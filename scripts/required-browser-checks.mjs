import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Evidence is valid only for this commit and this rule/environment contract.
export function validateEvidence(evidence, { commit, contract }) {
  return (
    evidence.commit === commit &&
    evidence.contract === contract &&
    evidence.schemaVersion === 1 &&
    evidence.status === 'passed' &&
    evidence.missing?.length === 0 &&
    evidence.axeFailures?.length === 0 &&
    evidence.records.length > 0 &&
    evidence.records.every(
      (record) =>
        record.status === 'passed' &&
        record.attempts.length > 0 &&
        record.attempts.every((attempt) => attempt.status === 'passed'),
    )
  );
}

// A skipped/fixme/expected-failure check is missing evidence, not a passing gate.
export default class RequiredBrowserChecks {
  constructor(options = {}) {
    this.requiredIds = options.requiredIds ?? [];
    this.projects = options.projects ?? ['chromium-light', 'chromium-dark'];
    this.manualRules = options.manualRules ?? [];
    this.axeFailures = [];
    this.attachments = new Map();
    this.outputFile =
      options.outputFile ?? 'test-results/browser-evidence.json';
  }

  onBegin(config, suite) {
    this.axeFailures = [];
    this.attachments.clear();
    this.config = config;
    this.tests = suite.allTests();
    this.missing = this.projects.flatMap((project) =>
      this.requiredIds
        .filter(
          (id) =>
            !this.tests.some(
              (test) =>
                test.title.includes(`[${id}]`) &&
                test.titlePath().includes(project),
            ),
        )
        .map((id) => `${project}: ${id}`),
    );
  }

  onTestEnd(test, result) {
    const attachments = (result.attachments ?? []).map((attachment, index) => {
      let path = attachment.path;
      if (attachment.body) {
        const name = createHash('sha256')
          .update(`${test.id}:${index}:${result.retry}`)
          .digest('hex');
        path = join(dirname(this.outputFile), 'evidence', `${name}.json`);
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, attachment.body);
      }
      // Independently reject incomplete axe output, even if a spec omits its
      // assertion. Intentionally invalid detector fixtures do not attach -axe.
      if (attachment.name.endsWith('-axe')) {
        try {
          const axe = JSON.parse(
            attachment.body?.toString() ?? readFileSync(path, 'utf8'),
          );
          if (axe.violations?.length !== 0 || axe.incomplete?.length !== 0)
            this.axeFailures.push(`${test.title}: ${attachment.name}`);
        } catch {
          this.axeFailures.push(`${test.title}: unreadable ${attachment.name}`);
        }
      }
      return {
        name: attachment.name,
        contentType: attachment.contentType,
        path,
      };
    });
    this.attachments.set(result, attachments);
  }

  onEnd(result) {
    const unverified = this.tests?.filter(
      (test) =>
        test.expectedStatus !== 'passed' ||
        test.results.length === 0 ||
        test.results.some((result) => result.status !== 'passed'),
    );
    const failed =
      !this.tests?.length ||
      unverified?.length ||
      this.missing?.length ||
      this.axeFailures.length ||
      (result && result.status !== 'passed');
    if (this.tests) {
      const commit =
        process.env.GITHUB_SHA ||
        execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
      const contract = createHash('sha256')
        .update(
          JSON.stringify({
            requiredIds: this.requiredIds,
            projects: this.projects,
            manualRules: this.manualRules,
          }),
        )
        .digest('hex');
      const evidence = {
        schemaVersion: 1,
        commit,
        sourceDirty:
          execFileSync('git', ['status', '--porcelain'], {
            encoding: 'utf8',
          }).trim().length > 0,
        contract,
        createdAt: new Date().toISOString(),
        durationMs: result?.duration,
        environment: {
          platform: process.platform,
          arch: process.arch,
          node: process.version,
          playwright: this.config?.version,
          projects: this.config?.projects?.map(({ name, use }) => ({
            name,
            use,
          })),
        },
        status: failed ? 'failed' : 'passed',
        missing: this.missing,
        axeFailures: this.axeFailures,
        records: this.tests.map((test) => ({
          title: test.titlePath(),
          location: test.location,
          rules: this.requiredIds.filter((id) =>
            test.title.includes(`[${id}]`),
          ),
          status: unverified.includes(test) ? 'unverified' : 'passed',
          attempts: test.results.map((attempt) => ({
            status: attempt.status,
            duration: attempt.duration,
            errors: attempt.errors,
            attachments:
              this.attachments.get(attempt) ??
              attempt.attachments?.map(({ name, contentType, path }) => ({
                name,
                contentType,
                path,
              })),
          })),
        })),
        residual: this.manualRules.map((rule) => ({
          ...rule,
          status: 'unverified',
        })),
      };
      mkdirSync(dirname(this.outputFile), { recursive: true });
      writeFileSync(this.outputFile, `${JSON.stringify(evidence, null, 2)}\n`);
      if (!failed && !validateEvidence(evidence, { commit, contract }))
        return { status: 'failed' };
    }
    if (failed) {
      console.error(
        'Required browser checks have failed or unverified results.',
      );
      if (this.missing?.length)
        console.error('Missing coverage:', this.missing);
      return { status: 'failed' };
    }
  }
}
