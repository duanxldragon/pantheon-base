#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const DEFAULT_ROOT = process.cwd();
const DEFAULT_ENV_FILE = 'pantheon-sonarcloud.env';
const DEFAULT_REPO = 'pantheon-base';
const DEFAULT_TASK_ID = '2026-06-03-main-sonar-remediation';
const BASELINE_NOT_RUN_GAP =
  'The runner and docs-side phases are validated, but the heavy remediation phases are still not run in this pass.';
const BACKEND_RACE_FALLBACK_GAP =
  'Local backend-tests evidence used `go test ./...` instead of `go test -race ./...` because this Windows environment does not mirror the ubuntu-latest race toolchain.';

export const PHASES = [
  {
    id: 'root-install',
    category: 'setup',
    cwd: '.',
    cwdLabel: 'pantheon-base',
    displayCommand: 'npm ci',
    command: () => 'npm ci',
    notes: 'install root dependencies before docs and repository quality checks',
  },
  {
    id: 'docs-frontmatter',
    category: 'quality-gates',
    cwd: '.',
    cwdLabel: 'pantheon-base',
    displayCommand: 'node scripts/frontmatter-check.mjs',
    command: () => 'node scripts/frontmatter-check.mjs',
    notes: 'repo-local docs governance gate',
  },
  {
    id: 'task-packet-template',
    category: 'quality-gates',
    cwd: '.',
    cwdLabel: 'pantheon-base',
    displayCommand: 'node scripts/check-task-packet-template.mjs',
    command: () => 'node scripts/check-task-packet-template.mjs',
    notes: 'repo-local task-packet template gate',
  },
  {
    id: 'generated-modules',
    category: 'quality-gates',
    cwd: '.',
    cwdLabel: 'pantheon-base',
    displayCommand: 'node frontend/scripts/cleanup-generated-modules.mjs --check',
    command: () => 'node frontend/scripts/cleanup-generated-modules.mjs --check',
    notes: 'repo-local generated-module hygiene gate',
  },
  {
    id: 'backend-tests',
    category: 'quality-gates',
    cwd: '.',
    cwdLabel: 'pantheon-base',
    displayCommand: 'go test -race ./...',
    command: ({ platform = process.platform } = {}) =>
      platform === 'win32' ? 'go test ./...' : 'go test -race ./...',
    notes: 'backend and shared package gate',
  },
  {
    id: 'frontend-install',
    category: 'setup',
    cwd: 'frontend',
    cwdLabel: 'pantheon-base/frontend',
    displayCommand: 'cd frontend && npm ci',
    command: () => 'npm ci',
    notes: 'install frontend dependencies before contract and build checks',
  },
  {
    id: 'frontend-menu-contract',
    category: 'frontend-contract',
    cwd: 'frontend',
    cwdLabel: 'pantheon-base/frontend',
    displayCommand: 'cd frontend && npm run check:menu-contract',
    command: () => 'npm run check:menu-contract',
    notes: 'frontend menu-contract gate',
  },
  {
    id: 'frontend-lint',
    category: 'frontend-contract',
    cwd: 'frontend',
    cwdLabel: 'pantheon-base/frontend',
    displayCommand: 'cd frontend && npm run lint',
    command: () => 'npm run lint',
    notes: 'frontend lint gate',
  },
  {
    id: 'frontend-build',
    category: 'frontend-contract',
    cwd: 'frontend',
    cwdLabel: 'pantheon-base/frontend',
    displayCommand: 'cd frontend && npm run build',
    command: () => 'npm run build',
    notes: 'frontend build gate',
  },
  {
    id: 'local-sonar',
    category: 'auxiliary-sonar',
    cwd: '.',
    cwdLabel: 'pantheon-base',
    displayCommand: String.raw`.\scripts\run-sonar.ps1`,
    command: ({ envFile = DEFAULT_ENV_FILE } = {}) =>
      process.platform === 'win32'
        ? `powershell -ExecutionPolicy Bypass -File scripts/run-sonar.ps1 -EnvFile "${envFile}"`
        : `pwsh -File scripts/run-sonar.ps1 -EnvFile "${envFile}"`,
    notes: 'local auxiliary Sonar scan after local whole-repo gate closure',
    runtimeSensitive: true,
  },
  {
    id: 'sonar-report',
    category: 'auxiliary-sonar',
    cwd: '.',
    cwdLabel: 'pantheon-base',
    displayCommand: 'node scripts/fetch-sonarcloud-report.mjs',
    command: ({ envFile = DEFAULT_ENV_FILE, taskId = DEFAULT_TASK_ID } = {}) =>
      `node scripts/fetch-sonarcloud-report.mjs --root "." --task "${taskId}" --env-file "${envFile}"`,
    notes: 'fetch the latest SonarCloud report into remediation evidence after the scan uploads',
    runtimeSensitive: true,
  },
];

