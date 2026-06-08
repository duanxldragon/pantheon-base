#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_ROOT = process.cwd();
const KEY_MIRRORS = [
  ['scripts/harness/check-review.mjs', 'agentic-repo-shell/scripts/harness/check-review.mjs'],
  ['scripts/harness/check-evidence.mjs', 'agentic-repo-shell/scripts/harness/check-evidence.mjs'],
  ['scripts/harness/check-failure-registry.mjs', 'agentic-repo-shell/scripts/harness/check-failure-registry.mjs'],
  ['scripts/harness/check-graph-review.mjs', 'agentic-repo-shell/scripts/harness/check-graph-review.mjs'],
  ['scripts/harness/scaffold-graph-review.mjs', 'agentic-repo-shell/scripts/harness/scaffold-graph-review.mjs'],
  ['scripts/harness/build-graph-review-import.mjs', 'agentic-repo-shell/scripts/harness/build-graph-review-import.mjs'],
  ['scripts/harness/check-template-health.mjs', 'agentic-repo-shell/scripts/harness/check-template-health.mjs'],
  ['scripts/harness/check-runtime-evidence.mjs', 'agentic-repo-shell/scripts/harness/check-runtime-evidence.mjs'],
  ['scripts/harness/check-doc-links.mjs', 'agentic-repo-shell/scripts/harness/check-doc-links.mjs'],
  ['scripts/harness/check-doc-inventory.mjs', 'agentic-repo-shell/scripts/harness/check-doc-inventory.mjs'],
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
  console.log('Usage: node scripts/harness/check-sync-drift.mjs [--json] [--strict] [--root <path>]');
}

function normalizeExport(content) {
  return content.replace(/\r\n/g, '\n').trim();
}

function scan(root) {
  const findings = [];
  for (const [left, right] of KEY_MIRRORS) {
    const leftPath = path.join(root, left);
    const rightPath = path.join(root, right);
    if (!fs.existsSync(leftPath) || !fs.existsSync(rightPath)) continue;
    const leftContent = normalizeExport(fs.readFileSync(leftPath, 'utf8'));
    const rightContent = normalizeExport(fs.readFileSync(rightPath, 'utf8'));
    if (rightContent !== `export * from '../../../${left}';` && leftContent !== rightContent) {
      findings.push({
        file: right,
        reason: `mirror drift detected against ${left}`,
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
