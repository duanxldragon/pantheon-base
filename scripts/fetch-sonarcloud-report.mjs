#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';
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

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--root requires a path');
      }
      options.root = path.resolve(value);
      index += 1;
    } else if (arg === '--env-file') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--env-file requires a file path');
      }
      options.envFile = value.trim();
      index += 1;
    } else if (arg === '--task') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--task requires a value');
      }
      options.taskId = value.trim();
      index += 1;
    } else if (arg === '--project-key') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--project-key requires a value');
      }
      options.projectKey = value.trim();
      index += 1;
    } else if (arg === '--branch') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--branch requires a value');
      }
      options.branch = value.trim();
      index += 1;
    } else if (arg === '--output-dir') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--output-dir requires a path');
      }
      options.outputDir = path.resolve(value);
      index += 1;
    } else if (arg === '--attempts') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--attempts requires a number');
      }
      options.attempts = Number.parseInt(value, 10);
      if (!Number.isFinite(options.attempts) || options.attempts < 1) {
        throw new Error('--attempts must be a positive integer');
      }
      index += 1;
    } else if (arg === '--wait-ms') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--wait-ms requires a number');
      }
      options.waitMs = Number.parseInt(value, 10);
      if (!Number.isFinite(options.waitMs) || options.waitMs < 0) {
        throw new Error('--wait-ms must be a non-negative integer');
      }
      index += 1;
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
  const url = new URL(endpoint, hostUrl.endsWith('/') ? hostUrl : `${hostUrl}/`);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    url.searchParams.set(key, String(value));
  }
  return url;
}

function authHeader(token) {
  return `Basic ${Buffer.from(`${token}:`, 'utf8').toString('base64')}`;
}

function responseSnippet(body) {
  const text = String(body ?? '').trim();
  if (!text) {
    return '';
  }
  return text.length > 240 ? `${text.slice(0, 240)}...` : text;
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

function renderMarkdown(report) {
  const lines = [
    '# SonarCloud Report',
    '',
    `- Project: \`${report.projectKey}\``,
    `- Branch: \`${report.branch}\``,
    `- Fetched at: ${report.fetchedAt}`,
    `- Status: ${report.status}`,
    `- Host: \`${report.hostUrl}\``,
  ];

  if (report.latestAnalysis) {
    lines.push(
      `- Latest analysis: ${report.latestAnalysis.date ?? 'n/a'}${report.latestAnalysis.revision ? ` (\`${report.latestAnalysis.revision}\`)` : ''}`,
    );
  } else {
    lines.push('- Latest analysis: n/a');
  }

  lines.push(
    `- Quality gate: ${report.qualityGate?.status ?? 'n/a'}`,
    `- Open issues: ${report.issues?.total ?? 'n/a'}`,
  );

  if (report.metrics && Object.keys(report.metrics).length > 0) {
    lines.push('', '## Metrics');
    for (const metricKey of DEFAULT_METRIC_KEYS) {
      const metric = report.metrics[metricKey];
      if (!metric) {
        continue;
      }
      lines.push(`- ${metricKey}: ${formatMetricValue(metricKey, metric.value)}`);
    }
  }

  if (report.issues?.facets?.rules?.length) {
    lines.push('', '## Top Rules');
    for (const facet of report.issues.facets.rules.slice(0, 10)) {
      lines.push(`- ${facet.value}: ${facet.count}`);
    }
  }

  if (report.errors?.length) {
    lines.push('', '## Errors');
    for (const error of report.errors) {
      lines.push(`- ${error.message}${error.status ? ` (${error.status})` : ''}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

async function collectSonarCloudReport({
  rootDir,
  outputDir,
  taskId,
  envFile,
  projectKey,
  branch,
  attempts,
  waitMs,
  fetchImpl = globalThis.fetch,
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

  const resolvedAttempts = Number.isFinite(attempts) && attempts > 0 ? attempts : DEFAULT_ATTEMPTS;
  const resolvedWaitMs = Number.isFinite(waitMs) && waitMs >= 0 ? waitMs : DEFAULT_WAIT_MS;

  let snapshot = null;
  let errors = [];
  for (let attempt = 1; attempt <= resolvedAttempts; attempt += 1) {
    const analysesUrl = buildUrl(hostUrl, '/api/project_analyses/search', {
      project: resolvedProjectKey,
      branch: resolvedBranch,
      ps: 1,
    });
    const qualityGateUrl = buildUrl(hostUrl, '/api/qualitygates/project_status', {
      projectKey: resolvedProjectKey,
      branch: resolvedBranch,
    });
    const measuresUrl = buildUrl(hostUrl, '/api/measures/component', {
      component: resolvedProjectKey,
      branch: resolvedBranch,
      metricKeys: DEFAULT_METRIC_KEYS.join(','),
    });
    const issuesUrl = buildUrl(hostUrl, '/api/issues/search', {
      componentKeys: resolvedProjectKey,
      branch: resolvedBranch,
      resolved: false,
      ps: 100,
      facets: 'rules,severities,types,directories',
    });

    const [analysesResult, qualityGateResult, measuresResult, issuesResult] = await Promise.all([
      safeFetchJson(analysesUrl, token, fetchImpl),
      safeFetchJson(qualityGateUrl, token, fetchImpl),
      safeFetchJson(measuresUrl, token, fetchImpl),
      safeFetchJson(issuesUrl, token, fetchImpl),
    ]);

    snapshot = {
      analysesResult,
      qualityGateResult,
      measuresResult,
      issuesResult,
      latestAnalysis: analysesResult.ok ? simplifyAnalysis(analysesResult.data) : null,
      qualityGate: qualityGateResult.ok ? simplifyQualityGate(qualityGateResult.data) : null,
      measures: measuresResult.ok ? simplifyMeasures(measuresResult.data) : {},
      issues: issuesResult.ok ? simplifyIssues(issuesResult.data) : { total: 0, issues: [], facets: {} },
    };
    errors = [analysesResult, qualityGateResult, measuresResult, issuesResult]
      .filter((result) => !result.ok)
      .map((result) => result.error);

    if (!shouldRetry(snapshot) || attempt === resolvedAttempts) {
      break;
    }

    await sleep(resolvedWaitMs);
  }

  const status = errors.length > 0 ? (snapshot?.latestAnalysis ? 'partial' : 'error') : shouldRetry(snapshot) ? 'pending' : 'complete';
  const report = {
    projectKey: resolvedProjectKey,
    branch: resolvedBranch,
    hostUrl,
    fetchedAt: new Date().toISOString(),
    status,
    latestAnalysis: snapshot?.latestAnalysis ?? null,
    qualityGate: snapshot?.qualityGate ?? null,
    metrics: snapshot?.measures ?? {},
    issues: snapshot?.issues ?? { total: 0, issues: [], facets: {} },
    errors,
  };

  const jsonPath = path.join(resolvedOutputDir, `${DEFAULT_OUTPUT_NAME}.json`);
  const markdownPath = path.join(resolvedOutputDir, `${DEFAULT_OUTPUT_NAME}.md`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(markdownPath, renderMarkdown(report), 'utf8');

  return {
    report,
    jsonPath,
    markdownPath,
    outputDir: resolvedOutputDir,
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
      console.log(`error: ${error.message}${error.status ? ` (${error.status})` : ''}`);
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
  parseArgs,
  parseKeyValueFile,
  readEnvFile,
  readProjectProperties,
  resolveBranchName,
  resolveHostUrl,
  resolveProjectKey,
  resolveToken,
  renderMarkdown,
};

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = await main();
}
