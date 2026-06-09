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
  fs.mkdirSync(path.join(root, 'docs', 'harness', 'tasks'), { recursive: true });
  fs.mkdirSync(path.join(root, '.harness', 'evidence'), { recursive: true });
  return root;
}

function writeUiTask(root, taskId, body) {
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'tasks', `${taskId}.task.md`), body);
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

test('check-visual-evidence passes when UI task declares viewport, states and has a screenshot', () => {
  const root = makeFixture();
  writeUiTask(
    root,
    'good-ui-task',
    [
      '# Task Packet: Good UI',
      'frontend/src/modules/auth/Login.tsx',
      'desktop viewport 1280x800',
      'mobile viewport 390x844',
      'verify empty, loading, error and permission denied states.',
    ].join('\n'),
  );
  const screenshotsDir = path.join(
    writeEvidenceDir(root, 'good-ui-task', { 'commands.json': '{"knownGaps":[]}' }),
    'screenshots',
  );
  fs.mkdirSync(screenshotsDir, { recursive: true });
  fs.writeFileSync(path.join(screenshotsDir, 'desktop.png'), 'fake-png');

  const result = runJson(root);

  assert.equal(result.uiTaskCount, 1);
  assert.equal(result.warningCount, 0);
});

test('check-visual-evidence warns when viewport plan and state plan are missing', () => {
  const root = makeFixture();
  writeUiTask(
    root,
    'no-plans',
    '# Task Packet: No Plans\n\nfrontend/src thing\n',
  );
  writeEvidenceDir(root, 'no-plans', { 'commands.json': '{"knownGaps":[]}' });

  const result = runJson(root);

  assert.equal(result.uiTaskCount, 1);
  const reasons = result.warnings.map((w) => w.reason).join('|');
  assert.match(reasons, /viewport verification plan/);
  assert.match(reasons, /state verification plan/);
});

test('check-visual-evidence warns when evidence directory is missing', () => {
  const root = makeFixture();
  writeUiTask(
    root,
    'orphan-ui-task',
    [
      '# Task Packet: Orphan',
      'frontend/src layout work',
      'desktop and mobile viewport check',
      'states: empty, loading, error',
    ].join('\n'),
  );

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
  writeUiTask(
    root,
    'strict-failure',
    [
      '# Task Packet: Strict Failure',
      'frontend/src layout work',
      'desktop and mobile viewport check',
      'states: empty, loading, error',
    ].join('\n'),
  );

  const result = spawnSync(process.execPath, [SCRIPT, '--strict', '--root', root], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /warning\(s\)/);
});

test('check-visual-evidence accepts a recorded screenshot gap as evidence', () => {
  const root = makeFixture();
  writeUiTask(
    root,
    'gap-recorded',
    [
      '# Task Packet: Gap',
      'frontend/src thing',
      'desktop and mobile viewport',
      'states: empty, loading, error, permission denied',
    ].join('\n'),
  );
  writeEvidenceDir(root, 'gap-recorded', {
    'commands.json': JSON.stringify({
      knownGaps: ['screenshot capture not run in this environment'],
    }),
  });

  const result = runJson(root);

  assert.equal(result.uiTaskCount, 1);
  assert.equal(
    result.warnings.filter((w) => w.reason.includes('no screenshots')).length,
    0,
  );
});
