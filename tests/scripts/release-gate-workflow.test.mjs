import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workflowPath = path.resolve('.github/workflows/release-gate.yml');
const workflowSource = fs.readFileSync(workflowPath, 'utf8');

test('release gate resolves and reports the immutable candidate commit', () => {
  assert.match(workflowSource, /INPUT_CANDIDATE_SHA:\s*\$\{\{ inputs\.candidate_sha \}\}/);
  assert.match(
    workflowSource,
    /candidate_sha=\$\(gh api "repos\/\$REPO\/commits\/\$requested_sha" --jq '\.sha'\)/,
  );
  assert.match(workflowSource, /candidate_sha=\$candidate_sha.*GITHUB_OUTPUT/);
  assert.match(workflowSource, /Candidate commit:.*CANDIDATE_SHA/);
});

test('release gate requires every aggregate check on the candidate SHA', () => {
  assert.match(
    workflowSource,
    /repos\/\$REPO\/commits\/\$CANDIDATE_SHA\/check-runs\?per_page=100/,
  );
  for (const checkName of [
    'CI Summary',
    'Quality Gates',
    'Security Gates',
    'Actionlint',
    'Full Smoke',
    'SonarCloud Code Analysis',
  ]) {
    assert.match(workflowSource, new RegExp(`^\\s+${checkName}$`, 'm'));
  }
  assert.match(workflowSource, /status.*!= "completed".*conclusion.*!= "success"/);
  assert.match(workflowSource, /needs:\s*\[candidate-checks,/);
  assert.match(workflowSource, /CANDIDATE_CHECKS.*!= "success"/);
});

test('security alert API failures block the release instead of becoming zero alerts', () => {
  assert.doesNotMatch(workflowSource, /2>\/dev\/null\s*\|\|\s*echo "0"/);
  assert.match(workflowSource, /total=\$\(echo "\$result" \| jq -er '\.total \| numbers'\)/);
});
