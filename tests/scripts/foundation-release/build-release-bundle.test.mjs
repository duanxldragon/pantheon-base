import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const currentFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFilePath), '..', '..', '..');
const scriptPath = path.join(repoRoot, 'scripts', 'foundation-release', 'build-release-bundle.mjs');

function withTempDir(callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pantheon-foundation-bundle-'));
  try {
    callback(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function runScript(args, cwd) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd,
    encoding: 'utf8',
  });
}

function runGit(root, args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout || result.error?.message);
  return result.stdout.trim();
}

function initializeGitRepo(root) {
  runGit(root, ['init']);
  runGit(root, ['config', 'user.name', 'Foundation Test']);
  runGit(root, ['config', 'user.email', 'foundation-test@example.com']);
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'test fixture']);
  return runGit(root, ['rev-parse', 'HEAD']);
}

function writeMinimalBundleFixture(root) {
  const releaseVersion = 'pantheon-base-v0.10.0';
  const releaseRoot = path.join(root, 'releases', releaseVersion);
  const manifestPath = path.join(releaseRoot, 'manifest.json');
  fs.mkdirSync(path.join(root, 'backend', 'pkg'), { recursive: true });
  fs.writeFileSync(path.join(root, 'backend', 'pkg', 'version.go'), 'package pkg\n', 'utf8');
  writeJson(manifestPath, {
    releaseVersion,
    releaseLine: 'release/0.10',
    baseCommit: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    sourceRepo: 'pantheon-base',
    consumerMode: 'foundation-release-consumer',
    sharedPaths: { backend: ['backend/pkg'] },
  });
  const baseCommit = initializeGitRepo(root);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.baseCommit = baseCommit;
  writeJson(manifestPath, manifest);
  return {
    baseCommit,
    manifestPath,
    releaseVersion,
    sharedFile: path.join(root, 'backend', 'pkg', 'version.go'),
  };
}

test('build-release-bundle copies shared paths into dist/foundation-releases/<version>/bundle', () => {
  withTempDir((root) => {
    const releaseRoot = path.join(root, 'releases', 'pantheon-base-v0.10.0');
    fs.mkdirSync(releaseRoot, { recursive: true });

    writeJson(path.join(releaseRoot, 'manifest.json'), {
      releaseVersion: 'pantheon-base-v0.10.0',
      releaseLine: 'release/0.10',
      baseCommit: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      sourceRepo: 'pantheon-base',
      consumerMode: 'foundation-release-consumer',
      bundleExclusions: ['backend/cmd/server/uploads'],
      sharedPaths: {
        backend: ['backend/cmd'],
        frontend: ['frontend/src/core', 'frontend/scripts/lib/css-declarations.mjs'],
        docs: ['docs/designs/FOUNDATION_RELEASE_MODEL.md'],
      },
    });
    writeJson(path.join(releaseRoot, 'verification-summary.json'), {
      releaseVersion: 'pantheon-base-v0.10.0',
    });
    fs.writeFileSync(path.join(releaseRoot, 'release-notes.md'), '# Release Notes\n', 'utf8');
    fs.writeFileSync(path.join(releaseRoot, 'upgrade-notes.md'), '# Upgrade Notes\n', 'utf8');
    fs.writeFileSync(path.join(releaseRoot, 'consumer-impact.md'), '# Consumer Impact\n', 'utf8');

    fs.mkdirSync(path.join(root, 'backend', 'cmd'), { recursive: true });
    fs.writeFileSync(path.join(root, 'backend', 'cmd', 'server.go'), 'package main\n', 'utf8');
    fs.mkdirSync(path.join(root, 'backend', 'cmd', 'server', 'uploads'), { recursive: true });
    fs.writeFileSync(path.join(root, 'backend', 'cmd', 'server', 'uploads', 'ignored.txt'), 'ignore me\n', 'utf8');
    fs.mkdirSync(path.join(root, 'frontend', 'src', 'core'), { recursive: true });
    fs.writeFileSync(path.join(root, 'frontend', 'src', 'core', 'app.ts'), 'export const app = 1;\n', 'utf8');
    fs.mkdirSync(path.join(root, 'frontend', 'scripts', 'lib'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'frontend', 'scripts', 'lib', 'css-declarations.mjs'),
      'export const shared = true;\n',
      'utf8',
    );
    fs.mkdirSync(path.join(root, 'docs', 'designs'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'designs', 'FOUNDATION_RELEASE_MODEL.md'), '# Model\n', 'utf8');

    const baseCommit = initializeGitRepo(root);
    const manifestPath = path.join(releaseRoot, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.baseCommit = baseCommit;
    writeJson(manifestPath, manifest);

    const stalePath = path.join(
      root,
      'dist',
      'foundation-releases',
      'pantheon-base-v0.10.0',
      'bundle',
      'stale.txt',
    );
    fs.mkdirSync(path.dirname(stalePath), { recursive: true });
    fs.writeFileSync(stalePath, 'stale\n', 'utf8');

    const result = runScript(['--root', root, '--release-version', 'pantheon-base-v0.10.0'], repoRoot);
    assert.equal(result.status, 0, result.stderr || result.stdout || result.error?.message);

    const bundleRoot = path.join(root, 'dist', 'foundation-releases', 'pantheon-base-v0.10.0', 'bundle');
    assert.equal(fs.existsSync(stalePath), false);
    assert.equal(fs.existsSync(path.join(bundleRoot, 'shared-backend', 'backend', 'cmd', 'server.go')), true);
    assert.equal(
      fs.existsSync(path.join(bundleRoot, 'shared-backend', 'backend', 'cmd', 'server', 'uploads', 'ignored.txt')),
      false,
    );
    assert.equal(fs.existsSync(path.join(bundleRoot, 'shared-frontend', 'frontend', 'src', 'core', 'app.ts')), true);
    assert.equal(
      fs.existsSync(
        path.join(bundleRoot, 'shared-frontend', 'frontend', 'scripts', 'lib', 'css-declarations.mjs'),
      ),
      true,
    );
    assert.equal(fs.existsSync(path.join(bundleRoot, 'docs', 'docs', 'designs', 'FOUNDATION_RELEASE_MODEL.md')), true);
    assert.equal(fs.existsSync(path.join(bundleRoot, 'manifest.paths.json')), true);
    assert.equal(fs.existsSync(path.join(root, 'dist', 'foundation-releases', 'pantheon-base-v0.10.0', 'go.mod')), true);
    assert.equal(
      fs.existsSync(path.join(root, 'dist', 'foundation-releases', 'pantheon-base-v0.10.0', 'foundation-release-pantheon-base-v0.10.0.tgz')),
      true,
    );
    assert.equal(
      fs.existsSync(path.join(root, 'dist', 'foundation-releases', 'pantheon-base-v0.10.0', 'foundation-release-pantheon-base-v0.10.0.tgz.sha256')),
      true,
    );
  });
});

test('build-release-bundle rejects tracked changes in shared paths', () => {
  withTempDir((root) => {
    const fixture = writeMinimalBundleFixture(root);
    fs.writeFileSync(fixture.sharedFile, 'package pkg\n\nconst Dirty = true\n', 'utf8');

    const result = runScript(['--root', root, '--release-version', fixture.releaseVersion], repoRoot);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr || result.error?.message || '', /changes outside manifest baseCommit/);
  });
});

