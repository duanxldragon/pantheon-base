import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(TEST_DIR, 'check-adoption.mjs');

const REQUIRED_PR_MARKERS = [
  'Task ID',
  'Task manifest',
  'Verification evidence',
  'OpenSpec change',
  'task id',
  'task manifest',
  'evidence',
  'Review artifact',
  'Trivial change',
  'visual evidence',
  'method health',
];

const REQUIRED_FILES = [
  'agentic-method-kit/HARNESS_CORE_MODEL.md',
  'agentic-method-kit/HARNESS_COVERAGE_MODEL.md',
  'agentic-method-kit/HARNESS_TEMPLATE_TAXONOMY.md',
  'agentic-method-kit/TOOL_ADAPTER_MATRIX.md',
  'docs/harness/HARNESS_CORE_MODEL.md',
  'docs/harness/HARNESS_COVERAGE_MODEL.md',
  'docs/harness/HARNESS_TEMPLATE_TAXONOMY.md',
  'docs/harness/TOOL_ADAPTER_MATRIX.md',
  'docs/harness/HARNESS_METHOD_PLAYBOOK.md',
  'docs/harness/HARNESS_ENGINEERING_CONTRACT.md',
  'docs/harness/AGENT_INTERFACE_CONTRACT.md',
  'docs/harness/TASK_PACKET_SPEC.md',
  'docs/harness/VERIFICATION_EVIDENCE_SPEC.md',
  'docs/harness/REVIEW_LOOP_SPEC.md',
  'docs/harness/VISUAL_QUALITY_PROTOCOL.md',
  '.agents/README.md',
  '.agents/adapters/codex.md',
  '.agents/adapters/claude-code.md',
  '.agents/adapters/cursor.md',
  '.agents/adapters/github-copilot.md',
  '.agents/adapters/openhands.md',
  '.agents/adapters/human.md',
  '.github/pull_request_template.md',
];

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'check-adoption-'));
  for (const repoPath of REQUIRED_FILES) {
    const target = path.join(root, repoPath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, 'stub');
  }
  fs.writeFileSync(
    path.join(root, '.github', 'pull_request_template.md'),
    REQUIRED_PR_MARKERS.join('\n'),
  );
  fs.mkdirSync(path.join(root, '.agents', 'prompts'), { recursive: true });
  fs.writeFileSync(
    path.join(root, '.agents', 'prompts', 'implementation.md'),
    [
      'Task manifest',
      'Record verification results',
      'Do not claim completion without fresh verification evidence',
    ].join('\n'),
  );
  fs.mkdirSync(path.join(root, 'openspec', 'changes'), { recursive: true });
  return root;
}

test('check-adoption passes when all required entrypoints exist', () => {
  const root = makeFixture();

  const output = execFileSync(process.execPath, [SCRIPT, '--json', '--strict', '--root', root], {
    encoding: 'utf8',
  });
  const result = JSON.parse(output);

  assert.equal(result.findingCount, 0);
  assert.ok(result.warningCount >= 1);
  assert.ok(
    result.warnings.some((w) => w.reason.includes('implementation adoption linkage was not evaluated')),
  );
});

test('check-adoption fails strict mode when a required Harness file is missing', () => {
  const root = makeFixture();
  fs.rmSync(path.join(root, 'docs', 'harness', 'HARNESS_ENGINEERING_CONTRACT.md'));

  const result = spawnSync(process.execPath, [SCRIPT, '--strict', '--root', root], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /required Harness adoption file is missing/);
});

test('check-adoption fails when PR template is missing the trivial-change marker', () => {
  const root = makeFixture();
  fs.writeFileSync(
    path.join(root, '.github', 'pull_request_template.md'),
    REQUIRED_PR_MARKERS.filter((marker) => marker !== 'Trivial change').join('\n'),
  );

  const result = spawnSync(process.execPath, [SCRIPT, '--strict', '--root', root], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /PR template missing adoption marker: Trivial change/);
});

test('check-adoption warns when implementation prompt is missing evidence rules', () => {
  const root = makeFixture();
  fs.writeFileSync(
    path.join(root, '.agents', 'prompts', 'implementation.md'),
    'no relevant content',
  );

  const output = execFileSync(process.execPath, [SCRIPT, '--json', '--root', root], {
    encoding: 'utf8',
  });
  const result = JSON.parse(output);

  assert.equal(result.findingCount, 0);
  assert.ok(result.warningCount >= 1);
  assert.ok(
    result.warnings.some((w) => w.reason.includes('implementation prompt missing adoption marker')),
  );
});

