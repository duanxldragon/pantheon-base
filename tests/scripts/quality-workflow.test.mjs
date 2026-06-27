import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workflowPath = path.resolve('.github/workflows/quality.yml');
const workflowSource = fs.readFileSync(workflowPath, 'utf8');

test('governance-only changes can skip runtime gates without failing Quality Gates', () => {
  assert.match(
    workflowSource,
    /uses:\s*dorny\/paths-filter@fbd0ab8f3e69293af611ebaee6363fc25e6d187d/i,
    'quality workflow should pin paths-filter to a revision that supports predicate-quantifier',
  );
  assert.match(
    workflowSource,
    /paths-filter[\s\S]*predicate-quantifier:\s*every/i,
    'quality workflow should require every changed file to match a scope filter',
  );
  assert.match(
    workflowSource,
    /governance_only:\s*\$\{\{\s*steps\.scope\.outputs\.governance_only\s*\|\|\s*'false'\s*\}\}/i,
    'change scope should default governance_only to false outside scoped events',
  );
  assert.match(
    workflowSource,
    /frontend-contract:[\s\S]*if:\s*\$\{\{\s*github\.event_name\s*==\s*'merge_group'\s*\|\|[\s\S]*needs\.change-scope\.outputs\.governance_only\s*!=\s*'true'/i,
    'frontend contract should be skipped for governance-only pull requests and pushes',
  );
  assert.match(
    workflowSource,
    /backend-tests:[\s\S]*if:\s*\$\{\{\s*github\.event_name\s*==\s*'merge_group'\s*\|\|[\s\S]*needs\.change-scope\.outputs\.governance_only\s*!=\s*'true'/i,
    'backend tests should be skipped for governance-only pull requests and pushes',
  );
  assert.match(
    workflowSource,
    /smoke-sanity:[\s\S]*if:\s*\$\{\{\s*github\.event_name\s*==\s*'merge_group'\s*\|\|[\s\S]*needs\.change-scope\.outputs\.governance_only\s*!=\s*'true'/i,
    'smoke sanity should be skipped for governance-only pull requests and pushes',
  );
  assert.match(
    workflowSource,
    /if\s+\[\s*"\$\{GOVERNANCE_ONLY\}"\s*=\s*"true"\s*\];\s*then[\s\S]*RUNTIME_GATES_REQUIRED=false/i,
    'quality gates should only require runtime gates when the change is not governance-only',
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
