import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, validateItem } from '../../cli/src/registry.mjs';

const source = fileURLToPath(new URL('../../react/src/', import.meta.url));
const packageJson = JSON.parse(
  await readFile(new URL('../../react/package.json', import.meta.url), 'utf8'),
);

// Keep the source tree intact, including type-only imports and diagnostics.
export async function createRegistry() {
  const names = (await readdir(resolve(source, 'components')))
    .filter((name) => /^[A-Z].*\.tsx$/.test(name))
    .sort();
  const items = [];
  for (const filename of names) {
    const files = new Map();
    async function collect(path) {
      if (files.has(path)) return;
      const content = await readFile(resolve(source, path), 'utf8');
      files.set(path, {
        path,
        content,
        sha256: digest(content),
      });
      for (const match of content.matchAll(/\bfrom\s+['"](\.[^'"]+)['"]/g)) {
        const imported = resolve(source, dirname(path), match[1]);
        const relative = imported.slice(source.length).replace(/^\//, '');
        const candidates = relative.endsWith('.js')
          ? [
              relative.replace(/\.js$/, '.ts'),
              relative.replace(/\.js$/, '.tsx'),
            ]
          : [relative];
        let dependency;
        for (const candidate of candidates) {
          try {
            await readFile(resolve(source, candidate));
            dependency = candidate;
            break;
          } catch (error) {
            if (error.code !== 'ENOENT') throw error;
          }
        }
        if (!dependency)
          throw new Error(`Missing import ${match[1]} in ${path}`);
        await collect(dependency);
      }
    }
    await collect(`components/${filename}`);
    await collect('styles/styles.css');
    const license = await readFile(
      new URL('../../../LICENSE', import.meta.url),
      'utf8',
    );
    files.set('LICENSE', {
      path: 'LICENSE',
      content: license,
      sha256: digest(license),
    });
    const name = filename.replace(/\.tsx$/, '').toLowerCase();
    items.push(
      validateItem(
        {
          schemaVersion: 1,
          kind: 'utakata-ui/component',
          packageVersion: packageJson.version,
          name,
          title: filename.replace(/\.tsx$/, ''),
          dependencies: packageJson.dependencies,
          files: [...files.values()].sort((a, b) =>
            a.path.localeCompare(b.path),
          ),
        },
        name,
      ),
    );
  }
  return items;
}

export async function writeRegistry(directory) {
  const items = await createRegistry();
  await mkdir(directory, { recursive: true });
  for (const item of items) {
    await writeFile(
      resolve(directory, `${item.name}.json`),
      `${JSON.stringify(item, null, 2)}\n`,
    );
  }
  await writeFile(
    resolve(directory, 'registry.json'),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        kind: 'utakata-ui/catalog',
        packageVersion: packageJson.version,
        items: items.map(({ name, title }) => ({ name, title })),
      },
      null,
      2,
    )}\n`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await writeRegistry(
    fileURLToPath(new URL('../dist/registry/v1/', import.meta.url)),
  );
}
