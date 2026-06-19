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
  const helperPath = path.join(root, 'codegraph-helper.js');
  fs.writeFileSync(
    helperPath,
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

  const output = execFileSync(
    process.execPath,
    [
      SCRIPT,
      '--codegraph-path',
      'D:\\repo\\example-app',
      '--codegraph-bin',
      helperPath,
      '--live-callers',
      'Authenticate',
      '--live-callees',
      'Authenticate',
    ],
    { encoding: 'utf8' },
  );
  const result = JSON.parse(output);

  assert.deepEqual(result.affectedSubgraph, ['Authenticate -> Login', 'LoginHandler -> Authenticate']);
  assert.deepEqual(result.checks, ['call-depth']);
});

test('repo-shell build-graph-review-import rejects windows cmd wrappers', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'build-graph-review-import-cmd-shell-'));
  const wrapperPath = path.join(root, 'codegraph.cmd');
  fs.writeFileSync(wrapperPath, '@echo off\r\nexit /b 0\r\n');

  assert.throws(
    () =>
      execFileSync(
        process.execPath,
        [
          SCRIPT,
          '--codegraph-path',
          'D:\\repo\\example-app',
          '--codegraph-bin',
          wrapperPath,
          '--live-callers',
          'Authenticate',
        ],
        { encoding: 'utf8' },
      ),
    /Windows \.cmd\/\.bat wrappers are not supported/u,
  );
});
