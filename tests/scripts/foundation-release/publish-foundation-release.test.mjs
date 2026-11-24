import assert from 'node:assert/strict';
import crypto from 'node:crypto';
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

const {
  buildGitHubReleaseBody,
  buildGitHubReleaseTitle,
  buildGitHubReleaseCreateArgs,
  validateReleaseAssetChecksum,
  validatePublishCandidate,
  validateReleaseBodySections,
  validateReleaseGateCheckRuns,
  isMissingGitHubReleaseError,
} = await import(moduleUrl);

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

test('buildGitHubReleaseTitle identifies the product and preserves canonical version identity', () => {
  assert.equal(buildGitHubReleaseTitle('pantheon-base-v0.18.8'), 'Pantheon Base v0.18.8');
  assert.equal(buildGitHubReleaseTitle('pantheon-base-v1.0.0'), 'Pantheon Base v1.0.0');
  for (const stage of ['alpha', 'beta', 'rc']) {
    assert.equal(
      buildGitHubReleaseTitle(`pantheon-base-v0.19.0-${stage}.1`),
      `Pantheon Base v0.19.0-${stage}.1`,
    );
  }
});

test('buildGitHubReleaseTitle rejects legacy and malformed tags instead of promoting them', () => {
  for (const version of [
    'base-v0.9.0',
    'backend/v0.13.1',
    'v1.0',
    'v1.0.0',
    'v0.18.8',
    'other-product-v0.18.8',
    'pantheon-base-v0.18',
    'pantheon-base-v0.18.8-rc',
    ' pantheon-base-v0.18.8 ',
    '',
    undefined,
  ]) {
    assert.throws(() => buildGitHubReleaseTitle(version), /release-version must match/);
  }
});

test('release create arguments preserve notes and classify prereleases separately from stable releases', () => {
  const options = {
    repoFullName: 'duanxldragon/pantheon-base',
    targetCommit: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    notes: '## Release Notes\n\nline one\nline two',
  };
  const stable = buildGitHubReleaseCreateArgs({ ...options, releaseVersion: 'pantheon-base-v0.18.8' });
  assert.equal(stable[stable.indexOf('--title') + 1], 'Pantheon Base v0.18.8');
  assert.equal(stable[stable.indexOf('--notes') + 1], options.notes);
  assert.equal(stable.includes('--prerelease'), false);
  assert.equal(stable.includes('--latest=false'), false);

  for (const stage of ['alpha', 'beta', 'rc']) {
    const args = buildGitHubReleaseCreateArgs({
      ...options,
      releaseVersion: `pantheon-base-v0.19.0-${stage}.2`,
    });
    assert.equal(args[args.indexOf('--title') + 1], `Pantheon Base v0.19.0-${stage}.2`);
    assert.equal(args[args.indexOf('--notes') + 1], options.notes);
    assert.equal(args.includes('--prerelease'), true);
    assert.equal(args.includes('--latest=false'), true);
  }
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

test('validatePublishCandidate binds the release tag to the manifest commit', () => {
  const targetCommit = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
  assert.doesNotThrow(() => validatePublishCandidate({
    releaseVersion: 'pantheon-base-v0.10.0',
    manifest: {
      releaseVersion: 'pantheon-base-v0.10.0',
      baseCommit: targetCommit,
    },
    targetCommit,
  }));

  assert.throws(() => validatePublishCandidate({
    releaseVersion: 'pantheon-base-v0.10.0',
    manifest: {
      releaseVersion: 'pantheon-base-v0.10.0',
      baseCommit: targetCommit,
    },
    targetCommit: 'feedfacefeedfacefeedfacefeedfacefeedface',
  }), /baseCommit.*does not match target commit/);
});

test('validateReleaseGateCheckRuns fails closed unless the latest gate succeeded', () => {
  const targetCommit = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
  assert.throws(
    () => validateReleaseGateCheckRuns({ checkRuns: [], targetCommit }),
    /release gate check is missing/,
  );
  assert.throws(
    () => validateReleaseGateCheckRuns({
      targetCommit,
      checkRuns: [{
        name: 'Release Gate Summary',
        status: 'completed',
        conclusion: 'failure',
        completed_at: '2026-08-11T00:00:00Z',
      }],
    }),
    /completed\/failure/,
  );

  const successfulGate = {
    name: 'Release Gate Summary',
    status: 'completed',
    conclusion: 'success',
    completed_at: '2026-08-11T00:01:00Z',
  };
  assert.equal(
    validateReleaseGateCheckRuns({
      targetCommit,
      checkRuns: [
        successfulGate,
        {
          name: 'Release Gate Summary',
          status: 'completed',
          conclusion: 'failure',
          completed_at: '2026-08-11T00:00:00Z',
        },
      ],
    }),
    successfulGate,
  );

  assert.throws(
    () => validateReleaseGateCheckRuns({
      targetCommit,
      checkRuns: [
        { ...successfulGate, started_at: '2026-08-11T00:01:00Z' },
        {
          name: 'Release Gate Summary',
          status: 'in_progress',
          conclusion: null,
          started_at: '2026-08-11T00:02:00Z',
        },
      ],
    }),
    /in_progress\/pending/,
  );
});

test('GitHub release lookup only treats an explicit not-found response as absent', () => {
  assert.equal(isMissingGitHubReleaseError(new Error('release not found')), true);
  assert.equal(isMissingGitHubReleaseError(new Error('HTTP 404: Not Found')), true);
  assert.equal(isMissingGitHubReleaseError(new Error('HTTP 403: Resource not accessible')), false);
  assert.equal(isMissingGitHubReleaseError(new Error('network connection reset')), false);
});

test('validateReleaseAssetChecksum rejects stale or malformed release checksums', () => {
  withTempDir((root) => {
    const archivePath = path.join(root, 'foundation-release-pantheon-base-v0.10.1.tgz');
    const checksumPath = `${archivePath}.sha256`;
    fs.writeFileSync(archivePath, 'foundation release archive', 'utf8');
    const expectedChecksum = crypto.createHash('sha256').update(fs.readFileSync(archivePath)).digest('hex');
    fs.writeFileSync(
      checksumPath,
      `${expectedChecksum}  foundation-release-pantheon-base-v0.10.1.tgz\n`,
      'utf8',
    );

    assert.equal(
      validateReleaseAssetChecksum({ archivePath, checksumPath }),
      expectedChecksum,
    );

    fs.writeFileSync(
      checksumPath,
      '0000000000000000000000000000000000000000000000000000000000000000  foundation-release-pantheon-base-v0.10.1.tgz\n',
      'utf8',
    );
    assert.throws(
      () => validateReleaseAssetChecksum({ archivePath, checksumPath }),
      /SHA-256 mismatch/,
    );
  });
});
