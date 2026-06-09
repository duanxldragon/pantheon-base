import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(TEST_DIR, 'check-sync-drift.mjs');

test('repo-shell check-sync-drift handles a clean mirror fixture', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-drift-shell-'));
  fs.mkdirSync(path.join(root, 'scripts', 'harness'), { recursive: true });
  fs.mkdirSync(path.join(root, 'agentic-repo-shell', 'scripts', 'harness'), { recursive: true });
  fs.writeFileSync(path.join(root, 'scripts', 'harness', 'check-review.mjs'), '#!/usr/bin/env node\n');
  fs.writeFileSync(path.join(root, 'agentic-repo-shell', 'scripts', 'harness', 'check-review.mjs'), "export * from '../../../scripts/harness/check-review.mjs';\n");
  fs.writeFileSync(path.join(root, 'scripts', 'harness', 'check-template-health.mjs'), '#!/usr/bin/env node\n');
  fs.writeFileSync(path.join(root, 'agentic-repo-shell', 'scripts', 'harness', 'check-template-health.mjs'), "export * from '../../../scripts/harness/check-template-health.mjs';\n");
  fs.writeFileSync(path.join(root, 'scripts', 'harness', 'check-runtime-evidence.mjs'), '#!/usr/bin/env node\n');
  fs.writeFileSync(path.join(root, 'agentic-repo-shell', 'scripts', 'harness', 'check-runtime-evidence.mjs'), "export * from '../../../scripts/harness/check-runtime-evidence.mjs';\n");
  fs.writeFileSync(path.join(root, 'scripts', 'harness', 'check-doc-links.mjs'), '#!/usr/bin/env node\n');
  fs.writeFileSync(path.join(root, 'agentic-repo-shell', 'scripts', 'harness', 'check-doc-links.mjs'), "export * from '../../../scripts/harness/check-doc-links.mjs';\n");
  fs.writeFileSync(path.join(root, 'scripts', 'harness', 'check-doc-inventory.mjs'), '#!/usr/bin/env node\n');
  fs.writeFileSync(path.join(root, 'agentic-repo-shell', 'scripts', 'harness', 'check-doc-inventory.mjs'), "export * from '../../../scripts/harness/check-doc-inventory.mjs';\n");
  const output = execFileSync(process.execPath, [SCRIPT, '--json', '--root', root], { encoding: 'utf8' });
  const result = JSON.parse(output);
  assert.equal(result.findingCount, 0);
});
