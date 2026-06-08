import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(TEST_DIR, 'check-runtime-evidence.mjs');

test('repo-shell check-runtime-evidence handles empty fixtures', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'runtime-evidence-shell-'));
  const output = execFileSync(process.execPath, [SCRIPT, '--json', '--root', root], { encoding: 'utf8' });
  const result = JSON.parse(output);
  assert.equal(result.errorCount, 0);
});
