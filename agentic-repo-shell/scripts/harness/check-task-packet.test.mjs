import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(TEST_DIR, 'check-task-packet.mjs');

const VALID_PACKET = `# Task Packet: Sample

## Goal

Sample goal for fixture.

## Primary Layer

platform

## Dependency Layers

- platform

## Harness Profile

- Template: custom
- Overlay: none
- Coverage Dimensions:
  - method-health

## Contract Anchors

- \`docs/harness/HARNESS_ENGINEERING_CONTRACT.md\`

## Scope

### In

- only sample work

### Out

- everything else

## Expected Files

### Create

- \`scripts/harness/sample.mjs\`

### Modify

- none

### Do Not Touch

- \`backend/\`

## Implementation Notes

write the script.

## Structural Scope

- Affected Subgraph: \`task packet -> checker -> result\`
- Boundary Crossings: \`none\`
- Risk Nodes: \`none\`
- Graph Focus: \`method-health\`

## Verification Plan

- node scripts/harness/sample.mjs

## Linkage

- Task ID: \`sample\`
- OpenSpec Change: none
- Superpowers Plan: none
- Evidence Directory: \`.harness/evidence/sample/\`
- Review File: \`.harness/evidence/sample/review.md\`

## Evidence Required

- evidence/sample/commands.json

## Human Gates

- review

## Completion Checklist

- [x] Layer and boundary declared
- [x] Contract anchors read
- [x] Verification run or exception recorded
- [x] Evidence saved or summarized
- [x] Review completed
`;

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'check-task-packet-'));
  fs.mkdirSync(path.join(root, 'docs', 'harness', 'tasks'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs', 'harness'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'docs', 'harness', 'HARNESS_ENGINEERING_CONTRACT.md'),
    'anchor stub',
  );
  fs.mkdirSync(path.join(root, '.harness', 'evidence', 'sample'), { recursive: true });
  fs.writeFileSync(path.join(root, '.harness', 'evidence', 'sample', 'review.md'), '# Review');
  return root;
}

test('check-task-packet accepts a valid task packet fixture', () => {
  const root = makeFixture();
  fs.writeFileSync(
    path.join(root, 'docs', 'harness', 'tasks', 'sample.task.md'),
    VALID_PACKET,
  );

  const output = execFileSync(process.execPath, [SCRIPT, '--json', '--root', root], {
    encoding: 'utf8',
  });
  const result = JSON.parse(output);

  assert.equal(result.errorCount, 0);
  assert.equal(result.warningCount, 0);
  assert.equal(result.results.length, 1);
});

test('check-task-packet fails when required sections are missing', () => {
  const root = makeFixture();
  fs.writeFileSync(
    path.join(root, 'docs', 'harness', 'tasks', 'broken.task.md'),
    '# Task Packet: Broken\n\nNo sections here.\n',
  );

  const result = spawnSync(process.execPath, [SCRIPT, '--root', root], { encoding: 'utf8' });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Missing required section/);
});

test('check-task-packet warns when contract anchor file does not exist', () => {
  const root = makeFixture();
  const packet = VALID_PACKET.replace(
    '`docs/harness/HARNESS_ENGINEERING_CONTRACT.md`',
    '`docs/harness/DOES_NOT_EXIST.md`',
  );
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'tasks', 'sample.task.md'), packet);

  const output = execFileSync(process.execPath, [SCRIPT, '--json', '--root', root], {
    encoding: 'utf8',
  });
  const result = JSON.parse(output);

  assert.equal(result.errorCount, 0);
  assert.ok(result.warningCount >= 1);
  const warnings = result.results[0].warnings.join('\n');
  assert.match(warnings, /Contract anchor does not exist/);
});

test('check-task-packet rejects an invalid primary layer value', () => {
  const root = makeFixture();
  const packet = VALID_PACKET.replace(/^platform$/m, 'platform | domain/auth');
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'tasks', 'sample.task.md'), packet);

  const result = spawnSync(process.execPath, [SCRIPT, '--root', root], { encoding: 'utf8' });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Invalid primary layer/);
});

test('check-task-packet rejects linkage task id mismatch', () => {
  const root = makeFixture();
  const packet = VALID_PACKET.replace('`sample`', '`other-task`');
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'tasks', 'sample.task.md'), packet);

  const result = spawnSync(process.execPath, [SCRIPT, '--root', root], { encoding: 'utf8' });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /must match file name task id/);
});

test('check-task-packet rejects malformed optional structural scope section', () => {
  const root = makeFixture();
  const packet = VALID_PACKET.replace(
    /## Structural Scope[\s\S]*?## Verification Plan/,
    `## Structural Scope

- Affected Subgraph:
- Boundary Crossings: \`none\`
- Risk Nodes: \`none\`

## Verification Plan`,
  );
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'tasks', 'sample.task.md'), packet);

  const result = spawnSync(process.execPath, [SCRIPT, '--root', root], { encoding: 'utf8' });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Affected Subgraph|Graph Focus/);
});
