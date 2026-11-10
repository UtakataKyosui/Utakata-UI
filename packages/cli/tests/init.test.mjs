import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { digest } from '../src/registry.mjs';

const bin = new URL('../bin/utakata-ui.mjs', import.meta.url).pathname;

async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'utakata-init-'));
  const cwd = join(root, 'app');
  const registry = join(root, 'registry');
  await mkdir(cwd);
  await mkdir(registry);
  const item = {
    schemaVersion: 1,
    kind: 'utakata-ui/component',
    packageVersion: '0.1.0',
    name: 'button',
    title: 'Button',
    dependencies: { '@base-ui/react': '^1.9.0', 'lism-css': '^1.1.0' },
    files: [
      {
        path: 'components/Button.tsx',
        content: 'export const Button = () => null;\n',
      },
      { path: 'styles/styles.css', content: '@import "lism-css/main.css";\n' },
      { path: 'LICENSE', content: 'MIT\n' },
    ].map((file) => ({ ...file, sha256: digest(file.content) })),
  };
  await writeFile(join(registry, 'button.json'), JSON.stringify(item));
  await writeFile(
    join(registry, 'registry.json'),
    JSON.stringify({
      schemaVersion: 1,
      kind: 'utakata-ui/catalog',
      items: [{ name: 'button', title: 'Button' }],
    }),
  );
  const invoke = (...args) =>
    spawnSync(process.execPath, [bin, ...args], {
      cwd,
      encoding: 'utf8',
      timeout: 10_000,
    });
  try {
    await run({ root, cwd, registry, item, invoke });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('init saves portable defaults and shared CSS; list/add use them with overrides', async () => {
  await fixture(async ({ cwd, registry, invoke }) => {
    const result = invoke('init', '--registry', registry, '--dir', 'ui');
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /pnpm add @base-ui\/react/);
    assert.match(result.stdout, /ui\/styles\/styles.css/);
    const config = JSON.parse(
      await readFile(join(cwd, 'utakata.json'), 'utf8'),
    );
    assert.deepEqual(config, {
      schemaVersion: 1,
      registry: '../registry',
      directory: 'ui',
    });
    assert.match(
      await readFile(join(cwd, 'ui/styles/styles.css'), 'utf8'),
      /lism-css/,
    );
    await assert.rejects(readFile(join(cwd, 'ui/components/Button.tsx')), {
      code: 'ENOENT',
    });
    assert.match(invoke('list').stdout, /button\tButton/);
    assert.match(invoke('init').stdout, /unchanged/);
    assert.equal(invoke('add', 'button', '--dir', 'custom').status, 0);
    assert.match(
      await readFile(join(cwd, 'custom/components/Button.tsx'), 'utf8'),
      /Button/,
    );
    assert.equal(invoke('add', 'button', '--registry', registry).status, 0);
    assert.match(
      await readFile(join(cwd, 'ui/components/Button.tsx'), 'utf8'),
      /Button/,
    );
    assert.deepEqual(
      JSON.parse(await readFile(join(cwd, 'utakata.json'), 'utf8')),
      config,
    );
    await writeFile(
      join(cwd, 'utakata.json'),
      JSON.stringify({ ...config, registry: '../missing' }),
    );
    assert.equal(invoke('list').status, 1);
    const override = invoke('list', '--registry', registry);
    assert.equal(override.status, 0, override.stderr);
    assert.match(override.stdout, /button\tButton/);
    assert.equal(
      JSON.parse(await readFile(join(cwd, 'utakata.json'), 'utf8')).registry,
      '../missing',
    );
    await assert.rejects(readFile(join(cwd, 'package.json')), {
      code: 'ENOENT',
    });
  });
});

test('init dry-run writes nothing, including for --cwd outside the invoking directory', async () => {
  await fixture(async ({ root, cwd, registry, invoke }) => {
    const result = invoke(
      'init',
      '--registry',
      registry,
      '--cwd',
      join(root, 'target'),
      '--dry-run',
    );
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /\[dry-run\] create/);
    await assert.rejects(readdir(join(root, 'target')), { code: 'ENOENT' });
    assert.deepEqual(await readdir(cwd), []);
  });
});