export const GROUPS = {
  baseline: [
    'root-install',
    'docs-frontmatter',
    'task-packet-template',
    'generated-modules',
    'backend-tests',
    'frontend-install',
    'frontend-menu-contract',
    'frontend-lint',
    'frontend-build',
  ],
  'local-sonar': ['local-sonar', 'sonar-report'],
  all: PHASES.map((phase) => phase.id),
};

function normalizePath(value) {
  return String(value).replaceAll('\\', '/');
}

function phaseMap() {
  return new Map(PHASES.map((phase) => [phase.id, phase]));
}

export function resolvePhaseIds({ group = 'baseline', phaseArgs = [] } = {}) {
  const explicit = phaseArgs
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim())
    .filter(Boolean);
  const ids = explicit.length > 0 ? explicit : GROUPS[group];
  if (!ids) {
    throw new Error(`Unknown phase group: ${group}`);
  }

  const knownIds = new Set(PHASES.map((phase) => phase.id));
  for (const id of ids) {
    if (!knownIds.has(id)) {
      throw new Error(`Unknown phase id: ${id}`);
    }
  }

  return [...new Set(ids)];
}

export function resolvePhaseExecution(phase, options = {}) {
  const command = phase.command({
    envFile: options.envFile,
    platform: options.platform ?? process.platform,
    taskId: options.taskId ?? DEFAULT_TASK_ID,
  });
  const execution = { command };
  if (phase.id === 'backend-tests' && command !== phase.displayCommand) {
    execution.executionNotes =
      'local Windows execution fell back to `go test ./...`; `quality.yml` remains the authoritative `go test -race ./...` gate on ubuntu-latest';
    execution.knownGap = BACKEND_RACE_FALLBACK_GAP;
  }
  return execution;
}

export function resolvePhaseEnv(rootDir, phase, baseEnv = process.env) {
  const env = { ...baseEnv };
  if (phase.id === 'backend-tests' || phase.id === 'local-sonar') {
    const goCacheDir = path.join(rootDir, '.harness', 'cache', 'go-build');
    fs.mkdirSync(goCacheDir, { recursive: true });
    env.GOCACHE = goCacheDir;
  }
  return env;
}

