import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workflowPath = path.resolve('.github/workflows/quality.yml');
const workflowSource = fs.readFileSync(workflowPath, 'utf8');

test('docs-only pull requests can skip smoke sanity without failing Quality Gates', () => {
  assert.match(
    workflowSource,
    /paths-filter[\s\S]*predicate-quantifier:\s*every/i,
    'quality workflow should detect docs-only pull requests',
  );
  assert.match(
    workflowSource,
    /smoke-sanity:[\s\S]*if:\s*\$\{\{\s*github\.event_name\s*!=\s*'pull_request'\s*\|\|[\s\S]*needs\.change-scope\.outputs\.docs_only\s*!=\s*'true'/i,
    'smoke sanity should be skipped for docs-only pull requests',
  );
  assert.match(
    workflowSource,
    /docs_only:\s*\$\{\{\s*steps\.scope\.outputs\.docs_only\s*\|\|\s*'false'\s*\}\}/i,
    'change scope should default docs_only to false outside pull requests',
  );
  assert.match(
    workflowSource,
    /if\s+\[\s*"\$\{DOCS_ONLY\}"\s*=\s*"true"\s*\];\s*then[\s\S]*SMOKE_SANITY_REQUIRED=false/i,
    'quality gates should only require smoke sanity when the change is not docs-only',
  );
});
