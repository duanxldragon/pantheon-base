#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_ROOT = process.cwd();

// Calculate workspace root (parent of pantheon-base)
const WORKSPACE_ROOT = path.resolve(DEFAULT_ROOT, '..');

// pantheon-harness paths - relative to workspace root
const PANTHEON_HARNESS_ROOT = path.join(WORKSPACE_ROOT, 'pantheon-harness');

const REQUIRED_METHOD_KIT_FILES = [
  'VERSION',
  'CHANGELOG.md',
  'README.md',
  'architecture/methodology/harness-methodology.zh.md',
  'architecture/methodology/workflow-routing.md',
  'architecture/methodology/solo-delivery-tiers.md',
  'architecture/harness/harness-core-model.md',
  'architecture/harness/harness-coverage-model.md',
  'architecture/harness/harness-template-taxonomy.md',
  'architecture/harness/tool-adapter-matrix.md',
].map(f => path.join(PANTHEON_HARNESS_ROOT, f));

const REQUIRED_REPO_SHELL_FILES = [
  'SHELL_VERSION.json',
  '.agents/README.md',
  '.github/pull_request_template.md',
  'docs/harness/HARNESS_CORE_MODEL.md',
  'docs/harness/HARNESS_COVERAGE_MODEL.md',
  'docs/harness/HARNESS_TEMPLATE_TAXONOMY.md',
  'docs/harness/TOOL_ADAPTER_MATRIX.md',
  'docs/harness/HARNESS_ENGINEERING_CONTRACT.md',
  'docs/harness/TRIVIALITY_CLASSIFICATION_POLICY.md',
  'docs/harness/VISUAL_EVIDENCE_PROMOTION_POLICY.md',
  'docs/harness/FAILURE_REGISTRY_PROMOTION_POLICY.md',
  'scripts/harness/check-adoption.mjs',
  'scripts/harness/check-review.mjs',
  'scripts/harness/check-graph-review.mjs',
  'scripts/harness/scaffold-graph-review.mjs',
  'scripts/harness/build-graph-review-import.mjs',
  'scripts/harness/check-visual-evidence.mjs',
  'scripts/harness/check-failure-registry.mjs',
  'scripts/harness/check-feature-ledger.mjs',
  'scripts/harness/check-template-health.mjs',
  'scripts/harness/check-runtime-evidence.mjs',
  'scripts/harness/check-doc-links.mjs',
  'scripts/harness/check-doc-inventory.mjs',
  'scripts/harness/check-sync-drift.mjs',
];

function printHelp() {
  console.log(`Usage:
  node scripts/harness/check-method-health.mjs [--json] [--strict] [--root <path>]

Checks:
- method kit version metadata exists and parses
- repo shell version metadata exists and parses
- compatible versions agree
- required method files exist
- required repo shell landing files exist
- feature-ledger checker exists for generated capability drift
- portable/runtime boundary directories exist`);
}

function parseArgs(argv) {
  const options = {
    json: false,
    strict: false,
    help: false,
    root: DEFAULT_ROOT,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') {
      options.json = true;
    } else if (arg === '--strict') {
      options.strict = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--root') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--root requires a path');
      }
      options.root = path.resolve(value);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function exists(root, repoPath) {
  return fs.existsSync(path.join(root, repoPath));
}

