import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { collectSonarCloudReport, parseArgs } from '../../scripts/fetch-sonarcloud-report.mjs';

async function withFixtureRepo(callback) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pantheon-sonar-report-'));
  try {
    fs.writeFileSync(
      path.join(repoRoot, 'sonar-project.properties'),
      'sonar.projectKey=duanxldragon_pantheon-base\n',
      'utf8',
    );
    fs.writeFileSync(
      path.join(repoRoot, 'pantheon-sonarcloud.env'),
      'SONAR_HOST_URL=https://sonarcloud.io\nSONAR_TOKEN=report-token\n',
      'utf8',
    );
    await callback(repoRoot);
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

function mockFetch(url) {
  const pathname = new URL(String(url)).pathname;
  const payloadByPath = {
    '/api/project_analyses/search': {
      analyses: [
        {
          key: 'analysis-1',
          date: '2026-06-10T12:00:00+08:00',
          revision: 'abc123',
          events: [],
        },
      ],
    },
    '/api/qualitygates/project_status': {
      projectStatus: {
        status: 'ERROR',
        conditions: [
          {
            status: 'ERROR',
            metricKey: 'coverage',
            comparator: 'LT',
            errorThreshold: '80',
            actualValue: '3.5',
          },
        ],
      },
    },
    '/api/measures/component': {
      component: {
        measures: [
          { metric: 'coverage', value: '3.5' },
          { metric: 'duplicated_lines_density', value: '16.3' },
          { metric: 'alert_status', value: 'ERROR' },
        ],
      },
    },
    '/api/issues/search': {
      total: 2,
      issues: [
        {
          key: 'issue-1',
          rule: 'javascript:S3776',
          severity: 'MAJOR',
          type: 'CODE_SMELL',
          component: 'scripts/harness/check-review.mjs',
          line: 1,
          message: 'Cyclomatic complexity is too high.',
          status: 'OPEN',
        },
        {
          key: 'issue-2',
          rule: 'javascript:S7735',
          severity: 'MINOR',
          type: 'CODE_SMELL',
          component: 'scripts/harness/check-adoption.mjs',
          line: 2,
          message: 'Duplicate string.',
          status: 'OPEN',
        },
      ],
      facets: [
        {
          property: 'rules',
          values: [
            { val: 'javascript:S3776', count: 1 },
            { val: 'javascript:S7735', count: 1 },
          ],
        },
      ],
    },
  };

  const payload = payloadByPath[pathname];
  assert.ok(payload, `unexpected SonarCloud request: ${pathname}`);

  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    async text() {
      return JSON.stringify(payload);
    },
  };
}

test('parseArgs accepts task and output directory options', () => {
  const options = parseArgs([
    '--task',
    '2026-06-03-main-sonar-remediation',
    '--output-dir',
    'report-output',
    '--branch',
    'main',
  ]);

  assert.equal(options.taskId, '2026-06-03-main-sonar-remediation');
  assert.equal(options.branch, 'main');
  assert.match(options.outputDir, /report-output$/);
});

test('collectSonarCloudReport writes a SonarCloud report artifact', async () => {
  await withFixtureRepo(async (repoRoot) => {
    const previousToken = process.env.SONAR_TOKEN;
    const previousHost = process.env.SONAR_HOST_URL;
    process.env.SONAR_TOKEN = 'report-token';
    process.env.SONAR_HOST_URL = 'https://sonarcloud.io';

    try {
      const result = await collectSonarCloudReport({
        rootDir: repoRoot,
        taskId: '2026-06-03-main-sonar-remediation',
        envFile: 'pantheon-sonarcloud.env',
        branch: 'main',
        outputDir: path.join(repoRoot, 'report-output'),
        attempts: 1,
        waitMs: 0,
        fetchImpl: mockFetch,
      });

      assert.equal(result.report.status, 'complete');
      assert.equal(result.report.projectKey, 'duanxldragon_pantheon-base');
      assert.equal(result.report.branch, 'main');
      assert.equal(result.report.qualityGate.status, 'ERROR');
      assert.equal(result.report.latestAnalysis.revision, 'abc123');
      assert.equal(result.report.issues.total, 2);
      assert.equal(result.report.metrics.coverage.value, '3.5');
      assert.equal(result.report.metrics.duplicated_lines_density.value, '16.3');
      assert.equal(fs.existsSync(result.jsonPath), true);
      assert.equal(fs.existsSync(result.markdownPath), true);
      assert.match(fs.readFileSync(result.markdownPath, 'utf8'), /Quality gate: ERROR/);
    } finally {
      if (previousToken === undefined) {
        delete process.env.SONAR_TOKEN;
      } else {
        process.env.SONAR_TOKEN = previousToken;
      }
      if (previousHost === undefined) {
        delete process.env.SONAR_HOST_URL;
      } else {
        process.env.SONAR_HOST_URL = previousHost;
      }
    }
  });
});
