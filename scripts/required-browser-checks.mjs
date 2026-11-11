import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  digest,
  readEvidenceGit,
  sourceFingerprint,
} from './evidence-contract.mjs';

// Evidence is valid only for this commit and this rule/environment contract.
export function validateEvidence(
  evidence,
  { commit, contract, source, environment },
) {
  return (
    !!evidence &&
    evidence.commit === commit &&
    evidence.contract === contract &&
    evidence.source === source &&
    evidence.environmentHash === environment &&
    typeof source === 'string' &&
    typeof environment === 'string' &&
    digest(JSON.stringify(evidence.environment)) === environment &&
    evidence.schemaVersion === 1 &&
    evidence.status === 'passed' &&
    evidence.missing?.length === 0 &&
    evidence.axeFailures?.length === 0 &&
    Array.isArray(evidence.records) &&
    evidence.records.length > 0 &&
    evidence.records.every(
      (record) =>
        record.status === 'passed' &&
        Array.isArray(record.attempts) &&
        record.attempts.length > 0 &&
        record.attempts.every(
          (attempt) =>
            attempt.status === 'passed' &&
            (!evidence.requireAttachments ||
              !record.rules?.length ||
              attempt.attachments?.length > 0) &&
            (attempt.attachments ?? []).every((attachment) => {
              try {
                return (
                  digest(readFileSync(attachment.path)) === attachment.sha256
                );
              } catch {
                return false;
              }
            }),
        ),
    )
  );
}

// A skipped/fixme/expected-failure check is missing evidence, not a passing gate.
export default class RequiredBrowserChecks {
  constructor(options = {}) {
    this.requiredIds = options.requiredIds ?? [];
    this.projects = options.projects ?? ['chromium-light', 'chromium-dark'];
    this.manualRules = options.manualRules ?? [];
    this.coverage = options.coverage ?? {};
    this.requireAttachments = options.requireAttachments ?? true;
    this.axeFailures = [];
    this.attachments = new Map();
    this.outputFile =
      options.outputFile ?? 'test-results/browser-evidence.json';
  }

  onBegin(config, suite) {
    this.axeFailures = [];
    this.attachments.clear();
    this.config = config;
    this.source = sourceFingerprint();
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
      let sha256;
      try {
        sha256 = digest(readFileSync(path));
      } catch {
        this.axeFailures.push(
          `${test.title}: missing attachment ${attachment.name}`,
        );
      }
      return {
        name: attachment.name,
        contentType: attachment.contentType,
        path,
        sha256,
      };
    });
    this.attachments.set(result, attachments);
  }

  onEnd(result) {
    const unverified = this.tests?.filter(
      (test) =>
        test.expectedStatus !== 'passed' ||
        test.results.length === 0 ||
        test.results.some(
          (result) =>
            result.status !== 'passed' ||
            (this.requireAttachments &&
              this.requiredIds.some((id) => test.title.includes(`[${id}]`)) &&
              !this.attachments.get(result)?.length),
        ),
    );
    const failed =
      !this.tests?.length ||
      unverified?.length ||
      this.missing?.length ||
      this.axeFailures.length ||
      this.source !== sourceFingerprint() ||
      (result && result.status !== 'passed');
    if (this.tests) {
      const commit =
        process.env.GITHUB_SHA || readEvidenceGit('rev-parse', 'HEAD').trim();
      const contract = createHash('sha256')
        .update(
          JSON.stringify({
            requiredIds: this.requiredIds,
            projects: this.projects,
            manualRules: this.manualRules,
            coverage: this.coverage,
            requireAttachments: this.requireAttachments,
          }),
        )
        .digest('hex');
      const evidence = {
        schemaVersion: 1,
        commit,
        sourceDirty: readEvidenceGit('status', '--porcelain').trim().length > 0,
        contract,
        source: this.source,
        requireAttachments: this.requireAttachments,
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
          cases: Object.entries(this.coverage).flatMap(([component, entry]) =>
            Object.entries(entry.states)
              .filter(([, id]) => test.title.includes(`[${id}]`))
              .map(([state]) => ({ component, state })),
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
          tracking: {
            issue: '#49',
            owner: 'release maintainer',
            procedure: 'ACCESSIBILITY-MANUAL.md',
            due: 'before a release claims this scope is verified',
          },
        })),
      };
      evidence.environmentHash = digest(JSON.stringify(evidence.environment));
      mkdirSync(dirname(this.outputFile), { recursive: true });
      writeFileSync(this.outputFile, `${JSON.stringify(evidence, null, 2)}\n`);
      if (
        !failed &&
        !validateEvidence(evidence, {
          commit,
          contract,
          source: evidence.source,
          environment: evidence.environmentHash,
        })
      )
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
