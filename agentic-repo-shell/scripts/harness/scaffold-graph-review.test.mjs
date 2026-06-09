import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(TEST_DIR, 'scaffold-graph-review.mjs');

test('repo-shell scaffold-graph-review mirrors root behavior', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-graph-review-shell-'));
  fs.mkdirSync(path.join(root, 'docs', 'harness', 'tasks'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'docs', 'harness', 'tasks', 'sample.task.md'),
    [
      '# Task Packet: sample',
      '',
      '## Structural Scope',
      '',
      '- Affected Subgraph: `route -> handler -> service -> repo`',
      '- Boundary Crossings: `none`',
      '- Risk Nodes: `none`',
      '- Graph Focus: `hub-check | cycle-check`',
      '',
      '## Linkage',
      '',
      '- Task ID: `sample`',
      '- OpenSpec Change: `none`',
      '- Superpowers Plan: `none`',
      '- Evidence Directory: `.harness/evidence/sample/`',
      '- Review File: `.harness/evidence/sample/review.md`',
    ].join('\n'),
  );

  const output = execFileSync(
    process.execPath,
    [SCRIPT, '--json', '--write', '--root', root, 'sample'],
    { encoding: 'utf8' },
  );
  const result = JSON.parse(output);

  assert.equal(result.taskId, 'sample');
  const evidence = JSON.parse(
    fs.readFileSync(path.join(root, '.harness', 'evidence', 'sample', 'commands.json'), 'utf8'),
  );
  assert.deepEqual(evidence.graphChecks.checks, ['cycle', 'hub']);
});

test('repo-shell scaffold-graph-review accepts imported graph review payload', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-graph-review-shell-import-'));
  fs.mkdirSync(path.join(root, 'docs', 'harness', 'tasks'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'docs', 'harness', 'tasks', 'sample.task.md'),
    [
      '# Task Packet: sample',
      '',
      '## Structural Scope',
      '',
      '- Affected Subgraph: `route -> handler -> service -> repo`',
      '- Boundary Crossings: `none`',
      '- Risk Nodes: `none`',
      '- Graph Focus: `hub-check | cycle-check`',
      '',
      '## Linkage',
      '',
      '- Task ID: `sample`',
      '- OpenSpec Change: `none`',
      '- Superpowers Plan: `none`',
      '- Evidence Directory: `.harness/evidence/sample/`',
      '- Review File: `.harness/evidence/sample/review.md`',
    ].join('\n'),
  );
  const importPath = path.join(root, 'graph-review.json');
  fs.writeFileSync(
    importPath,
    JSON.stringify(
      {
        usedCodeGraph: true,
        checks: ['hub', 'sensitive-flow'],
        findings: ['imported finding'],
        notes: 'imported note',
      },
      null,
      2,
    ),
  );

  execFileSync(
    process.execPath,
    [SCRIPT, '--write', '--import', importPath, '--root', root, 'sample'],
    { encoding: 'utf8' },
  );

  const evidence = JSON.parse(
    fs.readFileSync(path.join(root, '.harness', 'evidence', 'sample', 'commands.json'), 'utf8'),
  );
  assert.equal(evidence.graphChecks.usedCodeGraph, true);
  assert.deepEqual(evidence.graphChecks.checks, ['hub', 'sensitive-flow']);
  assert.deepEqual(evidence.graphChecks.findings, ['imported finding']);
});

test('repo-shell scaffold-graph-review supports direct live codegraph task writes', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-graph-review-shell-live-'));
  fs.mkdirSync(path.join(root, 'docs', 'harness', 'tasks'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'docs', 'harness', 'tasks', 'sample.task.md'),
    [
      '# Task Packet: sample',
      '',
      '## Structural Scope',
      '',
      '- Affected Subgraph: `route -> handler -> service -> repo`',
      '- Boundary Crossings: `none`',
      '- Risk Nodes: `none`',
      '- Graph Focus: `hub-check | cycle-check`',
      '',
      '## Linkage',
      '',
      '- Task ID: `sample`',
      '- OpenSpec Change: `none`',
      '- Superpowers Plan: `none`',
      '- Evidence Directory: `.harness/evidence/sample/`',
      '- Review File: `.harness/evidence/sample/review.md`',
    ].join('\n'),
  );
  fs.writeFileSync(
    path.join(root, 'codegraph-helper.js'),
    `const command = process.argv[2];
if (command === 'callers') {
  console.log(JSON.stringify({ symbol: 'Authenticate', callers: [{ name: 'LoginHandler' }] }, null, 2));
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
      '--json',
      '--write',
      '--root',
      root,
      '--codegraph-path',
      'D:\\repo\\example-app',
      '--codegraph-bin',
      path.join(root, 'codegraph.cmd'),
      '--live-callers',
      'Authenticate',
      'sample',
    ],
    { encoding: 'utf8' },
  );
  const result = JSON.parse(output);

  assert.equal(result.graphChecks.usedCodeGraph, true);
  assert.deepEqual(result.graphChecks.affectedSubgraph, ['LoginHandler -> Authenticate']);
  assert.deepEqual(result.graphChecks.checks, ['call-depth']);
});
