import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  TASK_MANIFEST_STATUSES,
  listTaskManifestPaths,
  readTaskManifest,
} from '../../scripts/task-manifest.mjs';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TEST_DIR, '..', '..');

function listAllTaskManifestPaths(root) {
  const archived = fs
    .globSync('.harness/archive/????-??/tasks/*/manifest.json', { cwd: root })
    .map((entry) => entry.replaceAll('\\', '/'))
    .filter((entry) => /^\.harness\/archive\/\d{4}-\d{2}\/tasks\//.test(entry));
  return [...listTaskManifestPaths(root), ...archived];
}

function baseManifest(overrides = {}) {
  return {
    taskId: 'sample-task',
    goal: 'sample goal',
    primaryLayer: 'platform',
    scope: { in: [], out: [] },
    linkage: {
      evidenceDir: '.harness/evidence/sample-task/',
      reviewFile: '.harness/evidence/sample-task/review.md',
      changeRef: 'chore/sample-task',
      planRefs: [],
    },
    ...overrides,
  };
}

test('accepts every canonical status value', () => {
  for (const status of TASK_MANIFEST_STATUSES) {
    assert.doesNotThrow(() =>
      readTaskManifestFromObject(baseManifest({ status })),
    );
  }
});

test('rejects status synonyms that used to drift in', () => {
  for (const status of ['done', 'complete', 'complete-with-explicit-gates']) {
    assert.throws(
      () => readTaskManifestFromObject(baseManifest({ status })),
      /taskManifest\.status must be one of/,
      `expected "${status}" to be rejected`,
    );
  }
});

test('treats status as optional so inherited repos without it stay legal', () => {
  assert.doesNotThrow(() => readTaskManifestFromObject(baseManifest()));
});

test('every committed manifest uses the canonical vocabulary', () => {
  const manifests = listAllTaskManifestPaths(REPO_ROOT);
  assert.ok(manifests.length > 0, 'expected at least one task manifest');
  for (const manifestPath of manifests) {
    const { payload } = readTaskManifest(REPO_ROOT, manifestPath);
    if (!('status' in payload)) {
      continue;
    }
    assert.ok(
      TASK_MANIFEST_STATUSES.has(payload.status.trim()),
      `${manifestPath}: status "${payload.status}" is not canonical`,
    );
  }
});

test('archive-only inventory remains nonempty and rejects illegal statuses', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'task-status-archive-'));
  const manifestPath = '.harness/archive/2026-11/tasks/sample-task/manifest.json';
  try {
    fs.mkdirSync(path.dirname(path.join(root, manifestPath)), { recursive: true });
    fs.writeFileSync(
      path.join(root, manifestPath),
      JSON.stringify(baseManifest({ status: 'completed' })),
    );
    assert.deepEqual(listTaskManifestPaths(root), []);
    const manifests = listAllTaskManifestPaths(root);
    assert.deepEqual(manifests, [manifestPath]);
    assert.equal(readTaskManifest(root, manifests[0]).payload.status, 'completed');

    fs.writeFileSync(
      path.join(root, manifestPath),
      JSON.stringify(baseManifest({ status: 'done' })),
    );
    assert.throws(
      () => readTaskManifest(root, manifests[0]),
      /taskManifest\.status must be one of/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// validateTaskManifest is only reachable through readTaskManifest, which reads
// from disk; this helper exercises the same schema without a fixture tree.
function readTaskManifestFromObject(payload) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'task-manifest-'));
  const manifestDir = path.join(dir, '.harness', 'tasks', 'sample-task');
  fs.mkdirSync(manifestDir, { recursive: true });
  const manifestFile = path.join(manifestDir, 'manifest.json');
  fs.writeFileSync(manifestFile, JSON.stringify(payload));
  try {
    return readTaskManifest(dir, 'sample-task');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
