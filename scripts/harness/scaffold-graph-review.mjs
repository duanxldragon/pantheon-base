#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = process.cwd();
const DEFAULT_TASK_DIR = 'docs/harness/tasks';
const DEFAULT_NOTE = 'scaffolded from task packet Structural Scope; replace after graph review';
const DEFAULT_REVIEW_FINDING = 'Graph review scaffold generated. Replace with real findings after review.';
const DEFAULT_REVIEW_RISK = 'Graph review scaffold only; final review not completed.';
const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const BUILD_GRAPH_REVIEW_IMPORT_SCRIPT = path.resolve(CURRENT_DIR, 'build-graph-review-import.mjs');

function printHelp() {
  console.log(`Usage:
  node scripts/harness/scaffold-graph-review.mjs [--json] [--write] [--import <file>] [--root <path>] <task-id | task-packet>
  node scripts/harness/scaffold-graph-review.mjs [--json] [--write] [--root <path>] --codegraph-path <repo> [--codegraph-bin <path>] [--sync] [--live-callers <symbol>] [--live-callees <symbol>] [--live-impact <symbol>] [--live-context <task>] <task-id | task-packet>

Default behavior:
  Report the derived graph review scaffold without writing files. Use --write to create or update files.

Examples:
  node scripts/harness/scaffold-graph-review.mjs sample
  node scripts/harness/scaffold-graph-review.mjs docs/harness/tasks/sample.task.md --json
  node scripts/harness/scaffold-graph-review.mjs --write sample
  node scripts/harness/scaffold-graph-review.mjs --write --import graph-review.json sample
  node scripts/harness/scaffold-graph-review.mjs --write --codegraph-path D:\\repo\\pantheon-base --live-context "permission service" sample`);
}

function parseArgs(argv) {
  const options = {
    json: false,
    write: false,
    help: false,
    importFile: null,
    root: DEFAULT_ROOT,
    target: null,
    sync: false,
    codegraphPath: null,
    codegraphBin: process.env.CODEGRAPH_BIN ?? null,
    liveCallers: null,
    liveCallees: null,
    liveImpact: null,
    liveContext: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') {
      options.json = true;
    } else if (arg === '--write') {
      options.write = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--sync') {
      options.sync = true;
    } else if (arg === '--import') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--import requires a path');
      }
      options.importFile = value;
      index += 1;
    } else if (arg === '--root') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--root requires a path');
      }
      options.root = path.resolve(value);
      index += 1;
    } else if (arg === '--codegraph-path') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--codegraph-path requires a path');
      }
      options.codegraphPath = value;
      index += 1;
    } else if (arg === '--codegraph-bin') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--codegraph-bin requires a path');
      }
      options.codegraphBin = value;
      index += 1;
    } else if (arg === '--live-callers') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--live-callers requires a symbol');
      }
      options.liveCallers = value;
      index += 1;
    } else if (arg === '--live-callees') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--live-callees requires a symbol');
      }
      options.liveCallees = value;
      index += 1;
    } else if (arg === '--live-impact') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--live-impact requires a symbol');
      }
      options.liveImpact = value;
      index += 1;
    } else if (arg === '--live-context') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--live-context requires a task');
      }
      options.liveContext = value;
      index += 1;
    } else if (!options.target) {
      options.target = arg;
    } else {
      throw new Error(`Unexpected extra argument: ${arg}`);
    }
  }

  const hasLiveMode =
    options.codegraphPath &&
    (options.liveCallers || options.liveCallees || options.liveImpact || options.liveContext);

  if (!options.help && !options.target) {
    throw new Error('A task id or task packet path is required.');
  }
  if (options.importFile && hasLiveMode) {
    throw new Error('Use either --import or live CodeGraph options, not both.');
  }
  if (!options.importFile && options.codegraphPath && !hasLiveMode) {
    throw new Error('Live CodeGraph mode requires at least one --live-* option.');
  }

  return options;
}

function hasLiveCodegraphOptions(options) {
  return Boolean(
    options.codegraphPath &&
      (options.liveCallers || options.liveCallees || options.liveImpact || options.liveContext),
  );
}

function toRepoPath(filePath, root) {
  return path.relative(root, filePath).replaceAll(path.sep, '/');
}

function stripBackticks(value) {
  return value.replace(/^`+/, '').replace(/`+$/, '').trim();
}

