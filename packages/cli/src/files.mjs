import { lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

export async function checkAncestors(root, target) {
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

export function destinationPath(root, directory) {
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

export async function planFile(root, destination, file, overwrite) {
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

export async function writePlan(root, plan) {
  for (const file of plan) {
    if (file.action === 'unchanged') continue;
    await mkdir(dirname(file.target), { recursive: true });
    await checkAncestors(root, file.target);
    await writeFile(file.target, file.content, {
      flag: file.action === 'create' ? 'wx' : 'w',
    });
  }
}
