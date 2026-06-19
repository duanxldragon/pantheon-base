import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(TEST_DIR, 'check-graph-review.mjs');

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'graph-review-shell-'));
  fs.mkdirSync(path.join(root, '.harness', 'evidence', 'sample'), { recursive: true });
  return root;
}

function writeManifest(root, overrides = {}) {
  fs.mkdirSync(path.join(root, '.harness', 'tasks', 'sample'), { recursive: true });
  fs.writeFileSync(
    path.join(root, '.harness', 'tasks', 'sample', 'manifest.json'),
    JSON.stringify(
      {
        taskId: 'sample',
        goal: 'Check graph review consistency.',
        primaryLayer: 'platform',
        scope: {
          in: ['graph review'],
          out: ['runtime'],
        },
        structuralScope: {
          affectedSubgraph: ['route -> handler -> service -> repo'],
          boundaryCrossings: ['none'],
          riskNodes: ['none'],
          graphFocus: ['cycle-check', 'hub-check'],
        },
        linkage: {
          evidenceDir: '.harness/evidence/sample/',
          reviewFile: '.harness/evidence/sample/review.md',
          changeRef: 'none',
          planRefs: [],
        },
        ...overrides,
      },
      null,
      2,
    ),
  );
}

function writeEvidence(root, payload) {
  fs.writeFileSync(path.join(root, '.harness', 'evidence', 'sample', 'commands.json'), JSON.stringify(payload, null, 2));
}

function writeReview(root, payload) {
  fs.writeFileSync(
    path.join(root, '.harness', 'evidence', 'sample', 'review.md'),
    ['# Review Summary: sample', '', '## Machine Readable', '```json', JSON.stringify(payload, null, 2), '```'].join('\n'),
  );
}

test('repo-shell check-graph-review accepts matching structural metadata', () => {
  const root = makeFixture();
  writeManifest(root);
  writeEvidence(root, {
    graphChecks: {
      affectedSubgraph: ['route -> handler -> service -> repo'],
      checks: ['cycle', 'hub'],
    },
  });
  writeReview(root, {
    structuralReview: {
      affectedSubgraph: ['route -> handler -> service -> repo'],
      checks: ['cycle', 'hub'],
    },
  });

  const output = execFileSync(process.execPath, [SCRIPT, '--json', '--strict', '--root', root], { encoding: 'utf8' });
  const result = JSON.parse(output);
  assert.equal(result.warningCount, 0);
});

test('repo-shell check-graph-review warns on mismatched checks', () => {
  const root = makeFixture();
  writeManifest(root);
  writeEvidence(root, {
    graphChecks: {
      affectedSubgraph: ['route -> handler -> service -> repo'],
      checks: ['cycle'],
    },
  });
  writeReview(root, {
    structuralReview: {
      affectedSubgraph: ['route -> handler -> service -> repo'],
      checks: ['hub'],
    },
  });

  const result = spawnSync(process.execPath, [SCRIPT, '--strict', '--root', root], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /structural checks do not match/);
});
