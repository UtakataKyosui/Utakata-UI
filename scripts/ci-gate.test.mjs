import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { gatesPassed } from './ci-gate.mjs';
import { selectScope } from './ci-scope.mjs';

test('Quality runs the complete dependency-free CI regression suite before scope selection', () => {
  const { scripts } = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  );
  const workflow = readFileSync(
    new URL('../.github/workflows/quality.yml', import.meta.url),
    'utf8',
  );
  const scopeJob = workflow.split('\n  checks:\n')[0];
  assert.ok(scopeJob.includes(`run: ${scripts['test:ci']}\n`));
  assert.ok(
    scopeJob.indexOf(`run: ${scripts['test:ci']}\n`) <
      scopeJob.indexOf('run: node scripts/ci-scope.mjs'),
  );
});

function fixture(required) {
  return {
    scope: {
      result: 'success',
      outputs: Object.fromEntries(
        ['checks', 'tests', 'cli', 'build', 'docs', 'browser', 'fallow'].map(
          (key) => [key, String(required)],
        ),
      ),
    },
    ...Object.fromEntries(
      [
        'checks',
        'unit',
        'build',
        'docs',
        'browser-accessibility',
        'fallow',
      ].map((key) => [key, { result: required ? 'success' : 'skipped' }]),
    ),
  };
}

