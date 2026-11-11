import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readlinkSync } from 'node:fs';

export function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function readEvidenceGit(...args) {
  // Hooks can inherit a temporary commit index. Read the worktree's own
  // index and prevent status from writing a stat refresh back to it.
  const env = { ...process.env };
  delete env.GIT_INDEX_FILE;
  return execFileSync('git', ['--no-optional-locks', ...args], {
    encoding: 'utf8',
    env,
  });
}

/** Includes unstaged and new nonignored source. Dist/results/caches remain
 * ignored; a dirty-tree run cannot be mistaken for the clean commit. */
export function sourceFingerprint() {
  const paths = readEvidenceGit(
    'ls-files',
    '-z',
    '--cached',
    '--others',
    '--exclude-standard',
  )
    .split('\0')
    .filter(Boolean)
    .sort();
  return digest(
    paths
      .map((path) => {
        try {
          const stat = lstatSync(path);
          return [
            path,
            stat.isSymbolicLink()
              ? readlinkSync(path)
              : stat.isFile()
                ? digest(readFileSync(path))
                : 'directory',
          ];
        } catch {
          return [path, 'deleted'];
        }
      })
      .map((entry) => JSON.stringify(entry))
      .join('\n'),
  );
}
