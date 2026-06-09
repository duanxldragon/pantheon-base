import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(TEST_DIR, 'check-failure-registry.mjs');

const VALID_REGISTRY = `# Failure Registry

## Registry

| Failure ID | Category | Failure Class | Owner Layer | Occurrences | Example | Impact | GitHub Signal | Current Guide | Current Sensor | Current Gate | Detected By | Missed By | Recommended Harness Change | Promotion Decision | Promotion Deadline | Status |
|---|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|
| \`FR-001\` | behaviour | test-gap | consumer-repository | 1 | Agent skipped verification | Regression reached review | repo-quality-gate | docs/harness/HARNESS_ENGINEERING_CONTRACT.md | scripts/harness/check-evidence.mjs | PR review | human review | automated gate | gate | gate-updated | none | accepted |
`;

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'check-failure-registry-shell-'));
  fs.mkdirSync(path.join(root, 'docs', 'harness'), { recursive: true });
  return root;
}

test('repo-shell check-failure-registry accepts a valid registry fixture', () => {
  const root = makeFixture();
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'failure-registry.md'), VALID_REGISTRY);

  const output = execFileSync(process.execPath, [SCRIPT, '--json', '--root', root], {
    encoding: 'utf8',
  });
  const result = JSON.parse(output);

  assert.equal(result.errorCount, 0);
  assert.equal(result.warningCount, 0);
  assert.equal(result.results.length, 1);
});

test('repo-shell check-failure-registry reports missing default files as a warning', () => {
  const root = makeFixture();
  const output = execFileSync(process.execPath, [SCRIPT, '--json', '--root', root], {
    encoding: 'utf8',
  });
  const result = JSON.parse(output);

  assert.equal(result.errorCount, 0);
  assert.equal(result.warningCount, 1);
  assert.match(result.results[0].warnings[0], /No failure registry files found/);
});

test('repo-shell check-failure-registry fails when required columns are missing', () => {
  const root = makeFixture();
  fs.writeFileSync(
    path.join(root, 'broken.md'),
    `# Failure Registry

| Failure ID | Category | Status |
|---|---|---|
| \`FR-001\` | behaviour | open |
`,
  );

  const result = spawnSync(process.execPath, [SCRIPT, '--root', root, 'broken.md'], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Missing required column/);
});

test('repo-shell check-failure-registry rejects invalid enum values', () => {
  const root = makeFixture();
  const registry = VALID_REGISTRY
    .replace('| behaviour |', '| correctness |')
    .replace('| test-gap |', '| flaky-test |')
    .replace('| consumer-repository |', '| product-code |')
    .replace('| 1 |', '| 0 |')
    .replace('| repo-quality-gate |', '| github-actions |')
    .replace('| gate |', '| playbook |')
    .replace('| gate-updated |', '| planned |')
    .replace('| accepted |', '| planned |');
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'failure-registry.md'), registry);

  const result = spawnSync(process.execPath, [SCRIPT, '--root', root], { encoding: 'utf8' });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Invalid Category "correctness"/);
  assert.match(result.stdout, /Invalid Failure Class "flaky-test"/);
  assert.match(result.stdout, /Invalid Owner Layer "product-code"/);
  assert.match(result.stdout, /Occurrences "0" must be an integer >= 1/);
  assert.match(result.stdout, /Invalid GitHub Signal "github-actions"/);
  assert.match(result.stdout, /Invalid Recommended Harness Change "playbook"/);
  assert.match(result.stdout, /Invalid Promotion Decision "planned"/);
  assert.match(result.stdout, /Invalid Status "planned"/);
});

test('repo-shell check-failure-registry rejects template placeholder rows in real registries', () => {
  const root = makeFixture();
  fs.writeFileSync(
    path.join(root, 'docs', 'harness', 'failure-registry.md'),
    `# Failure Registry

| Failure ID | Category | Failure Class | Owner Layer | Occurrences | Example | Impact | GitHub Signal | Current Guide | Current Sensor | Current Gate | Detected By | Missed By | Recommended Harness Change | Promotion Decision | Promotion Deadline | Status |
|---|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|
| \`FR-001\` | behaviour \\| maintainability \\| architecture-fitness \\| runtime-quality \\| method-health | instruction-gap \\| task-boundary-gap \\| architecture-drift \\| test-gap \\| static-sensor-gap \\| runtime-evidence-gap \\| security-boundary-gap \\| ci-signal-noise \\| method-health-gap | portable-method \\| consumer-template \\| consumer-repository \\| agent-adapter \\| no-action | 1 | short concrete example | user/system impact | method-gate \\| repo-quality-gate \\| runtime-evidence-gate \\| external-flaky \\| not-applicable | guide path or none | sensor path or none | gate path or none | test/review/human/runtime | sensor or review that missed it | guide/sensor/gate/template/adapter/registry-only/no-action | no-repeat-observed \\| guide-updated \\| sensor-added \\| gate-updated \\| template-updated \\| adapter-updated \\| registry-only | date or none | open \\| accepted \\| implemented \\| rejected |
`,
  );

  const result = spawnSync(process.execPath, [SCRIPT, '--root', root], { encoding: 'utf8' });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /appears to be the template placeholder row/);
});
