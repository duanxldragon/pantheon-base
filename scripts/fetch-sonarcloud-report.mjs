#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const DEFAULT_ROOT = process.cwd();
const DEFAULT_ENV_FILE = 'pantheon-sonarcloud.env';
const DEFAULT_HOST_URL = 'https://sonarcloud.io';
const DEFAULT_PROJECT_KEY = 'duanxldragon_pantheon-base';
const DEFAULT_OUTPUT_NAME = 'sonarcloud-report';
const DEFAULT_WAIT_MS = 5000;
const DEFAULT_ATTEMPTS = 12;
const DEFAULT_METRIC_KEYS = [
  'alert_status',
  'coverage',
  'duplicated_lines_density',
  'open_issues',
  'bugs',
  'vulnerabilities',
  'security_hotspots',
  'security_hotspots_reviewed',
];

function normalizePath(value) {
  return String(value).replaceAll('\\', '/');
}

function parseKeyValueFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const entries = {};
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex < 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (!key) {
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
}

function readEnvFile(rootDir, envFile) {
  const envPath = path.isAbsolute(envFile) ? envFile : path.join(rootDir, envFile);
  return parseKeyValueFile(envPath);
}

function readProjectProperties(rootDir) {
  const propertiesPath = path.join(rootDir, 'sonar-project.properties');
  return parseKeyValueFile(propertiesPath);
}

function currentGitBranch(rootDir) {
  const result = spawnSync('git', ['branch', '--show-current'], {
    cwd: rootDir,
    encoding: 'utf8',
    shell: false,
  });
  if (result.status !== 0) {
    return '';
  }

  return String(result.stdout ?? '').trim();
}

function resolveBranchName(options, rootDir, env) {
  if (options.branch) {
    return options.branch;
  }

  const envBranch =
    env.SONAR_BRANCH_NAME?.trim() ||
    env.GITHUB_REF_NAME?.trim() ||
    env.GITHUB_HEAD_REF?.trim();
  if (envBranch) {
    return envBranch;
  }

  const gitBranch = currentGitBranch(rootDir);
  if (gitBranch && gitBranch !== 'HEAD') {
    return gitBranch;
  }

  return 'main';
}

function resolveProjectKey(options, rootDir, env, envFileVars) {
  return (
    options.projectKey?.trim() ||
    env.SONAR_PROJECT_KEY?.trim() ||
    envFileVars.SONAR_PROJECT_KEY?.trim() ||
    readProjectProperties(rootDir)['sonar.projectKey']?.trim() ||
    DEFAULT_PROJECT_KEY
  );
}

function resolveHostUrl(env, envFileVars) {
  return (
    env.SONAR_HOST_URL?.trim() ||
    envFileVars.SONAR_HOST_URL?.trim() ||
    DEFAULT_HOST_URL
  );
}

function resolveToken(env, envFileVars) {
  return env.SONAR_TOKEN?.trim() || envFileVars.SONAR_TOKEN?.trim() || '';
}

function readRequiredOptionValue(argv, index, flag, label) {
  const value = argv[index + 1];
  if (!value) {
    throw new Error(`${flag} requires ${label}`);
  }
  return value;
}

function parseIntegerOption(value, flag, minimum, description) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < minimum) {
    throw new Error(`${flag} must be ${description}`);
  }
  return parsed;
}

