import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '../..');
const checkScript = path.join(repoRoot, 'scripts', 'harness', 'check-graph-review.mjs');
const scaffoldScript = path.join(repoRoot, 'scripts', 'harness', 'scaffold-graph-review.mjs');

function spawnNodeScript(scriptPath, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk;
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      resolve({ code: code ?? 0, signal: signal ?? null, stdout, stderr });
    });
  });
}

function createFixtureRepo() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pantheon-graph-review-'));
  fs.mkdirSync(path.join(fixtureRoot, 'docs', 'harness', 'tasks'), { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, '.harness', 'evidence', 'graph-review-sample'), { recursive: true });
  return fixtureRoot;
}

function writeTaskPacket(fixtureRoot, taskId) {
  fs.writeFileSync(
    path.join(fixtureRoot, 'docs', 'harness', 'tasks', `${taskId}.task.md`),
    `# Task Packet: ${taskId}\n\n## Structural Scope\n\n- Affected Subgraph: alpha | beta\n- Boundary Crossings: none\n- Risk Nodes: node-a\n- Graph Focus: cycle-check | call-depth | hub-check\n`,
    'utf8',
  );
}

function writeConsistentGraphReviewEvidence(fixtureRoot, taskId) {
  const evidenceDir = path.join(fixtureRoot, '.harness', 'evidence', taskId);
  const graphChecks = {
    affectedSubgraph: ['alpha', 'beta'],
    checks: ['call-depth', 'cycle', 'hub'],
  };
  const structuralReview = {
    affectedSubgraph: ['alpha', 'beta'],
    checks: ['call-depth', 'cycle', 'hub'],
  };

  fs.writeFileSync(
    path.join(evidenceDir, 'commands.json'),
    `${JSON.stringify({ graphChecks }, null, 2)}\n`,
    'utf8',
  );
  fs.writeFileSync(
    path.join(evidenceDir, 'review.md'),
    [
      `# Review Summary: ${taskId}`,
      '',
      '## Machine Readable',
      '',
      '```json',
      JSON.stringify({ structuralReview }, null, 2),
      '```',
      '',
    ].join('\n'),
    'utf8',
  );
}

test('check-graph-review accepts matching task packet, evidence, and review scopes', async () => {
  const fixtureRoot = createFixtureRepo();
  const taskId = 'graph-review-sample';
  try {
    writeTaskPacket(fixtureRoot, taskId);
    writeConsistentGraphReviewEvidence(fixtureRoot, taskId);

    const result = await spawnNodeScript(
      checkScript,
      ['--strict', '--root', fixtureRoot],
      fixtureRoot,
    );

    assert.equal(result.code, 0, `${result.stderr}\n${result.stdout}`);
    assert.match(result.stdout, /Graph review check \(strict\): 1 graph-reviewed task\(s\), 0 warning\(s\)/);
    assert.match(result.stdout, /no findings/);
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test('scaffold-graph-review writes consistent graph review artifacts from task scope', async () => {
  const fixtureRoot = createFixtureRepo();
  const taskId = 'graph-review-sample';
  try {
    writeTaskPacket(fixtureRoot, taskId);

    const result = await spawnNodeScript(
      scaffoldScript,
      ['--write', '--json', '--root', fixtureRoot, taskId],
      fixtureRoot,
    );

    assert.equal(result.code, 0, `${result.stderr}\n${result.stdout}`);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.taskId, taskId);
    assert.equal(payload.written, true);
    assert.equal(payload.importedFrom, null);
    assert.equal(payload.taskPacket, `docs/harness/tasks/${taskId}.task.md`);
    assert.equal(payload.evidence, `.harness/evidence/${taskId}/commands.json`);
    assert.equal(payload.review, `.harness/evidence/${taskId}/review.md`);
    assert.deepEqual(payload.graphChecks, {
      usedCodeGraph: false,
      affectedSubgraph: ['alpha', 'beta'],
      checks: ['call-depth', 'cycle', 'hub'],
      findings: [],
      notes: 'scaffolded from task packet Structural Scope; replace after graph review',
    });
    assert.deepEqual(payload.structuralReview, {
      affectedSubgraph: ['alpha', 'beta'],
      checks: ['call-depth', 'cycle', 'hub'],
      findings: [],
      notes: 'scaffolded from task packet Structural Scope; replace after graph review',
    });

    const writtenEvidence = JSON.parse(
      fs.readFileSync(path.join(fixtureRoot, '.harness', 'evidence', taskId, 'commands.json'), 'utf8'),
    );
    assert.equal(writtenEvidence.taskId, taskId);
    assert.deepEqual(writtenEvidence.graphChecks.affectedSubgraph, ['alpha', 'beta']);
    assert.deepEqual(writtenEvidence.graphChecks.checks, ['call-depth', 'cycle', 'hub']);
    assert.equal(
      fs.existsSync(path.join(fixtureRoot, '.harness', 'evidence', taskId, 'review.md')),
      true,
    );
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});
