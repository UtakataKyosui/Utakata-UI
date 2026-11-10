import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const cli = new URL('../bin/utakata-ui.mjs', import.meta.url);
const invoke = (...args) =>
  spawnSync(process.execPath, [cli.pathname, ...args], { encoding: 'utf8' });

test('top-level and a11y help describe the unified command', () => {
  for (const args of [[], ['--help'], ['a11y', '--help'], ['a11y', '-h']]) {
    const result = invoke(...args);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /utakata-ui a11y --config/);
  }
});

test('a11y preserves text/JSON results and exit codes without a registry', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'utakata-a11y-'));
  const config = join(cwd, 'colors.json');
  const check = {
    name: 'body',
    kind: 'text',
    foreground: '#000',
    background: '#fff',
    conveysMeaning: false,
  };
  try {
    await writeFile(config, JSON.stringify([check]));
    const pass = invoke('a11y', '--config', config);
    assert.equal(pass.status, 0, pass.stderr);
    assert.match(pass.stdout, /PASS body: 21\.000:1/);
    const json = invoke('a11y', '--config', config, '--json');
    assert.equal(json.status, 0, json.stderr);
    assert.deepEqual(JSON.parse(json.stdout), [
      { name: 'body', ratio: 21, minimum: 4.5, violations: [] },
    ]);
    await writeFile(
      config,
      JSON.stringify([{ ...check, foreground: '#777', conveysMeaning: true }]),
    );
    const fail = invoke('a11y', '--config', config, '--json');
    assert.equal(fail.status, 1);
    assert.equal(JSON.parse(fail.stdout)[0].violations.length, 2);
    for (const content of [
      '{',
      '[]',
      JSON.stringify([{ ...check, foreground: 'transparent' }]),
    ]) {
      await writeFile(config, content);
      const invalid = invoke('a11y', '--config', config);
      assert.equal(invalid.status, 2);
      assert.match(invalid.stderr, /Utakata UI a11y:/);
    }
    for (const args of [
      [],
      ['--config'],
      ['--unknown'],
      ['extra'],
      ['--config', join(cwd, 'missing.json')],
    ]) {
      const invalid = invoke('a11y', ...args);
      assert.equal(invalid.status, 2);
      assert.match(invalid.stderr, /Utakata UI a11y:/);
    }
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
