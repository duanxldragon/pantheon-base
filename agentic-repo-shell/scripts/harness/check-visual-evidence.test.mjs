import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(TEST_DIR, 'check-visual-evidence.mjs');

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'check-visual-evidence-'));
  fs.mkdirSync(path.join(root, '.harness', 'tasks'), { recursive: true });
  fs.mkdirSync(path.join(root, '.harness', 'evidence'), { recursive: true });
  return root;
}

function writeUiManifest(root, taskId, visualEvidence = {}, overrides = {}) {
  fs.mkdirSync(path.join(root, '.harness', 'tasks', taskId), { recursive: true });
  fs.writeFileSync(
    path.join(root, '.harness', 'tasks', taskId, 'manifest.json'),
    JSON.stringify(
      {
        taskId,
        goal: 'Verify visual evidence.',
        primaryLayer: 'platform',
        scope: {
          in: ['ui verification'],
          out: ['runtime'],
        },
        verificationPlan: {
          commands: ['npm run test:ui'],
          runtimeEvidence: ['browser evidence'],
          visualEvidence,
        },
        linkage: {
          evidenceDir: `.harness/evidence/${taskId}/`,
          reviewFile: `.harness/evidence/${taskId}/review.md`,
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

function writeRawManifest(root, taskId, payload) {
  fs.mkdirSync(path.join(root, '.harness', 'tasks', taskId), { recursive: true });
  fs.writeFileSync(
    path.join(root, '.harness', 'tasks', taskId, 'manifest.json'),
    JSON.stringify(payload, null, 2),
  );
}

function writeEvidenceDir(root, taskId, files) {
  const dir = path.join(root, '.harness', 'evidence', taskId);
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    const target = path.join(dir, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  return dir;
}

function runJson(root) {
  const output = execFileSync(process.execPath, [SCRIPT, '--json', '--root', root], {
    encoding: 'utf8',
  });
  return JSON.parse(output);
}

test('check-visual-evidence passes when browserEvidence covers viewport, state, and route plans', () => {
  const root = makeFixture();
  writeUiManifest(root, 'good-ui-task', {
    viewports: ['desktop', 'mobile'],
    states: ['empty', 'loading', 'error', 'permission'],
    routes: ['/auth/login'],
  });
  writeEvidenceDir(root, 'good-ui-task', {
    'commands.json': JSON.stringify({
      knownGaps: [],
      browserEvidence: [
        {
          viewport: 'desktop',
          url: '/auth/login',
          checkedStates: ['empty', 'loading', 'error', 'permission'],
        },
        {
          viewport: 'mobile',
          url: 'https://example.test/auth/login?mode=compact#login',
          checkedStates: ['empty', 'loading', 'error', 'permission'],
        },
      ],
    }),
    'review.md': '# Review\n',
  });

  const result = runJson(root);

  assert.equal(result.uiTaskCount, 1);
  assert.equal(result.warningCount, 0);
});

test('check-visual-evidence warns when the task manifest visual plan is invalid', () => {
  const root = makeFixture();
  writeRawManifest(root, 'no-plans', {
    taskId: 'no-plans',
    goal: 'Invalid manifest should surface schema errors.',
    primaryLayer: 'platform',
    scope: {
      in: ['ui verification'],
      out: ['runtime'],
    },
    verificationPlan: {
      commands: ['npm run test:ui'],
      runtimeEvidence: ['browser evidence'],
      visualEvidence: {},
    },
    linkage: {
      evidenceDir: '.harness/evidence/no-plans/',
      reviewFile: '.harness/evidence/no-plans/review.md',
      changeRef: 'none',
      planRefs: [],
    },
  });
  writeEvidenceDir(root, 'no-plans', { 'commands.json': '{"knownGaps":[]}' });

  const result = runJson(root);

  assert.equal(result.uiTaskCount, 0);
  assert.equal(result.warningCount, 1);
  const reasons = result.warnings.map((w) => w.reason).join('|');
  assert.match(reasons, /visualEvidence\.viewports is required/);
  assert.match(reasons, /visualEvidence\.states is required/);
});

test('check-visual-evidence warns when evidence directory is missing', () => {
  const root = makeFixture();
  writeUiManifest(root, 'orphan-ui-task', {
    viewports: ['desktop', 'mobile'],
    states: ['empty', 'loading', 'error'],
  });

  const result = runJson(root);

  assert.equal(result.uiTaskCount, 1);
  assert.ok(
    result.warnings.some((w) =>
      w.reason.includes('UI task has no matching .harness/evidence directory'),
    ),
  );
});

test('check-visual-evidence fails strict mode when warnings exist', () => {
  const root = makeFixture();
  writeUiManifest(root, 'strict-failure', {
    viewports: ['desktop', 'mobile'],
    states: ['empty', 'loading', 'error'],
  });

  const result = spawnSync(process.execPath, [SCRIPT, '--strict', '--root', root], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /warning\(s\)/);
});

test('check-visual-evidence accepts a recorded screenshot gap as evidence', () => {
  const root = makeFixture();
  writeUiManifest(root, 'gap-recorded', {
    viewports: ['desktop', 'mobile'],
    states: ['empty', 'loading', 'error', 'permission denied'],
  });
  writeEvidenceDir(root, 'gap-recorded', {
    'commands.json': JSON.stringify({
      knownGaps: ['screenshot capture not run in this environment'],
    }),
  });

  const result = runJson(root);

  assert.equal(result.uiTaskCount, 1);
  assert.equal(result.warningCount, 1);
  assert.equal(
    result.warnings.filter((w) => w.reason.includes('missing browserEvidence entries')).length,
    1,
  );
});