function normalizeListValue(value) {
  const normalized = stripBackticks(value);
  if (!normalized || normalized.toLowerCase() === 'none') {
    return [];
  }

  return normalized
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeTaskGraphFocus(value) {
  const mapping = new Map([
    ['cycle-check', 'cycle'],
    ['hub-check', 'hub'],
    ['call-depth', 'call-depth'],
    ['sensitive-input-flow', 'sensitive-flow'],
    ['none', 'none'],
  ]);

  return normalizeListValue(value)
    .map((entry) => mapping.get(entry) || entry)
    .filter((entry) => entry !== 'none')
    .sort();
}

function extractSection(content, title) {
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const heading = new RegExp(`^## ${escapedTitle}\\s*$`, 'm');
  const match = heading.exec(content);
  if (!match || match.index === undefined) {
    return null;
  }

  const body = content.slice(match.index + match[0].length);
  const nextSection = /^##\s/m.exec(body);
  const section = (nextSection ? body.slice(0, nextSection.index) : body).trim();
  return section || null;
}

function parseTaskStructuralScope(content) {
  const section = extractSection(content, 'Structural Scope');
  if (!section) {
    throw new Error('Task packet is missing ## Structural Scope.');
  }

  const affectedSubgraphMatch = section.match(/^- Affected Subgraph:\s*(.+)$/m);
  const graphFocusMatch = section.match(/^- Graph Focus:\s*(.+)$/m);
  if (!affectedSubgraphMatch) {
    throw new Error('Task packet Structural Scope is missing "- Affected Subgraph:".');
  }
  if (!graphFocusMatch) {
    throw new Error('Task packet Structural Scope is missing "- Graph Focus:".');
  }

  return {
    affectedSubgraph: normalizeListValue(affectedSubgraphMatch[1]),
    checks: normalizeTaskGraphFocus(graphFocusMatch[1]),
  };
}

function parseLinkage(content, fallbackTaskId) {
  const section = extractSection(content, 'Linkage');
  if (!section) {
    return {
      taskId: fallbackTaskId,
      changeRef: 'none',
      planRefs: [],
      evidenceDir: `.harness/evidence/${fallbackTaskId}/`,
      reviewFile: `.harness/evidence/${fallbackTaskId}/review.md`,
    };
  }

  function extract(pattern) {
    const match = section.match(pattern);
    return match ? stripBackticks(match[1]) : null;
  }

  const taskId = extract(/^- Task ID:\s*(.+)$/m) || fallbackTaskId;
  const changeRef = extract(/^- OpenSpec Change:\s*(.+)$/m) || 'none';
  const planRefValue = extract(/^- Superpowers Plan:\s*(.+)$/m) || 'none';
  const evidenceDir = extract(/^- Evidence Directory:\s*(.+)$/m) || `.harness/evidence/${taskId}/`;
  const reviewFile = extract(/^- Review File:\s*(.+)$/m) || `.harness/evidence/${taskId}/review.md`;

  return {
    taskId,
    changeRef,
    planRefs: normalizeListValue(planRefValue),
    evidenceDir,
    reviewFile,
  };
}

function resolveTaskPacket(root, target) {
  const directPath = path.isAbsolute(target) ? target : path.join(root, target);
  if (target.endsWith('.task.md') || target.includes('/') || target.includes('\\')) {
    if (!fs.existsSync(directPath)) {
      throw new Error(`Task packet not found: ${target}`);
    }
    return directPath;
  }

  const byTaskId = path.join(root, DEFAULT_TASK_DIR, `${target}.task.md`);
  if (!fs.existsSync(byTaskId)) {
    throw new Error(`Task packet not found for task id "${target}". Expected ${toRepoPath(byTaskId, root)}`);
  }
  return byTaskId;
}

function ensureTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`;
}

function normalizeChecks(value) {
  const items = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  return items
    .map((entry) => String(entry).trim())
    .filter(Boolean)
    .sort();
}

function normalizeAffectedSubgraph(value) {
  const items = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  return items
    .map((entry) => String(entry).trim())
    .filter(Boolean)
    .sort();
}

function normalizeFindings(value) {
  const items = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  return items
    .map((entry) => String(entry).trim())
    .filter(Boolean);
}

function readJsonObjectIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Expected JSON object in ${filePath}`);
  }
  return parsed;
}

function readImportedGraphReview(root, importFile) {
  if (!importFile) {
    return null;
  }

  const filePath = path.isAbsolute(importFile) ? importFile : path.join(root, importFile);
  const parsed = readJsonObjectIfExists(filePath);
  if (!parsed) {
    throw new Error(`Imported graph review file not found: ${importFile}`);
  }

  return {
    usedCodeGraph: typeof parsed.usedCodeGraph === 'boolean' ? parsed.usedCodeGraph : undefined,
    affectedSubgraph: normalizeAffectedSubgraph(parsed.affectedSubgraph),
    checks: normalizeChecks(parsed.checks),
    findings: normalizeFindings(parsed.findings),
    notes: typeof parsed.notes === 'string' && parsed.notes.trim() !== '' ? parsed.notes.trim() : undefined,
    file: toRepoPath(filePath, root),
  };
}

