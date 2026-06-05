import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const currentFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFilePath), '..', '..', '..');
const scriptPath = path.join(repoRoot, 'scripts', 'foundation-release', 'resolve-sonar-project-version.mjs');

function withTempDir(callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pantheon-sonar-version-'));
  try {
    callback(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function runScript(args, cwd, env = process.env) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd,
    env,
    encoding: 'utf8',
  });
}

test('resolve-sonar-project-version prefers the latest release manifest version', () => {
  withTempDir((root) => {
    fs.mkdirSync(path.join(root, 'releases', 'base-v0.8.1'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'releases', 'base-v0.8.1', 'manifest.json'),
      `${JSON.stringify({ releaseVersion: 'base-v0.8.1' }, null, 2)}\n`,
      'utf8',
    );

    const result = runScript([], root);
    assert.equal(result.status, 0, result.stderr || result.stdout || result.error?.message);
    assert.equal(result.stdout.trim(), 'base-v0.8.1');
  });
});

test('resolve-sonar-project-version picks the highest release manifest version', () => {
  withTempDir((root) => {
    fs.mkdirSync(path.join(root, 'releases', 'base-v0.8.1'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'releases', 'base-v0.8.1', 'manifest.json'),
      `${JSON.stringify({ releaseVersion: 'base-v0.8.1' }, null, 2)}\n`,
      'utf8',
    );
    fs.mkdirSync(path.join(root, 'releases', 'base-v0.8.2'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'releases', 'base-v0.8.2', 'manifest.json'),
      `${JSON.stringify({ releaseVersion: 'base-v0.8.2' }, null, 2)}\n`,
      'utf8',
    );

    const result = runScript([], root);
    assert.equal(result.status, 0, result.stderr || result.stdout || result.error?.message);
    assert.equal(result.stdout.trim(), 'base-v0.8.2');
  });
});

test('resolve-sonar-project-version falls back to the default version when no release metadata exists', () => {
  withTempDir((root) => {
    const result = runScript(['--default', 'base-v0.8.2'], root);
    assert.equal(result.status, 0, result.stderr || result.stdout || result.error?.message);
    assert.equal(result.stdout.trim(), 'base-v0.8.2');
  });
});

test('resolve-sonar-project-version allows an explicit environment override', () => {
  withTempDir((root) => {
    const result = runScript([], root, {
      ...process.env,
      PANTHEON_SONAR_PROJECT_VERSION: 'base-v9.9.9',
    });
    assert.equal(result.status, 0, result.stderr || result.stdout || result.error?.message);
    assert.equal(result.stdout.trim(), 'base-v9.9.9');
  });
});
