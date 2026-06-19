import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(TEST_DIR, 'check-review.mjs');

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'check-review-kit-'));
  fs.mkdirSync(path.join(root, 'agentic-method-kit', 'config'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs', 'harness', 'tasks'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs', 'superpowers', 'plans'), { recursive: true });
  fs.mkdirSync(path.join(root, 'openspec', 'changes', 'sample-change'), { recursive: true });
  fs.mkdirSync(path.join(root, '.harness', 'evidence', 'sample'), { recursive: true });
  fs.mkdirSync(path.join(root, '.harness', 'tasks', 'sample'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'agentic-method-kit', 'config', 'method.config.json'),
    JSON.stringify({ evidenceDir: '.harness/evidence' }),
  );
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'tasks', 'sample.task.md'), '# Task');
  fs.writeFileSync(
    path.join(root, '.harness', 'tasks', 'sample', 'manifest.json'),
    `${JSON.stringify(
      {
        taskId: 'sample',
        goal: 'Validate review artifacts against manifest-first linkage.',
        primaryLayer: 'platform',
        scope: { in: ['review check'], out: ['runtime changes'] },
        linkage: {
          evidenceDir: '.harness/evidence/sample/',
          reviewFile: '.harness/evidence/sample/review.md',
          changeRef: 'openspec/changes/sample-change/',
          planRefs: ['docs/superpowers/plans/sample-plan.md'],
        },
      },
      null,
      2,
    )}\n`,
  );
  fs.writeFileSync(path.join(root, 'docs', 'superpowers', 'plans', 'sample-plan.md'), '# Plan');
  fs.writeFileSync(path.join(root, '.harness', 'evidence', 'sample', 'commands.json'), '{}');
  return root;
}

function writeReview(root, content) {
  fs.writeFileSync(path.join(root, '.harness', 'evidence', 'sample', 'review.md'), content);
}

function validReview() {
  return [
    '# Review',
    '',
    '## Machine Readable',
    '```json',
    JSON.stringify(
      {
        taskId: 'sample',
        verdict: 'approved',
        structuralReview: {
          affectedSubgraph: ['route -> handler -> service -> repo'],
          checks: ['cycle', 'hub'],
          findings: [],
          notes: 'none',
        },
        linkage: {
          taskManifest: '.harness/tasks/sample/manifest.json',
          evidence: '.harness/evidence/sample/commands.json',
          reviewFile: '.harness/evidence/sample/review.md',
          changeRef: 'openspec/changes/sample-change/',
          planRefs: ['docs/superpowers/plans/sample-plan.md'],
        },
      },
      null,
      2,
    ),
    '```',
  ].join('\n');
}

test('check-review accepts a valid review artifact', () => {
  const root = makeFixture();
  writeReview(root, validReview());

  const output = execFileSync(process.execPath, [SCRIPT, '--json', '--strict', '--root', root], {
    encoding: 'utf8',
  });
  const result = JSON.parse(output);

  assert.equal(result.errorCount, 0);
  assert.equal(result.fileCount, 1);
});

test('check-review fails when machine-readable block is missing', () => {
  const root = makeFixture();
  writeReview(root, '# Review only');

  const result = spawnSync(process.execPath, [SCRIPT, '--strict', '--root', root], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /missing ## Machine Readable JSON block/);
});

test('check-review fails when linkage does not match the task id', () => {
  const root = makeFixture();
  const parsed = JSON.parse(validReview().match(/```json\s*([\s\S]*?)\s*```/m)[1]);
  parsed.linkage.taskManifest = '.harness/tasks/other/manifest.json';
  writeReview(
    root,
    ['# Review', '', '## Machine Readable', '```json', JSON.stringify(parsed, null, 2), '```'].join('\n'),
  );

  const result = spawnSync(process.execPath, [SCRIPT, '--strict', '--root', root], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /root\.linkage\.taskManifest must be ".harness\/tasks\/sample\/manifest\.json"/);
});

test('check-review fails on malformed structural review metadata', () => {
  const root = makeFixture();
  const parsed = JSON.parse(validReview().match(/```json\s*([\s\S]*?)\s*```/m)[1]);
  parsed.structuralReview = { checks: ['cycle', 'bad-check'], findings: [1] };
  writeReview(
    root,
    ['# Review', '', '## Machine Readable', '```json', JSON.stringify(parsed, null, 2), '```'].join('\n'),
  );

  const result = spawnSync(process.execPath, [SCRIPT, '--strict', '--root', root], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /structuralReview\.checks\[1\]|structuralReview\.findings\[0\]/);
});