function readLiveGraphReview(root, options) {
  const args = ['--root', root, '--codegraph-path', options.codegraphPath];
  if (options.codegraphBin) {
    args.push('--codegraph-bin', options.codegraphBin);
  }
  if (options.sync) {
    args.push('--sync');
  }
  if (options.liveCallers) {
    args.push('--live-callers', options.liveCallers);
  }
  if (options.liveCallees) {
    args.push('--live-callees', options.liveCallees);
  }
  if (options.liveImpact) {
    args.push('--live-impact', options.liveImpact);
  }
  if (options.liveContext) {
    args.push('--live-context', options.liveContext);
  }

  const parsed = JSON.parse(
    execFileSync(process.execPath, [BUILD_GRAPH_REVIEW_IMPORT_SCRIPT, ...args], {
      encoding: 'utf8',
    }),
  );

  return {
    usedCodeGraph: typeof parsed.usedCodeGraph === 'boolean' ? parsed.usedCodeGraph : undefined,
    affectedSubgraph: normalizeAffectedSubgraph(parsed.affectedSubgraph),
    checks: normalizeChecks(parsed.checks),
    findings: normalizeFindings(parsed.findings),
    notes: typeof parsed.notes === 'string' && parsed.notes.trim() !== '' ? parsed.notes.trim() : undefined,
    file: null,
  };
}

function extractReviewMachineReadable(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/## Machine Readable\s+```json\s*([\s\S]*?)\s*```/m);
  if (!match) {
    return { content, machine: null };
  }

  const machine = JSON.parse(match[1]);
  if (!machine || typeof machine !== 'object' || Array.isArray(machine)) {
    throw new Error(`Expected machine-readable review JSON object in ${filePath}`);
  }

  return { content, machine };
}

function buildGraphChecks(taskScope) {
  return {
    usedCodeGraph: false,
    affectedSubgraph: taskScope.affectedSubgraph,
    checks: taskScope.checks,
    findings: [],
    notes: DEFAULT_NOTE,
  };
}

function buildStructuralReview(taskScope) {
  return {
    affectedSubgraph: taskScope.affectedSubgraph,
    checks: taskScope.checks,
    findings: [],
    notes: DEFAULT_NOTE,
  };
}

function applyImportedGraphReview(base, imported, includeUsedCodeGraph = false) {
  if (!imported) {
    return base;
  }

  const merged = {
    affectedSubgraph: imported.affectedSubgraph.length > 0 ? imported.affectedSubgraph : base.affectedSubgraph,
    checks: imported.checks.length > 0 ? imported.checks : base.checks,
    findings: imported.findings.length > 0 ? imported.findings : base.findings,
    notes: imported.notes ?? base.notes,
  };

  if (includeUsedCodeGraph) {
    merged.usedCodeGraph = typeof imported.usedCodeGraph === 'boolean' ? imported.usedCodeGraph : base.usedCodeGraph;
  }

  return merged;
}

function renderReview(taskId, review, linkage, structuralReview) {
  const checksText = structuralReview.checks.length > 0 ? structuralReview.checks.map((entry) => `\`${entry}\``).join(', ') : 'none';
  const subgraphText =
    structuralReview.affectedSubgraph.length > 0
      ? structuralReview.affectedSubgraph.map((entry) => `\`${entry}\``).join(', ')
      : 'none';
  const changeRefText = linkage.changeRef === 'none' ? 'none' : `\`${linkage.changeRef}\``;
  const structuralFindingSummary =
    structuralReview.findings.length > 0 ? structuralReview.findings.map((entry) => `\`${entry}\``).join(', ') : 'none';
  const findingLines =
    structuralReview.findings.length > 0 ? structuralReview.findings.map((entry) => `- ${entry}`) : [`- ${DEFAULT_REVIEW_FINDING}`];
  const residualRisk =
    structuralReview.findings.length > 0 ? '- review findings recorded; confirm closure before approval' : `- ${DEFAULT_REVIEW_RISK}`;

  return [
    `# Review Summary: ${taskId}`,
    '',
    '## Machine Readable',
    '',
    '```json',
    JSON.stringify(review, null, 2),
    '```',
    '',
    '## Linkage',
    '',
    `- Task Packet: \`${linkage.taskPacket}\``,
    `- Evidence: \`${linkage.evidence}\``,
    `- OpenSpec Change: ${changeRefText}`,
    '',
    '## Verdict',
    '',
    review.verdict,
    '',
    '## Findings',
    '',
    ...findingLines,
    '',
    '## Structural Notes',
    '',
    `- Affected subgraph: ${subgraphText}`,
    `- Checks: ${checksText}`,
    `- Findings: ${structuralFindingSummary}`,
    '',
    '## Residual Risk',
    '',
    residualRisk,
    '',
    '## Verification Checked',
    '',
    '- none',
    '',
  ].join('\n');
}

