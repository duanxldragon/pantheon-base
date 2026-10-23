import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

// A release bundle is immutable once published. v0.17.0 shipped a development
// MySQL password inside an archived evidence file (`.harness/archive/2026-09/
// evidence/.../commands.json`, a `mysql -uroot -p<hex>` command). It could not
// be recalled: the asset had been downloaded and the credential lives in the
// tag's history forever. The password was rotated, which is the only remedy
// available after the fact.
//
// Secret scanning already runs on every commit (`.github/workflows/security.yml`
// -> gitleaks), and it did not catch this one: gitleaks has no rule for a bare
// password embedded in a shell command or a DSN, only for recognizable token
// prefixes. Scanning the git tree also says nothing about what the *bundle*
// contains, and the bundle is what consumers materialize.
//
// This check closes that gap at the only point where it is still cheap: before
// the tag is created. It is deliberately narrow - a handful of high-signal
// credential shapes rather than an entropy heuristic - because a false positive
// blocks a release and teaches the maintainer to bypass the gate.

const SCAN_SKIP_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'dist',
  'coverage',
  'test-results',
  'playwright-report',
  '.vite',
  '.cache',
]);

const SCAN_SKIP_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.bmp', '.svg',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.pdf', '.zip', '.gz', '.tgz', '.tar', '.br', '.7z',
  '.mp3', '.mp4', '.webm', '.wav',
  '.wasm', '.so', '.dll', '.exe', '.class', '.jar', '.bin',
]);

const MAX_SCANNED_FILE_BYTES = 2 * 1024 * 1024;

// A value that is obviously a placeholder must not block a release. Everything
// here is something a documentation, example or template file legitimately
// contains - `.env.example` ships `changeme...` on purpose.
const PLACEHOLDER_PATTERN =
  /^(?:<[^>]*>|\$\{[^}]*\}|\$\([^)]*\)|\{\{[^}]*\}\}|redacted|changeme|change-me|placeholder|example|dummy|sample|your[-_]?[a-z]*|x{4,}|\*{3,}|\.{3,}|-+|null|none|empty)$/i;

const PLACEHOLDER_SUBSTRINGS = ['changeme', 'change-me', 'placeholder', 'your-password', 'your_password'];

