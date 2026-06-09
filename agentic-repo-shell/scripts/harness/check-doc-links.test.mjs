import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(TEST_DIR, 'check-doc-links.mjs');

test('repo-shell check-doc-links works on a simple docs fixture', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-links-shell-'));
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', 'README.md'), '[Guide](./guide.md)');
  fs.writeFileSync(path.join(root, 'docs', 'guide.md'), '# Guide');
  const output = execFileSync(process.execPath, [SCRIPT, '--json', '--root', root], { encoding: 'utf8' });
  const result = JSON.parse(output);
  assert.equal(result.findingCount, 0);
});