function readJson(root, repoPath, findings) {
  const fullPath = path.join(root, repoPath);
  if (!fs.existsSync(fullPath)) {
    findings.push({ file: repoPath, reason: 'required file is missing' });
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (error) {
    findings.push({ file: repoPath, reason: `invalid JSON: ${error.message}` });
    return null;
  }
}

function validateMethodKit(root, findings) {
  for (const repoPath of REQUIRED_METHOD_KIT_FILES) {
    // repoPath is already a full absolute path, use it directly
    if (!fs.existsSync(repoPath)) {
      findings.push({ file: repoPath, reason: 'required method kit file is missing' });
    }
  }

  const versionTextPath = path.join(WORKSPACE_ROOT, 'pantheon-harness', 'VERSION');
  if (fs.existsSync(versionTextPath)) {
    const value = fs.readFileSync(versionTextPath, 'utf8').trim();
    if (!/^\d+\.\d+\.\d+$/.test(value)) {
      findings.push({
        file: 'pantheon-harness/VERSION',
        reason: 'version must use semver-like x.y.z format',
      });
    }
  }

  // No METHOD_VERSION.json required in new structure
}

function validateRepoShell(root, findings) {
  for (const repoPath of REQUIRED_REPO_SHELL_FILES) {
    if (!exists(root, repoPath)) {
      findings.push({ file: repoPath, reason: 'required repo shell landing file is missing' });
    }
  }

  // Read local VERSION instead of SHELL_VERSION.json
  const versionTextPath = path.join(root, 'VERSION');
  if (fs.existsSync(versionTextPath)) {
    const value = fs.readFileSync(versionTextPath, 'utf8').trim();
    if (/^\d+\.\d+\.\d+$/.test(value)) {
      return { version: value };
    }
  }
  return null;
}

function validateCompatibility(pantheonHarnessVersion, baseVersion, findings) {
  if (!pantheonHarnessVersion || !baseVersion) {
    return;
  }

  // Both should use the same version format (x.y.z)
  if (pantheonHarnessVersion !== baseVersion) {
    findings.push({
      file: 'VERSION',
      reason: `pantheon-harness version "${pantheonHarnessVersion}" does not match pantheon-base version "${baseVersion}"`,
    });
  }
}

function validateBoundaries(root, warnings) {
  if (!exists(root, '.harness')) {
    warnings.push({ file: '.harness', reason: 'runtime evidence directory is missing' });
  }
  if (!exists(root, 'openspec')) {
    warnings.push({ file: 'openspec', reason: 'OpenSpec skeleton directory is missing' });
  }
}

function scan(root) {
  const findings = [];
  const warnings = [];

  // Validate pantheon-harness exists and get its version
  let pantheonHarnessVersion = null;
  const harnessVersionPath = path.join(WORKSPACE_ROOT, 'pantheon-harness', 'VERSION');
  if (fs.existsSync(harnessVersionPath)) {
    pantheonHarnessVersion = fs.readFileSync(harnessVersionPath, 'utf8').trim();
  }

  // Validate local VERSION
  let baseVersion = null;
  const baseVersionPath = path.join(root, 'VERSION');
  if (fs.existsSync(baseVersionPath)) {
    baseVersion = fs.readFileSync(baseVersionPath, 'utf8').trim();
  }

  validateMethodKit(root, findings);
  validateRepoShell(root, findings);
  validateCompatibility(pantheonHarnessVersion, baseVersion, findings);
  validateBoundaries(root, warnings);

  return {
    findings,
    warnings,
    pantheonHarnessVersion,
    baseVersion,
  };
}

function printTextReport(result, strict) {
  const mode = strict ? 'strict' : 'report-only';
  console.log(
    `Method health check (${mode}): ${result.findings.length} finding(s), ${result.warnings.length} warning(s)`,
  );
  if (result.pantheonHarnessVersion || result.baseVersion) {
    console.log(`pantheon-harness version: ${result.pantheonHarnessVersion ?? 'unknown'}`);
    console.log(`pantheon-base version: ${result.baseVersion ?? 'unknown'}`);
  }
  if (result.findings.length === 0 && result.warnings.length === 0) {
    console.log('\nno findings');
  }
  for (const finding of result.findings) {
    console.log(`\nfinding: ${finding.file}`);
    console.log(`  reason: ${finding.reason}`);
  }
  for (const warning of result.warnings) {
    console.log(`\nwarning: ${warning.file}`);
    console.log(`  reason: ${warning.reason}`);
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

  const result = scan(options.root);

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          mode: options.strict ? 'strict' : 'report-only',
          pantheonHarnessVersion: result.pantheonHarnessVersion,
          pantheonBaseVersion: result.baseVersion,
          findingCount: result.findings.length,
          warningCount: result.warnings.length,
          findings: result.findings,
          warnings: result.warnings,
        },
        null,
        2,
      ),
    );
  } else {
    printTextReport(result, options.strict);
  }

  return options.strict && result.findings.length > 0 ? 1 : 0;
}

process.exitCode = main();

