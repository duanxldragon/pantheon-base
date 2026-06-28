import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFilePath), '..', '..', '..');
const moduleUrl = pathToFileURL(
  path.join(repoRoot, 'scripts', 'foundation-release', 'publish-foundation-release.mjs'),
).href;

const { buildGitHubReleaseBody, buildGitHubReleaseTitle, validateReleaseBodySections } =
  await import(moduleUrl);

function withTempDir(callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pantheon-foundation-publish-'));
  try {
    callback(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('buildGitHubReleaseBody combines release notes, upgrade notes, and consumer impact', () => {
  const body = buildGitHubReleaseBody({
    releaseNotes: '# Release Notes\n\nshared auth cleanup',
    upgradeNotes: '# Upgrade Notes\n\nrerun inheritance checks',
    consumerImpact: '# Consumer Impact\n\nops should review business overlays',
  });

  assert.match(body, /## Release Notes/);
  assert.match(body, /shared auth cleanup/);
  assert.match(body, /## Upgrade Notes/);
  assert.match(body, /rerun inheritance checks/);
  assert.match(body, /## Consumer Impact/);
  assert.match(body, /ops should review business overlays/);
});

test('buildGitHubReleaseTitle uses the short semver display title', () => {
  assert.equal(buildGitHubReleaseTitle('base-v0.8.3'), 'v0.8.3');
  assert.equal(buildGitHubReleaseTitle('pantheon-base-v0.8.3'), 'v0.8.3');
  assert.equal(buildGitHubReleaseTitle('v0.8.3'), 'v0.8.3');
});

test('release body title stripping keeps section content only', () => {
  const body = buildGitHubReleaseBody({
    releaseNotes: '# Release Notes\n\nline one\nline two',
    upgradeNotes: '# Upgrade Notes\n\nupgrade body',
    consumerImpact: '# Consumer Impact\n\nimpact body',
  });

  assert.doesNotMatch(body, /^# Release Notes/m);
  assert.match(body, /line one/);
  assert.match(body, /line two/);
});

test('validateReleaseBodySections rejects placeholder content', () => {
  assert.deepEqual(validateReleaseBodySections({
    releaseNotes: '# Release Notes\n\nNo release notes provided.',
    upgradeNotes: '# Upgrade Notes\n\nNo upgrade notes provided.',
    consumerImpact: '# Consumer Impact\n\nNo consumer impact summary provided.',
  }), [
    'release notes still uses placeholder content',
    'upgrade notes still uses placeholder content',
    'consumer impact still uses placeholder content',
  ]);
});

test('validateReleaseBodySections accepts non-placeholder content', () => {
  withTempDir((root) => {
    assert.equal(fs.existsSync(root), true);
  });
  assert.deepEqual(validateReleaseBodySections({
    releaseNotes: '# Release Notes\n\nshared auth cleanup',
    upgradeNotes: '# Upgrade Notes\n\nrerun inheritance checks',
    consumerImpact: '# Consumer Impact\n\nops should review business overlays',
  }), []);
});