const ARGUMENT_HANDLERS = {
  '--root': (options, argv, index) => {
    options.root = path.resolve(readRequiredOptionValue(argv, index, '--root', 'a path'));
    return index + 1;
  },
  '--env-file': (options, argv, index) => {
    options.envFile = readRequiredOptionValue(argv, index, '--env-file', 'a file path').trim();
    return index + 1;
  },
  '--task': (options, argv, index) => {
    options.taskId = readRequiredOptionValue(argv, index, '--task', 'a value').trim();
    return index + 1;
  },
  '--project-key': (options, argv, index) => {
    options.projectKey = readRequiredOptionValue(argv, index, '--project-key', 'a value').trim();
    return index + 1;
  },
  '--branch': (options, argv, index) => {
    options.branch = readRequiredOptionValue(argv, index, '--branch', 'a value').trim();
    return index + 1;
  },
  '--output-dir': (options, argv, index) => {
    options.outputDir = path.resolve(readRequiredOptionValue(argv, index, '--output-dir', 'a path'));
    return index + 1;
  },
  '--attempts': (options, argv, index) => {
    options.attempts = parseIntegerOption(
      readRequiredOptionValue(argv, index, '--attempts', 'a number'),
      '--attempts',
      1,
      'a positive integer',
    );
    return index + 1;
  },
  '--wait-ms': (options, argv, index) => {
    options.waitMs = parseIntegerOption(
      readRequiredOptionValue(argv, index, '--wait-ms', 'a number'),
      '--wait-ms',
      0,
      'a non-negative integer',
    );
    return index + 1;
  },
};

function parseArgs(argv) {
  const options = {
    root: DEFAULT_ROOT,
    envFile: DEFAULT_ENV_FILE,
    taskId: '',
    projectKey: '',
    branch: '',
    outputDir: '',
    attempts: DEFAULT_ATTEMPTS,
    waitMs: DEFAULT_WAIT_MS,
    help: false,
  };

  let index = 0;
  while (index < argv.length) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      index += 1;
      continue;
    }

    const handler = ARGUMENT_HANDLERS[arg];
    if (!handler) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    index = handler(options, argv, index) + 1;
  }

  return options;
}

function printHelp() {
  console.log(`Usage:
  node scripts/fetch-sonarcloud-report.mjs [--root <repo-root>] [--task <task-id>] [--env-file <file>] [--project-key <key>] [--branch <name>] [--output-dir <dir>] [--attempts <n>] [--wait-ms <ms>]

Examples:
  node scripts/fetch-sonarcloud-report.mjs --task 2026-06-03-main-sonar-remediation
  node scripts/fetch-sonarcloud-report.mjs --root . --output-dir .harness/evidence/2026-06-03-main-sonar-remediation/logs
  node scripts/fetch-sonarcloud-report.mjs --branch main --output-dir sonar-report`);
}

function resolveOutputDir(options, rootDir) {
  if (options.outputDir) {
    return options.outputDir;
  }

  if (options.taskId) {
    return path.join(rootDir, '.harness', 'evidence', options.taskId, 'logs');
  }

  return path.join(rootDir, DEFAULT_OUTPUT_NAME);
}

function buildUrl(hostUrl, endpoint, params) {
  const url = new URL(endpoint, hostUrl.endsWith('/') ? hostUrl : hostUrl + '/');
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    url.searchParams.set(key, String(value));
  }
  return url;
}

function authHeader(token) {
  return 'Basic ' + Buffer.from(token + ':', 'utf8').toString('base64');
}

function responseSnippet(body) {
  const text = String(body ?? '').trim();
  if (!text) {
    return '';
  }
  return text.length > 240 ? text.slice(0, 240) + '...' : text;
}

async function fetchJson(url, token, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(url, {
    headers: {
      Authorization: authHeader(token),
      Accept: 'application/json',
    },
  });

  const text = await response.text();
  if (!response.ok) {
    const error = new Error(
      `SonarCloud request failed for ${url.pathname}${url.search} (${response.status} ${response.statusText})`,
    );
    error.status = response.status;
    error.body = responseSnippet(text);
    throw error;
  }

  if (!text) {
    return {};
  }

  return JSON.parse(text);
}

async function safeFetchJson(url, token, fetchImpl = globalThis.fetch) {
  try {
    return { ok: true, data: await fetchJson(url, token, fetchImpl) };
  } catch (error) {
    return {
      ok: false,
      error: {
        message: error.message,
        status: error.status ?? null,
        body: error.body ?? '',
      },
    };
  }
}

function formatMetricValue(metricKey, value) {
  if (value === undefined || value === null || value === '') {
    return 'n/a';
  }

  if (metricKey === 'coverage' || metricKey === 'duplicated_lines_density') {
    return `${value}%`;
  }

  return String(value);
}