// NOSONAR - CLI arg parser with natural if-else chain, restructuring would harm readability
function parseArgs(argv) {
  const options = {
    root: DEFAULT_ROOT,
    taskId: DEFAULT_TASK_ID,
    envFile: DEFAULT_ENV_FILE,
    group: 'baseline',
    phaseArgs: [],
    execute: false,
    continueOnFail: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--root requires a path');
      }
      options.root = path.resolve(value);
      index += 1;
    } else if (arg === '--task') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--task requires a task id');
      }
      options.taskId = value.trim();
      index += 1;
    } else if (arg === '--env-file') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--env-file requires a file path');
      }
      options.envFile = value.trim();
      index += 1;
    } else if (arg === '--group') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--group requires a group name');
      }
      options.group = value.trim();
      index += 1;
    } else if (arg === '--phase') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--phase requires a phase id');
      }
      options.phaseArgs.push(value.trim());
      index += 1;
    } else if (arg === '--execute') {
      options.execute = true;
    } else if (arg === '--continue-on-fail') {
      options.continueOnFail = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage:
  node scripts/run-sonar-remediation.mjs [--task <task-id>] [--group baseline|local-sonar|all] [--phase <phase-id>] [--env-file <file>] [--execute] [--continue-on-fail]

Examples:
  node scripts/run-sonar-remediation.mjs --task 2026-06-03-main-sonar-remediation
  node scripts/run-sonar-remediation.mjs --task 2026-06-03-main-sonar-remediation --phase docs-frontmatter --phase task-packet-template --execute
  node scripts/run-sonar-remediation.mjs --task 2026-06-03-main-sonar-remediation --group baseline --execute
  node scripts/run-sonar-remediation.mjs --task 2026-06-03-main-sonar-remediation --group local-sonar --env-file pantheon-sonarcloud.env --execute`);
}

function evidenceDir(rootDir, taskId) {
  return path.join(rootDir, '.harness', 'evidence', taskId);
}

function evidenceFile(rootDir, taskId) {
  return path.join(evidenceDir(rootDir, taskId), 'commands.json');
}

function summaryFile(rootDir, taskId) {
  return path.join(evidenceDir(rootDir, taskId), 'summary.md');
}

function reviewFile(rootDir, taskId) {
  return path.join(evidenceDir(rootDir, taskId), 'review.md');
}

function taskPacketPath(rootDir, taskId) {
  return path.join(rootDir, 'docs', 'harness', 'tasks', `${taskId}.task.md`);
}

function relativeFromRoot(rootDir, targetPath) {
  return normalizePath(path.relative(rootDir, targetPath));
}

function defaultPlanRefs(rootDir, taskId) {
  const planPath = path.join(rootDir, 'docs', 'superpowers', 'plans', `${taskId}-method.md`);
  if (!fs.existsSync(planPath)) {
    return [];
  }
  return [relativeFromRoot(rootDir, planPath)];
}

export function createDefaultEvidence(rootDir, taskId) {
  return {
    taskId,
    repo: DEFAULT_REPO,
    agent: {
      tool: 'codex',
      adapter: '.agents/adapters/codex.md',
    },
    commands: PHASES.map((phase) => ({
      command: phase.displayCommand,
      cwd: phase.cwdLabel,
      status: 'not-run',
      durationMs: 0,
      notes: `planned ${phase.category} phase`,
    })),
    runtimeSensitive: true,
    runtimeGap:
      'No fresh CI log, Sonar trace, or performance sample has been captured yet for this remediation task.',
    linkage: {
      taskPacket: normalizePath(path.join('docs', 'harness', 'tasks', `${taskId}.task.md`)),
      evidenceDir: `${normalizePath(path.join('.harness', 'evidence', taskId))}/`,
      reviewFile: normalizePath(path.join('.harness', 'evidence', taskId, 'review.md')),
      changeRef: 'none',
      planRefs: defaultPlanRefs(rootDir, taskId),
    },
    knownGaps: [
      'This evidence file is the execution log for the Sonar remediation chain and starts with all phases as not-run.',
    ],
    completedAt: new Date(0).toISOString(),
  };
}

function mergeEvidence(existing, rootDir, taskId) {
  const merged = {
    ...createDefaultEvidence(rootDir, taskId),
    ...existing,
  };
  merged.taskId = taskId;
  merged.repo = existing.repo ?? DEFAULT_REPO;
  merged.agent = {
    tool: 'codex',
    adapter: '.agents/adapters/codex.md',
    ...existing.agent,
  };
  merged.linkage = {
    ...createDefaultEvidence(rootDir, taskId).linkage,
    ...existing.linkage,
  };
  merged.commands = Array.isArray(existing.commands) ? [...existing.commands] : [];
  merged.knownGaps = Array.isArray(existing.knownGaps) ? [...existing.knownGaps] : [];
  if (Array.isArray(existing.runtimeLogs)) {
    merged.runtimeLogs = [...existing.runtimeLogs];
  }
  if (Array.isArray(existing.runtimeMetrics)) {
    merged.runtimeMetrics = [...existing.runtimeMetrics];
  }
  if (Array.isArray(existing.runtimeTraces)) {
    merged.runtimeTraces = [...existing.runtimeTraces];
  }
  if (Array.isArray(existing.runtimePerformance)) {
    merged.runtimePerformance = [...existing.runtimePerformance];
  }
  return merged;
}

function ensureFile(filePath, content) {
  if (fs.existsSync(filePath)) {
    return;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function syncKnownGap(evidence, gap, enabled) {
  const next = new Set(Array.isArray(evidence.knownGaps) ? evidence.knownGaps : []);
  if (enabled) {
    next.add(gap);
  } else {
    next.delete(gap);
  }
  evidence.knownGaps = [...next];
}

function reconcileEvidenceGaps(evidence) {
  const commandByDisplay = new Map(evidence.commands.map((entry) => [entry.command, entry]));
  const baselineComplete = GROUPS.baseline.every((phaseId) => {
    const phase = phaseMap().get(phaseId);
    const command = commandByDisplay.get(phase.displayCommand);
    return command && command.status !== 'not-run';
  });
  syncKnownGap(evidence, BASELINE_NOT_RUN_GAP, !baselineComplete);

  const backendCommand = commandByDisplay.get('go test -race ./...');
  const usedBackendFallback =
    Boolean(backendCommand) &&
    typeof backendCommand.notes === 'string' &&
    backendCommand.notes.includes('local Windows execution fell back to `go test ./...`');
  syncKnownGap(evidence, BACKEND_RACE_FALLBACK_GAP, usedBackendFallback);
}

export function ensureEvidenceState(rootDir, taskId) {
  const packetPath = taskPacketPath(rootDir, taskId);
  if (!fs.existsSync(packetPath)) {
    throw new Error(`Task packet not found: ${relativeFromRoot(rootDir, packetPath)}`);
  }

  const dir = evidenceDir(rootDir, taskId);
  fs.mkdirSync(path.join(dir, 'logs'), { recursive: true });

  let evidence = createDefaultEvidence(rootDir, taskId);
  const commandsPath = evidenceFile(rootDir, taskId);
  if (fs.existsSync(commandsPath)) {
    const existing = JSON.parse(fs.readFileSync(commandsPath, 'utf8'));
    evidence = mergeEvidence(existing, rootDir, taskId);
  }

  for (const phase of PHASES) {
    if (!evidence.commands.some((entry) => entry.command === phase.displayCommand)) {
      evidence.commands.push({
        command: phase.displayCommand,
        cwd: phase.cwdLabel,
        status: 'not-run',
        durationMs: 0,
        notes: `planned ${phase.category} phase`,
      });
    }
  }

  fs.writeFileSync(commandsPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');

  ensureFile(
    summaryFile(rootDir, taskId),
    `# Verification Summary: ${taskId}

## Scope

- Primary layer: \`platform\`
- Changed files:
  - \`docs/harness/tasks/${taskId}.task.md\`
  - \`.harness/evidence/${taskId}/commands.json\`

## Commands

| Command | CWD | Result | Notes |
|---|---|---|---|

## Browser Evidence

- none

## Known Gaps

- summarize residual risks and runtime gaps after each remediation batch

## Completion Status

partial
`,
  );

  ensureFile(
    reviewFile(rootDir, taskId),
    `# Review: ${taskId}

## Findings

- pending

## Assumptions

- review content should point at the same task packet and evidence directory

## Status

- pending
`,
  );

  return evidence;
}

