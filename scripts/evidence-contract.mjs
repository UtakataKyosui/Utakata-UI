import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readlinkSync } from 'node:fs';

export function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

/** Includes unstaged and new nonignored source. Dist/results/caches remain
 * ignored; a dirty-tree run cannot be mistaken for the clean commit. */
export function sourceFingerprint() {
  const paths = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    { encoding: 'utf8' },
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
