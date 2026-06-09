#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';

const DEFAULT_ROOT = process.cwd();
const IMPLEMENTATION_ROOTS = [
  'src/',
  'app/',
  'lib/',
  'packages/',
  'services/',
  'backend/',
  'frontend/',
  'docs/contracts/',
  'docs/designs/',
  'docs/acceptances/',
];
const TASK_PACKET_ROOT = 'docs/harness/tasks/';
const EVIDENCE_ROOT = '.harness/evidence/';
const OPEN_SPEC_CHANGES_ROOT = 'openspec/changes';

const REQUIRED_FILES = [
  'agentic-method-kit/HARNESS_CORE_MODEL.md',
  'agentic-method-kit/HARNESS_COVERAGE_MODEL.md',
  'agentic-method-kit/HARNESS_TEMPLATE_TAXONOMY.md',
  'agentic-method-kit/TOOL_ADAPTER_MATRIX.md',
  'docs/harness/HARNESS_CORE_MODEL.md',
  'docs/harness/HARNESS_COVERAGE_MODEL.md',
  'docs/harness/HARNESS_TEMPLATE_TAXONOMY.md',
  'docs/harness/TOOL_ADAPTER_MATRIX.md',
  'docs/harness/HARNESS_METHOD_PLAYBOOK.md',
  'docs/harness/HARNESS_ENGINEERING_CONTRACT.md',
  'docs/harness/AGENT_INTERFACE_CONTRACT.md',
  'docs/harness/TASK_PACKET_SPEC.md',
  'docs/harness/VERIFICATION_EVIDENCE_SPEC.md',
  'docs/harness/REVIEW_LOOP_SPEC.md',
  'docs/harness/VISUAL_QUALITY_PROTOCOL.md',
  '.agents/README.md',
  '.agents/adapters/codex.md',
  '.agents/adapters/claude-code.md',
  '.agents/adapters/cursor.md',
  '.agents/adapters/github-copilot.md',
  '.agents/adapters/openhands.md',
  '.agents/adapters/human.md',
  '.github/pull_request_template.md',
];

const REQUIRED_PR_MARKERS = [
  'Task packet',
  'Trivial change',
  'Verification evidence',
  'OpenSpec change',
  'task packet',
  'evidence',
  'visual evidence',
  'method health',
];

const REQUIRED_AGENT_PROMPT_MARKERS = [
  'Task Packet',
  'Record verification results',
  'Do not claim completion without fresh verification evidence',
];

function printHelp() {
  console.log(`Usage:
  node scripts/harness/check-adoption.mjs [--json] [--strict] [--root <path>] [--changed-file <path> ...]

Checks that Phase 7 Harness adoption entrypoints are present:
- shared contracts
- tool adapters
- PR template task/evidence/trivial markers
- implementation prompt completion evidence rules
- implementation changes are paired with task packet and evidence files`);
}

function parseArgs(argv) {
  const options = { json: false, strict: false, help: false, root: DEFAULT_ROOT, changedFiles: [] };
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
    } else if (arg === '--changed-file') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--changed-file requires a path');
      }
      options.changedFiles.push(value.replaceAll('\\', '/'));
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function readText(root, repoPath) {
  return fs.readFileSync(path.join(root, repoPath), 'utf8');
}

function hasAllMarkers(content, markers) {
  return markers.filter((marker) => !content.includes(marker));
}

function toRepoPath(filePath, root) {
  return path.relative(root, filePath).replaceAll(path.sep, '/');
}

