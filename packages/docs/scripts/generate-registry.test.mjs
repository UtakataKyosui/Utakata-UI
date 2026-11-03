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
import { dirname, join, posix } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { addComponents } from '../../cli/src/install.mjs';
import { digest, validateCatalog } from '../../cli/src/registry.mjs';
import { createRegistry, writeRegistry } from './generate-registry.mjs';

test('every component includes its complete relative import graph and shared CSS', async () => {
  const items = await createRegistry();
  const publicApi = await readFile(
    new URL('../../react/src/index.ts', import.meta.url),
    'utf8',
  );
  const publicComponents = [
    ...new Set(
      [...publicApi.matchAll(/from '\.\/components\/([^']+)\.js'/g)].map(
        (match) => match[1],
      ),
    ),
  ].sort();
  assert.deepEqual(items.map((item) => item.title).sort(), publicComponents);
  assert.equal(new Set(items.map((item) => item.name)).size, items.length);
  for (const item of items) {
    const paths = new Set(item.files.map((file) => file.path));
    assert.ok(paths.has('styles/styles.css'));
    assert.ok(paths.has(`components/${item.title}.tsx`));
    assert.ok(item.dependencies['@base-ui/react']);
    for (const file of item.files) {
      assert.equal(file.sha256, digest(file.content));
      for (const match of file.content.matchAll(
        /\bfrom\s+['"](\.[^'"]+)['"]/g,
      )) {
        const imported = posix.normalize(`${dirname(file.path)}/${match[1]}`);
        assert.ok(
          paths.has(imported.replace(/\.js$/, '.ts')) ||
            paths.has(imported.replace(/\.js$/, '.tsx')),
          `${item.name}: ${imported}`,
        );
      }
    }
  }
  const button = items.find((item) => item.name === 'button');
  assert.ok(
    button.files.some((file) => file.path === 'components/accessibility.ts'),
  );
  assert.ok(
    button.files.some((file) => file.content.includes('iconOnly: true')),
  );
});

test('build output contains parseable catalog and installable item payloads', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'utakata-registry-'));
  try {
    await writeRegistry(directory);
    const catalog = JSON.parse(
      await readFile(join(directory, 'registry.json'), 'utf8'),
    );
    validateCatalog(catalog);
    for (const item of catalog.items) {
      assert.equal(
        JSON.parse(await readFile(join(directory, `${item.name}.json`), 'utf8'))
          .name,
        item.name,
      );
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('distributed source typechecks with valid and invalid consumer usage', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'utakata-registry-types-'));
  try {
    const registry = join(directory, 'registry');
    await writeRegistry(registry);
    await addComponents({
      registry,
      names: (await createRegistry()).map((item) => item.name),
      cwd: directory,
      directory: 'ui/utakata',
    });
    await mkdir(join(directory, 'node_modules'));
    for (const name of ['@base-ui', 'lism-css', 'react', 'react-dom']) {
      await symlink(
        fileURLToPath(
          new URL(`../../react/node_modules/${name}`, import.meta.url),
        ),
        join(directory, 'node_modules', name),
      );
    }
    await symlink(
      fileURLToPath(new URL('../../../node_modules/@types', import.meta.url)),
      join(directory, 'node_modules/@types'),
    );
    await writeFile(
      join(directory, 'consumer.tsx'),
      `
import { Button } from './ui/utakata/components/Button.js';
export const valid = <Button>保存</Button>;
export const icon = <Button iconOnly aria-label="閉じる">×</Button>;
// @ts-expect-error An icon-only button must have an accessible name.
export const invalid = <Button iconOnly>×</Button>;
`,
    );
    await writeFile(
      join(directory, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          jsx: 'react-jsx',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          noEmit: true,
          typeRoots: [
            fileURLToPath(
              new URL('../../../node_modules/@types', import.meta.url),
            ),
          ],
        },
        include: ['**/*.ts', '**/*.tsx'],
      }),
    );
    try {
      execFileSync(
        process.execPath,
        [
          fileURLToPath(
            new URL(
              '../../../node_modules/typescript/bin/tsc',
              import.meta.url,
            ),
          ),
          '-p',
          join(directory, 'tsconfig.json'),
        ],
        { stdio: 'pipe' },
      );
    } catch (error) {
      throw new Error(error.stdout.toString());
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