function formatLatestAnalysisLine(latestAnalysis) {
  if (!latestAnalysis) {
    return '- Latest analysis: n/a';
  }

  const revisionSuffix = latestAnalysis.revision ? ' (`' + latestAnalysis.revision + '`)' : '';
  return '- Latest analysis: ' + (latestAnalysis.date ?? 'n/a') + revisionSuffix;
}

function formatErrorLine(error) {
  const statusSuffix = error.status ? ' (' + error.status + ')' : '';
  return '- ' + error.message + statusSuffix;
}

function simplifyAnalysis(analysisResponse) {
  const analyses = analysisResponse?.analyses ?? [];
  const latest = analyses[0];
  if (!latest) {
    return null;
  }

  return {
    key: latest.key ?? null,
    date: latest.date ?? null,
    revision: latest.revision ?? null,
    events: Array.isArray(latest.events) ? latest.events : [],
  };
}

function simplifyQualityGate(qualityGateResponse) {
  const projectStatus = qualityGateResponse?.projectStatus ?? null;
  if (!projectStatus) {
    return null;
  }

  return {
    status: projectStatus.status ?? null,
    conditions: Array.isArray(projectStatus.conditions)
      ? projectStatus.conditions.map((condition) => ({
          status: condition.status ?? null,
          metricKey: condition.metricKey ?? null,
          comparator: condition.comparator ?? null,
          errorThreshold: condition.errorThreshold ?? null,
          actualValue: condition.actualValue ?? null,
        }))
      : [],
  };
}

function simplifyMeasures(measuresResponse) {
  const measures = measuresResponse?.component?.measures ?? [];
  const result = {};
  for (const measure of measures) {
    if (!measure?.metric) {
      continue;
    }
    result[measure.metric] = {
      value: measure.value ?? null,
      bestValue: measure.bestValue ?? null,
      period: measure.period ?? null,
    };
  }
  return result;
}

function simplifyIssues(issuesResponse) {
  const issues = Array.isArray(issuesResponse?.issues) ? issuesResponse.issues : [];
  const facets = Array.isArray(issuesResponse?.facets) ? issuesResponse.facets : [];
  const facetMap = {};

  for (const facet of facets) {
    if (!facet?.property) {
      continue;
    }
    facetMap[facet.property] = Array.isArray(facet.values)
      ? facet.values.map((value) => ({
          value: value.val ?? null,
          count: value.count ?? null,
        }))
      : [];
  }

  return {
    total: Number(issuesResponse?.total ?? issues.length ?? 0),
    issues: issues.slice(0, 10).map((issue) => ({
      key: issue.key ?? null,
      rule: issue.rule ?? null,
      severity: issue.severity ?? null,
      type: issue.type ?? null,
      component: issue.component ?? null,
      line: issue.line ?? null,
      message: issue.message ?? null,
      status: issue.status ?? null,
    })),
    facets: facetMap,
  };
}

function shouldRetry(snapshot) {
  const readyQualityGate = snapshot.qualityGate?.status && snapshot.qualityGate.status !== 'NONE';
  const readyAnalysis = Boolean(snapshot.latestAnalysis);
  return !(readyQualityGate && readyAnalysis);
}

function resolveReportStatus(snapshot, errors) {
  if (errors.length > 0) {
    return snapshot?.latestAnalysis ? 'partial' : 'error';
  }

  if (shouldRetry(snapshot)) {
    return 'pending';
  }

  return 'complete';
}

function appendMetricLines(lines, metrics) {
  if (!metrics || Object.keys(metrics).length === 0) {
    return;
  }

  lines.push('', '## Metrics');
  for (const metricKey of DEFAULT_METRIC_KEYS) {
    const metric = metrics[metricKey];
    if (!metric) {
      continue;
    }
    lines.push('- ' + metricKey + ': ' + formatMetricValue(metricKey, metric.value));
  }
}

function appendTopRuleLines(lines, issues) {
  const rules = issues?.facets?.rules ?? [];
  if (rules.length === 0) {
    return;
  }

  lines.push('', '## Top Rules');
  for (const facet of rules.slice(0, 10)) {
    lines.push('- ' + facet.value + ': ' + facet.count);
  }
}