export const CREDENTIAL_RULES = [
  {
    id: 'mysql-dsn-password',
    description: 'password embedded in a MySQL DSN (user:password@tcp(...))',
    // `/` is excluded from the value so a URL-shaped example
    // (`mysql://user:password@tcp(...)`) cannot be read as `mysql:` plus the
    // value `//user:password`.
    pattern: /\b[A-Za-z0-9_.-]+:([^@\s"'`/]{12,})@tcp\(/g,
    secretGroup: 1,
  },
  {
    id: 'url-credentials',
    description: 'password embedded in a URL (scheme://user:password@host)',
    pattern: /\b[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:([^/\s@"'`]{8,})@/g,
    secretGroup: 1,
  },
  {
    id: 'shell-password-flag',
    description: 'password passed on a command line (-p<long value>)',
    // The lower bound is what keeps `-p3306` and `-p80` out of the results.
    pattern: /(?:^|[\s"'])-p([0-9A-Fa-f]{16,})(?=[\s"'`]|$)/gm,
    secretGroup: 1,
  },
];

function isPlaceholder(value) {
  if (value === undefined || value === null) {
    return true;
  }
  const trimmed = String(value).trim();
  if (trimmed === '') {
    return true;
  }
  if (PLACEHOLDER_PATTERN.test(trimmed)) {
    return true;
  }
  const lowered = trimmed.toLowerCase();
  if (PLACEHOLDER_SUBSTRINGS.some((needle) => lowered.includes(needle))) {
    return true;
  }
  // Template interpolation, and values made of one repeated character, are
  // never real credentials.
  if (trimmed.includes('$')) {
    return true;
  }
  if (new Set(trimmed).size === 1) {
    return true;
  }
  // A value built only from lowercase letters, underscores and dashes is a
  // word, not a secret. This is what separates a documentation example
  // (`mysql://user:password@tcp(...)`) and a test fixture
  // (`root:super_secret@tcp(...)`) from a real credential, which is
  // hexadecimal, base64 or mixed case. The trade-off is explicit: an all
  // lowercase passphrase of 12+ characters is not reported.
  return /^[a-z][a-z_-]*$/.test(trimmed);
}

// mask keeps the finding readable without reprinting the secret in CI logs,
// which would defeat the purpose of the check.
function mask(value) {
  if (value.length <= 4) {
    return '*'.repeat(value.length);
  }
  return `${value.slice(0, 2)}${'*'.repeat(Math.max(4, value.length - 4))}${value.slice(-2)}`;
}

/**
 * Scan one text blob for credential shapes.
 * Returns findings with the rule id, the masked value and the 1-based line.
 */
export function scanTextForCredentials(text, filePath = '<memory>') {
  const findings = [];
  if (typeof text !== 'string' || text === '') {
    return findings;
  }
  const lines = text.split(/\r?\n/);

  for (const rule of CREDENTIAL_RULES) {
    rule.pattern.lastIndex = 0;
    let match = rule.pattern.exec(text);
    while (match !== null) {
      const secret = match[rule.secretGroup];
      if (!isPlaceholder(secret)) {
        const line = text.slice(0, match.index).split(/\r?\n/).length;
        findings.push({
          rule: rule.id,
          description: rule.description,
          file: filePath,
          line,
          // Report the surrounding line so the maintainer can find it, but
          // never the secret itself.
          context: lines[line - 1] === undefined ? '' : maskSecretInLine(lines[line - 1], secret),
          masked: mask(secret),
        });
      }
      match = rule.pattern.exec(text);
    }
  }
  return findings;
}

function maskSecretInLine(line, secret) {
  const trimmed = line.trim();
  const maskedLine = trimmed.split(secret).join(mask(secret));
  return maskedLine.length > 200 ? `${maskedLine.slice(0, 200)}...` : maskedLine;
}

function shouldScanFile(absolutePath) {
  const extension = path.extname(absolutePath).toLowerCase();
  if (SCAN_SKIP_EXTENSIONS.has(extension)) {
    return false;
  }
  try {
    const stats = fs.statSync(absolutePath);
    return stats.isFile() && stats.size <= MAX_SCANNED_FILE_BYTES;
  } catch {
    return false;
  }
}

function collectFiles(root, files) {
  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (SCAN_SKIP_DIRECTORIES.has(entry.name)) {
        continue;
      }
      collectFiles(absolutePath, files);
      continue;
    }
    if (entry.isFile() && shouldScanFile(absolutePath)) {
      files.push(absolutePath);
    }
  }
}

/**
 * Scan every text file under `root`. Binary and generated directories are
 * skipped; the caller decides what to do with the findings.
 */
export function scanDirectoryForCredentials(root) {
  const resolvedRoot = path.resolve(root);
  if (!fs.existsSync(resolvedRoot)) {
    return { ok: false, scanned: 0, findings: [], error: `directory does not exist: ${resolvedRoot}` };
  }

  const files = [];
  collectFiles(resolvedRoot, files);

  const findings = [];
  for (const absolutePath of files) {
    let text;
    try {
      text = fs.readFileSync(absolutePath, 'utf8');
    } catch {
      continue;
    }
    const relative = path.relative(resolvedRoot, absolutePath).replaceAll(path.sep, '/');
    findings.push(...scanTextForCredentials(text, relative));
  }

  return { ok: findings.length === 0, scanned: files.length, findings };
}

/**
 * The bundle staging tree the release pipeline tars up. It exists on disk
 * between createReleaseBundle() and createArchive(), which is where the publish
 * flow calls this.
 */
export function resolveBundleRoot(root, releaseVersion) {
  return path.join(path.resolve(root), 'dist', 'foundation-releases', releaseVersion, 'bundle');
}

export function formatCredentialFindings(findings) {
  return findings
    .map((finding) => `  ${finding.file}:${finding.line} [${finding.rule}] ${finding.context}`)
    .join('\n');
}

/**
 * Hard precondition for publishing: a bundle that carries a credential must not
 * be tagged, because the tag cannot be taken back.
 */
export function assertBundleIsFreeOfCredentials({ root, releaseVersion }) {
  const bundleRoot = resolveBundleRoot(root, releaseVersion);
  const result = scanDirectoryForCredentials(bundleRoot);
  if (result.error) {
    throw new Error(`release secret scan could not run: ${result.error}`);
  }
  if (!result.ok) {
    throw new Error(
      `release bundle ${releaseVersion} contains ${result.findings.length} credential-shaped string(s); ` +
        'a published asset cannot be recalled, so the release is refused:\n' +
        formatCredentialFindings(result.findings),
    );
  }
  return result;
}

function parseArgs(argv) {
  const options = { root: process.cwd(), releaseVersion: null, target: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') {
      options.root = argv[index + 1];
      index += 1;
    } else if (arg === '--release-version') {
      options.releaseVersion = argv[index + 1];
      index += 1;
    } else if (arg === '--path') {
      options.target = argv[index + 1];
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return options;
}

const USAGE = `Usage:
  node scripts/foundation-release/check-release-secrets.mjs --path <directory>
  node scripts/foundation-release/check-release-secrets.mjs --release-version <version> [--root <repo>]

Scans a directory (or a release bundle's staging tree) for credential shapes
that must never reach a published asset. Exits 1 on any finding.
`;

export function runCheckCli(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(USAGE);
    return 0;
  }

  const target = options.target ?? (options.releaseVersion ? resolveBundleRoot(options.root, options.releaseVersion) : null);
  if (!target) {
    process.stderr.write(`${USAGE}\nEither --path or --release-version is required.\n`);
    return 2;
  }

  const result = scanDirectoryForCredentials(target);
  if (result.error) {
    process.stderr.write(`release secret scan could not run: ${result.error}\n`);
    return 2;
  }
  if (!result.ok) {
    process.stderr.write(
      `release secret scan found ${result.findings.length} credential-shaped string(s) in ${result.scanned} file(s):\n`,
    );
    process.stderr.write(`${formatCredentialFindings(result.findings)}\n`);
    return 1;
  }
  process.stdout.write(`release secret scan: clean (${result.scanned} file(s) scanned)\n`);
  return 0;
}

const invokedDirectly =
  process.argv[1] !== undefined && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (invokedDirectly) {
  try {
    process.exitCode = runCheckCli();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
