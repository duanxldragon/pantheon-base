import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.resolve(TEST_DIR, 'check-method-health.mjs');

function createFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'method-health-shell-'));
  fs.mkdirSync(path.join(root, 'agentic-method-kit'), { recursive: true });
  fs.mkdirSync(path.join(root, '.agents'), { recursive: true });
  fs.mkdirSync(path.join(root, '.github'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs', 'harness'), { recursive: true });
  fs.mkdirSync(path.join(root, 'scripts', 'harness'), { recursive: true });
  fs.mkdirSync(path.join(root, '.harness'), { recursive: true });
  fs.mkdirSync(path.join(root, 'openspec'), { recursive: true });

  fs.writeFileSync(path.join(root, 'agentic-method-kit', 'VERSION'), '1.0.0\n');
  fs.writeFileSync(
    path.join(root, 'agentic-method-kit', 'METHOD_VERSION.json'),
    JSON.stringify({ version: '1.0.0', compatibleRepoShell: '1.0.0' }),
  );
  fs.writeFileSync(path.join(root, 'agentic-method-kit', 'HARNESS_CORE_MODEL.md'), '# Core Model\n');
  fs.writeFileSync(path.join(root, 'agentic-method-kit', 'HARNESS_COVERAGE_MODEL.md'), '# Coverage Model\n');
  fs.writeFileSync(path.join(root, 'agentic-method-kit', 'HARNESS_TEMPLATE_TAXONOMY.md'), '# Template Taxonomy\n');
  fs.writeFileSync(path.join(root, 'agentic-method-kit', 'TOOL_ADAPTER_MATRIX.md'), '# Tool Adapter Matrix\n');
  fs.writeFileSync(path.join(root, 'agentic-method-kit', 'CHANGELOG.md'), '# Changelog\n');
  fs.writeFileSync(path.join(root, 'agentic-method-kit', 'UPGRADE.md'), '# Upgrade\n');
  fs.writeFileSync(
    path.join(root, 'SHELL_VERSION.json'),
    JSON.stringify({ version: '1.0.0', compatibleMethodKit: '1.0.0' }),
  );
  fs.writeFileSync(path.join(root, '.agents', 'README.md'), '# Adapters\n');
  fs.writeFileSync(path.join(root, '.github', 'pull_request_template.md'), 'Task packet\n');
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'HARNESS_CORE_MODEL.md'), '# Core Model\n');
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'HARNESS_COVERAGE_MODEL.md'), '# Coverage Model\n');
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'HARNESS_TEMPLATE_TAXONOMY.md'), '# Template Taxonomy\n');
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'TOOL_ADAPTER_MATRIX.md'), '# Tool Adapter Matrix\n');
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'HARNESS_ENGINEERING_CONTRACT.md'), '# Contract\n');
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'DOCUMENT_FRONTMATTER_SPEC.md'), '# Frontmatter\n');
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'TRIVIALITY_CLASSIFICATION_POLICY.md'), '# Triviality\n');
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'VISUAL_EVIDENCE_PROMOTION_POLICY.md'), '# Visual Policy\n');
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'FAILURE_REGISTRY_PROMOTION_POLICY.md'), '# Failure Policy\n');
  fs.writeFileSync(path.join(root, 'scripts', 'harness', 'check-adoption.mjs'), '#!/usr/bin/env node\n');
  fs.writeFileSync(path.join(root, 'scripts', 'harness', 'check-review.mjs'), '#!/usr/bin/env node\n');
  fs.writeFileSync(path.join(root, 'scripts', 'harness', 'check-graph-review.mjs'), '#!/usr/bin/env node\n');
  fs.writeFileSync(path.join(root, 'scripts', 'harness', 'scaffold-graph-review.mjs'), '#!/usr/bin/env node\n');
  fs.writeFileSync(path.join(root, 'scripts', 'harness', 'build-graph-review-import.mjs'), '#!/usr/bin/env node\n');
  fs.writeFileSync(path.join(root, 'scripts', 'harness', 'check-doc-frontmatter.mjs'), '#!/usr/bin/env node\n');
  fs.writeFileSync(path.join(root, 'scripts', 'harness', 'check-doc-links.mjs'), '#!/usr/bin/env node\n');
  fs.writeFileSync(path.join(root, 'scripts', 'harness', 'check-doc-inventory.mjs'), '#!/usr/bin/env node\n');
  fs.writeFileSync(path.join(root, 'scripts', 'harness', 'check-failure-registry.mjs'), '#!/usr/bin/env node\n');
  fs.writeFileSync(path.join(root, 'scripts', 'harness', 'check-template-health.mjs'), '#!/usr/bin/env node\n');
  fs.writeFileSync(path.join(root, 'scripts', 'harness', 'check-runtime-evidence.mjs'), '#!/usr/bin/env node\n');
  fs.writeFileSync(path.join(root, 'scripts', 'harness', 'check-sync-drift.mjs'), '#!/usr/bin/env node\n');
  return root;
}

test('repo-shell check-method-health passes with compatible versions', () => {
  const root = createFixture();
  const output = execFileSync('node', [SCRIPT_PATH, '--json', '--strict', '--root', root], {
    encoding: 'utf8',
  });
  const result = JSON.parse(output);
  assert.equal(result.findingCount, 0);
  assert.equal(result.warningCount, 0);
});

test('repo-shell check-method-health reports missing failure registry checker', () => {
  const root = createFixture();
  fs.rmSync(path.join(root, 'scripts', 'harness', 'check-failure-registry.mjs'));
  const output = execFileSync('node', [SCRIPT_PATH, '--json', '--root', root], {
    encoding: 'utf8',
  });
  const result = JSON.parse(output);
  assert.equal(result.findingCount, 1);
  assert.equal(result.findings[0].file, 'scripts/harness/check-failure-registry.mjs');
});

test('repo-shell check-method-health reports missing graph review checker', () => {
  const root = createFixture();
  fs.rmSync(path.join(root, 'scripts', 'harness', 'check-graph-review.mjs'));
  const output = execFileSync('node', [SCRIPT_PATH, '--json', '--root', root], {
    encoding: 'utf8',
  });
  const result = JSON.parse(output);
  assert.equal(result.findingCount, 1);
  assert.equal(result.findings[0].file, 'scripts/harness/check-graph-review.mjs');
});

test('repo-shell check-method-health reports missing graph review scaffold tool', () => {
  const root = createFixture();
  fs.rmSync(path.join(root, 'scripts', 'harness', 'scaffold-graph-review.mjs'));
  const output = execFileSync('node', [SCRIPT_PATH, '--json', '--root', root], {
    encoding: 'utf8',
  });
  const result = JSON.parse(output);
  assert.equal(result.findingCount, 1);
  assert.equal(result.findings[0].file, 'scripts/harness/scaffold-graph-review.mjs');
});

test('repo-shell check-method-health reports missing graph review import builder', () => {
  const root = createFixture();
  fs.rmSync(path.join(root, 'scripts', 'harness', 'build-graph-review-import.mjs'));
  const output = execFileSync('node', [SCRIPT_PATH, '--json', '--root', root], {
    encoding: 'utf8',
  });
  const result = JSON.parse(output);
  assert.equal(result.findingCount, 1);
  assert.equal(result.findings[0].file, 'scripts/harness/build-graph-review-import.mjs');
});