function logFilePath(rootDir, taskId, phaseId) {
  const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
  return path.join(evidenceDir(rootDir, taskId), 'logs', `${stamp}-${phaseId}.log`);
}

export function recordPhaseResult(evidence, phaseId, patch, rootDir, taskId) {
  const phases = phaseMap();
  const phase = phases.get(phaseId);
  if (!phase) {
    throw new Error(`Unknown phase id: ${phaseId}`);
  }

  const index = evidence.commands.findIndex((entry) => entry.command === phase.displayCommand);
  const nextEntry = {
    command: phase.displayCommand,
    cwd: phase.cwdLabel,
    status: 'not-run',
    durationMs: 0,
    notes: phase.notes,
    ...(index >= 0 ? evidence.commands[index] : {}),
    ...patch,
  };

  if (index >= 0) {
    evidence.commands[index] = nextEntry;
  } else {
    evidence.commands.push(nextEntry);
  }

  if (phase.runtimeSensitive && patch.logPath) {
    const relativeLog = normalizePath(path.relative(rootDir, patch.logPath));
    const runtimeLogs = new Set(Array.isArray(evidence.runtimeLogs) ? evidence.runtimeLogs : []);
    runtimeLogs.add(relativeLog);
    evidence.runtimeLogs = [...runtimeLogs];
    delete evidence.runtimeGap;
  }

  reconcileEvidenceGaps(evidence);
  evidence.completedAt = new Date().toISOString();
  fs.writeFileSync(evidenceFile(rootDir, taskId), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
}

function executePhase(rootDir, taskId, phase, options, evidence) {
  const execution = resolvePhaseExecution(phase, options);
  const command = execution.command;
  const cwd = path.resolve(rootDir, phase.cwd);
  const env = resolvePhaseEnv(rootDir, phase, process.env);
  const startedAt = Date.now();
  const result = spawnSync(command, {
    cwd,
    encoding: 'utf8',
    shell: true,
    env,
  });
  const durationMs = Date.now() - startedAt;
  const logPath = logFilePath(rootDir, taskId, phase.id);
  const logBody = [
    `# phase: ${phase.id}`,
    `# cwd: ${cwd}`,
    `# plannedCommand: ${phase.displayCommand}`,
    `# command: ${command}`,
    `# gocache: ${env.GOCACHE ?? 'default'}`,
    `# exitCode: ${result.status ?? 'null'}`,
    '',
    '## execution',
    execution.executionNotes ?? 'direct',
    '',
    '## stdout',
    result.stdout ?? '',
    '',
    '## stderr',
    result.stderr ?? '',
    '',
  ].join('\n');
  fs.writeFileSync(logPath, logBody, 'utf8');

  const status = result.error || result.status !== 0 ? 'failed' : 'passed';
  const noteParts = [phase.notes];
  if (execution.executionNotes) {
    noteParts.push(execution.executionNotes);
  }
  noteParts.push(`log: ${relativeFromRoot(rootDir, logPath)}`);
  const notes = noteParts.join('; ');
  recordPhaseResult(
    evidence,
    phase.id,
    {
      status,
      durationMs,
      notes,
      logPath,
    },
    rootDir,
    taskId,
  );

  return {
    status,
    durationMs,
    command,
    logPath,
    exitCode: result.status ?? 1,
    error: result.error ?? null,
  };
}

function printPlan(taskId, phaseIds, options) {
  console.log(`Seeded Sonar remediation evidence for task "${taskId}".`);
  console.log(`Selected phases (${options.execute ? 'execute' : 'plan-only'}):`);
  const phases = phaseMap();
  for (const phaseId of phaseIds) {
    const phase = phases.get(phaseId);
    console.log(`- ${phase.id}: ${phase.displayCommand} [cwd=${phase.cwdLabel}]`);
  }
  if (!options.execute) {
    console.log('Re-run with --execute to run the selected phases and record their results.');
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

  let phaseIds;
  try {
    phaseIds = resolvePhaseIds({ group: options.group, phaseArgs: options.phaseArgs });
  } catch (error) {
    console.error(error.message);
    return 1;
  }

  let evidence;
  try {
    evidence = ensureEvidenceState(options.root, options.taskId);
  } catch (error) {
    console.error(error.message);
    return 1;
  }

  printPlan(options.taskId, phaseIds, options);
  if (!options.execute) {
    return 0;
  }

  const phases = phaseMap();
  for (const phaseId of phaseIds) {
    const phase = phases.get(phaseId);
    const result = executePhase(options.root, options.taskId, phase, options, evidence);
    console.log(
      `[${result.status.toUpperCase()}] ${phase.id} (${Math.round(result.durationMs)} ms) -> ${relativeFromRoot(options.root, result.logPath)}`,
    );
    if (result.status === 'failed' && !options.continueOnFail) {
      return result.exitCode || 1;
    }
  }

  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = main();
}
