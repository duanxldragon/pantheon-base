import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const source = fs.readFileSync(path.resolve('.github/workflows/quality.yml'), 'utf8');
const section = source.slice(source.indexOf('  docs-governance:'), source.indexOf('  frontend-contract:'));
const resolver = section.match(/node --input-type=module <<'NODE'\r?\n([\s\S]*?)\r?\n\s*NODE/)[1];

test('method commit resolver accepts a full immutable pin and rejects missing/malicious pins', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'method-ci-pin-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, '.harness'));
  const output = path.join(root, 'github-output');
  const run = (sourceCommit) => {
    fs.writeFileSync(output, '');
    fs.writeFileSync(path.join(root, '.harness/method-consumption.json'), JSON.stringify({ sourceCommit }));
    return spawnSync(process.execPath, ['--input-type=module'], {
      input: resolver, cwd: root, encoding: 'utf8', windowsHide: true,
      env: { ...process.env, GITHUB_OUTPUT: output },
    });
  };
  assert.equal(run('a'.repeat(40)).status, 0);
  assert.equal(fs.readFileSync(output, 'utf8'), `commit=${'a'.repeat(40)}\n`);
  for (const pin of [undefined, 'main', '123abc', 'a'.repeat(40) + '\ncommit=main']) {
    const result = run(pin);
    assert.notEqual(result.status, 0);
    assert.equal(fs.readFileSync(output, 'utf8'), '');
  }
});

test('consumer/Harness sibling layout pins checkout and invokes read-only consumption', () => {
  assert.match(section, /working-directory:\s*pantheon-base/);
  assert.match(section, /path:\s*pantheon-base/);
  assert.match(section, /repository:\s*duanxldragon\/pantheon-harness/);
  assert.match(section, /ref:\s*\$\{\{ steps\.method-source\.outputs\.commit \}\}/);
  const verify = section.match(/- name: Verify method consumption\s*\n\s*run:\s*([^\n]+)/)[1];
  assert.match(verify, /--root \. --source \.\.\/pantheon-harness/);
  assert.doesNotMatch(verify, /--update/);
  assert.ok(section.indexOf('Resolve method source commit') < section.indexOf('Checkout pinned Pantheon Harness'));
  assert.ok(section.indexOf('Checkout pinned Pantheon Harness') < section.indexOf('Verify method consumption'));
});
