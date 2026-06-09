import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(TEST_DIR, 'check-template-health.mjs');

function createFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'template-health-shell-'));
  fs.mkdirSync(path.join(root, 'agentic-method-kit', 'config'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs', 'harness'), { recursive: true });
  fs.writeFileSync(path.join(root, 'agentic-method-kit', 'HARNESS_CORE_MODEL.md'), '# Core\n');
  fs.writeFileSync(path.join(root, 'agentic-method-kit', 'HARNESS_COVERAGE_MODEL.md'), '# Coverage\n');
  fs.writeFileSync(path.join(root, 'agentic-method-kit', 'HARNESS_TEMPLATE_TAXONOMY.md'), '# Taxonomy\n');
  fs.writeFileSync(path.join(root, 'agentic-method-kit', 'TOOL_ADAPTER_MATRIX.md'), '# Matrix\n');
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'HARNESS_CORE_MODEL.md'), '# Core\n');
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'HARNESS_COVERAGE_MODEL.md'), '# Coverage\n');
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'HARNESS_TEMPLATE_TAXONOMY.md'), '# Taxonomy\n');
  fs.writeFileSync(path.join(root, 'docs', 'harness', 'TOOL_ADAPTER_MATRIX.md'), '# Matrix\n');
  fs.writeFileSync(path.join(root, 'agentic-method-kit', 'config', 'method.config.json'), JSON.stringify({ templateId: 'api-service' }));
  return root;
}

test('repo-shell check-template-health accepts a valid template selection', () => {
  const root = createFixture();
  const output = execFileSync(process.execPath, [SCRIPT, '--json', '--strict', '--root', root], { encoding: 'utf8' });
  const result = JSON.parse(output);
  assert.equal(result.findingCount, 0);
});
