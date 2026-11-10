import { readFile, realpath } from 'node:fs/promises';
import { basename, dirname, relative, resolve, sep } from 'node:path';
import { checkAncestors, destinationPath } from './files.mjs';

export const configName = 'utakata.json';
const defaultDirectory = 'src/components/utakata';

export function projectDirectory(root, directory) {
  const destination = destinationPath(root, directory);
  if (relative(root, destination).split(sep)[0].toLowerCase() === configName)
    throw new Error(`--dir must not overlap ${configName}`);
  return destination;
}

async function readConfig(root, ignoreInvalid) {
  const target = resolve(root, configName);
  await checkAncestors(root, target);
  try {
    const config = JSON.parse(await readFile(target, 'utf8'));
    if (
      config?.schemaVersion !== 1 ||
      typeof config.registry !== 'string' ||
      !config.registry.trim() ||
      typeof config.directory !== 'string' ||
      !config.directory.trim()
    )
      throw new Error('Expected schemaVersion: 1, registry and directory');
    projectDirectory(root, config.directory);
    return config;
  } catch (error) {
    if (error.code === 'ENOENT' || ignoreInvalid) return undefined;
    throw new Error(`Invalid ${configName}: ${error.message}`);
  }
}

export async function projectOptions(
  { cwd = process.cwd(), registry, directory },
  initializing = false,
) {
  const root = resolve(cwd);
  // An explicit init registry can repair an invalid config through --overwrite.
  const config = await readConfig(root, initializing && registry !== undefined);
  const source = registry ?? config?.registry;
  if (typeof source !== 'string' || !source.trim())
    throw new Error(
      `--registry is required; run init --registry <URL or directory> to save it in ${configName}`,
    );
  return {
    cwd: root,
    registry: /^https?:\/\//.test(source)
      ? source
      : resolve(registry === undefined ? root : process.cwd(), source),
    directory: directory ?? config?.directory ?? defaultDirectory,
  };
}

async function physicalPath(path) {
  try {
    return await realpath(path);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return resolve(await physicalPath(dirname(path)), basename(path));
  }
}

export async function configContents({ cwd, registry, directory }) {
  return `${JSON.stringify(
    {
      schemaVersion: 1,
      registry: /^https?:\/\//.test(registry)
        ? registry
        : relative(await physicalPath(cwd), await physicalPath(registry))
            .split(sep)
            .join('/') || '.',
      directory: relative(cwd, projectDirectory(cwd, directory))
        .split(sep)
        .join('/'),
    },
    null,
    2,
  )}\n`;
}
