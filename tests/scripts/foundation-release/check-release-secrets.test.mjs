import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFilePath), '..', '..', '..');
const scriptPath = path.join(repoRoot, 'scripts', 'foundation-release', 'check-release-secrets.mjs');
const moduleUrl = pathToFileURL(scriptPath).href;

const {
  CREDENTIAL_RULES,
  scanTextForCredentials,
  scanDirectoryForCredentials,
  assertBundleIsFreeOfCredentials,
  resolveBundleRoot,
  runCheckCli,
} = await import(moduleUrl);

// The shape v0.17.0 shipped inside an archived evidence file: a 48-character
// hexadecimal password passed to `mysql -p` and embedded in a DSN. The value
// here is synthetic on purpose — copying the real one into a test fixture would
// be the same leak in a new place. What is asserted is the shape, which is what
// the rules match.
const LEAKED_SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef';
const LEAKED_COMMAND = `mysql -uroot -p${LEAKED_SECRET} pantheon_base`;
const LEAKED_DSN = `root:${LEAKED_SECRET}@tcp(127.0.0.1:3306)/pantheon_base?charset=utf8mb4`;

function withTempDir(callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pantheon-release-secrets-'));
  try {
    return callback(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function writeFile(root, relativePath, content) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, 'utf8');
}

test('the rule set stays small enough to stay honest', () => {
  // A broad rule set (any `password = ...` assignment) reported 42 findings on
  // the real v0.17.1 bundle, all false positives: test fixtures, Go struct
  // literals and i18n copy. A gate that noisy gets bypassed, so the rules are
  // deliberately limited to credentials inside a command line or a connection
  // string.
  assert.deepEqual(
    CREDENTIAL_RULES.map((rule) => rule.id).sort(),
    ['mysql-dsn-password', 'shell-password-flag', 'url-credentials'],
  );
});

test('catches the command line shape that actually leaked', () => {
  const findings = scanTextForCredentials(LEAKED_COMMAND, 'commands.json');

  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, 'shell-password-flag');
  assert.equal(findings[0].file, 'commands.json');
  assert.equal(findings[0].line, 1);
});

test('catches the DSN shape that actually leaked', () => {
  const findings = scanTextForCredentials(LEAKED_DSN, 'env.sh');

  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, 'mysql-dsn-password');
});

test('never reprints the secret it found', () => {
  // The report is written to CI logs, so echoing the credential would move the
  // leak rather than close it.
  const findings = scanTextForCredentials(LEAKED_COMMAND, 'commands.json');

  assert.equal(findings.length, 1);
  assert.ok(!findings[0].context.includes(LEAKED_SECRET), `context leaked the secret: ${findings[0].context}`);
  assert.ok(!findings[0].masked.includes(LEAKED_SECRET), `masked value leaked the secret: ${findings[0].masked}`);
  assert.ok(findings[0].context.includes('mysql -uroot -p'), 'the context must still be recognizable');
});

test('reports the line number inside a larger file', () => {
  const text = ['{', '  "commands": [', `    {"command": "${LEAKED_COMMAND}"}`, '  ]', '}'].join('\n');
  const findings = scanTextForCredentials(text, 'summary.json');

  assert.equal(findings.length, 1);
  assert.equal(findings[0].line, 3);
});

test('ignores the placeholders and examples a release legitimately ships', () => {
  const allowed = [
    'PANTHEON_DSN=root:changeme-in-production-please@tcp(mysql:3306)/pantheon_base',
    '// golang-migrate expects: mysql://user:password@tcp(host:port)/dbname?params',
    'namespace := ConnectionCacheNamespace("root:super_secret@tcp(127.0.0.1:3306)/pantheon")',
    'PANTHEON_TEST_REDIS_PASSWORD="<redacted>"',
    'export PANTHEON_DSN="root:${DB_PASSWORD}@tcp(127.0.0.1:3306)/pantheon_base"',
    'mysql -h127.0.0.1 -uroot -p3306',
    'mysql -uroot -p pantheon_base',
  ];

  for (const line of allowed) {
    const findings = scanTextForCredentials(line, 'allowed.txt');
    assert.deepEqual(findings, [], `must not report: ${line}`);
  }
});

test('walks a directory and skips generated trees', () => {
  withTempDir((root) => {
    writeFile(root, 'bundle/.harness/evidence/commands.json', LEAKED_COMMAND);
    writeFile(root, 'bundle/node_modules/pkg/index.js', LEAKED_COMMAND);
    writeFile(root, 'bundle/docs/clean.md', '# nothing to see\n');

    const result = scanDirectoryForCredentials(path.join(root, 'bundle'));

    assert.equal(result.ok, false);
    assert.equal(result.findings.length, 1, JSON.stringify(result.findings));
    assert.equal(result.findings[0].file, '.harness/evidence/commands.json');
    // node_modules is skipped, so the file count is the two non-generated files.
    assert.equal(result.scanned, 2);
  });
});

test('refuses a bundle that carries a credential and passes a clean one', () => {
  withTempDir((root) => {
    const releaseVersion = 'pantheon-base-v0.17.2';
    const bundleRoot = resolveBundleRoot(root, releaseVersion);
    writeFile(bundleRoot, 'shared-backend/.env.example', 'PANTHEON_DSN=root:changeme-in-production-please@tcp(mysql:3306)/db\n');

    const clean = assertBundleIsFreeOfCredentials({ root, releaseVersion });
    assert.equal(clean.ok, true);

    writeFile(bundleRoot, 'shared-backend/.harness/archive/commands.json', LEAKED_COMMAND);

    assert.throws(
      () => assertBundleIsFreeOfCredentials({ root, releaseVersion }),
      (error) => {
        assert.match(error.message, /cannot be recalled/);
        assert.match(error.message, /\.harness\/archive\/commands\.json/);
        assert.ok(!error.message.includes(LEAKED_SECRET), 'the refusal must not reprint the secret');
        return true;
      },
    );
  });
});

test('the CLI exits non-zero on a finding and zero on a clean tree', () => {
  withTempDir((root) => {
    writeFile(root, 'clean.txt', 'nothing here\n');
    assert.equal(runCheckCli(['--path', root]), 0);

    writeFile(root, 'leak.txt', LEAKED_COMMAND);
    assert.equal(runCheckCli(['--path', root]), 1);
  });
});

test('the CLI rejects a missing target instead of scanning nothing', () => {
  // Scanning nothing and reporting success is how a gate silently disappears.
  assert.equal(runCheckCli([]), 2);
  assert.equal(runCheckCli(['--path', path.join(os.tmpdir(), 'definitely-not-here-pantheon')]), 2);
});