test('init rejects config/style conflicts before any writes and allows explicit overwrite', async () => {
  await fixture(async ({ cwd, registry, invoke }) => {
    await mkdir(join(cwd, 'ui/styles'), { recursive: true });
    await writeFile(join(cwd, 'ui/styles/styles.css'), '/* local */');
    assert.equal(
      invoke('init', '--registry', registry, '--dir', 'ui').status,
      1,
    );
    await assert.rejects(readFile(join(cwd, 'utakata.json')), {
      code: 'ENOENT',
    });
    await assert.rejects(readFile(join(cwd, 'ui/LICENSE')), { code: 'ENOENT' });
    await writeFile(join(cwd, 'utakata.json'), '{"local":true}\n');
    const failed = invoke('init', '--registry', registry);
    assert.equal(failed.status, 1);
    await assert.rejects(
      readFile(join(cwd, 'src/components/utakata/LICENSE')),
      { code: 'ENOENT' },
    );
    assert.equal(
      invoke('init', '--registry', registry, '--overwrite').status,
      0,
    );
    const config = await readFile(join(cwd, 'utakata.json'), 'utf8');
    await writeFile(
      join(cwd, 'src/components/utakata/styles/styles.css'),
      '/* custom */',
    );
    const conflict = invoke('init', '--dir', 'src/components/utakata');
    assert.equal(conflict.status, 1);
    assert.equal(await readFile(join(cwd, 'utakata.json'), 'utf8'), config);
    assert.equal(invoke('init', '--overwrite', '--dry-run').status, 0);
    assert.equal(
      await readFile(
        join(cwd, 'src/components/utakata/styles/styles.css'),
        'utf8',
      ),
      '/* custom */',
    );
    assert.equal(invoke('init', '--overwrite').status, 0);
  });
});

test('init rejects bad registries, escaping destinations and symlinked config or styles', async () => {
  await fixture(async ({ root, cwd, registry, invoke, item }) => {
    for (const directory of [
      '../outside',
      '.',
      'utakata.json',
      'utakata.json/nested',
    ]) {
      assert.equal(
        invoke('init', '--registry', registry, '--dir', directory).status,
        1,
      );
      assert.deepEqual(await readdir(cwd), []);
    }
    const outside = join(root, 'outside');
    await mkdir(outside);
    await symlink(outside, join(cwd, 'ui'));
    assert.equal(
      invoke('init', '--registry', registry, '--dir', 'ui').status,
      1,
    );
    await rm(join(cwd, 'ui'));
    const config = join(root, 'external.json');
    await writeFile(config, '{}');
    await symlink(config, join(cwd, 'utakata.json'));
    assert.equal(
      invoke('init', '--registry', registry, '--overwrite').status,
      1,
    );
    assert.equal(await readFile(config, 'utf8'), '{}');
    await rm(join(cwd, 'utakata.json'));
    item.files[1].content += 'tampered';
    await writeFile(join(registry, 'button.json'), JSON.stringify(item));
    assert.equal(invoke('init', '--registry', registry).status, 1);
    assert.deepEqual(await readdir(cwd), []);
  });
});

test('config errors and missing init registry give actionable failures without writes', async () => {
  await fixture(async ({ cwd, registry, invoke }) => {
    const missing = invoke('init');
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /--registry/);
    for (const config of [
      '{',
      '{}',
      JSON.stringify({ schemaVersion: 2, registry, directory: 'ui' }),
      JSON.stringify({ schemaVersion: 1, registry, directory: '../outside' }),
    ]) {
      await writeFile(join(cwd, 'utakata.json'), config);
      const invalid = invoke('add', 'button');
      assert.equal(invalid.status, 1);
      assert.match(invalid.stderr, /utakata.json/);
    }
  });
});
