import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const packages = {
  react: { path: 'packages/react/package.json', name: '@utakata-ui/react' },
  cli: { path: 'packages/cli/package.json', name: '@utakata-ui/cli' },
};

export function selectRelease({ current, previous, expectedName, event }) {
  if (
    current.name !== expectedName ||
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(current.version)
  )
    throw new Error(
      'Release requires the expected package name and a stable package.json version.',
    );
  if (event === 'workflow_dispatch')
    return { release: true, version: current.version };
  if (event !== 'push' || !previous || previous.name !== expectedName)
    throw new Error(
      'Automatic release requires a readable previous package.json.',
    );
  if (current.version === previous.version)
    return { release: false, version: current.version };
  if (!/^\d+\.\d+\.\d+$/.test(previous.version))
    throw new Error('Previous package.json version must be stable.');
  const next = current.version.split('.').map(Number);
  const old = previous.version.split('.').map(Number);
  const index = next.findIndex((part, i) => part !== old[i]);
  if (index === -1 || next[index] < old[index])
    throw new Error('Package version must increase.');
  return { release: true, version: current.version };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const target = packages[process.argv[2]];
  if (!target) throw new Error('Select react or cli.');
  if (process.env.GITHUB_REF !== 'refs/heads/main')
    throw new Error('Release must run on main.');
  const event = process.env.GITHUB_EVENT_NAME;
  let previous;
  if (event === 'push') {
    const before = process.env.BEFORE_SHA;
    if (!/^[a-f0-9]{40}$/.test(before ?? '') || /^0+$/.test(before))
      throw new Error('Automatic release needs a valid push base.');
    previous = JSON.parse(
      execFileSync('git', ['show', `${before}:${target.path}`], {
        encoding: 'utf8',
      }),
    );
  }
  const result = selectRelease({
    current: JSON.parse(readFileSync(target.path, 'utf8')),
    previous,
    expectedName: target.name,
    event,
  });
  const output = `release=${result.release}\nversion=${result.version}\n`;
  console.log(output);
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, output);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `### ${target.name}\n\npackage.json version: ${result.version}; ${result.release ? 'verify and release' : 'unchanged — no publication'}.\n`,
    );
}
