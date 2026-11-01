import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { hookContext } from './agent-hooks.mjs';

test('hook checks tracked whitespace without modifying files', () => {
  // Git hooks export repository/index paths; the fixture must use its own index.
  const gitEnvironment = Object.entries(process.env).filter(([key]) =>
    key.startsWith('GIT_'),
  );
  for (const [key] of gitEnvironment) delete process.env[key];
  const root = mkdtempSync(join(tmpdir(), 'utakata-hooks-'));
  const git = (...args) => {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  };
  try {
    git('init', '-q');
    writeFileSync(join(root, 'sample.txt'), 'clean\n');
    git('add', 'sample.txt');
    assert.equal(hookContext('PostToolUse', root), '');
    writeFileSync(join(root, 'sample.txt'), 'trailing  \n');
    assert.match(hookContext('PostToolUse', root), /sample.txt/);
    assert.equal(
      readFileSync(join(root, 'sample.txt'), 'utf8'),
      'trailing  \n',
    );
    assert.equal(hookContext('Unknown', root), '');
    assert.match(hookContext('SessionStart', root), /AGENTS.md/);
  } finally {
    rmSync(root, { recursive: true, force: true });
    for (const [key, value] of gitEnvironment) process.env[key] = value;
  }
});

test('both agents discover the same skills and have valid hook definitions', () => {
  for (const skill of ['utakata-ui', 'utakata-component', 'utakata-verify']) {
    for (const agent of ['.agents', '.claude']) {
      assert.equal(
        realpathSync(`${agent}/skills/${skill}`),
        realpathSync(`skills/${skill}`),
      );
    }
  }
  for (const path of ['.claude/settings.json', '.codex/hooks.json']) {
    const { hooks } = JSON.parse(readFileSync(path, 'utf8'));
    assert.ok(hooks.SessionStart.length);
    assert.ok(hooks.PostToolUse.length);
    for (const groups of Object.values(hooks)) {
      for (const group of groups) {
        for (const hook of group.hooks) {
          const result = spawnSync(hook.command, {
            shell: true,
            cwd: join(process.cwd(), 'packages/react'),
            env: { ...process.env, CLAUDE_PROJECT_DIR: process.cwd() },
            input: JSON.stringify({ hook_event_name: 'SessionStart' }),
            encoding: 'utf8',
          });
          assert.equal(result.status, 0, result.stderr);
          assert.match(
            JSON.parse(result.stdout).hookSpecificOutput.additionalContext,
            /AGENTS.md/,
          );
        }
      }
    }
  }
});
