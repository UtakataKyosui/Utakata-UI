import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

// Resolve from the actual Docs dependency graph, without hard-coded .pnpm paths.
const docs = createRequire(
  new URL('../packages/docs/package.json', import.meta.url),
);
const blume = createRequire(docs.resolve('blume'));
const compiler = createRequire(blume.resolve('@astrojs/compiler-rs'));
const binding = compiler.resolve('@astrojs/compiler-binding');

try {
  await import(pathToFileURL(binding).href);
  console.log(
    `Docs native compiler loaded (${process.platform}/${process.arch}, ${process.version})`,
  );
} catch (error) {
  console.error('Docs native compiler failed to load:', binding);
  console.error(
    'Installed sibling bindings:',
    readdirSync(dirname(dirname(binding))),
  );
  console.error(error);
  process.exitCode = 1;
}
