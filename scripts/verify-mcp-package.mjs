import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { componentManifest } from '../packages/react/dist/metadata/manifest.js';

const [mcpArchive, reactArchive] = process.argv
  .slice(2)
  .map((path) => resolve(path));
assert.ok(
  mcpArchive && reactArchive,
  'Usage: node scripts/verify-mcp-package.mjs <mcp.tgz> <react.tgz>',
);
const directory = mkdtempSync(join(tmpdir(), 'utakata-mcp-consumer-'));
try {
  writeFileSync(
    join(directory, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }),
  );
  execFileSync(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--prefer-offline',
      mcpArchive,
      reactArchive,
    ],
    { cwd: directory, stdio: 'inherit', timeout: 120_000 },
  );
  const metadata = JSON.parse(
    readFileSync(
      join(directory, 'node_modules/@utakata-ui/mcp/package.json'),
      'utf8',
    ),
  );
  const reactMetadata = JSON.parse(
    readFileSync(
      join(directory, 'node_modules/@utakata-ui/react/package.json'),
      'utf8',
    ),
  );
  assert.equal(
    metadata.dependencies['@utakata-ui/react'],
    reactMetadata.version,
  );
  assert.equal(metadata.bin['utakata-ui-mcp'], 'dist/server.js');
  assert.equal(metadata.license, 'MIT');
  for (const file of ['README.md', 'LICENSE']) {
    assert.ok(
      readFileSync(join(directory, 'node_modules/@utakata-ui/mcp', file))
        .length,
    );
  }
  assert.ok(
    readFileSync(
      join(directory, 'node_modules/@utakata-ui/mcp/dist/server.js'),
      'utf8',
    ).startsWith('#!/usr/bin/env node\n'),
  );
  writeFileSync(
    join(directory, 'expected.json'),
    JSON.stringify(componentManifest),
  );
  writeFileSync(
    join(directory, 'consumer.mjs'),
    `
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
const expected = JSON.parse(readFileSync('expected.json', 'utf8'));
const client = new Client({ name: 'utakata-package-test', version: '1.0.0' });
const transport = new StdioClientTransport({
  command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
  args: ['exec', '--offline', '--yes', '--', ${JSON.stringify(`${metadata.name}@${metadata.version}`)}],
  stderr: 'pipe',
});
let stderr = '';
transport.stderr?.on('data', chunk => { stderr += chunk; });
try {
  await client.connect(transport);
  assert.equal(client.getServerVersion().version, ${JSON.stringify(metadata.version)});
  const tools = await client.listTools();
  assert.deepEqual(tools.tools.map(tool => tool.name).sort(), ['get_component', 'list_components', 'search_components']);
  const list = await client.callTool({name:'list_components', arguments:{}});
  assert.ok(!list.isError);
  const entries = JSON.parse(list.content[0].text);
  assert.deepEqual(entries.map(entry => entry.name).sort(), Object.keys(expected.components).sort());
  for (const entry of entries) {
    const {name, ...details} = entry;
    assert.deepEqual(details, {...expected.components[name], qualityRules: [...expected.components[name].qualityRules, ...expected.sharedQualityRules]});
  }
  const button = await client.callTool({name:'get_component', arguments:{name:'button'}});
  assert.equal(JSON.parse(button.content[0].text).name, 'Button');
  const search = await client.callTool({name:'search_components', arguments:{query:'Dialog'}});
  assert.ok(JSON.parse(search.content[0].text).some(entry => entry.name === 'Dialog'));
  const unknown = await client.callTool({name:'get_component', arguments:{name:'NotAComponent'}});
  assert.equal(unknown.isError, true);
  const invalid = await client.callTool({name:'search_components', arguments:{query:' '}});
  assert.equal(invalid.isError, true);
} finally {
  await client.close();
}
assert.equal(stderr, '');
console.log('Packed MCP: stdio initialization, bin, all tools, manifest parity and invalid inputs passed.');
`,
  );
  execFileSync(process.execPath, ['consumer.mjs'], {
    cwd: directory,
    stdio: 'inherit',
    timeout: 30_000,
  });
} finally {
  rmSync(directory, { recursive: true, force: true });
}