function discoverChangedFiles(root) {
  try {
    const tracked = execFileSync(
      'git',
      ['diff', '--name-only', '--relative', 'HEAD'],
      { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    )
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const untracked = execFileSync(
      'git',
      ['ls-files', '--others', '--exclude-standard'],
      { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    )
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    return Array.from(new Set([...tracked, ...untracked])).sort();
  } catch {
    return [];
  }
}

function scanChangedFiles(root, findings, warnings, changedFiles) {
  const normalizedFiles = Array.from(new Set(changedFiles.map((file) => file.replaceAll('\\', '/')))).sort();
  if (normalizedFiles.length === 0) {
    warnings.push({
      file: '.',
      reason: 'no changed files detected; implementation adoption linkage was not evaluated',
    });
    return;
  }

  const implementationChanges = normalizedFiles.filter((file) =>
    IMPLEMENTATION_ROOTS.some((prefix) => file.startsWith(prefix)),
  );
  if (implementationChanges.length === 0) {
    return;
  }

  const hasTaskPacketChange = normalizedFiles.some(
    (file) => file.startsWith(TASK_PACKET_ROOT) && file.endsWith('.task.md'),
  );
  const hasEvidenceChange = normalizedFiles.some(
    (file) => file.startsWith(EVIDENCE_ROOT) && /\/commands\.json$/.test(file),
  );

  if (!hasTaskPacketChange) {
    findings.push({
      file: implementationChanges[0],
      reason: 'implementation change detected without a matching task packet change',
    });
  }

  if (!hasEvidenceChange) {
    findings.push({
      file: implementationChanges[0],
      reason: 'implementation change detected without matching verification evidence',
    });
  }
}

function listActiveOpenSpecChanges(root) {
  const changesRoot = path.join(root, OPEN_SPEC_CHANGES_ROOT);
  if (!fs.existsSync(changesRoot)) {
    return [];
  }

  return fs
    .readdirSync(changesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'archive')
    .map((entry) => `${OPEN_SPEC_CHANGES_ROOT}/${entry.name}/`)
    .sort();
}

function parseTaskPacketChangeRef(root, repoPath) {
  const fullPath = path.join(root, repoPath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const match = content.match(/^- OpenSpec Change:\s+(.+)$/m);
  if (!match) {
    return null;
  }
  return match[1].trim();
}

function parseEvidenceChangeRef(root, repoPath) {
  const fullPath = path.join(root, repoPath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  try {
    const payload = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    return payload?.linkage?.changeRef ?? null;
  } catch {
    return null;
  }
}

function scanOpenSpecLinkage(root, findings, changedFiles) {
  const activeChanges = listActiveOpenSpecChanges(root);
  if (activeChanges.length === 0) {
    return;
  }

  const changedTaskPackets = changedFiles.filter(
    (file) => file.startsWith(TASK_PACKET_ROOT) && file.endsWith('.task.md'),
  );
  const changedEvidenceFiles = changedFiles.filter(
    (file) => file.startsWith(EVIDENCE_ROOT) && /\/commands\.json$/.test(file),
  );

  for (const taskPacket of changedTaskPackets) {
    const changeRef = parseTaskPacketChangeRef(root, taskPacket);
    if (!changeRef || changeRef === 'none') {
      findings.push({
        file: taskPacket,
        reason: 'active OpenSpec change exists; changed task packet must declare a real OpenSpec Change linkage',
      });
      continue;
    }
    if (!activeChanges.includes(changeRef)) {
      findings.push({
        file: taskPacket,
        reason: `task packet OpenSpec Change must reference an active change: ${activeChanges.join(', ')}`,
      });
    }
  }

  for (const evidenceFile of changedEvidenceFiles) {
    const changeRef = parseEvidenceChangeRef(root, evidenceFile);
    if (!changeRef || changeRef === 'none') {
      findings.push({
        file: evidenceFile,
        reason: 'active OpenSpec change exists; changed evidence must declare a real linkage.changeRef',
      });
      continue;
    }
    if (!activeChanges.includes(changeRef)) {
      findings.push({
        file: evidenceFile,
        reason: `evidence linkage.changeRef must reference an active change: ${activeChanges.join(', ')}`,
      });
    }
  }
}

function scanAdoption(root, changedFiles) {
  const findings = [];
  const warnings = [];

  for (const repoPath of REQUIRED_FILES) {
    if (!fs.existsSync(path.join(root, repoPath))) {
      findings.push({
        file: repoPath,
        reason: 'required Harness adoption file is missing',
      });
    }
  }

  const prTemplatePath = '.github/pull_request_template.md';
  if (fs.existsSync(path.join(root, prTemplatePath))) {
    const missing = hasAllMarkers(readText(root, prTemplatePath), REQUIRED_PR_MARKERS);
    for (const marker of missing) {
      findings.push({
        file: prTemplatePath,
        reason: `PR template missing adoption marker: ${marker}`,
      });
    }
  }

  const implementationPromptPath = '.agents/prompts/implementation.md';
  if (!fs.existsSync(path.join(root, implementationPromptPath))) {
    findings.push({
      file: implementationPromptPath,
      reason: 'implementation prompt is missing',
    });
  } else {
    const missing = hasAllMarkers(readText(root, implementationPromptPath), REQUIRED_AGENT_PROMPT_MARKERS);
    for (const marker of missing) {
      warnings.push({
        file: implementationPromptPath,
        reason: `implementation prompt missing adoption marker: ${marker}`,
      });
    }
  }

  scanChangedFiles(root, findings, warnings, changedFiles);
  scanOpenSpecLinkage(root, findings, changedFiles);

  return { findings, warnings };
}

function printTextReport(result, strict) {
  const mode = strict ? 'strict' : 'report-only';
  console.log(
    `Adoption check (${mode}): ${result.findings.length} finding(s), ${result.warnings.length} warning(s)`,
  );
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

  const changedFiles = options.changedFiles.length > 0 ? options.changedFiles : discoverChangedFiles(options.root);
  const result = scanAdoption(options.root, changedFiles);
  if (options.json) {
    console.log(
      JSON.stringify(
        {
          mode: options.strict ? 'strict' : 'report-only',
          changedFileCount: changedFiles.length,
          findingCount: result.findings.length,
          warningCount: result.warnings.length,
          changedFiles,
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
