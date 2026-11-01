import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function hookContext(event, root) {
  if (event === 'SessionStart') {
    return 'Utakata-UI: read AGENTS.md. Skills: utakata-component and utakata-verify. Use pinned pnpm and Node engines. Hooks only check tracked whitespace; run scoped tests and other required checks yourself.';
  }
  if (event !== 'PostToolUse') return '';
  const result = spawnSync('git', ['diff', '--check'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 5000,
    maxBuffer: 32 * 1024,
  });
  if (result.error || result.status === null) {
    return 'Whitespace check could not finish; run git diff --check manually.';
  }
  if (result.status === 0) return '';
  return `git diff --check reported tracked working-tree issues (possibly pre-existing):\n${result.stdout || result.stderr}`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const input = JSON.parse(readFileSync(0, 'utf8'));
    const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    const context = hookContext(input.hook_event_name, root);
    if (context) {
      console.log(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: input.hook_event_name,
          additionalContext: context,
        },
      }));
    }
  } catch {
    console.error('Agent hook could not read its event; check hook configuration.');
    process.exitCode = 1;
  }
}
