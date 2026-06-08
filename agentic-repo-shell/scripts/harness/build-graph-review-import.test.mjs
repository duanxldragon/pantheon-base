import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(TEST_DIR, 'build-graph-review-import.mjs');

test('repo-shell build-graph-review-import mirrors root behavior', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'build-graph-review-import-shell-'));
  const source = path.join(root, 'trace.json');
  fs.writeFileSync(
    source,
    JSON.stringify(
      {
        trace: [{ name: 'router' }, { name: 'service' }, { name: 'repo' }],
        checks: ['cycle'],
        findings: ['imported finding'],
      },
      null,
      2,
    ),
  );

  const output = execFileSync(process.execPath, [SCRIPT, '--source', source], { encoding: 'utf8' });
  const result = JSON.parse(output);

  assert.deepEqual(result.affectedSubgraph, ['router -> service -> repo']);
  assert.deepEqual(result.checks, ['cycle']);
});

test('repo-shell build-graph-review-import supports live codegraph mode', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'build-graph-review-import-live-shell-'));
  fs.writeFileSync(
    path.join(root, 'codegraph-helper.js'),
    `const command = process.argv[2];
if (command === 'callers') {
  console.log(JSON.stringify({ symbol: 'Authenticate', callers: [{ name: 'LoginHandler' }] }, null, 2));
  process.exit(0);
}
if (command === 'callees') {
  console.log(JSON.stringify({ symbol: 'Authenticate', callees: [{ name: 'Login' }] }, null, 2));
  process.exit(0);
}
console.error('unknown');
process.exit(1);
`,
  );
  fs.writeFileSync(path.join(root, 'codegraph.cmd'), `@echo off\r\nnode "%~dp0\\codegraph-helper.js" %*\r\n`);

  const output = execFileSync(
    process.execPath,
    [
      SCRIPT,
      '--codegraph-path',
      'D:\\repo\\example-app',
      '--codegraph-bin',
      path.join(root, 'codegraph.cmd'),
      '--live-callers',
      'Authenticate',
      '--live-callees',
      'Authenticate',
    ],
    {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${root};${process.env.PATH ?? ''}` },
    },
  );
  const result = JSON.parse(output);

  assert.deepEqual(result.affectedSubgraph, ['Authenticate -> Login', 'LoginHandler -> Authenticate']);
  assert.deepEqual(result.checks, ['call-depth']);
});
