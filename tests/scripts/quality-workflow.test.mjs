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
    /filters:\s*\|[\s\S]*all:\s*\n\s*-\s*'\*\*'/i,
    'quality workflow should count all changed files before classifying scopes',
  );
  assert.match(
    workflowSource,
    /docs_only:\s*\$\{\{[\s\S]*steps\.scope\.outputs\.all_count\s*==\s*steps\.scope\.outputs\.docs_only_count[\s\S]*\}\}/i,
    'change scope should classify docs-only by comparing matched docs count with all changed files',
  );
  assert.match(
    workflowSource,
    /governance_only:\s*\$\{\{[\s\S]*steps\.scope\.outputs\.all_count\s*==\s*steps\.scope\.outputs\.governance_only_count[\s\S]*\}\}/i,
    'change scope should classify governance-only by comparing matched governance count with all changed files',
  );
  assert.doesNotMatch(
    workflowSource,
    /predicate-quantifier:\s*every/i,
    'quality workflow should not require every whitelist glob to match the same file',
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
    /go-lint:[\s\S]*if:\s*\$\{\{\s*github\.event_name\s*==\s*'merge_group'\s*\|\|[\s\S]*needs\.change-scope\.outputs\.governance_only\s*!=\s*'true'/i,
    'go lint should be skipped for governance-only pull requests and pushes',
  );
  assert.match(
    workflowSource,
    /quality-gates:[\s\S]*needs:[\s\S]*- go-lint[\s\S]*if:\s*always\(\)/i,
    'quality gates should depend on go-lint results',
  );
  assert.match(
    workflowSource,
    /GO_LINT_RESULT.*!=.*"success"/i,
    'quality gates should enforce go-lint as a runtime gate',
  );
  assert.match(
    workflowSource,
    /Run golangci-lint[\s\S]*continue-on-error:\s*true/i,
    'go-lint step should use continue-on-error so findings are reported without failing the job',
  );
  assert.match(
    workflowSource,
    /Enforce go-lint gate[\s\S]*EVENT_NAME[\s\S]*pull_request[\s\S]*merge_group[\s\S]*report-only/i,
    'go-lint gate should be report-only for pull_request and merge_group events',
  );
  assert.match(
    workflowSource,
    /Quality Gates Summary[\s\S]*GITHUB_STEP_SUMMARY/i,
    'quality gates should write a job summary to GITHUB_STEP_SUMMARY',
  );
  assert.match(
    workflowSource,
    /if\s+\[\s*"\$\{GOVERNANCE_ONLY\}"\s*=\s*"true"\s*\];\s*then[\s\S]*RUNTIME_GATES_REQUIRED=false/i,
    'quality gates should only require runtime gates when the change is not governance-only',
  );
  for (const governancePath of [
    'package.json',
    'package-lock.json',
    'scripts/cleanup-github-branches.mjs',
    'scripts/collect-merge-targets.mjs',
    'scripts/execute-merge.mjs',
  ]) {
    assert.match(
      workflowSource,
      new RegExp(`- '${governancePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`),
      `${governancePath} should be classified as governance-only`,
    );
  }
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
