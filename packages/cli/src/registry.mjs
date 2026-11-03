import { createHash } from 'node:crypto';

export const digest = (content) =>
  createHash('sha256').update(content).digest('hex');
export const validName = (name) =>
  typeof name === 'string' && /^[a-z][a-z0-9-]*$/.test(name);

function validateDependencies(dependencies, name) {
  const supported = ['@base-ui/react', 'lism-css'];
  if (!dependencies || Object.keys(dependencies).length !== supported.length)
    throw new Error(`Invalid dependencies: ${name}`);
  for (const key of supported) {
    if (
      typeof dependencies[key] !== 'string' ||
      !/^[~^]?\d+\.\d+\.\d+$/.test(dependencies[key])
    )
      throw new Error(`Invalid dependencies: ${name}`);
  }
}

function validateFile(file, paths, name) {
  if (typeof file?.path !== 'string' || typeof file.content !== 'string')
    throw new Error(`Invalid registry file: ${name}`);
  if (
    !/^(LICENSE|(?:components|metadata|styles)\/[A-Za-z0-9_/-]+\.(?:ts|tsx|css))$/.test(
      file.path,
    )
  )
    throw new Error(`Invalid registry path: ${name}`);
  if (
    file.path.split('/').some((part) => !part || part === '.' || part === '..')
  )
    throw new Error(`Invalid registry path: ${name}`);
  if (
    paths.has(file.path.toLowerCase()) ||
    file.sha256 !== digest(file.content)
  )
    throw new Error(`Invalid registry file: ${name}`);
  paths.add(file.path.toLowerCase());
}

function validateFiles(item, name) {
  if (
    !Array.isArray(item.files) ||
    !item.files.length ||
    item.files.length > 256
  )
    throw new Error(`Invalid files: ${name}`);
  const paths = new Set();
  for (const file of item.files) validateFile(file, paths, name);
  const required = [
    'license',
    'styles/styles.css',
    `components/${item.title}.tsx`.toLowerCase(),
  ];
  if (!required.every((path) => paths.has(path)))
    throw new Error(`Incomplete component: ${name}`);
}

export function validateItem(item, name) {
  if (
    item?.schemaVersion !== 1 ||
    item.kind !== 'utakata-ui/component' ||
    item.name !== name ||
    !validName(name) ||
    typeof item.title !== 'string' ||
    !/^\d+\.\d+\.\d+$/.test(item.packageVersion)
  ) {
    throw new Error(`Invalid Utakata UI registry item: ${name}`);
  }
  validateDependencies(item.dependencies, name);
  validateFiles(item, name);
  return item;
}

export function validateCatalog(catalog) {
  if (
    catalog?.schemaVersion !== 1 ||
    catalog.kind !== 'utakata-ui/catalog' ||
    !Array.isArray(catalog.items) ||
    !catalog.items.length
  )
    throw new Error('Invalid Utakata UI catalog');
  const names = new Set();
  for (const item of catalog.items) {
    if (
      !validName(item.name) ||
      typeof item.title !== 'string' ||
      names.has(item.name)
    )
      throw new Error('Invalid catalog entry');
    names.add(item.name);
  }
  return catalog;
}
