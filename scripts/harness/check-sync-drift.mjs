#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_ROOT = process.cwd();

// Calculate workspace root (parent of pantheon-base)
const WORKSPACE_ROOT = path.resolve(DEFAULT_ROOT, '..');
const PANTHEON_HARNESS_ROOT = path.join(WORKSPACE_ROOT, 'pantheon-harness');

// Compare pantheon-base harness scripts with pantheon-harness source
const KEY_MIRRORS = [
  'check-review.mjs',
  'check-evidence.mjs',
  'check-failure-registry.mjs',
  'check-graph-review.mjs',
  'scaffold-graph-review.mjs',
  'build-graph-review-import.mjs',
  'check-visual-evidence.mjs',
  'check-template-health.mjs',
  'check-runtime-evidence.mjs',
  'check-doc-links.mjs',
  'check-doc-inventory.mjs',
  'check-adoption.mjs',
  'check-method-health.mjs',
].map(f => ['scripts/harness/' + f, 'scripts/harness/' + f]);

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
  console.log('Usage: node scripts/harness/check-sync-drift.mjs [--json] [--strict] [--root <path>]');
}

function normalizeExport(content) {
  return content.replace(/\r\n/g, '\n').trim();
}

function scan(root) {
  const findings = [];
  for (const [localFile, harnessFile] of KEY_MIRRORS) {
    const leftPath = path.join(root, localFile);
    const rightPath = path.join(PANTHEON_HARNESS_ROOT, harnessFile);
    if (!fs.existsSync(leftPath)) {
      findings.push({
        file: localFile,
        reason: 'local file does not exist',
      });
      continue;
    }
    if (!fs.existsSync(rightPath)) {
      // Harness source file doesn't exist, skip comparison
      continue;
    }
    const leftContent = normalizeExport(fs.readFileSync(leftPath, 'utf8'));
    const rightContent = normalizeExport(fs.readFileSync(rightPath, 'utf8'));
    if (leftContent !== rightContent) {
      findings.push({
        file: localFile,
        reason: `out of sync with pantheon-harness source: ${harnessFile}`,
      });
    }
  }
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
  if (options.help) return printHelp(), 0;
  const findings = scan(options.root);
  if (options.json) console.log(JSON.stringify({ mode: options.strict ? 'strict' : 'report-only', findingCount: findings.length, findings }, null, 2));
  else {
    console.log(`Sync drift check (${options.strict ? 'strict' : 'report-only'}): ${findings.length} finding(s)`);
    for (const finding of findings) console.log(`finding: ${finding.file}\n  reason: ${finding.reason}`);
  }
  return options.strict && findings.length > 0 ? 1 : 0;
}

process.exitCode = main();

