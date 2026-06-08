#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_ROOT = process.cwd();
const REPOSITORIES = ['pantheon-base', 'pantheon-ops'];
const BUSINESS_REPOSITORIES = new Set(['pantheon-ops']);

const GO_FORBIDDEN_IMPORT_PATTERNS = [
  {
    pattern: /\/backend\/internal\//,
    reason: 'business backend must not import backend/internal directly',
  },
  {
    pattern: /\/backend\/modules\/system\//,
    reason: 'business backend must not import system module internals directly',
  },
  {
    pattern: /\/backend\/modules\/auth\//,
    reason: 'business backend must not import auth module internals directly',
  },
  {
    pattern: /\/backend\/modules\/dashboard\//,
    reason: 'business backend must not import dashboard module internals directly',
  },
  {
    pattern: /\/backend\/modules\/platform\//,
    reason: 'business backend must not import platform module internals directly',
  },
];

const TS_FORBIDDEN_IMPORT_PATTERNS = [
  {
    pattern: /(?:^|\/)modules\/system(?:\/|$)/,
    reason: 'business frontend must not import system module internals directly',
  },
  {
    pattern: /(?:^|\/)modules\/auth(?:\/|$)/,
    reason: 'business frontend must not import auth module internals directly',
  },
  {
    pattern: /(?:^|\/)modules\/platform(?:\/|$)/,
    reason: 'business frontend must not import platform module internals directly',
  },
  {
    pattern: /(?:^|\/)\.\.\/system(?:\/|$)/,
    reason: 'business frontend must not reach into sibling system modules',
  },
  {
    pattern: /(?:^|\/)\.\.\/auth(?:\/|$)/,
    reason: 'business frontend must not reach into sibling auth modules',
  },
  {
    pattern: /(?:^|\/)\.\.\/platform(?:\/|$)/,
    reason: 'business frontend must not reach into sibling platform modules',
  },
];

function printHelp() {
  console.log(`Usage:
  node scripts/harness/check-boundaries.mjs [--json] [--strict] [--root <path>]

Default behavior:
  Report findings and exit 0. Use --strict to exit 1 when findings exist.

Examples:
  node scripts/harness/check-boundaries.mjs
  node scripts/harness/check-boundaries.mjs --json
  node scripts/harness/check-boundaries.mjs --strict
  node scripts/harness/check-boundaries.mjs --root /tmp/fixture`);
}

function parseArgs(argv) {
  const options = {
    json: false,
    strict: false,
    help: false,
    root: DEFAULT_ROOT,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--json') {
      options.json = true;
    } else if (arg === '--strict') {
      options.strict = true;
    } else if (arg === '--root') {
      const value = argv[++i];
      if (!value) {
        throw new Error('--root requires a path');
      }
      options.root = path.resolve(value);
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function walkFiles(rootDir, extensions) {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const files = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
      } else if (extensions.some((extension) => entry.name.endsWith(extension))) {
        files.push(entryPath);
      }
    }
  }

  return files.sort();
}

function toRepoPath(filePath, root) {
  return path.relative(root, filePath).replaceAll(path.sep, '/');
}

function scanGoFile(filePath, root) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];
  const importPattern = /"([^"]+)"/g;
  let match;

  while ((match = importPattern.exec(content)) !== null) {
    const importPath = match[1];
    const normalizedImportPath = importPath.replaceAll('\\', '/');

    for (const rule of GO_FORBIDDEN_IMPORT_PATTERNS) {
      if (rule.pattern.test(normalizedImportPath)) {
        findings.push({
          file: toRepoPath(filePath, root),
          importPath,
          reason: rule.reason,
        });
      }
    }
  }

  return findings;
}

function scanTsFile(filePath, root) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];
  const importPattern =
    /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;

  while ((match = importPattern.exec(content)) !== null) {
    const importPath = match[1];
    const normalizedImportPath = importPath.replaceAll('\\', '/');

    for (const rule of TS_FORBIDDEN_IMPORT_PATTERNS) {
      if (rule.pattern.test(normalizedImportPath)) {
        findings.push({
          file: toRepoPath(filePath, root),
          importPath,
          reason: rule.reason,
        });
      }
    }
  }

  return findings;
}

function scanRepository(repoName, root) {
  const warnings = [];
  const findings = [];
  const repoRoot = path.join(root, repoName);
  const backendBusinessRoot = path.join(repoRoot, 'backend', 'modules', 'business');
  const frontendBusinessRoot = path.join(repoRoot, 'frontend', 'src', 'modules', 'business');

  if (!fs.existsSync(repoRoot)) {
    warnings.push(`Repository root not found: ${repoName}`);
    return { repo: repoName, findings, warnings };
  }

  const expectsBusinessModules = BUSINESS_REPOSITORIES.has(repoName);

  if (fs.existsSync(backendBusinessRoot)) {
    for (const filePath of walkFiles(backendBusinessRoot, ['.go'])) {
      findings.push(...scanGoFile(filePath, root));
    }
  } else if (expectsBusinessModules) {
    warnings.push(`Backend business root not found: ${toRepoPath(backendBusinessRoot, root)}`);
  }

  if (fs.existsSync(frontendBusinessRoot)) {
    for (const filePath of walkFiles(frontendBusinessRoot, ['.ts', '.tsx'])) {
      findings.push(...scanTsFile(filePath, root));
    }
  } else if (expectsBusinessModules) {
    warnings.push(`Frontend business root not found: ${toRepoPath(frontendBusinessRoot, root)}`);
  }

  return { repo: repoName, findings, warnings };
}

function printTextReport(results, strict) {
  const findingCount = results.reduce((count, result) => count + result.findings.length, 0);
  const warningCount = results.reduce((count, result) => count + result.warnings.length, 0);
  const mode = strict ? 'strict' : 'report-only';

  console.log(`Boundary check (${mode}): ${findingCount} finding(s), ${warningCount} warning(s)`);

  for (const result of results) {
    console.log(`\n${result.repo}`);

    if (result.findings.length === 0) {
      console.log('  no findings');
    }

    for (const finding of result.findings) {
      console.log(`  finding: ${finding.file}`);
      console.log(`    import: ${finding.importPath}`);
      console.log(`    reason: ${finding.reason}`);
    }

    for (const warning of result.warnings) {
      console.log(`  warning: ${warning}`);
    }
  }
}

function main() {
  let options;

  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    return 1;
  }

  if (options.help) {
    printHelp();
    return 0;
  }

  const results = REPOSITORIES.map((repo) => scanRepository(repo, options.root));
  const findingCount = results.reduce((count, result) => count + result.findings.length, 0);
  const warningCount = results.reduce((count, result) => count + result.warnings.length, 0);

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          mode: options.strict ? 'strict' : 'report-only',
          findingCount,
          warningCount,
          results,
        },
        null,
        2,
      ),
    );
  } else {
    printTextReport(results, options.strict);
  }

  return options.strict && findingCount > 0 ? 1 : 0;
}

process.exitCode = main();