test('build-release-bundle rejects untracked files in shared paths', () => {
  withTempDir((root) => {
    const fixture = writeMinimalBundleFixture(root);
    fs.writeFileSync(path.join(root, 'backend', 'pkg', 'untracked.go'), 'package pkg\n', 'utf8');

    const result = runScript(['--root', root, '--release-version', fixture.releaseVersion], repoRoot);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr || result.error?.message || '', /untracked files/);
  });
});

test('build-release-bundle rejects a manifest commit that is not HEAD', () => {
  withTempDir((root) => {
    const fixture = writeMinimalBundleFixture(root);
    fs.writeFileSync(path.join(root, 'README.md'), '# New HEAD\n', 'utf8');
    runGit(root, ['add', 'README.md']);
    runGit(root, ['commit', '-m', 'advance head']);

    const result = runScript(['--root', root, '--release-version', fixture.releaseVersion], repoRoot);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr || result.error?.message || '', /does not match manifest baseCommit/);
  });
});

test('build-release-bundle fails when a shared path is missing', () => {
  withTempDir((root) => {
    const releaseRoot = path.join(root, 'releases', 'pantheon-base-v0.10.0');
    fs.mkdirSync(releaseRoot, { recursive: true });

    const manifestPath = path.join(releaseRoot, 'manifest.json');
    writeJson(manifestPath, {
      releaseVersion: 'pantheon-base-v0.10.0',
      releaseLine: 'release/0.10',
      baseCommit: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      sourceRepo: 'pantheon-base',
      consumerMode: 'foundation-release-consumer',
      sharedPaths: {
        backend: ['backend/missing'],
      },
    });
    const baseCommit = initializeGitRepo(root);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.baseCommit = baseCommit;
    writeJson(manifestPath, manifest);

    const result = runScript(['--root', root, '--release-version', 'pantheon-base-v0.10.0'], repoRoot);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr || result.error?.message || '', /missing|cannot find/i);
  });
});
