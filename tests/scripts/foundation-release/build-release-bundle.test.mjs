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

test('build-release-bundle copies shared paths into dist/foundation-releases/<version>/bundle', () => {
  withTempDir((root) => {
    const releaseRoot = path.join(root, 'releases', 'base-v0.8.0');
    fs.mkdirSync(releaseRoot, { recursive: true });

    writeJson(path.join(releaseRoot, 'manifest.json'), {
      releaseVersion: 'base-v0.8.0',
      releaseLine: 'release/0.8',
      baseCommit: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      sourceRepo: 'pantheon-base',
      consumerMode: 'foundation-release-consumer',
      bundleExclusions: ['backend/cmd/server/uploads'],
      sharedPaths: {
        backend: ['backend/cmd'],
        frontend: ['frontend/src/core'],
        docs: ['docs/designs/FOUNDATION_RELEASE_MODEL.md'],
      },
    });
    writeJson(path.join(releaseRoot, 'verification-summary.json'), {
      releaseVersion: 'base-v0.8.0',
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
    fs.mkdirSync(path.join(root, 'docs', 'designs'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'designs', 'FOUNDATION_RELEASE_MODEL.md'), '# Model\n', 'utf8');

    const result = runScript(['--root', root, '--release-version', 'base-v0.8.0'], repoRoot);
    assert.equal(result.status, 0, result.stderr || result.stdout || result.error?.message);

    const bundleRoot = path.join(root, 'dist', 'foundation-releases', 'base-v0.8.0', 'bundle');
    assert.equal(fs.existsSync(path.join(bundleRoot, 'shared-backend', 'backend', 'cmd', 'server.go')), true);
    assert.equal(
      fs.existsSync(path.join(bundleRoot, 'shared-backend', 'backend', 'cmd', 'server', 'uploads', 'ignored.txt')),
      false,
    );
    assert.equal(fs.existsSync(path.join(bundleRoot, 'shared-frontend', 'frontend', 'src', 'core', 'app.ts')), true);
    assert.equal(fs.existsSync(path.join(bundleRoot, 'docs', 'docs', 'designs', 'FOUNDATION_RELEASE_MODEL.md')), true);
    assert.equal(fs.existsSync(path.join(bundleRoot, 'manifest.paths.json')), true);
    assert.equal(fs.existsSync(path.join(root, 'dist', 'foundation-releases', 'base-v0.8.0', 'go.mod')), true);
    assert.equal(
      fs.existsSync(path.join(root, 'dist', 'foundation-releases', 'base-v0.8.0', 'foundation-release-base-v0.8.0.tgz')),
      true,
    );
    assert.equal(
      fs.existsSync(path.join(root, 'dist', 'foundation-releases', 'base-v0.8.0', 'foundation-release-base-v0.8.0.tgz.sha256')),
      true,
    );
  });
});

test('build-release-bundle fails when a shared path is missing', () => {
  withTempDir((root) => {
    const releaseRoot = path.join(root, 'releases', 'base-v0.8.0');
    fs.mkdirSync(releaseRoot, { recursive: true });

    writeJson(path.join(releaseRoot, 'manifest.json'), {
      releaseVersion: 'base-v0.8.0',
      releaseLine: 'release/0.8',
      baseCommit: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      sourceRepo: 'pantheon-base',
      consumerMode: 'foundation-release-consumer',
      sharedPaths: {
        backend: ['backend/missing'],
      },
    });

    const result = runScript(['--root', root, '--release-version', 'base-v0.8.0'], repoRoot);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr || result.error?.message || '', /missing|cannot find/i);
  });
});