test('check-adoption fails when implementation files change without task manifest or evidence linkage', () => {
  const root = makeFixture();

  const result = spawnSync(
    process.execPath,
    [
      SCRIPT,
      '--strict',
      '--root',
      root,
      '--changed-file',
      'backend/modules/auth/service.go',
    ],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /implementation change detected without a matching task manifest change/);
  assert.match(result.stdout, /implementation change detected without matching verification evidence/);
});

test('check-adoption passes when implementation changes include task manifest and evidence linkage', () => {
  const root = makeFixture();
  fs.mkdirSync(path.join(root, '.harness', 'tasks', 'sample'), { recursive: true });
  fs.writeFileSync(
    path.join(root, '.harness', 'tasks', 'sample', 'manifest.json'),
    JSON.stringify({
      taskId: 'sample',
      goal: 'Manifest-only adoption fixture.',
      primaryLayer: 'app',
      scope: { in: ['automation'], out: ['runtime changes'] },
      linkage: {
        evidenceDir: '.harness/evidence/sample/',
        reviewFile: '.harness/evidence/sample/review.md',
        changeRef: 'none',
        planRefs: [],
      },
    }),
  );
  fs.mkdirSync(path.join(root, '.harness', 'evidence', 'sample'), { recursive: true });
  fs.writeFileSync(path.join(root, '.harness', 'evidence', 'sample', 'commands.json'), '{}');

  const output = execFileSync(
    process.execPath,
    [
      SCRIPT,
      '--json',
      '--strict',
      '--root',
      root,
      '--changed-file',
      'frontend/src/modules/auth/Login.tsx',
      '--changed-file',
      '.harness/tasks/sample/manifest.json',
      '--changed-file',
      '.harness/evidence/sample/commands.json',
    ],
    { encoding: 'utf8' },
  );
  const result = JSON.parse(output);

  assert.equal(result.findingCount, 0);
});

test('check-adoption requires real openspec linkage when an active change exists', () => {
  const root = makeFixture();
  fs.mkdirSync(path.join(root, 'openspec', 'changes', 'sample-change'), { recursive: true });
  fs.mkdirSync(path.join(root, '.harness', 'tasks', 'sample'), { recursive: true });
  fs.writeFileSync(
    path.join(root, '.harness', 'tasks', 'sample', 'manifest.json'),
    JSON.stringify({
      taskId: 'sample',
      goal: 'Manifest linkage must point to active OpenSpec change.',
      primaryLayer: 'app',
      scope: { in: ['automation'], out: ['runtime changes'] },
      linkage: {
        evidenceDir: '.harness/evidence/sample/',
        reviewFile: '.harness/evidence/sample/review.md',
        changeRef: 'none',
        planRefs: [],
      },
    }),
  );
  fs.mkdirSync(path.join(root, '.harness', 'evidence', 'sample'), { recursive: true });
  fs.writeFileSync(
    path.join(root, '.harness', 'evidence', 'sample', 'commands.json'),
    JSON.stringify({
      taskId: 'sample',
      repo: 'example-repository',
      agent: { tool: 'codex' },
      commands: [{ command: 'echo', cwd: '.', status: 'passed' }],
      linkage: {
        taskManifest: '.harness/tasks/sample/manifest.json',
        evidenceDir: '.harness/evidence/sample/',
        reviewFile: '.harness/evidence/sample/review.md',
        changeRef: 'none',
        planRefs: [],
      },
      knownGaps: [],
    }),
  );

  const result = spawnSync(
    process.execPath,
    [
      SCRIPT,
      '--strict',
      '--root',
      root,
      '--changed-file',
      'backend/modules/auth/service.go',
      '--changed-file',
      '.harness/tasks/sample/manifest.json',
      '--changed-file',
      '.harness/evidence/sample/commands.json',
    ],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /changed task manifest must declare a real linkage\.changeRef/);
  assert.match(result.stdout, /changed evidence must declare a real linkage\.changeRef/);
});