function appendErrorLines(lines, errors) {
  if (!errors?.length) {
    return;
  }

  lines.push('', '## Errors');
  for (const error of errors) {
    lines.push(formatErrorLine(error));
  }
}

function renderMarkdown(report) {
  const lines = [
    '# SonarCloud Report',
    '',
    '- Project: `' + report.projectKey + '`',
    '- Branch: `' + report.branch + '`',
    '- Fetched at: ' + report.fetchedAt,
    '- Status: ' + report.status,
    '- Host: `' + report.hostUrl + '`',
  ];

  lines.push(
    formatLatestAnalysisLine(report.latestAnalysis),
    '- Quality gate: ' + (report.qualityGate?.status ?? 'n/a'),
    '- Open issues: ' + (report.issues?.total ?? 'n/a'),
  );

  appendMetricLines(lines, report.metrics);
  appendTopRuleLines(lines, report.issues);
  appendErrorLines(lines, report.errors);

  return lines.join('\n') + '\n';
}

function resolveSonarCloudContext({
  rootDir,
  outputDir,
  taskId,
  envFile,
  projectKey,
  branch,
  attempts,
  waitMs,
} = {}) {
  const resolvedRoot = path.resolve(rootDir ?? DEFAULT_ROOT);
  const envFileVars = readEnvFile(resolvedRoot, envFile ?? DEFAULT_ENV_FILE);
  const env = process.env;
  const hostUrl = resolveHostUrl(env, envFileVars);
  const token = resolveToken(env, envFileVars);
  if (!token) {
    throw new Error(
      `SONAR_TOKEN is required. Provide it via environment or ${normalizePath(path.join(resolvedRoot, envFile ?? DEFAULT_ENV_FILE))}.`,
    );
  }

  const resolvedProjectKey = projectKey?.trim() || resolveProjectKey({ projectKey }, resolvedRoot, env, envFileVars);
  const resolvedBranch = resolveBranchName({ branch }, resolvedRoot, env);
  const resolvedOutputDir = path.resolve(resolveOutputDir({ outputDir, taskId }, resolvedRoot));
  fs.mkdirSync(resolvedOutputDir, { recursive: true });

  return {
    resolvedRoot,
    hostUrl,
    token,
    resolvedProjectKey,
    resolvedBranch,
    resolvedOutputDir,
    resolvedAttempts: Number.isFinite(attempts) && attempts > 0 ? attempts : DEFAULT_ATTEMPTS,
    resolvedWaitMs: Number.isFinite(waitMs) && waitMs >= 0 ? waitMs : DEFAULT_WAIT_MS,
  };
}

function buildSonarCloudUrls(hostUrl, projectKey, branch) {
  return {
    analysesUrl: buildUrl(hostUrl, '/api/project_analyses/search', {
      project: projectKey,
      branch,
      ps: 1,
    }),
    qualityGateUrl: buildUrl(hostUrl, '/api/qualitygates/project_status', {
      projectKey,
      branch,
    }),
    measuresUrl: buildUrl(hostUrl, '/api/measures/component', {
      component: projectKey,
      branch,
      metricKeys: DEFAULT_METRIC_KEYS.join(','),
    }),
    issuesUrl: buildUrl(hostUrl, '/api/issues/search', {
      componentKeys: projectKey,
      branch,
      resolved: false,
      ps: 100,
      facets: 'rules,severities,types,directories',
    }),
  };
}

async function fetchSonarCloudSnapshot(urls, token, fetchImpl = globalThis.fetch) {
  const [analysesResult, qualityGateResult, measuresResult, issuesResult] = await Promise.all([
    safeFetchJson(urls.analysesUrl, token, fetchImpl),
    safeFetchJson(urls.qualityGateUrl, token, fetchImpl),
    safeFetchJson(urls.measuresUrl, token, fetchImpl),
    safeFetchJson(urls.issuesUrl, token, fetchImpl),
  ]);

  const snapshot = {
    analysesResult,
    qualityGateResult,
    measuresResult,
    issuesResult,
    latestAnalysis: analysesResult.ok ? simplifyAnalysis(analysesResult.data) : null,
    qualityGate: qualityGateResult.ok ? simplifyQualityGate(qualityGateResult.data) : null,
    measures: measuresResult.ok ? simplifyMeasures(measuresResult.data) : {},
    issues: issuesResult.ok ? simplifyIssues(issuesResult.data) : { total: 0, issues: [], facets: {} },
  };
  const errors = [analysesResult, qualityGateResult, measuresResult, issuesResult]
    .filter((result) => !result.ok)
    .map((result) => result.error);

  return { snapshot, errors };
}

