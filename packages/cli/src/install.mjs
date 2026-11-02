import { lstat, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
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

async function checkAncestors(root, target) {
  const parts = relative(root, target).split(sep);
  let path = root;
  for (const part of ['', ...parts]) {
    path = resolve(path, part);
    try {
      const info = await lstat(path);
      if (info.isSymbolicLink()) throw new Error(`Refusing symlink: ${path}`);
      if (path !== target && !info.isDirectory())
        throw new Error(`Not a directory: ${path}`);
      if (path === target && !info.isFile())
        throw new Error(`Not a file: ${path}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

function destinationPath(root, directory) {
  const destination = resolve(root, directory);
  const inside = relative(root, destination);
  if (
    !inside ||
    inside.startsWith(`..${sep}`) ||
    inside === '..' ||
    isAbsolute(inside)
  )
    throw new Error('--dir must be a subdirectory of --cwd');
  return destination;
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

async function planFile(root, destination, file, overwrite) {
  const target = resolve(destination, file.path);
  await checkAncestors(root, target);
  let existing;
  try {
    existing = await readFile(target, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const action =
    existing === file.content
      ? 'unchanged'
      : existing === undefined
        ? 'create'
        : 'overwrite';
  if (action === 'overwrite' && !overwrite)
    throw new Error(
      `Existing file differs: ${target}. Review it before using --overwrite.`,
    );
  return { target, action, content: file.content };
}

async function writePlan(root, plan) {
  for (const file of plan) {
    if (file.action === 'unchanged') continue;
    await mkdir(dirname(file.target), { recursive: true });
    await checkAncestors(root, file.target);
    await writeFile(file.target, file.content, {
      flag: file.action === 'create' ? 'wx' : 'w',
    });
  }
}

export async function addComponents({
  registry,
  names,
  cwd = process.cwd(),
  directory = 'src/components/utakata',
  dryRun = false,
  overwrite = false,
}) {
  if (!names.length || names.some((name) => !validName(name)))
    throw new Error('Specify component names, for example: add button dialog');
  const root = resolve(cwd);
  const destination = destinationPath(root, directory);
  const { files, dependencies } = await collectComponents(registry, names);
  // Complete validation and conflict detection before writing any file.
  const plan = [];
  for (const file of files.values())
    plan.push(await planFile(root, destination, file, overwrite));
  if (!dryRun) await writePlan(root, plan);
  return {
    files: plan.map(({ target, action }) => ({ target, action })),
    dependencies: Object.fromEntries(dependencies),
  };
}
