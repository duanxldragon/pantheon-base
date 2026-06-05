import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const currentFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFilePath), '..', '..', '..');
const scriptPath = path.join(repoRoot, 'scripts', 'foundation-release', 'build-release-manifest.mjs');

function withTempDir(callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pantheon-foundation-release-'));
  try {
    callback(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function runScript(args, cwd) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd,
    encoding: 'utf8',
  });
}

test('build-release-manifest writes release metadata files into releases/<version>', () => {
  withTempDir((root) => {
    const result = runScript(
      [
        '--root',
        root,
        '--release-version',
        'base-v0.8.0',
        '--release-line',
        'release/0.8',
        '--base-commit',
        'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
        '--release-notes',
        'shared auth cleanup',
        '--upgrade-notes',
        'run inheritance checks',
        '--consumer-impact',
        'ops should review backend drift',
      ],
      repoRoot,
    );

    assert.equal(result.status, 0, result.stderr || result.stdout || result.error?.message);

    const releaseRoot = path.join(root, 'releases', 'base-v0.8.0');
    const manifest = JSON.parse(fs.readFileSync(path.join(releaseRoot, 'manifest.json'), 'utf8'));

    assert.equal(manifest.releaseVersion, 'base-v0.8.0');
    assert.equal(manifest.releaseLine, 'release/0.8');
    assert.equal(manifest.baseCommit, 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef');
    assert.equal(manifest.sourceRepo, 'pantheon-base');
    assert.equal(manifest.consumerMode, 'foundation-release-consumer');
    assert.equal(manifest.qualityBaselines.sonarProjectVersion, 'base-v0.8.0');

    assert.match(fs.readFileSync(path.join(releaseRoot, 'release-notes.md'), 'utf8'), /shared auth cleanup/);
    assert.match(fs.readFileSync(path.join(releaseRoot, 'upgrade-notes.md'), 'utf8'), /run inheritance checks/);
    assert.match(
      fs.readFileSync(path.join(releaseRoot, 'consumer-impact.md'), 'utf8'),
      /ops should review backend drift/,
    );

    const verificationSummary = JSON.parse(
      fs.readFileSync(path.join(releaseRoot, 'verification-summary.json'), 'utf8'),
    );
    assert.equal(verificationSummary.releaseVersion, 'base-v0.8.0');
  });
});

test('build-release-manifest fails when release version is missing', () => {
  withTempDir((root) => {
    const result = runScript(
      [
        '--root',
        root,
        '--release-line',
        'release/0.8',
        '--base-commit',
        'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      ],
      repoRoot,
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr || result.error?.message || '', /release-version|cannot find/i);
  });
});

test('build-release-manifest help lists the supported release metadata flags', () => {
  const result = runScript(['--help'], repoRoot);

  assert.equal(result.status, 0, result.stderr || result.error?.message);
  assert.match(result.stdout, /--release-version <version>/);
  assert.match(result.stdout, /--release-line <line>/);
  assert.match(result.stdout, /--base-commit <sha>/);
  assert.match(result.stdout, /--consumer-impact <text>/);
});
