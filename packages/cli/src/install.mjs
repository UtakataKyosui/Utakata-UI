import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  configContents,
  configName,
  projectDirectory,
  projectOptions,
} from './config.mjs';
import { planFile, writePlan } from './files.mjs';
import { paletteFile } from './palette.mjs';
import { validateCatalog, validateItem, validName } from './registry.mjs';

const limit = 8 * 1024 * 1024;

function registryURL(registry, filename) {
  const base = new URL(registry.endsWith('/') ? registry : `${registry}/`);
  if (base.username || base.password || base.search || base.hash)
    throw new Error(
      'Registry URL must not contain credentials, query or fragment',
    );
  if (
    base.protocol !== 'https:' &&
    !['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)
  )
    throw new Error('Use HTTPS for a remote registry');
  return new URL(filename, base);
}

async function readHTTP(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    redirect: 'error',
  });
  if (!response.ok)
    throw new Error(`Registry returned HTTP ${response.status}`);
  const chunks = [];
  let bytes = 0;
  for await (const chunk of response.body) {
    bytes += chunk.length;
    if (bytes > limit) throw new Error('Registry response too large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function readRegistry(registry, filename) {
  if (/^https?:\/\//.test(registry))
    return JSON.parse(await readHTTP(registryURL(registry, filename)));
  const path = resolve(registry, filename);
  if ((await stat(path)).size > limit)
    throw new Error('Registry file too large');
  return JSON.parse(await readFile(path, 'utf8'));
}

export async function listComponents(registry) {
  return validateCatalog(await readRegistry(registry, 'registry.json')).items;
}

function mergeDependencies(dependencies, item) {
  for (const [dependency, version] of Object.entries(item.dependencies)) {
    if (
      dependencies.has(dependency) &&
      dependencies.get(dependency) !== version
    )
      throw new Error(`Conflicting dependency: ${dependency}`);
    dependencies.set(dependency, version);
  }
}

function mergeFiles(files, item) {
  for (const file of item.files) {
    const key = file.path.toLowerCase();
    const existing = files.get(key);
    if (
      existing &&
      (existing.path !== file.path || existing.content !== file.content)
    )
      throw new Error(`Conflicting registry files: ${file.path}`);
    files.set(key, file);
  }
}

async function collectComponents(registry, names) {
  const files = new Map();
  const dependencies = new Map();
  const versions = new Set();
  for (const name of [...new Set(names)]) {
    const item = validateItem(
      await readRegistry(registry, `${name}.json`),
      name,
    );
    versions.add(item.packageVersion);
    if (versions.size > 1) throw new Error('Conflicting component versions');
    mergeDependencies(dependencies, item);
    mergeFiles(files, item);
  }
  return { files, dependencies };
}

export async function addComponents({
  registry,
  names,
  cwd = process.cwd(),
  directory,
  dryRun = false,
  overwrite = false,
}) {
  if (!names.length || names.some((name) => !validName(name)))
    throw new Error('Specify component names, for example: add button dialog');
  const options = await projectOptions({ registry, directory, cwd });
  const root = options.cwd;
  const destination = projectDirectory(root, options.directory);
  const { files, dependencies } = await collectComponents(
    options.registry,
    names,
  );
  // Complete validation and conflict detection before writing any file.
  const plan = [];
  for (const file of files.values())
    plan.push(await planFile(root, destination, file, overwrite));
  const theme = paletteFile(options.palette);
  if (theme) plan.push(await planFile(root, destination, theme, overwrite));
  if (!dryRun) await writePlan(root, plan);
  return {
    files: plan.map(({ target, action }) => ({ target, action })),
    dependencies: Object.fromEntries(dependencies),
    ...(theme ? { stylesheet: resolve(destination, theme.path) } : {}),
  };
}

export async function initializeProject({
  registry,
  directory,
  cwd,
  palette,
  dryRun = false,
  overwrite = false,
}) {
  const options = await projectOptions(
    { registry, directory, cwd, palette },
    true,
  );
  const destination = projectDirectory(options.cwd, options.directory);
  const items = await listComponents(options.registry);
  // Each component carries the same shared CSS and license. Validate the full
  // item, but initialize only those shared files, without installing a component.
  const { files, dependencies } = await collectComponents(options.registry, [
    items[0].name,
  ]);
  const shared = [...files.values()].filter(
    (file) => file.path === 'LICENSE' || file.path.startsWith('styles/'),
  );
  const plan = [
    await planFile(
      options.cwd,
      options.cwd,
      {
        path: configName,
        content: await configContents(options),
      },
      overwrite,
    ),
  ];
  for (const file of shared)
    plan.push(await planFile(options.cwd, destination, file, overwrite));
  const theme = paletteFile(options.palette);
  if (theme)
    plan.push(await planFile(options.cwd, destination, theme, overwrite));
  if (!dryRun) await writePlan(options.cwd, plan);
  return {
    files: plan.map(({ target, action }) => ({ target, action })),
    dependencies: Object.fromEntries(dependencies),
    stylesheet: resolve(destination, theme?.path ?? 'styles/styles.css'),
  };
}
