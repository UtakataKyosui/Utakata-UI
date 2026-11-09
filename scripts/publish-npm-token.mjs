import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function publishWithToken(
  archive,
  {
    token = process.env.NPM_TOKEN,
    environment = process.env,
    execute = execFileSync,
  } = {},
) {
  if (!token?.trim())
    throw new Error('The npm Environment must define NPM_TOKEN');
  if (!archive?.endsWith('.tgz'))
    throw new Error('Exactly one packed .tgz is required');
  const directory = mkdtempSync(join(tmpdir(), 'utakata-npm-auth-'));
  const userconfig = join(directory, 'npmrc');
  try {
    // Only the variable reference is written; never persist the secret itself.
    writeFileSync(
      userconfig,
      '//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}\n',
      { mode: 0o600 },
    );
    const env = {
      ...environment,
      NODE_AUTH_TOKEN: token,
      NPM_CONFIG_USERCONFIG: userconfig,
    };
    delete env.NPM_TOKEN;
    execute(
      'npm',
      [
        'publish',
        resolve(archive),
        '--access',
        'public',
        '--provenance',
        '--tag',
        'latest',
        '--registry=https://registry.npmjs.org/',
        '--ignore-scripts',
      ],
      { env, stdio: 'inherit' },
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    if (process.argv.length !== 3)
      throw new Error('Exactly one packed .tgz is required');
    publishWithToken(process.argv[2]);
  } catch {
    // Child errors may contain environment data; do not serialize the error object.
    console.error(
      'Token publication failed. Check NPM_TOKEN, scope permissions, version and npm publish output.',
    );
    process.exitCode = 1;
  }
}
