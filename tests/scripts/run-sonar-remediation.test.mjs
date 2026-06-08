import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  createDefaultEvidence,
  ensureEvidenceState,
  recordPhaseResult,
  resolvePhaseEnv,
  resolvePhaseExecution,
  resolvePhaseIds,
} from '../../scripts/run-sonar-remediation.mjs';

function withFixtureRepo(callback) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pantheon-sonar-remediation-'));
  try {
    fs.mkdirSync(path.join(repoRoot, 'docs', 'harness', 'tasks'), { recursive: true });
    fs.writeFileSync(
      path.join(repoRoot, 'docs', 'harness', 'tasks', '2026-06-03-main-sonar-remediation.task.md'),
      '# Task Packet: 2026-06-03-main-sonar-remediation\n',
      'utf8',
    );
    fs.mkdirSync(path.join(repoRoot, 'docs', 'superpowers', 'plans'), { recursive: true });
    fs.writeFileSync(
      path.join(repoRoot, 'docs', 'superpowers', 'plans', '2026-06-03-main-sonar-remediation-method.md'),
      '# plan\n',
      'utf8',
    );
    callback(repoRoot);
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

test('resolvePhaseIds uses the baseline group by default and deduplicates explicit phases', () => {
  assert.deepEqual(resolvePhaseIds(), [
    'root-install',
    'docs-frontmatter',
    'task-packet-template',
    'generated-modules',
    'backend-tests',
    'frontend-install',
    'frontend-menu-contract',
    'frontend-lint',
    'frontend-build',
    'duplication',
  ]);

  assert.deepEqual(
    resolvePhaseIds({ phaseArgs: ['docs-frontmatter,task-packet-template', 'docs-frontmatter'] }),
    ['docs-frontmatter', 'task-packet-template'],
  );
});

test('ensureEvidenceState seeds commands, summary, review, and plan linkage', () => {
  withFixtureRepo((repoRoot) => {
    const evidence = ensureEvidenceState(repoRoot, '2026-06-03-main-sonar-remediation');

    assert.equal(evidence.taskId, '2026-06-03-main-sonar-remediation');
    assert.equal(evidence.linkage.taskPacket, 'docs/harness/tasks/2026-06-03-main-sonar-remediation.task.md');
    assert.deepEqual(evidence.linkage.planRefs, [
      'docs/superpowers/plans/2026-06-03-main-sonar-remediation-method.md',
    ]);
    assert.equal(
      fs.existsSync(
        path.join(repoRoot, '.harness', 'evidence', '2026-06-03-main-sonar-remediation', 'summary.md'),
      ),
      true,
    );
    assert.equal(
      fs.existsSync(
        path.join(repoRoot, '.harness', 'evidence', '2026-06-03-main-sonar-remediation', 'review.md'),
      ),
      true,
    );
    assert.equal(evidence.commands.some((entry) => entry.command === 'go test -race ./...'), true);
    assert.equal(
      evidence.commands.some((entry) => entry.command === '.\\scripts\\run-sonar.ps1'),
      true,
    );
  });
});

test('resolvePhaseExecution falls back to portable backend tests on Windows', () => {
  const phase = {
    id: 'backend-tests',
    displayCommand: 'go test -race ./...',
    command: ({ platform }) => (platform === 'win32' ? 'go test ./...' : 'go test -race ./...'),
  };

  const execution = resolvePhaseExecution(phase, { platform: 'win32' });
  assert.equal(execution.command, 'go test ./...');
  assert.match(execution.executionNotes, /quality\.yml/);
  assert.match(execution.knownGap, /go test \.\/\.\.\./);
});

test('resolvePhaseEnv pins Go phases to a repo-local cache', () => {
  withFixtureRepo((repoRoot) => {
    const env = resolvePhaseEnv(repoRoot, { id: 'backend-tests' }, {});
    assert.equal(
      env.GOCACHE,
      path.join(repoRoot, '.harness', 'cache', 'go-build'),
    );
    assert.equal(fs.existsSync(env.GOCACHE), true);
  });
});

test('recordPhaseResult updates command status and captures runtime logs for local sonar', () => {
  withFixtureRepo((repoRoot) => {
    const taskId = '2026-06-03-main-sonar-remediation';
    const evidence = createDefaultEvidence(repoRoot, taskId);
    const logPath = path.join(repoRoot, '.harness', 'evidence', taskId, 'logs', 'sonar.log');
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.writeFileSync(logPath, 'ok\n', 'utf8');

    recordPhaseResult(
      evidence,
      'local-sonar',
      {
        status: 'passed',
        durationMs: 1234,
        notes: 'sonar executed',
        logPath,
      },
      repoRoot,
      taskId,
    );

    const command = evidence.commands.find((entry) => entry.command === '.\\scripts\\run-sonar.ps1');
    assert.equal(command.status, 'passed');
    assert.match(command.notes, /sonar executed/);
    assert.deepEqual(evidence.runtimeLogs, [
      '.harness/evidence/2026-06-03-main-sonar-remediation/logs/sonar.log',
    ]);
    assert.equal('runtimeGap' in evidence, false);
  });
});

test('recordPhaseResult reconciles backend fallback gap once backend-tests runs on Windows', () => {
  withFixtureRepo((repoRoot) => {
    const taskId = '2026-06-03-main-sonar-remediation';
    const evidence = createDefaultEvidence(repoRoot, taskId);
    const logPath = path.join(repoRoot, '.harness', 'evidence', taskId, 'logs', 'backend.log');
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.writeFileSync(logPath, 'ok\n', 'utf8');

    recordPhaseResult(
      evidence,
      'backend-tests',
      {
        status: 'passed',
        durationMs: 222,
        notes:
          'backend and shared package gate; local Windows execution fell back to `go test ./...`; `quality.yml` remains the authoritative `go test -race ./...` gate on ubuntu-latest; log: .harness/evidence/2026-06-03-main-sonar-remediation/logs/backend.log',
        logPath,
      },
      repoRoot,
      taskId,
    );

    assert.match(
      evidence.knownGaps.join('\n'),
      /Local backend-tests evidence used `go test \.\/\.\.\.` instead of `go test -race \.\/\.\.\.`/,
    );
  });
});
