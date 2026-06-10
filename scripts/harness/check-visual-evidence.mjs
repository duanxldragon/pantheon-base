#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_ROOT = process.cwd();

const UI_PATTERNS = [
  /frontend\/src/i,
  /\bUI\b/i,
  /\bvisual\b/i,
  /\blayout\b/i,
  /\bpage\b/i,
  /\bcomponent\b/i,
  /\bdashboard\b/i,
  /\btable\b/i,
  /\bform\b/i,
  /\bchart\b/i,
  /\bnavigation\b/i,
  /\bscreenshot/i,
  /\bviewport/i,
];

function printHelp() {
  console.log(`Usage:
  node scripts/harness/check-visual-evidence.mjs [--json] [--strict] [--root <path>]

Default behavior:
  Report visual evidence warnings and exit 0. Use --strict to exit 1 when warnings exist.

Examples:
  node scripts/harness/check-visual-evidence.mjs
  node scripts/harness/check-visual-evidence.mjs --json
  node scripts/harness/check-visual-evidence.mjs --strict
  node scripts/harness/check-visual-evidence.mjs --root /tmp/fixture --strict`);
}

function parseArgs(argv) {
  const options = { json: false, strict: false, help: false, root: DEFAULT_ROOT };
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

function readFiles(dir, suffix) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(suffix))
    .map((name) => path.join(dir, name))
    .sort((left, right) => left.localeCompare(right));
}

function toRepoPath(filePath, root) {
  return path.relative(root, filePath).replaceAll(path.sep, '/');
}

function taskIdFromPath(taskPath) {
  return path.basename(taskPath).replace(/\.task\.md$/, '');
}

function isUiTask(content) {
  return UI_PATTERNS.some((pattern) => pattern.test(content));
}

function hasViewportPlan(content) {
  return /\bviewport\b/i.test(content) && /\b(desktop|mobile|narrow|wide)\b/i.test(content);
}

function hasStatePlan(content) {
  return /\b(empty|loading|error|permission|forbidden|denied)\b/i.test(content);
}

function readEvidence(taskId, root) {
  const evidenceDir = path.join(root, '.harness', 'evidence', taskId);
  const commandsPath = path.join(evidenceDir, 'commands.json');
  const summaryPath = path.join(evidenceDir, 'summary.md');
  const screenshotsDir = path.join(evidenceDir, 'screenshots');
  const evidence = {
    dir: evidenceDir,
    exists: fs.existsSync(evidenceDir),
    hasScreenshots: false,
    hasBrowserEvidence: false,
    hasScreenshotGap: false,
  };

  if (fs.existsSync(screenshotsDir)) {
    evidence.hasScreenshots = fs
      .readdirSync(screenshotsDir)
      .some((name) => /\.(png|jpe?g|webp)$/i.test(name));
  }

  if (fs.existsSync(commandsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(commandsPath, 'utf8'));
      evidence.hasBrowserEvidence = Array.isArray(data.browserEvidence) && data.browserEvidence.length > 0;
      evidence.hasScreenshotGap =
        Array.isArray(data.knownGaps) &&
        data.knownGaps.some((gap) => /screenshot|visual|browser|viewport/i.test(String(gap)));
    } catch {
      evidence.hasScreenshotGap = true;
    }
  }

  if (fs.existsSync(summaryPath)) {
    const summary = fs.readFileSync(summaryPath, 'utf8');
    evidence.hasScreenshotGap ||= /screenshot|visual|browser|viewport/i.test(summary) && /not run|gap|unable|未运行|未截图|原因/i.test(summary);
  }

  return evidence;
}

function scanTasks(root) {
  const warnings = [];
  const uiTasks = [];
  const taskDir = path.join(root, 'docs', 'harness', 'tasks');

  for (const taskPath of readFiles(taskDir, '.task.md')) {
    const content = fs.readFileSync(taskPath, 'utf8');
    if (!isUiTask(content)) {
      continue;
    }

    const taskId = taskIdFromPath(taskPath);
    uiTasks.push(taskId);

    if (!hasViewportPlan(content)) {
      warnings.push({
        file: toRepoPath(taskPath, root),
        taskId,
        reason: 'UI task packet does not declare desktop/mobile viewport verification plan',
      });
    }

    if (!hasStatePlan(content)) {
      warnings.push({
        file: toRepoPath(taskPath, root),
        taskId,
        reason: 'UI task packet does not declare empty/loading/error/permission state verification plan',
      });
    }

    const evidence = readEvidence(taskId, root);
    if (!evidence.exists) {
      warnings.push({
        file: toRepoPath(taskPath, root),
        taskId,
        reason: 'UI task has no matching .harness/evidence directory',
      });
      continue;
    }

    if (!evidence.hasScreenshots && !evidence.hasBrowserEvidence && !evidence.hasScreenshotGap) {
      warnings.push({
        file: toRepoPath(evidence.dir, root),
        taskId,
        reason: 'UI task evidence has no screenshots/browser evidence and no recorded visual evidence gap',
      });
    }
  }

  return { uiTasks, warnings };
}

function printTextReport(result, strict) {
  const mode = strict ? 'strict' : 'report-only';
  console.log(
    `Visual evidence check (${mode}): ${result.uiTasks.length} UI task(s), ${result.warnings.length} warning(s)`,
  );
  if (result.warnings.length === 0) {
    console.log('\nno findings');
  }
  for (const warning of result.warnings) {
    console.log(`\nwarning: ${warning.file}`);
    console.log(`  task: ${warning.taskId}`);
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

  const result = scanTasks(options.root);
  if (options.json) {
    console.log(
      JSON.stringify(
        {
          mode: options.strict ? 'strict' : 'report-only',
          uiTaskCount: result.uiTasks.length,
          warningCount: result.warnings.length,
          uiTasks: result.uiTasks,
          warnings: result.warnings,
        },
        null,
        2,
      ),
    );
  } else {
    printTextReport(result, options.strict);
  }

  return options.strict && result.warnings.length > 0 ? 1 : 0;
}

process.exitCode = main();
