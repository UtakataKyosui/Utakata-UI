import { spawnSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const managers = ['npm', 'pnpm', 'yarn', 'bun'];

export async function dependencyPlan(cwd, dependencies, requested) {
  const metadata = JSON.parse(
    await readFile(join(cwd, 'package.json'), 'utf8'),
  );
  if (
    metadata.packageManager != null &&
    typeof metadata.packageManager !== 'string'
  )
    throw new Error('package.json packageManager must be a string.');
  let manager = requested ?? metadata.packageManager?.split('@')[0];
  if (!manager) {
    const locks = [];
    for (const [name, files] of [
      ['pnpm', ['pnpm-lock.yaml']],
      ['yarn', ['yarn.lock']],
      ['bun', ['bun.lock', 'bun.lockb']],
      ['npm', ['package-lock.json']],
    ]) {
      if (
        (
          await Promise.all(
            files.map((file) =>
              stat(join(cwd, file)).then(
                () => true,
                (error) => {
                  if (error.code === 'ENOENT') return false;
                  throw error;
                },
              ),
            ),
          )
        ).some(Boolean)
      )
        locks.push(name);
    }
    if (locks.length > 1)
      throw new Error(
        'Multiple package managers found; specify --package-manager.',
      );
    manager = locks[0] ?? 'npm';
  }
  if (!managers.includes(manager))
    throw new Error('Use npm, pnpm, yarn or bun as --package-manager.');
  const packages = Object.entries(dependencies).map(([name, version]) => {
    if (
      !['@base-ui/react', 'lism-css'].includes(name) ||
      !/^[~^]?\d+\.\d+\.\d+$/.test(version)
    )
      throw new Error('Unsupported registry dependency.');
    return `${name}@${version}`;
  });
  return {
    manager,
    args: [
      manager === 'npm' ? 'install' : 'add',
      '--ignore-scripts',
      ...packages,
    ],
  };
}

export function installDependencies(cwd, plan) {
  const windowsShim = process.platform === 'win32' && plan.manager !== 'bun';
  // Registry package names/versions and manager names are allowlisted above.
  // Quote the fixed arguments for Windows .cmd shims without interpolating cwd.
  const command = windowsShim ? 'cmd.exe' : plan.manager;
  const args = windowsShim
    ? [
        '/d',
        '/s',
        '/c',
        `"${plan.manager}.cmd" ${plan.args.map((arg) => `"${arg}"`).join(' ')}`,
      ]
    : plan.args;
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(
      `Dependency installation failed (${plan.manager}); generated files remain available. Rerun the printed install command.`,
    );
}
