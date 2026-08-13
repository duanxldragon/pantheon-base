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
        'pantheon-base-v0.10.0',
        '--release-line',
        'release/0.10',
        '--base-commit',
        'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
        '--release-notes',
        'shared auth cleanup',
        '--upgrade-notes',
        'run inheritance checks',
        '--consumer-impact',
        'ops should review backend drift',
        '--required-check',
        'Release Gate Summary',
      ],
      repoRoot,
    );

    assert.equal(result.status, 0, result.stderr || result.stdout || result.error?.message);

    const releaseRoot = path.join(root, 'releases', 'pantheon-base-v0.10.0');
    const manifest = JSON.parse(fs.readFileSync(path.join(releaseRoot, 'manifest.json'), 'utf8'));

    assert.equal(manifest.releaseVersion, 'pantheon-base-v0.10.0');
    assert.equal(manifest.releaseLine, 'release/0.10');
    assert.equal(manifest.baseCommit, 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef');
    assert.equal(manifest.sourceRepo, 'pantheon-base');
    assert.equal(manifest.consumerMode, 'foundation-release-consumer');
    assert.deepEqual(manifest.releaseArtifact, {
      assetName: 'foundation-release-pantheon-base-v0.10.0.tgz',
    });
    assert.deepEqual(manifest.repoSnapshot, {
      assetName: 'repo.tar',
      generatedFrom: 'git-archive',
    });
    assert.deepEqual(manifest.sharedPaths.frontend, [
      'frontend/src/App.tsx',
      'frontend/src/main.tsx',
      'frontend/src/vite-env.d.ts',
      'frontend/src/api',
      'frontend/src/hooks',
      'frontend/src/components',
      'frontend/src/core',
      'frontend/src/store',
      'frontend/src/modules/auth',
      'frontend/src/modules/lowcode',
      'frontend/src/modules/platform',
      'frontend/src/modules/system',
      'frontend/src/index.css',
      'frontend/package.json',
      'frontend/playwright.api.config.ts',
      'frontend/playwright.config.ts',
      'frontend/playwright.full-system.config.ts',
      'frontend/playwright.auto-recycle.config.ts',
      'frontend/playwright.many-to-many.config.ts',
      'frontend/playwright.master-detail.config.ts',
      'frontend/scripts/cleanup-generated-modules.mjs',
      'frontend/scripts/cleanup-smoke-fixtures.mjs',
      'frontend/scripts/check-smoke-web-base.mjs',
      'frontend/scripts/database-import-qa-setup.mjs',
      'frontend/scripts/export-generated-module.mjs',
      'frontend/scripts/go-module.test.mjs',
      'frontend/scripts/lib/auth-cookie-session.mjs',
      'frontend/scripts/lib/cleanup-fixture-cache.mjs',
      'frontend/scripts/lib/cleanup-fixture-query-plan.mjs',
      'frontend/scripts/lib/cleanup-http.mjs',
      'frontend/scripts/lib/css-declarations.mjs',
      'frontend/scripts/many-to-many-qa-setup.mjs',
      'frontend/scripts/master-detail-qa-setup.mjs',
      'frontend/scripts/run-smoke-suite.mjs',
      'frontend/scripts/run-smoke-suite.test.mjs',
      'frontend/scripts/start-smoke-vite.mjs',
      'frontend/scripts/test-fixtures/bind-ready-server.mjs',
      'frontend/scripts/test-fixtures/fake-playwright-cli.mjs',
      'frontend/scripts/test-fixtures/record-cleanup.mjs',
      'frontend/scripts/transpile-typescript-files.mjs',
      'frontend/tests/fixtures/coverage.ts',
      'frontend/tests/smoke/business/generated',
      'frontend/tests/smoke/helpers',
      'frontend/tests/smoke/platform',
      'frontend/tests/smoke/system',
      'frontend/tests/smoke/README.md',
    ]);
    assert.deepEqual(manifest.verification.requiredChecks, [
      'CI Summary',
      'Quality Gates',
      'Security Gates',
      'Actionlint',
      'Full Smoke',
      'SonarCloud Code Analysis',
      'Release Gate Summary',
    ]);

    assert.match(fs.readFileSync(path.join(releaseRoot, 'release-notes.md'), 'utf8'), /shared auth cleanup/);
    assert.match(fs.readFileSync(path.join(releaseRoot, 'upgrade-notes.md'), 'utf8'), /run inheritance checks/);
    assert.match(
      fs.readFileSync(path.join(releaseRoot, 'consumer-impact.md'), 'utf8'),
      /ops should review backend drift/,
    );

    const verificationSummary = JSON.parse(
      fs.readFileSync(path.join(releaseRoot, 'verification-summary.json'), 'utf8'),
    );
    assert.equal(verificationSummary.releaseVersion, 'pantheon-base-v0.10.0');
    assert.deepEqual(
      verificationSummary.requiredChecks,
      manifest.verification.requiredChecks,
    );
  });
});

test('build-release-manifest fails when release version is missing', () => {
  withTempDir((root) => {
    const result = runScript(
      [
        '--root',
        root,
        '--release-line',
        'release/0.10',
        '--base-commit',
        'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      ],
      repoRoot,
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr || result.error?.message || '', /release-version|cannot find/i);
  });
});

test('build-release-manifest rejects legacy tag names and mismatched release lines', () => {
  withTempDir((root) => {
    const commonArgs = [
      '--root',
      root,
      '--base-commit',
      'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    ];
    const legacyResult = runScript([
      ...commonArgs,
      '--release-version',
      'base-v0.10.0',
      '--release-line',
      'release/0.10',
    ], repoRoot);
    assert.notEqual(legacyResult.status, 0);
    assert.match(legacyResult.stderr, /pantheon-base-vX\.Y\.Z/);

    const mismatchedLineResult = runScript([
      ...commonArgs,
      '--release-version',
      'pantheon-base-v0.10.0',
      '--release-line',
      'release/0.9',
    ], repoRoot);
    assert.notEqual(mismatchedLineResult.status, 0);
    assert.match(mismatchedLineResult.stderr, /release\/0\.10/);
  });
});

test('build-release-manifest help lists the supported release metadata flags', () => {
  const result = runScript(['--help'], repoRoot);

  assert.equal(result.status, 0, result.stderr || result.error?.message);
  assert.match(result.stdout, /--release-version <version>/);
  assert.match(result.stdout, /--release-line <line>/);
  assert.match(result.stdout, /--base-commit <sha>/);
  assert.match(result.stdout, /--consumer-impact <text>/);
  assert.match(result.stdout, /--required-check <name>/);
});
