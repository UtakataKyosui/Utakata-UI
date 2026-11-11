import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import RequiredBrowserChecks, {
  validateEvidence,
} from './required-browser-checks.mjs';

function run(tests) {
  const directory = mkdtempSync(join(tmpdir(), 'utakata-evidence-'));
  const reporter = new RequiredBrowserChecks({
    requireAttachments: false,
    requiredIds: ['input.visual-theme'],
    outputFile: join(directory, 'evidence.json'),
  });
  try {
    reporter.onBegin({}, { allTests: () => tests });
    return reporter.onEnd();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

const fixture = (project, status = 'passed') => ({
  title: '[input.visual-theme] visual properties',
  titlePath: () => [project],
  expectedStatus: 'passed',
  results: [{ status }],
});

test('evidence persists rule mapping, failures and residual checks; stale results cannot pass', () => {
  const directory = mkdtempSync(join(tmpdir(), 'utakata-evidence-'));
  try {
    const outputFile = join(directory, 'evidence.json');
    const reporter = new RequiredBrowserChecks({
      requireAttachments: false,
      requiredIds: ['input.visual-theme'],
      projects: ['chromium-light'],
      manualRules: [
        { id: 'input.screen-reader', requirement: 'Verify speech' },
      ],
      outputFile,
    });
    reporter.onBegin({}, { allTests: () => [fixture('chromium-light')] });
    assert.equal(reporter.onEnd({ status: 'passed' }), undefined);
    const evidence = JSON.parse(readFileSync(outputFile, 'utf8'));
    const expected = {
      commit: evidence.commit,
      contract: evidence.contract,
      source: evidence.source,
      environment: evidence.environmentHash,
    };
    assert.equal(validateEvidence(evidence, expected), true);
    assert.equal(
      validateEvidence(evidence, {
        ...expected,
        source: 'changed-css-or-source',
      }),
      false,
    );
    assert.equal(
      validateEvidence(evidence, {
        ...expected,
        environment: 'changed-browser-or-config',
      }),
      false,
    );
    assert.equal(
      validateEvidence(
        { ...evidence, environment: { platform: 'different' } },
        expected,
      ),
      false,
    );
    assert.equal(validateEvidence({}, expected), false);
    assert.equal(validateEvidence(null, expected), false);
    assert.deepEqual(evidence.records[0].rules, ['input.visual-theme']);
    assert.equal(evidence.residual[0].status, 'unverified');
    assert.equal(
      validateEvidence(evidence, { ...expected, commit: 'stale' }),
      false,
    );
    assert.equal(
      validateEvidence(evidence, { ...expected, contract: 'changed' }),
      false,
    );
    for (const status of [
      'failed',
      'unverified',
      'skipped',
      'timedOut',
      'incomplete',
    ]) {
      assert.equal(validateEvidence({ ...evidence, status }, expected), false);
    }
    assert.equal(
      validateEvidence({ ...evidence, records: [] }, expected),
      false,
    );
    assert.equal(
      validateEvidence({ ...evidence, missing: ['new.rule'] }, expected),
      false,
    );
    assert.equal(
      validateEvidence(
        { ...evidence, records: [{ status: 'passed', attempts: [] }] },
        expected,
      ),
      false,
    );
    assert.equal(
      validateEvidence(
        {
          ...evidence,
          records: [{ status: 'passed', attempts: [{ status: 'incomplete' }] }],
        },
        expected,
      ),
      false,
    );
    // Global timeout/error must fail even if every completed test passed.
    assert.deepEqual(reporter.onEnd({ status: 'timedout' }), {
      status: 'failed',
    });
    assert.equal(JSON.parse(readFileSync(outputFile, 'utf8')).status, 'failed');
    reporter.onBegin({}, { allTests: () => [fixture('chromium-light')] });
    reporter.source = 'source-changed-during-run';
    assert.deepEqual(reporter.onEnd({ status: 'passed' }), {
      status: 'failed',
    });
    const testCase = fixture('chromium-light');
    testCase.expectedStatus = 'failed';
    reporter.onBegin({}, { allTests: () => [testCase] });
    assert.deepEqual(reporter.onEnd({ status: 'passed' }), {
      status: 'failed',
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('required browser coverage rejects missing themes, rules and skipped results', () => {
  assert.deepEqual(run([]), { status: 'failed' });
  assert.deepEqual(run([fixture('chromium-light')]), { status: 'failed' });
  assert.deepEqual(
    run([fixture('chromium-light'), fixture('chromium-dark', 'skipped')]),
    { status: 'failed' },
  );
  const wrong = fixture('chromium-dark');
  wrong.title = 'unrelated passing check';
  assert.deepEqual(run([fixture('chromium-light'), wrong]), {
    status: 'failed',
  });
  for (const status of ['failed', 'timedOut', 'interrupted']) {
    assert.deepEqual(
      run([fixture('chromium-light'), fixture('chromium-dark', status)]),
      { status: 'failed' },
    );
  }
  const missing = fixture('chromium-dark');
  missing.results = [];
  assert.deepEqual(run([fixture('chromium-light'), missing]), {
    status: 'failed',
  });
  assert.equal(
    run([fixture('chromium-light'), fixture('chromium-dark')]),
    undefined,
  );
});

test('reporter rejects incomplete, invalid and unreadable axe attachments even when a test passes', () => {
  const directory = mkdtempSync(join(tmpdir(), 'utakata-axe-'));
  try {
    for (const [axe, pass] of [
      [{ violations: [], incomplete: [] }, true],
      [{ violations: [], incomplete: [{ id: 'color-contrast' }] }, false],
      [{ violations: [{ id: 'button-name' }], incomplete: [] }, false],
      [{ violations: [] }, false],
      ['invalid JSON', false],
    ]) {
      const outputFile = join(directory, 'evidence.json');
      const reporter = new RequiredBrowserChecks({
        requiredIds: ['input.visual-theme'],
        projects: ['chromium-light'],
        outputFile,
      });
      const testCase = fixture('chromium-light');
      testCase.id = 'input';
      testCase.results[0].attachments = [
        {
          name: 'input-axe',
          contentType: 'application/json',
          body: Buffer.from(JSON.stringify(axe)),
        },
      ];
      reporter.onBegin({}, { allTests: () => [testCase] });
      reporter.onTestEnd(testCase, testCase.results[0]);
      assert.deepEqual(
        reporter.onEnd({ status: 'passed' }),
        pass ? undefined : { status: 'failed' },
      );
      const evidence = JSON.parse(readFileSync(outputFile, 'utf8'));
      const attachment = evidence.records[0].attempts[0].attachments[0];
      assert.equal(readFileSync(attachment.path, 'utf8'), JSON.stringify(axe));
      if (pass) {
        const expected = {
          commit: evidence.commit,
          contract: evidence.contract,
          source: evidence.source,
          environment: evidence.environmentHash,
        };
        assert.equal(validateEvidence(evidence, expected), true);
        writeFileSync(attachment.path, 'replaced');
        assert.equal(validateEvidence(evidence, expected), false);
        rmSync(attachment.path);
        assert.equal(validateEvidence(evidence, expected), false);
      }
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('a required passing test without retained attachments is unverified', () => {
  const directory = mkdtempSync(join(tmpdir(), 'utakata-missing-evidence-'));
  try {
    const reporter = new RequiredBrowserChecks({
      requiredIds: ['input.visual-theme'],
      projects: ['chromium-light'],
      outputFile: join(directory, 'evidence.json'),
    });
    reporter.onBegin({}, { allTests: () => [fixture('chromium-light')] });
    assert.deepEqual(reporter.onEnd({ status: 'passed' }), {
      status: 'failed',
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