function createSonarCloudReport(context, snapshot, errors) {
  const report = {
    projectKey: context.resolvedProjectKey,
    branch: context.resolvedBranch,
    hostUrl: context.hostUrl,
    fetchedAt: new Date().toISOString(),
    status: resolveReportStatus(snapshot, errors),
    latestAnalysis: snapshot.latestAnalysis ?? null,
    qualityGate: snapshot.qualityGate ?? null,
    metrics: snapshot.measures ?? {},
    issues: snapshot.issues ?? { total: 0, issues: [], facets: {} },
    errors,
  };
  return report;
}

function writeSonarCloudReportArtifacts(report, outputDir) {
  const jsonPath = path.join(outputDir, `${DEFAULT_OUTPUT_NAME}.json`);
  const markdownPath = path.join(outputDir, `${DEFAULT_OUTPUT_NAME}.md`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(markdownPath, renderMarkdown(report), 'utf8');

  return {
    jsonPath,
    markdownPath,
    outputDir,
  };
}

async function collectSonarCloudReport(options = {}) {
  const context = resolveSonarCloudContext(options);
  const urls = buildSonarCloudUrls(context.hostUrl, context.resolvedProjectKey, context.resolvedBranch);
  const { snapshot, errors } = await fetchSonarCloudSnapshot(urls, context.token, options.fetchImpl ?? globalThis.fetch);
  const report = createSonarCloudReport(context, snapshot, errors);
  const artifacts = writeSonarCloudReportArtifacts(report, context.resolvedOutputDir);
  return {
    report,
    ...artifacts,
  };
}

function printSummary(result) {
  const { report, jsonPath, markdownPath } = result;
  console.log(`SonarCloud report written to ${normalizePath(jsonPath)}`);
  console.log(`SonarCloud summary written to ${normalizePath(markdownPath)}`);
  console.log(`Project: ${report.projectKey} [branch=${report.branch}]`);
  console.log(`Status: ${report.status}`);
  console.log(`Quality gate: ${report.qualityGate?.status ?? 'n/a'}`);
  console.log(`Latest analysis: ${report.latestAnalysis?.date ?? 'n/a'}`);
  console.log(`Open issues: ${report.issues?.total ?? 0}`);
  for (const metricKey of ['coverage', 'duplicated_lines_density', 'alert_status']) {
    const metric = report.metrics?.[metricKey];
    if (!metric) {
      continue;
    }
    console.log(`${metricKey}: ${formatMetricValue(metricKey, metric.value)}`);
  }
  if (report.errors?.length) {
    for (const error of report.errors) {
      console.log('error: ' + error.message + (error.status ? ' (' + error.status + ')' : ''));
    }
  }
}

async function main() {
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

  try {
    const result = await collectSonarCloudReport({
      rootDir: options.root,
      taskId: options.taskId,
      envFile: options.envFile,
      projectKey: options.projectKey,
      branch: options.branch,
      outputDir: options.outputDir,
      attempts: options.attempts,
      waitMs: options.waitMs,
    });
    printSummary(result);
  } catch (error) {
    console.error(error.message);
    return 1;
  }

  return 0;
}

export {
  collectSonarCloudReport,
  formatErrorLine,
  formatLatestAnalysisLine,
  parseArgs,
  parseKeyValueFile,
  readEnvFile,
  readProjectProperties,
  resolveBranchName,
  resolveHostUrl,
  resolveProjectKey,
  resolveToken,
  resolveReportStatus,
  renderMarkdown,
};

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = await main();
}
