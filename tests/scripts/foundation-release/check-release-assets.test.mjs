import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFilePath), '..', '..', '..');
const scriptPath = path.join(repoRoot, 'scripts', 'foundation-release', 'check-release-assets.mjs');
const moduleUrl = pathToFileURL(scriptPath).href;

const {
  requiredReleaseAssetNames,
  evaluateReleaseAssets,
  verifyLocalBundle,
  checkReleaseAssets,
  parseCheckArgs,
  runCheckCli,
} = await import(moduleUrl);

const RELEASE_VERSION = 'pantheon-base-v0.16.0';
const ARCHIVE_NAME = `foundation-release-${RELEASE_VERSION}.tgz`;

function withTempDir(callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pantheon-release-assets-'));
  try {
    callback(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function writeChecksumSidecar(archivePath, { recordedName } = {}) {
  const checksum = sha256(fs.readFileSync(archivePath));
  const name = recordedName ?? path.basename(archivePath);
  fs.writeFileSync(`${archivePath}.sha256`, `${checksum}  ${name}\n`, 'utf8');
}

function writeLocalBundle(distRoot, { tamperArchive = false, omitRepoTarChecksum = false } = {}) {
  const versionRoot = path.join(distRoot, RELEASE_VERSION);
  fs.mkdirSync(versionRoot, { recursive: true });

  const archivePath = path.join(versionRoot, ARCHIVE_NAME);
  fs.writeFileSync(archivePath, 'bundle-archive-contents', 'utf8');
  writeChecksumSidecar(archivePath);

  const repoTarPath = path.join(versionRoot, 'repo.tar');
  fs.writeFileSync(repoTarPath, 'repo-snapshot-contents', 'utf8');
  if (!omitRepoTarChecksum) {
    writeChecksumSidecar(repoTarPath);
  }

  if (tamperArchive) {
    fs.appendFileSync(archivePath, 'tampered', 'utf8');
  }

  return versionRoot;
}

test('requiredReleaseAssetNames lists the four consumable assets', () => {
  assert.deepEqual(requiredReleaseAssetNames(RELEASE_VERSION), [
    ARCHIVE_NAME,
    `${ARCHIVE_NAME}.sha256`,
    'repo.tar',
    'repo.tar.sha256',
  ]);
});

test('evaluateReleaseAssets accepts a complete asset set', () => {
  const result = evaluateReleaseAssets({
    releaseVersion: RELEASE_VERSION,
    assetNames: [ARCHIVE_NAME, `${ARCHIVE_NAME}.sha256`, 'repo.tar', 'repo.tar.sha256'],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
});

test('evaluateReleaseAssets reports each missing asset', () => {
  const result = evaluateReleaseAssets({
    releaseVersion: RELEASE_VERSION,
    assetNames: [ARCHIVE_NAME],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, [`${ARCHIVE_NAME}.sha256`, 'repo.tar', 'repo.tar.sha256']);
});

test('evaluateReleaseAssets treats an empty release as fully missing', () => {
  const result = evaluateReleaseAssets({ releaseVersion: RELEASE_VERSION, assetNames: undefined });

  assert.equal(result.ok, false);
  assert.equal(result.missing.length, 4);
});

test('verifyLocalBundle accepts a checksum-consistent bundle', () => {
  withTempDir((distRoot) => {
    writeLocalBundle(distRoot);
    const result = verifyLocalBundle(distRoot, RELEASE_VERSION);

    assert.equal(result.present, true);
    assert.equal(result.ok, true);
    assert.deepEqual(result.verified, [ARCHIVE_NAME, 'repo.tar']);
  });
});

test('verifyLocalBundle rejects a tampered archive', () => {
  withTempDir((distRoot) => {
    writeLocalBundle(distRoot, { tamperArchive: true });
    const result = verifyLocalBundle(distRoot, RELEASE_VERSION);

    assert.equal(result.ok, false);
    assert.match(result.findings.join('\n'), /SHA-256 mismatch/u);
  });
});

test('verifyLocalBundle rejects a missing checksum sidecar', () => {
  withTempDir((distRoot) => {
    writeLocalBundle(distRoot, { omitRepoTarChecksum: true });
    const result = verifyLocalBundle(distRoot, RELEASE_VERSION);

    assert.equal(result.ok, false);
    assert.match(result.findings.join('\n'), /missing local checksum: repo\.tar\.sha256/u);
  });
});

test('verifyLocalBundle reports an absent version directory as not present', () => {
  withTempDir((distRoot) => {
    const result = verifyLocalBundle(distRoot, RELEASE_VERSION);

    assert.equal(result.present, false);
    assert.equal(result.ok, false);
  });
});

test('checkReleaseAssets local-only accepts a valid local bundle without contacting GitHub', async () => {
  const distRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pantheon-release-assets-'));
  try {
    writeLocalBundle(distRoot);
    let fetched = false;
    const code = await checkReleaseAssets({
      releaseVersion: RELEASE_VERSION,
      distRoot,
      localOnly: true,
      resolveRepo: () => 'duanxldragon/pantheon-base',
      fetchAssetNames: () => {
        fetched = true;
        return [];
      },
      log: () => {},
    });

    assert.equal(code, 0);
    assert.equal(fetched, false, 'local-only must not query GitHub');
  } finally {
    fs.rmSync(distRoot, { recursive: true, force: true });
  }
});

test('checkReleaseAssets local-only fails when no local bundle was built', async () => {
  const distRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pantheon-release-assets-'));
  try {
    const code = await checkReleaseAssets({
      releaseVersion: RELEASE_VERSION,
      distRoot,
      localOnly: true,
      resolveRepo: () => 'duanxldragon/pantheon-base',
      fetchAssetNames: () => {
        throw new Error('local-only must not query GitHub');
      },
      log: () => {},
    });

    assert.equal(code, 1);
  } finally {
    fs.rmSync(distRoot, { recursive: true, force: true });
  }
});

test('checkReleaseAssets rejects combining local-only with skip-local', async () => {
  await assert.rejects(
    checkReleaseAssets({
      releaseVersion: RELEASE_VERSION,
      localOnly: true,
      skipLocal: true,
      resolveRepo: () => 'duanxldragon/pantheon-base',
      fetchAssetNames: () => [],
      log: () => {},
    }),
    /--local-only cannot be combined with --skip-local/u,
  );
});

test('checkReleaseAssets passes when the release carries every asset', async () => {
  const code = await checkReleaseAssets({
    releaseVersion: RELEASE_VERSION,
    skipLocal: true,
    resolveRepo: () => 'duanxldragon/pantheon-base',
    fetchAssetNames: () => [ARCHIVE_NAME, `${ARCHIVE_NAME}.sha256`, 'repo.tar', 'repo.tar.sha256'],
    log: () => {},
  });

  assert.equal(code, 0);
});

test('checkReleaseAssets fails when the release is missing assets', async () => {
  const lines = [];
  const code = await checkReleaseAssets({
    releaseVersion: RELEASE_VERSION,
    skipLocal: true,
    resolveRepo: () => 'duanxldragon/pantheon-base',
    fetchAssetNames: () => [],
    log: (line) => lines.push(line),
  });

  assert.equal(code, 1);
  assert.match(lines.join('\n'), /\[FAIL\] release pantheon-base-v0\.16\.0 is missing assets/u);
});

test('checkReleaseAssets fails when the release does not exist and no wait is allowed', async () => {
  const code = await checkReleaseAssets({
    releaseVersion: RELEASE_VERSION,
    skipLocal: true,
    waitSeconds: 0,
    resolveRepo: () => 'duanxldragon/pantheon-base',
    fetchAssetNames: () => {
      throw new Error('gh release view failed: HTTP 404: Not Found');
    },
    log: () => {},
  });

  assert.equal(code, 1);
});

test('checkReleaseAssets retries while the release is still being published', async () => {
  let attempts = 0;
  const sleeps = [];
  const code = await checkReleaseAssets({
    releaseVersion: RELEASE_VERSION,
    skipLocal: true,
    waitSeconds: 120,
    pollSeconds: 5,
    resolveRepo: () => 'duanxldragon/pantheon-base',
    fetchAssetNames: () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error('gh release view failed: HTTP 404: Not Found');
      }
      return [ARCHIVE_NAME, `${ARCHIVE_NAME}.sha256`, 'repo.tar', 'repo.tar.sha256'];
    },
    sleep: (milliseconds) => {
      sleeps.push(milliseconds);
      return Promise.resolve();
    },
    log: () => {},
  });

  assert.equal(code, 0);
  assert.equal(attempts, 2);
  assert.deepEqual(sleeps, [5000]);
});

test('checkReleaseAssets rethrows unexpected failures instead of reporting a gate failure', async () => {
  await assert.rejects(
    checkReleaseAssets({
      releaseVersion: RELEASE_VERSION,
      skipLocal: true,
      resolveRepo: () => 'duanxldragon/pantheon-base',
      fetchAssetNames: () => {
        throw new Error('gh release view failed: HTTP 500: Server Error');
      },
      log: () => {},
    }),
    /HTTP 500/u,
  );
});

test('parseCheckArgs rejects malformed options', () => {
  assert.throws(() => parseCheckArgs(['--release-version']), /--release-version requires a value/u);
  assert.throws(() => parseCheckArgs(['--wait', '-1']), /--wait requires a non-negative number/u);
  assert.throws(() => parseCheckArgs(['--poll', '0']), /--poll requires a positive number/u);
  assert.throws(() => parseCheckArgs(['--nope']), /Unknown argument: --nope/u);
});

test('parseCheckArgs accepts local-only and dist overrides', () => {
  const options = parseCheckArgs([
    '--release-version',
    RELEASE_VERSION,
    '--local-only',
    '--dist',
    'dist/foundation-releases',
  ]);

  assert.equal(options.localOnly, true);
  assert.equal(options.releaseVersion, RELEASE_VERSION);
  assert.match(options.distRoot, /dist[\\/]foundation-releases$/u);
});

test('cli rejects a release version that is not pantheon-base-vX.Y.Z', async () => {
  await assert.rejects(
    runCheckCli(['--release-version', '0.16.0'], { log: () => {} }),
    /release-version must match pantheon-base-vX\.Y\.Z/u,
  );
});

test('cli requires an explicit release version', async () => {
  await assert.rejects(runCheckCli([], { log: () => {} }), /--release-version is required/u);
});

test('cli prints help without contacting GitHub', async () => {
  const lines = [];
  const code = await runCheckCli(['--help'], { log: (line) => lines.push(line) });

  assert.equal(code, 0);
  assert.match(lines.join('\n'), /--release-version <version>/u);
});
