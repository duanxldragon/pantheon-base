import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildGithubOutput,
  collectLocalBranches,
  collectMergeTargets,
  collectOpenPRs,
  getBranchCommitDate,
  getPRStatus,
} from '../../scripts/collect-merge-targets.mjs';

function createBranch(name, date = '2026-06-20T00:00:00Z') {
  return {
    name,
    commit: {
      commit: {
        author: {
          date,
        },
      },
    },
  };
}

test('getPRStatus reads a single pull request status rollup', () => {
  const calls = [];
  const status = getPRStatus(42, {
    ghJsonFn(command) {
      calls.push(command);
      return {
        statusCheckRollup: [
          { conclusion: 'SUCCESS' },
          { conclusion: 'SUCCESS' },
        ],
      };
    },
  });

  assert.deepEqual(calls, ['pr view 42 --json statusCheckRollup']);
  assert.deepEqual(status, {
    passing: true,
    checks: [
      { conclusion: 'SUCCESS' },
      { conclusion: 'SUCCESS' },
    ],
    hasChecks: true,
  });
});

test('collectOpenPRs skips draft, external, and failing pull requests', () => {
  const result = collectOpenPRs({
    ghJsonFn(command) {
      if (command.startsWith('pr list --state open')) {
        return [
          {
            number: 1,
            title: 'Ready PR',
            headRefName: 'fix/ready',
            isDraft: false,
            author: { login: 'dev' },
          },
          {
            number: 2,
            title: 'Draft PR',
            headRefName: 'fix/draft',
            isDraft: true,
            author: { login: 'dev' },
          },
          {
            number: 3,
            title: 'Fork PR',
            headRefName: 'fork-owner:fix/external',
            isDraft: false,
            author: { login: 'external' },
          },
          {
            number: 4,
            title: 'Failing PR',
            headRefName: 'fix/failing',
            isDraft: false,
            author: { login: 'dev' },
          },
        ];
      }
      if (command === 'pr view 4 --json statusCheckRollup') {
        return { statusCheckRollup: [{ conclusion: 'FAILURE' }] };
      }
      return { statusCheckRollup: [{ conclusion: 'SUCCESS' }] };
    },
  });

  assert.deepEqual(result.eligible, [
    {
      type: 'pr',
      number: 1,
      title: 'Ready PR',
      branch: 'fix/ready',
      author: 'dev',
    },
  ]);
  assert.deepEqual(
    result.skipped.map((item) => item.reason),
    ['Draft PR', 'External fork PR', 'CI checks failing'],
  );
});

test('collectLocalBranches uses JSON merged PR data and skips merged or stale branches', () => {
  const commands = [];
  const result = collectLocalBranches({
    now: new Date('2026-06-27T00:00:00Z'),
    ghJsonFn(command) {
      commands.push(command);
      if (command.startsWith('api repos/{owner}/{repo}/branches')) {
        return [
          createBranch('main'),
          createBranch('release/1.0'),
          createBranch('fix/already-merged'),
          createBranch('fix/stale', '2026-05-01T00:00:00Z'),
          createBranch('fix/ready'),
        ];
      }
      if (command === 'pr list --state merged --limit 100 --json number,headRefName') {
        return [{ number: 10, headRefName: 'fix/already-merged' }];
      }
      throw new Error(`Unexpected command: ${command}`);
    },
  });

  assert.deepEqual(commands, [
    'api repos/{owner}/{repo}/branches?protected=false',
    'pr list --state merged --limit 100 --json number,headRefName',
  ]);
  assert.deepEqual(result.eligible, [
    {
      type: 'branch',
      name: 'fix/ready',
      lastCommit: '2026-06-20T00:00:00Z',
      daysOld: 7,
    },
  ]);
  assert.deepEqual(
    result.skipped.map((item) => item.reason),
    ['Already has merged PR', 'Stale branch (57 days old)'],
  );
});

test('getBranchCommitDate fetches commit detail when branch list only includes a sha', () => {
  const commands = [];
  const date = getBranchCommitDate(
    {
      name: 'fix/ready',
      commit: {
        sha: 'abc123',
      },
    },
    {
      ghJsonFn(command) {
        commands.push(command);
        return {
          commit: {
            author: {
              date: '2026-06-21T00:00:00Z',
            },
          },
        };
      },
    },
  );

  assert.equal(date, '2026-06-21T00:00:00Z');
  assert.deepEqual(commands, ['api repos/{owner}/{repo}/commits/abc123']);
});

test('collectLocalBranches supports the real GitHub branch API shape', () => {
  const result = collectLocalBranches({
    now: new Date('2026-06-27T00:00:00Z'),
    ghJsonFn(command) {
      if (command.startsWith('api repos/{owner}/{repo}/branches')) {
        return [
          {
            name: 'fix/ready',
            commit: {
              sha: 'abc123',
              url: 'https://api.github.com/repos/acme/demo/commits/abc123',
            },
          },
        ];
      }
      if (command === 'pr list --state merged --limit 100 --json number,headRefName') {
        return [];
      }
      if (command === 'api repos/{owner}/{repo}/commits/abc123') {
        return {
          commit: {
            author: {
              date: '2026-06-21T00:00:00Z',
            },
          },
        };
      }
      throw new Error(`Unexpected command: ${command}`);
    },
  });

  assert.deepEqual(result, {
    eligible: [
      {
        type: 'branch',
        name: 'fix/ready',
        lastCommit: '2026-06-21T00:00:00Z',
        daysOld: 6,
      },
    ],
    skipped: [],
  });
});

test('collectMergeTargets treats no eligible targets as a successful no-op summary', () => {
  const result = collectMergeTargets({
    now: new Date('2026-06-27T00:00:00Z'),
    ghJsonFn(command) {
      if (command.startsWith('pr list --state open')) {
        return [
          {
            number: 2,
            title: 'Draft PR',
            headRefName: 'fix/draft',
            isDraft: true,
            author: { login: 'dev' },
          },
        ];
      }
      if (command.startsWith('api repos/{owner}/{repo}/branches')) {
        return [createBranch('main')];
      }
      if (command === 'pr list --state merged --limit 100 --json number,headRefName') {
        return [];
      }
      throw new Error(`Unexpected command: ${command}`);
    },
  });

  assert.equal(result.hasPRs, false);
  assert.equal(result.hasBranches, false);
  assert.deepEqual(result.outputs, {
    has_prs: 'false',
    has_branches: 'false',
    pr_list: '[]',
    branch_list: '[]',
  });
});

test('buildGithubOutput writes multiline-safe GitHub Actions outputs', () => {
  assert.equal(
    buildGithubOutput({
      has_prs: 'false',
      pr_list: '[]',
    }),
    'has_prs<<EOF\nfalse\nEOF\npr_list<<EOF\n[]\nEOF',
  );
});