test('aggregate CLI identifies the failing job without blaming irrelevant browser skips', () => {
  const jobs = fixture(false);
  jobs.scope.outputs.checks = 'true';
  jobs.checks.result = 'failure';
  const result = spawnSync(process.execPath, ['scripts/ci-gate.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      RESULTS: JSON.stringify(jobs),
      EVENT_NAME: 'pull_request',
      GITHUB_STEP_SUMMARY: '',
    },
    encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.match(
    result.stdout,
    /checks: failure; required for this change — gate failed/,
  );
  assert.match(
    result.stdout,
    /browser-accessibility: skipped; not required for this change\n/,
  );
});

test('non-component PRs pass with irrelevant browser, screen reader and package gates skipped', () => {
  for (const files of [
    ['packages/docs/blume.config.ts', 'packages/docs/public/icon.png'],
    ['packages/docs/docs/getting-started.md'],
    ['README.md'],
    ['skills/utakata-ui/SKILL.md'],
    ['packages/cli/src/index.mjs'],
  ]) {
    const scope = selectScope(files);
    const jobs = fixture(false);
    jobs.scope.outputs = Object.fromEntries(
      Object.entries(scope).map(([key, value]) => [key, String(value)]),
    );
    const applicable = {
      checks: scope.checks,
      unit: scope.tests || scope.cli,
      build: scope.build,
      docs: scope.docs,
      'browser-accessibility': scope.browser,
      fallow: scope.fallow,
    };
    for (const [job, needed] of Object.entries(applicable))
      jobs[job].result = needed ? 'success' : 'skipped';
    assert.equal(scope.browser, false, files.join(', '));
    assert.equal(gatesPassed(jobs, 'pull_request'), true, files.join(', '));
    // A real lint/build failure must still block the same non-component PR.
    jobs.checks.result = 'failure';
    assert.equal(gatesPassed(jobs, 'pull_request'), false);
  }
});

test('aggregate permits only irrelevant skips; every missing or nonpassing required gate fails', () => {
  assert.equal(gatesPassed(fixture(true), 'pull_request'), true);
  assert.equal(gatesPassed(fixture(false), 'pull_request'), true);
  const missingOutput = fixture(false);
  delete missingOutput.scope.outputs.browser;
  assert.equal(gatesPassed(missingOutput, 'pull_request'), false);
  for (const job of Object.keys(fixture(true))) {
    for (const status of ['failure', 'cancelled', 'skipped', undefined]) {
      const jobs = fixture(true);
      jobs[job].result = status;
      assert.equal(
        gatesPassed(jobs, 'pull_request'),
        false,
        `${job}: ${status}`,
      );
    }
  }
  const main = fixture(true);
  main.fallow.result = 'skipped';
  assert.equal(gatesPassed(main, 'push'), true);
  assert.equal(gatesPassed(main, 'pull_request'), false);
});

test('Quality and React release share the complete browser and screen reader gate', () => {
  const read = (name) =>
    readFileSync(
      new URL(`../.github/workflows/${name}.yml`, import.meta.url),
      'utf8',
    );
  for (const name of ['quality', 'release']) {
    assert.match(read(name), /uses: \.\/\.github\/workflows\/browser\.yml/);
  }
  assert.match(
    read('release'),
    /needs: \[prior, browser-accessibility, verify\]/,
  );
  assert.match(read('quality'), /run: node scripts\/ci-gate\.mjs/);
  for (const browser of ['chromium', 'firefox', 'webkit']) {
    for (const theme of ['light', 'dark'])
      assert.ok(
        read('browser')
          .replace(/\s+/g, ' ')
          .includes(
            `project: ${browser}-${theme}, browser: ${browser}, config:`,
          ),
      );
  }
  assert.match(read('browser'), /fail-fast: false/);
  assert.match(
    read('browser'),
    /CI_BROWSER_PROJECT: \$\{\{ matrix.project \}\}/,
  );
  assert.match(read('browser'), /--project=\$\{\{ matrix.project \}\}/);
  assert.doesNotMatch(
    read('browser'),
    /continue-on-error|--grep|--pass-with-no-tests/,
  );
});

test('releases skip a verification job only when prior evidence was reused', () => {
  for (const [name, gates] of [
    ['release', ['checks', 'browser']],
    ['release-cli', ['checks']],
  ]) {
    const workflow = readFileSync(
      new URL(`../.github/workflows/${name}.yml`, import.meta.url),
      'utf8',
    );
    assert.ok(
      workflow.includes(
        `run: node scripts/prior-verification.mjs ${name}.yml ${gates.join(',')}\n`,
      ),
    );
    assert.match(workflow, /actions: read/);
    assert.match(
      workflow,
      /FULL_VERIFICATION: \$\{\{ inputs\.full_verification \}\}/,
    );
    const publish = workflow.split('\n  release:\n')[1];
    const condition = publish.split('    runs-on:')[0];
    assert.match(
      condition,
      /!cancelled\(\) && needs\.prior\.result == 'success'/,
    );
    const jobs = { checks: 'verify', browser: 'browser-accessibility' };
    for (const gate of gates) {
      const job = jobs[gate];
      assert.ok(
        condition.includes(
          `(needs.${job}.result == 'success' || (needs.${job}.result == 'skipped' && needs.prior.outputs.${gate} == 'reuse'))`,
        ),
        `${name} ${gate}`,
      );
      assert.ok(
        workflow.includes(
          `  ${job}:\n    needs: prior\n    if: needs.prior.outputs.${gate} == 'run'\n`,
        ),
        `${name} ${job}`,
      );
    }
    // Publication always rebuilds, packs and tests the exact archive it uploads.
    assert.match(publish, /verify-(react|cli)-package\.mjs/);
    assert.doesNotMatch(publish, /run: pnpm check/);
    // The React archive has no prepack, so it must be built before any pack.
    const reactPack = publish.search(
      /npm pack \.\/packages\/react|pnpm --filter @utakata-ui\/react pack/,
    );
    if (reactPack !== -1)
      assert.ok(
        publish.indexOf('run: pnpm --filter @utakata-ui/react build') !== -1 &&
          publish.indexOf('run: pnpm --filter @utakata-ui/react build') <
            reactPack,
        name,
      );
  }
});

test('releases default to verification and expose the token only to explicit manual publication', () => {
  for (const name of ['release', 'release-cli']) {
    const workflow = readFileSync(
      new URL(`../.github/workflows/${name}.yml`, import.meta.url),
      'utf8',
    );
    assert.match(workflow, /default: verify/);
    assert.match(workflow, /options: \[verify, oidc, token\]/);
    assert.match(
      workflow,
      /if: github.event_name == 'push' \|\| inputs.release_mode == 'oidc'/,
    );
    assert.match(
      workflow,
      /if: github.event_name == 'workflow_dispatch' && inputs.release_mode == 'token'/,
    );
    assert.equal((workflow.match(/secrets\.NPM_TOKEN/g) ?? []).length, 1);
    const [verification, tokenStep] = workflow.split(
      '      - name: Publish with npm Environment token',
    );
    assert.doesNotMatch(verification, /secrets\.NPM_TOKEN/);
    assert.match(tokenStep, /node scripts\/publish-npm-token\.mjs/);
    assert.equal((workflow.match(/^\s+environment:/gm) ?? []).length, 1);
    assert.ok(
      workflow.includes(
        "    environment: ${{ (github.event_name == 'push' || inputs.release_mode != 'verify') && 'npm' || '' }}\n",
      ),
    );
    assert.match(workflow, /git merge-base --is-ancestor HEAD origin\/main/);
    assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  }
});

test('screen reader jobs execute on real OS runners and retain output', () => {
  const workflow = readFileSync(
    new URL('../.github/workflows/browser.yml', import.meta.url),
    'utf8',
  );
  for (const reader of ['voiceover-webkit', 'nvda-firefox'])
    assert.ok(workflow.includes(`reader: ${reader}`));
  assert.match(workflow, /pnpm exec guidepup setup --ci/);
  assert.match(workflow, /pnpm exec guidepup install/);
  assert.match(workflow, /run: pnpm test:a11y:screen-reader/);
  assert.match(workflow, /name: screen-reader \(\$\{\{ matrix.reader \}\}\)/);
});
