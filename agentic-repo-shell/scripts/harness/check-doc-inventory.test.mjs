import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(TEST_DIR, 'check-doc-inventory.mjs');

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

test('repo-shell check-doc-inventory works on a simple inventory fixture', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-inventory-shell-'));
  writeFile(path.join(root, 'scripts', 'harness', 'check-example.mjs'), '#!/usr/bin/env node\n');
  writeFile(path.join(root, 'scripts', 'harness', 'README.md'), '### `check-example.mjs`\n');
  writeFile(path.join(root, 'agentic-repo-shell', 'scripts', 'harness', 'check-shell.mjs'), '#!/usr/bin/env node\n');
  writeFile(path.join(root, 'agentic-repo-shell', 'scripts', 'harness', 'README.md'), '### `check-shell.mjs`\n');
  writeFile(path.join(root, 'docs', 'README.md'), '# Docs\n');

  const output = execFileSync(process.execPath, [SCRIPT, '--json', '--root', root], { encoding: 'utf8' });
  const result = JSON.parse(output);

  assert.equal(result.findingCount, 0);
});
