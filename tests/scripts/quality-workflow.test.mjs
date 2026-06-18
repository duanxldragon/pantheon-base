import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workflowPath = path.resolve('.github/workflows/quality.yml');
const workflowSource = fs.readFileSync(workflowPath, 'utf8');

test('docs-only pull requests can skip smoke sanity without failing Quality Gates', () => {
  assert.match(
    workflowSource,
    /uses:\s*dorny\/paths-filter@fbd0ab8f3e69293af611ebaee6363fc25e6d187d/i,
    'quality workflow should pin paths-filter to a revision that supports predicate-quantifier',
  );
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

test('docs governance validates the PR governance template and pull request body', () => {
  assert.match(
    workflowSource,
    /Check PR governance template[\s\S]*npm run check:pr-governance/i,
    'docs governance should check the PR governance template',
  );
  assert.match(
    workflowSource,
    /Validate PR governance body[\s\S]*if:\s*github\.event_name\s*==\s*'pull_request'[\s\S]*node scripts\/check-pr-governance\.mjs --event "\$GITHUB_EVENT_PATH"/i,
    'docs governance should validate the pull request body on pull request events',
  );
});

test('docs governance does not checkout an unused pantheon-base foundation copy', () => {
  assert.doesNotMatch(
    workflowSource,
    /Checkout pantheon-base foundation/i,
    'quality workflow should not spend CI time on an unused secondary checkout',
  );
  assert.doesNotMatch(
    workflowSource,
    /path:\s*pantheon-base-foundation/i,
    'quality workflow should not materialize an unused pantheon-base-foundation path',
  );
});