function replaceReviewMachineReadable(content, review) {
  return content.replace(
    /## Machine Readable\s+```json\s*[\s\S]*?\s*```/m,
    ['## Machine Readable', '', '```json', JSON.stringify(review, null, 2), '```'].join('\n'),
  );
}

function scaffold(root, target, write, importFile, options = {}) {
  const taskPacketPath = resolveTaskPacket(root, target);
  const taskPacketRepoPath = toRepoPath(taskPacketPath, root);
  const taskPacket = fs.readFileSync(taskPacketPath, 'utf8');
  const fallbackTaskId = path.basename(taskPacketPath).replace(/\.task\.md$/, '');
  const taskScope = parseTaskStructuralScope(taskPacket);
  const imported = hasLiveCodegraphOptions(options) ? readLiveGraphReview(root, options) : readImportedGraphReview(root, importFile);
  const parsedLinkage = parseLinkage(taskPacket, fallbackTaskId);
  const taskId = parsedLinkage.taskId;
  const evidenceDirRepoPath = ensureTrailingSlash(parsedLinkage.evidenceDir);
  const reviewRepoPath = parsedLinkage.reviewFile;
  const evidenceRepoPath = `${evidenceDirRepoPath}commands.json`;
  const evidencePath = path.join(root, evidenceRepoPath);
  const reviewPath = path.join(root, reviewRepoPath);
  const graphChecks = applyImportedGraphReview(buildGraphChecks(taskScope), imported, true);
  const structuralReview = applyImportedGraphReview(buildStructuralReview(taskScope), imported, false);

  const evidenceLinkage = {
    taskPacket: taskPacketRepoPath,
    evidenceDir: evidenceDirRepoPath,
    reviewFile: reviewRepoPath,
    changeRef: parsedLinkage.changeRef,
    planRefs: parsedLinkage.planRefs,
  };
  const reviewLinkage = {
    taskPacket: taskPacketRepoPath,
    evidence: evidenceRepoPath,
    reviewFile: reviewRepoPath,
    changeRef: parsedLinkage.changeRef,
    planRefs: parsedLinkage.planRefs,
  };

  const existingEvidence = readJsonObjectIfExists(evidencePath);
  const nextEvidence = {
    taskId,
    repo: existingEvidence?.repo ?? path.basename(root),
    agent: existingEvidence?.agent ?? { tool: 'other' },
    commands: existingEvidence?.commands ?? [],
    knownGaps: existingEvidence?.knownGaps ?? [],
    ...existingEvidence,
    taskId,
    graphChecks,
    linkage: {
      ...(existingEvidence?.linkage ?? {}),
      ...evidenceLinkage,
    },
  };

  const existingReview = extractReviewMachineReadable(reviewPath);
  const nextReview = {
    ...(existingReview?.machine ?? {}),
    taskId,
    verdict:
      typeof existingReview?.machine?.verdict === 'string' && existingReview.machine.verdict.trim() !== ''
        ? existingReview.machine.verdict
        : 'changes requested',
    structuralReview,
    linkage: {
      ...(existingReview?.machine?.linkage ?? {}),
      ...reviewLinkage,
    },
  };

  const nextReviewContent =
    existingReview?.machine && existingReview.content
      ? replaceReviewMachineReadable(existingReview.content, nextReview)
      : renderReview(taskId, nextReview, reviewLinkage, structuralReview);

  if (write) {
    fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
    fs.writeFileSync(evidencePath, `${JSON.stringify(nextEvidence, null, 2)}\n`);
    fs.writeFileSync(reviewPath, nextReviewContent);
  }

  return {
    taskId,
    written: write,
    importedFrom: imported?.file ?? null,
    taskPacket: taskPacketRepoPath,
    evidence: evidenceRepoPath,
    review: reviewRepoPath,
    graphChecks,
    structuralReview,
  };
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

  let result;
  try {
    result = scaffold(options.root, options.target, options.write, options.importFile, options);
  } catch (error) {
    console.error(error.message);
    return 1;
  }

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(
      `Graph review scaffold (${options.write ? 'write' : 'report-only'}): ${result.taskId}\n` +
        `  task packet: ${result.taskPacket}\n` +
        `  evidence: ${result.evidence}\n` +
        `  review: ${result.review}`,
    );
  }

  return 0;
}

process.exitCode = main();
