import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dependencyPlan } from '../src/dependencies.mjs';
import { digest } from '../src/registry.mjs';

const dependencies = { '@base-ui/react': '^1.9.0', 'lism-css': '^1.1.0' };

test('dependency planning respects packageManager and lockfiles and rejects ambiguity/injection', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'utakata-dependencies-'));
  try {
    await writeFile(join(cwd, 'package.json'), '{"private":true}');
    assert.equal((await dependencyPlan(cwd, dependencies)).manager, 'npm');
    await writeFile(join(cwd, 'pnpm-lock.yaml'), '');
    assert.equal((await dependencyPlan(cwd, dependencies)).manager, 'pnpm');
    await writeFile(join(cwd, 'yarn.lock'), '');
    await assert.rejects(dependencyPlan(cwd, dependencies), /Multiple/);
    assert.equal(
      (await dependencyPlan(cwd, dependencies, 'yarn')).manager,
      'yarn',
    );
    await assert.rejects(
      dependencyPlan(cwd, dependencies, 'npm; echo bad'),
      /Use npm/,
    );
    await assert.rejects(
      dependencyPlan(cwd, { 'lism-css': '1.1.0; bad' }, 'npm'),
      /Unsupported/,
    );
    await writeFile(
      join(cwd, 'package.json'),
      '{"packageManager":"pnpm@10.18.3"}',
    );
    assert.deepEqual(await dependencyPlan(cwd, dependencies), {
      manager: 'pnpm',
      args: [
        'add',
        '--ignore-scripts',
        '@base-ui/react@^1.9.0',
        'lism-css@^1.1.0',
      ],
    });
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test('init runs the selected manager; dry-run and no-install never execute it', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'utakata-init-deps-'));
  try {
    const registry = join(cwd, 'registry');
    const bin = join(cwd, 'bin');
    const log = join(cwd, 'install.json');
    await mkdir(registry);
    await mkdir(bin);
    await writeFile(
      join(cwd, 'package.json'),
      '{"private":true,"packageManager":"pnpm@10.18.3"}',
    );
    const files = [
      {
        path: 'components/Button.tsx',
        content: 'export const Button = () => null;',
      },
      { path: 'styles/styles.css', content: '@import "lism-css/main.css";' },
      { path: 'LICENSE', content: 'MIT' },
    ].map((file) => ({ ...file, sha256: digest(file.content) }));
    await writeFile(
      join(registry, 'registry.json'),
      JSON.stringify({
        schemaVersion: 1,
        kind: 'utakata-ui/catalog',
        items: [{ name: 'button', title: 'Button' }],
      }),
    );
    await writeFile(
      join(registry, 'button.json'),
      JSON.stringify({
        schemaVersion: 1,
        kind: 'utakata-ui/component',
        name: 'button',
        title: 'Button',
        packageVersion: '0.1.0',
        dependencies,
        files,
      }),
    );
    const fake = join(bin, 'pnpm');
    await writeFile(
      fake,
      `#!/usr/bin/env node\nrequire('node:fs').writeFileSync(process.env.UTAKATA_INSTALL_LOG, JSON.stringify(process.argv.slice(2)));\n`,
    );
    await chmod(fake, 0o755);
    if (process.platform === 'win32')
      await writeFile(`${fake}.cmd`, `@"${process.execPath}" "${fake}" %*\r\n`);
    const cli = fileURLToPath(
      new URL('../bin/utakata-ui.mjs', import.meta.url),
    );
    const invoke = (...args) =>
      spawnSync(
        process.execPath,
        [cli, 'init', '--registry', registry, ...args],
        {
          cwd,
          encoding: 'utf8',
          env: {
            ...process.env,
            PATH: `${bin}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH}`,
            UTAKATA_INSTALL_LOG: log,
          },
        },
      );
    for (const option of ['--dry-run', '--no-install']) {
      const result = invoke(option);
      assert.equal(result.status, 0, result.stderr);
      await assert.rejects(readFile(log), { code: 'ENOENT' });
    }
    const result = invoke();
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(await readFile(log, 'utf8')), [
      'add',
      '--ignore-scripts',
      '@base-ui/react@^1.9.0',
      'lism-css@^1.1.0',
    ]);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
