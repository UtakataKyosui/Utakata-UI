import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { addComponents, listComponents } from '../src/install.mjs';
import { digest } from '../src/registry.mjs';

const bin = fileURLToPath(new URL('../bin/utakata-ui.mjs', import.meta.url));

async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'utakata-cli-'));
  const registry = join(root, 'registry');
  const cwd = join(root, 'app');
  await mkdir(registry);
  await mkdir(cwd);
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
  const save = () =>
    writeFile(join(registry, 'button.json'), JSON.stringify(item));
  await save();
  await writeFile(
    join(registry, 'registry.json'),
    JSON.stringify({
      schemaVersion: 1,
      kind: 'utakata-ui/catalog',
      items: [{ name: 'button', title: 'Button' }],
    }),
  );
  try {
    await run({ root, registry, cwd, item, save });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('CLI lists and installs without shadcn configuration or dependencies', async () => {
  await fixture(async ({ registry, cwd }) => {
    const invoke = (...args) =>
      execFileSync(
        process.execPath,
        [bin, ...args, '--registry', registry, '--cwd', cwd],
        { encoding: 'utf8' },
      );
    assert.match(invoke('list'), /button\tButton/);
    assert.match(invoke('add', 'button', '--dry-run'), /\[dry-run\] create/);
    await assert.rejects(
      readFile(join(cwd, 'src/components/utakata/LICENSE')),
      { code: 'ENOENT' },
    );
    assert.match(
      invoke('add', 'button'),
      /pnpm add @base-ui\/react@\^1.9.0 lism-css@\^1.1.0/,
    );
    assert.equal(
      await readFile(
        join(cwd, 'src/components/utakata/components/Button.tsx'),
        'utf8',
      ),
      'export const Button = () => null;\n',
    );
    assert.match(invoke('add', 'button'), /unchanged/);
    await assert.rejects(readFile(join(cwd, 'components.json')), {
      code: 'ENOENT',
    });
    await assert.rejects(readFile(join(cwd, 'package.json')), {
      code: 'ENOENT',
    });
  });
});

test('conflicts abort all writes; explicit overwrite and custom directory work', async () => {
  await fixture(async ({ registry, cwd }) => {
    const directory = 'components/utakata';
    await mkdir(join(cwd, directory, 'styles'), { recursive: true });
    const css = join(cwd, directory, 'styles/styles.css');
    await writeFile(css, '/* local edits */');
    await assert.rejects(
      addComponents({ registry, cwd, directory, names: ['button'] }),
      /Existing file differs/,
    );
    await assert.rejects(
      readFile(join(cwd, directory, 'components/Button.tsx')),
      { code: 'ENOENT' },
    );
    await addComponents({
      registry,
      cwd,
      directory,
      names: ['button'],
      overwrite: true,
      dryRun: true,
    });
    assert.equal(await readFile(css, 'utf8'), '/* local edits */');
    await addComponents({
      registry,
      cwd,
      directory,
      names: ['button'],
      overwrite: true,
    });
    assert.match(await readFile(css, 'utf8'), /lism-css/);
  });
});

test('rejects tampering, traversal, unsupported schemas and missing files before writing', async () => {
  await fixture(async ({ registry, cwd, item, save }) => {
    const original = structuredClone(item);
    for (const mutate of [
      () => {
        item.files[0].content += 'tampered';
      },
      () => {
        item.files[0].path = '../../package.json';
      },
      () => {
        item.files[0].path = '/tmp/outside.ts';
      },
      () => {
        item.files[0].path = 'components\\outside.ts';
      },
      () => {
        item.schemaVersion = 2;
      },
      () => {
        item.kind = 'registry:ui';
      },
      () => {
        item.files.pop();
      },
      () => {
        item.dependencies['lism-css'] = 'file:/tmp/arbitrary';
      },
      () => {
        item.files.push(item.files[0]);
      },
      () => {
        item.files.push({ ...item.files[0], path: 'components/button.tsx' });
      },
    ]) {
      Object.assign(item, structuredClone(original));
      mutate();
      await save();
      await assert.rejects(addComponents({ registry, cwd, names: ['button'] }));
      await assert.rejects(
        readFile(join(cwd, 'src/components/utakata/components/Button.tsx')),
        { code: 'ENOENT' },
      );
    }
  });
});

test('mixed versions, dependencies and conflicting shared files reject the whole install', async () => {
  await fixture(async ({ registry, cwd, item }) => {
    for (const mode of ['version', 'dependencies', 'files']) {
      const field = structuredClone(item);
      field.name = 'field';
      field.title = 'Field';
      field.files[0].path = 'components/Field.tsx';
      if (mode === 'version') field.packageVersion = '0.2.0';
      if (mode === 'dependencies') field.dependencies['lism-css'] = '^1.2.0';
      if (mode === 'files') {
        field.files[1].content += '/* changed */';
        field.files[1].sha256 = digest(field.files[1].content);
      }
      await writeFile(join(registry, 'field.json'), JSON.stringify(field));
      await assert.rejects(
        addComponents({ registry, cwd, names: ['button', 'field'] }),
        /Conflicting/,
      );
      await assert.rejects(
        readFile(join(cwd, 'src/components/utakata/LICENSE')),
        { code: 'ENOENT' },
      );
    }
  });
});

test('rejects unknown components, destination escapes and symlinks', async () => {
  await fixture(async ({ registry, cwd, root }) => {
    await assert.rejects(
      addComponents({ registry, cwd, names: ['../button'] }),
    );
    await assert.rejects(addComponents({ registry, cwd, names: ['missing'] }), {
      code: 'ENOENT',
    });
    await assert.rejects(
      addComponents({
        registry,
        cwd,
        names: ['button'],
        directory: '../outside',
      }),
    );
    await assert.rejects(
      addComponents({ registry, cwd, names: ['button'], directory: '.' }),
    );
    await mkdir(join(root, 'outside'));
    await symlink(join(root, 'outside'), join(cwd, 'linked'));
    await assert.rejects(
      addComponents({
        registry,
        cwd,
        names: ['button'],
        directory: 'linked/ui',
      }),
      /symlink/,
    );
    await assert.rejects(readFile(join(root, 'outside/ui/LICENSE')), {
      code: 'ENOENT',
    });
  });
});

test('validates HTTP responses and catalog identity', async (context) => {
  await fixture(async ({ registry, item }) => {
    const mock = context.mock.method(
      globalThis,
      'fetch',
      async () => new Response(JSON.stringify(item)),
    );
    await addComponents({
      registry: 'https://example.com/registry/v1',
      names: ['button'],
      dryRun: true,
    });
    assert.equal(
      String(mock.mock.calls[0].arguments[0]),
      'https://example.com/registry/v1/button.json',
    );
    mock.mock.mockImplementation(
      async () => new Response('not JSON', { status: 404 }),
    );
    await assert.rejects(
      addComponents({
        registry: 'https://example.com',
        names: ['button'],
        dryRun: true,
      }),
      /HTTP 404/,
    );
    mock.mock.mockImplementation(
      async () => new Response('x'.repeat(8 * 1024 * 1024 + 1)),
    );
    await assert.rejects(
      addComponents({
        registry: 'https://example.com',
        names: ['button'],
        dryRun: true,
      }),
      /too large/,
    );
    await assert.rejects(
      addComponents({
        registry: 'http://example.com',
        names: ['button'],
        dryRun: true,
      }),
      /HTTPS/,
    );
    await writeFile(
      join(registry, 'registry.json'),
      JSON.stringify({ schemaVersion: 1, kind: 'other', items: [] }),
    );
    await assert.rejects(listComponents(registry), /catalog/);
  });
});
