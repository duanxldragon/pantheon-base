#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_ROOT = process.cwd();

const REQUIRED_DOC_README_ENTRIES = [
  'agentic-method-kit/README.md',
  'agentic-method-kit/HARNESS_CORE_MODEL.md',
  'agentic-method-kit/HARNESS_COVERAGE_MODEL.md',
  'agentic-method-kit/HARNESS_TEMPLATE_TAXONOMY.md',
  'agentic-method-kit/TOOL_ADAPTER_MATRIX.md',
  'agentic-method-kit/METHOD_PLAYBOOK.md',
  'docs/harness/HARNESS_ENGINEERING_CONTRACT.md',
  'docs/harness/HARNESS_METHOD_PLAYBOOK.md',
];

function parseArgs(argv) {
  const options = { json: false, strict: false, help: false, root: DEFAULT_ROOT };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') options.json = true;
    else if (arg === '--strict') options.strict = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--root') {
      const value = argv[index + 1];
      if (!value) throw new Error('--root requires a path');
      options.root = path.resolve(value);
      index += 1;
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function printHelp() {
  console.log('Usage: node scripts/harness/check-doc-inventory.mjs [--json] [--strict] [--root <path>]');
}

function toUnix(relativePath) {
  return relativePath.replaceAll(path.sep, '/');
}

function readIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

function listCheckScripts(root, dir) {
  const fullDir = path.join(root, dir);
  if (!fs.existsSync(fullDir)) return [];
  return fs
    .readdirSync(fullDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith('.mjs') && !name.endsWith('.test.mjs'))
    .sort();
}

function validateScriptInventory(root, dir, readmePath, findings) {
  const readme = readIfExists(path.join(root, readmePath));
  if (readme === null) {
    findings.push({ file: readmePath, reason: 'inventory README is missing' });
    return;
  }

  for (const scriptName of listCheckScripts(root, dir)) {
    if (!readme.includes(scriptName)) {
      findings.push({
        file: toUnix(path.join(dir, scriptName)),
        inventory: readmePath,
        reason: 'script is missing from inventory README',
      });
    }
  }
}

function validateDocsReadme(root, findings) {
  const readmePath = 'docs/README.md';
  const readme = readIfExists(path.join(root, readmePath));
  if (readme === null) {
    findings.push({ file: readmePath, reason: 'docs README is missing' });
    return;
  }

  const normalized = readme.replaceAll('\\', '/');
  for (const repoPath of REQUIRED_DOC_README_ENTRIES) {
    if (!fs.existsSync(path.join(root, repoPath))) {
      continue;
    }

    const normalizedRepoPath = repoPath.replaceAll('\\', '/');
    const acceptableRefs = new Set([normalizedRepoPath, `../${normalizedRepoPath}`]);
    if (normalizedRepoPath.startsWith('docs/')) {
      acceptableRefs.add(normalizedRepoPath.slice('docs/'.length));
    }
    if (![...acceptableRefs].some((entry) => normalized.includes(entry))) {
      findings.push({
        file: normalizedRepoPath,
        inventory: readmePath,
        reason: 'required document is missing from docs README',
      });
    }
  }
}

function scan(root) {
  const findings = [];

  validateScriptInventory(root, 'scripts/harness', 'scripts/harness/README.md', findings);
  validateScriptInventory(
    root,
    'agentic-repo-shell/scripts/harness',
    'agentic-repo-shell/scripts/harness/README.md',
    findings,
  );
  validateDocsReadme(root, findings);

  return findings;
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

  const findings = scan(options.root);
  if (options.json) {
    console.log(
      JSON.stringify(
        {
          mode: options.strict ? 'strict' : 'report-only',
          findingCount: findings.length,
          findings,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(`Docs inventory check (${options.strict ? 'strict' : 'report-only'}): ${findings.length} finding(s)`);
    for (const finding of findings) {
      console.log(`finding: ${finding.file}`);
      if (finding.inventory) console.log(`  inventory: ${finding.inventory}`);
      console.log(`  reason: ${finding.reason}`);
    }
  }

  return options.strict && findings.length > 0 ? 1 : 0;
}

process.exitCode = main();
