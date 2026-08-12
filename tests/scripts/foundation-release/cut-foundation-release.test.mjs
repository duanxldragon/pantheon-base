import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const currentFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFilePath), '..', '..', '..');
const scriptPath = path.join(repoRoot, 'scripts', 'foundation-release', 'cut-foundation-release.mjs');

function withTempDir(callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pantheon-foundation-cut-'));
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

test('cut-foundation-release creates both release metadata and dist bundle outputs', () => {
  withTempDir((root) => {
    fs.mkdirSync(path.join(root, 'backend', 'cmd'), { recursive: true });
    fs.writeFileSync(path.join(root, 'backend', 'cmd', 'server.go'), 'package main\n', 'utf8');
    fs.mkdirSync(path.join(root, 'backend', 'internal'), { recursive: true });
    fs.writeFileSync(path.join(root, 'backend', 'internal', 'app.go'), 'package internal\n', 'utf8');
    fs.mkdirSync(path.join(root, 'backend', 'modules'), { recursive: true });
    fs.writeFileSync(path.join(root, 'backend', 'modules', 'module.go'), 'package modules\n', 'utf8');
    fs.mkdirSync(path.join(root, 'backend', 'pkg'), { recursive: true });
    fs.writeFileSync(path.join(root, 'backend', 'pkg', 'pkg.go'), 'package pkg\n', 'utf8');
    fs.mkdirSync(path.join(root, 'frontend', 'src', 'core'), { recursive: true });
    fs.writeFileSync(path.join(root, 'frontend', 'src', 'core', 'app.ts'), 'export const app = 1;\n', 'utf8');
    fs.mkdirSync(path.join(root, 'frontend', 'src', 'api'), { recursive: true });
    fs.writeFileSync(path.join(root, 'frontend', 'src', 'App.tsx'), 'export const App = 1;\n', 'utf8');
    fs.writeFileSync(path.join(root, 'frontend', 'src', 'main.tsx'), 'export const main = 1;\n', 'utf8');
    fs.writeFileSync(path.join(root, 'frontend', 'src', 'vite-env.d.ts'), '/// <reference types="vite/client" />\n', 'utf8');
    fs.writeFileSync(path.join(root, 'frontend', 'src', 'api', 'request.ts'), 'export const request = 1;\n', 'utf8');
    fs.writeFileSync(path.join(root, 'frontend', 'src', 'api', 'file.ts'), 'export const file = 1;\n', 'utf8');
    fs.writeFileSync(path.join(root, 'frontend', 'src', 'api', 'requestErrorUtils.ts'), 'export const errors = 1;\n', 'utf8');
    fs.mkdirSync(path.join(root, 'frontend', 'src', 'hooks'), { recursive: true });
    fs.writeFileSync(path.join(root, 'frontend', 'src', 'hooks', 'usePermission.ts'), 'export const usePermission = 1;\n', 'utf8');
    fs.mkdirSync(path.join(root, 'frontend', 'src', 'components'), { recursive: true });
    fs.writeFileSync(path.join(root, 'frontend', 'src', 'components', 'card.tsx'), 'export const Card = 1;\n', 'utf8');
    fs.mkdirSync(path.join(root, 'frontend', 'src', 'store'), { recursive: true });
    fs.writeFileSync(path.join(root, 'frontend', 'src', 'store', 'useAuthStore.ts'), 'export const store = 1;\n', 'utf8');
    fs.mkdirSync(path.join(root, 'frontend', 'src', 'modules', 'auth'), { recursive: true });
    fs.writeFileSync(path.join(root, 'frontend', 'src', 'modules', 'auth', 'Login.tsx'), 'export const Login = 1;\n', 'utf8');
    fs.mkdirSync(path.join(root, 'frontend', 'src', 'modules', 'lowcode'), { recursive: true });
    fs.writeFileSync(path.join(root, 'frontend', 'src', 'modules', 'lowcode', 'index.ts'), 'export const lowcode = 1;\n', 'utf8');
    fs.mkdirSync(path.join(root, 'frontend', 'src', 'modules', 'platform'), { recursive: true });
    fs.writeFileSync(path.join(root, 'frontend', 'src', 'modules', 'platform', 'index.ts'), 'export const platform = 1;\n', 'utf8');
    fs.mkdirSync(path.join(root, 'frontend', 'src', 'modules', 'system'), { recursive: true });
    fs.writeFileSync(path.join(root, 'frontend', 'src', 'modules', 'system', 'index.ts'), 'export const system = 1;\n', 'utf8');
    fs.writeFileSync(path.join(root, 'frontend', 'src', 'index.css'), 'body { margin: 0; }\n', 'utf8');
    fs.mkdirSync(path.join(root, 'frontend', 'scripts', 'lib'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'frontend', 'scripts', 'export-generated-module.mjs'),
      'export const exporter = true;\n',
      'utf8',
    );
    fs.writeFileSync(
      path.join(root, 'frontend', 'scripts', 'lib', 'css-declarations.mjs'),
      'export const shared = true;\n',
      'utf8',
    );
    fs.writeFileSync(
      path.join(root, 'frontend', 'scripts', 'transpile-typescript-files.mjs'),
      'export const transpiler = true;\n',
      'utf8',
    );
    const sharedSmokeFiles = [
      'frontend/playwright.api.config.ts',
      'frontend/playwright.config.ts',
      'frontend/playwright.full-system.config.ts',
      'frontend/playwright.auto-recycle.config.ts',
      'frontend/playwright.many-to-many.config.ts',
      'frontend/playwright.master-detail.config.ts',
      'frontend/scripts/cleanup-generated-modules.mjs',
      'frontend/scripts/cleanup-smoke-fixtures.mjs',
      'frontend/scripts/database-import-qa-setup.mjs',
      'frontend/scripts/lib/auth-cookie-session.mjs',
      'frontend/scripts/lib/cleanup-fixture-cache.mjs',
      'frontend/scripts/lib/cleanup-fixture-query-plan.mjs',
      'frontend/scripts/lib/cleanup-http.mjs',
      'frontend/scripts/many-to-many-qa-setup.mjs',
      'frontend/scripts/master-detail-qa-setup.mjs',
      'frontend/scripts/run-smoke-suite.mjs',
      'frontend/scripts/run-smoke-suite.test.mjs',
      'frontend/scripts/start-smoke-vite.mjs',
      'frontend/scripts/test-fixtures/bind-ready-server.mjs',
      'frontend/scripts/test-fixtures/fake-playwright-cli.mjs',
      'frontend/scripts/test-fixtures/record-cleanup.mjs',
      'frontend/tests/fixtures/coverage.ts',
      'frontend/tests/smoke/helpers/auth.ts',
      'frontend/tests/smoke/helpers/fixture-policy.ts',
      'frontend/tests/smoke/helpers/shared-read-cache.ts',
      'frontend/tests/smoke/helpers/url-pattern.ts',
      'frontend/tests/smoke/business/generated/module-auto-recycle-real.spec.ts',
      'frontend/tests/smoke/business/generated/module-governance-host-real.spec.ts',
      'frontend/tests/smoke/business/generated/module-governance-real.spec.ts',
      'frontend/tests/smoke/business/generated/module-many-to-many-real.spec.ts',
      'frontend/tests/smoke/business/generated/module-master-detail-real.spec.ts',
      'frontend/tests/smoke/platform/shell-visual-contract.spec.ts',
      'frontend/tests/smoke/system/system-pages.spec.ts',
      'frontend/tests/smoke/system/system-workspace-task-depth.ts',
    ];
    for (const relativePath of sharedSmokeFiles) {
      const filePath = path.join(root, relativePath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, `export const fixture = '${relativePath}';\n`, 'utf8');
    }
    fs.mkdirSync(path.join(root, 'docs', 'designs'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'designs', 'FOUNDATION_RELEASE_MODEL.md'), '# Model\n', 'utf8');
    fs.writeFileSync(path.join(root, 'docs', 'designs', 'WORKFLOW.md'), '# Workflow\n', 'utf8');

    const baseCommit = initializeGitRepo(root);
    const result = runScript(
      [
        '--root',
        root,
        '--release-version',
        'pantheon-base-v0.10.0',
        '--release-line',
        'release/0.10',
        '--base-commit',
        baseCommit,
        '--release-notes',
        'shared foundation release',
        '--upgrade-notes',
        'upgrade ops carefully',
        '--consumer-impact',
        'ops should rerun inheritance checks',
        '--required-check',
        'Release Gate Summary',
      ],
      repoRoot,
    );

    assert.equal(result.status, 0, result.stderr || result.stdout || result.error?.message);
    assert.equal(fs.existsSync(path.join(root, 'releases', 'pantheon-base-v0.10.0', 'manifest.json')), true);
    assert.equal(
      fs.existsSync(path.join(root, 'dist', 'foundation-releases', 'pantheon-base-v0.10.0', 'bundle', 'manifest.paths.json')),
      true,
    );
    assert.equal(
      fs.existsSync(
        path.join(
          root,
          'dist',
          'foundation-releases',
          'pantheon-base-v0.10.0',
          'bundle',
          'shared-frontend',
          'frontend',
          'src',
          'store',
          'useAuthStore.ts',
        ),
      ),
      true,
    );
    for (const relativePath of [
      'frontend/scripts/run-smoke-suite.test.mjs',
      'frontend/scripts/master-detail-qa-setup.mjs',
      'frontend/scripts/test-fixtures/bind-ready-server.mjs',
      'frontend/scripts/test-fixtures/fake-playwright-cli.mjs',
      'frontend/scripts/test-fixtures/record-cleanup.mjs',
    ]) {
      assert.equal(
        fs.existsSync(
          path.join(
            root,
            'dist',
            'foundation-releases',
            'pantheon-base-v0.10.0',
            'bundle',
            'shared-frontend',
            relativePath,
          ),
        ),
        true,
        `${relativePath} must be included in the shared frontend bundle`,
      );
    }
    assert.equal(
      fs.existsSync(
        path.join(
          root,
          'dist',
          'foundation-releases',
          'pantheon-base-v0.10.0',
          'bundle',
          'shared-frontend',
          'frontend',
          'tests',
          'smoke',
          'business',
          'generated',
          'module-master-detail-real.spec.ts',
        ),
      ),
      true,
    );
    assert.equal(
      fs.existsSync(
        path.join(
          root,
          'dist',
          'foundation-releases',
          'pantheon-base-v0.10.0',
          'bundle',
          'shared-frontend',
          'frontend',
          'tests',
          'smoke',
          'system',
          'system-pages.spec.ts',
        ),
      ),
      true,
    );
    assert.equal(
      fs.existsSync(
        path.join(
          root,
          'dist',
          'foundation-releases',
          'pantheon-base-v0.10.0',
          'bundle',
          'shared-frontend',
          'frontend',
          'scripts',
          'export-generated-module.mjs',
        ),
      ),
      true,
    );
    assert.equal(
      fs.existsSync(
        path.join(
          root,
          'dist',
          'foundation-releases',
          'pantheon-base-v0.10.0',
          'bundle',
          'shared-frontend',
          'frontend',
          'scripts',
          'transpile-typescript-files.mjs',
        ),
      ),
      true,
    );
    assert.equal(
      fs.existsSync(
        path.join(
          root,
          'dist',
          'foundation-releases',
          'pantheon-base-v0.10.0',
          'bundle',
          'shared-frontend',
          'frontend',
          'scripts',
          'lib',
          'css-declarations.mjs',
        ),
      ),
      true,
    );
  });
});

test('cut-foundation-release help lists the supported release metadata flags', () => {
  const result = runScript(['--help'], repoRoot);

  assert.equal(result.status, 0, result.stderr || result.error?.message);
  assert.match(result.stdout, /--release-version <version>/);
  assert.match(result.stdout, /--release-line <line>/);
  assert.match(result.stdout, /--base-commit <sha>/);
  assert.match(result.stdout, /--consumer-impact <text>/);
  assert.match(result.stdout, /--required-check <name>/);
});
