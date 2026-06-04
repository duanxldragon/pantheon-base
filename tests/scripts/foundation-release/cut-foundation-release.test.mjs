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
    fs.mkdirSync(path.join(root, 'frontend', 'src', 'components'), { recursive: true });
    fs.writeFileSync(path.join(root, 'frontend', 'src', 'components', 'card.tsx'), 'export const Card = 1;\n', 'utf8');
    fs.mkdirSync(path.join(root, 'frontend', 'src', 'modules', 'system'), { recursive: true });
    fs.writeFileSync(path.join(root, 'frontend', 'src', 'modules', 'system', 'index.ts'), 'export const system = 1;\n', 'utf8');
    fs.mkdirSync(path.join(root, 'docs', 'designs'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'designs', 'FOUNDATION_RELEASE_MODEL.md'), '# Model\n', 'utf8');
    fs.writeFileSync(path.join(root, 'docs', 'designs', 'WORKFLOW.md'), '# Workflow\n', 'utf8');

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
        'shared foundation release',
        '--upgrade-notes',
        'upgrade ops carefully',
        '--consumer-impact',
        'ops should rerun inheritance checks',
      ],
      repoRoot,
    );

    assert.equal(result.status, 0, result.stderr || result.stdout || result.error?.message);
    assert.equal(fs.existsSync(path.join(root, 'releases', 'base-v0.8.0', 'manifest.json')), true);
    assert.equal(
      fs.existsSync(path.join(root, 'dist', 'foundation-releases', 'base-v0.8.0', 'bundle', 'manifest.paths.json')),
      true,
    );
  });
});
