import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { writeRegistry } from '../packages/docs/scripts/generate-registry.mjs';

async function verifyHTTP(cwd, registry, version) {
  const server = createServer(async (request, response) => {
    if (!/^\/(registry|button)\.json$/.test(request.url ?? '')) {
      response.writeHead(404).end();
      return;
    }
    response.setHeader('Content-Type', 'application/json');
    response.end(await readFile(join(registry, request.url.slice(1))));
  });
  await new Promise((ready) => server.listen(0, '127.0.0.1', ready));
  try {
    const url = `http://127.0.0.1:${server.address().port}`;
    const { stdout } = await promisify(execFile)(
      'npm',
      [
        'exec',
        '--offline',
        '--yes',
        '--',
        `@utakata-ui/cli@${version}`,
        'add',
        'button',
        '--registry',
        url,
        '--cwd',
        cwd,
        '--dir',
        'http/components',
      ],
      { cwd, timeout: 30_000 },
    );
    assert.match(stdout, /create/);
    assert.match(
      await readFile(
        join(cwd, 'http/components/components/Button.tsx'),
        'utf8',
      ),
      /iconOnly: true/,
    );
  } finally {
    server.closeAllConnections();
    await new Promise((done) => server.close(done));
  }
}

if (!process.argv[2])
  throw new Error('Usage: node scripts/verify-cli-package.mjs <cli.tgz>');
const archive = resolve(process.argv[2]);
const cwd = await mkdtemp(join(tmpdir(), 'utakata-cli-consumer-'));
try {
  await writeFile(
    join(cwd, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }),
  );
  execFileSync(
    'npm',
    ['install', '--ignore-scripts', '--no-audit', '--no-fund', archive],
    { cwd, stdio: 'inherit', timeout: 120_000 },
  );
  const metadata = JSON.parse(
    await readFile(
      join(cwd, 'node_modules/@utakata-ui/cli/package.json'),
      'utf8',
    ),
  );
  assert.equal(metadata.bin['utakata-ui'], 'bin/utakata-ui.mjs');
  assert.equal(Object.keys(metadata.dependencies ?? {}).length, 0);
  for (const file of ['LICENSE', 'README.md'])
    assert.ok(
      (await readFile(join(cwd, 'node_modules/@utakata-ui/cli', file))).length,
    );
  const registry = join(cwd, 'registry');
  await writeRegistry(registry);
  const invoke = (...args) =>
    execFileSync(
      'npm',
      [
        'exec',
        '--offline',
        '--yes',
        '--',
        `@utakata-ui/cli@${metadata.version}`,
        ...args,
        '--registry',
        registry,
        '--cwd',
        cwd,
      ],
      { cwd, encoding: 'utf8', timeout: 30_000 },
    );
  assert.match(invoke('list'), /button\tButton/);
  assert.match(invoke('add', 'button', 'field', '--dry-run'), /\[dry-run\]/);
  await assert.rejects(readFile(join(cwd, 'src/components/utakata/LICENSE')), {
    code: 'ENOENT',
  });
  assert.match(invoke('add', 'button', 'field'), /pnpm add @base-ui\/react/);
  assert.match(
    await readFile(
      join(cwd, 'src/components/utakata/components/Button.tsx'),
      'utf8',
    ),
    /iconOnly: true/,
  );
  assert.match(
    await readFile(
      join(cwd, 'src/components/utakata/styles/styles.css'),
      'utf8',
    ),
    /lism-css/,
  );
  assert.match(invoke('add', 'button', 'field'), /unchanged/);
  await assert.rejects(readFile(join(cwd, 'components.json')), {
    code: 'ENOENT',
  });
  await verifyHTTP(cwd, registry, metadata.version);
  console.log(
    'Packed CLI: package-name execution, list, dry-run, source installation, repeat installation and HTTP download passed.',
  );
} finally {
  await rm(cwd, { recursive: true, force: true });
}
