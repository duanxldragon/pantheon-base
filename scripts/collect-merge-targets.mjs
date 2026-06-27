#!/usr/bin/env node
/**
 * collect-merge-targets.mjs
 * Collects PRs and branches that are ready to merge, excluding:
 * - Draft PRs
 * - PRs with CI failures (unless FORCE_MODE=true)
 * - Branches without corresponding PRs
 */

import { execSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const DRY_RUN = process.env.FORCE_MODE === 'dry-run';
const FORCE_MODE = process.env.FORCE_MODE === 'true';

const log = (msg) => console.log(`[collect-merge-targets] ${msg}`);
const warn = (msg) => console.warn(`[collect-merge-targets] WARN: ${msg}`);

// Run gh command with JSON output
function ghJson(cmd) {
  try {
    const result = execSync(`gh ${cmd}`, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
    return JSON.parse(result);
  } catch (e) {
    const stderr = e.stderr || '';
    if (stderr.includes('no open pull requests')) {
      return [];
    }
    throw e;
  }
}

// Check if PR has all CI checks passing
export function getPRStatus(prNumber, { ghJsonFn = ghJson } = {}) {
  try {
    const pullRequest = ghJsonFn(`pr view ${prNumber} --json statusCheckRollup`);
    const checks = Array.isArray(pullRequest?.statusCheckRollup)
      ? pullRequest.statusCheckRollup
      : [];
    if (checks.length === 0) {
      return { passing: true, checks: [], hasChecks: false };
    }
    const allPassing = checks.every((check) => check.conclusion === 'SUCCESS');
    return { passing: allPassing, checks, hasChecks: true };
  } catch (e) {
    warn(`Could not get status for PR #${prNumber}: ${e.message}`);
    return { passing: true, checks: [], hasChecks: false };
  }
}

// Get open PRs eligible for merge
export function collectOpenPRs({ ghJsonFn = ghJson, forceMode = FORCE_MODE } = {}) {
  log('Collecting open PRs...');
  const prs = ghJsonFn('pr list --state open --json number,title,headRefName,isDraft,mergeable,additions,deletions,author');

  log(`Found ${prs.length} open PR(s)`);

  const eligible = [];
  const skipped = [];

  for (const pr of prs) {
    // Skip draft PRs
    if (pr.isDraft) {
      skipped.push({ type: 'pr', number: pr.number, reason: 'Draft PR' });
      continue;
    }

    // Skip PRs not from the same repository (external forks)
    if (pr.headRefName.includes(':')) {
      skipped.push({ type: 'pr', number: pr.number, reason: 'External fork PR' });
      continue;
    }

    // Check CI status
    const status = getPRStatus(pr.number, { ghJsonFn });

    if (status.hasChecks && !status.passing) {
      if (forceMode) {
        warn(`PR #${pr.number} has failing checks, but FORCE_MODE=true, including anyway`);
      } else {
        skipped.push({ type: 'pr', number: pr.number, reason: 'CI checks failing', checks: status.checks });
        continue;
      }
    }

    eligible.push({
      type: 'pr',
      number: pr.number,
      title: pr.title,
      branch: pr.headRefName,
      author: pr.author?.login || 'unknown'
    });
  }

  return { eligible, skipped };
}

// Get local branches that have a tracking relationship or corresponding PR
export function collectLocalBranches({
  ghJsonFn = ghJson,
  forceMode = FORCE_MODE,
  now = new Date(),
} = {}) {
  log('Collecting local branches...');

  // Get all branches that are NOT main
  const branches = ghJsonFn('api repos/{owner}/{repo}/branches?protected=false')
    .filter(b => b.name !== 'main' && !b.name.startsWith('release/'));

  log(`Found ${branches.length} non-main branch(es)`);

  // Get PRs that are already merged
  const mergedPRs = ghJsonFn('pr list --state merged --limit 100 --json number,headRefName');

  const eligible = [];
  const skipped = [];

  for (const branch of branches) {
    // Find if there's a merged PR for this branch
    const mergedPR = mergedPRs.find(pr => pr.headRefName === branch.name);

    if (mergedPR) {
      skipped.push({ type: 'branch', name: branch.name, reason: 'Already has merged PR' });
      continue;
    }

    // Get the last commit date
    const branchCommitDate = getBranchCommitDate(branch, { ghJsonFn });
    const lastCommit = new Date(branchCommitDate);
    const daysOld = (now - lastCommit) / (1000 * 60 * 60 * 24);

    // Skip branches older than 30 days without activity
    if (daysOld > 30 && !forceMode) {
      skipped.push({ type: 'branch', name: branch.name, reason: `Stale branch (${Math.round(daysOld)} days old)` });
      continue;
    }

    eligible.push({
      type: 'branch',
      name: branch.name,
      lastCommit: branchCommitDate,
      daysOld: Math.round(daysOld)
    });
  }

  return { eligible, skipped };
}

export function getBranchCommitDate(branch, { ghJsonFn = ghJson } = {}) {
  const inlineDate = branch.commit?.commit?.author?.date;
  if (inlineDate) {
    return inlineDate;
  }

  const sha = branch.commit?.sha;
  if (!sha) {
    throw new Error(`Branch ${branch.name} does not include a commit sha`);
  }

  const commit = ghJsonFn(`api repos/{owner}/{repo}/commits/${sha}`);
  const commitDate = commit?.commit?.author?.date;
  if (!commitDate) {
    throw new Error(`Commit ${sha} for branch ${branch.name} does not include an author date`);
  }
  return commitDate;
}

export function buildGithubOutput(outputs) {
  return Object.entries(outputs).map(([key, value]) => `${key}<<EOF\n${value}\nEOF`).join('\n');
}

export function collectMergeTargets({
  ghJsonFn = ghJson,
  forceMode = FORCE_MODE,
  now = new Date(),
} = {}) {
  const prs = collectOpenPRs({ ghJsonFn, forceMode });
  const branches = collectLocalBranches({ ghJsonFn, forceMode, now });
  const hasPRs = prs.eligible.length > 0;
  const hasBranches = branches.eligible.length > 0;
  return {
    prs,
    branches,
    hasPRs,
    hasBranches,
    outputs: {
      has_prs: hasPRs ? 'true' : 'false',
      has_branches: hasBranches ? 'true' : 'false',
      pr_list: JSON.stringify(prs.eligible),
      branch_list: JSON.stringify(branches.eligible),
    },
  };
}

function writeGithubOutput(outputs, outputPath = process.env.GITHUB_OUTPUT) {
  if (!outputPath) {
    return;
  }
  appendFileSync(outputPath, `${buildGithubOutput(outputs)}\n`);
}

function main() {
  log('Starting merge target collection...');
  log(`Mode: ${DRY_RUN ? 'DRY-RUN' : FORCE_MODE ? 'FORCE' : 'NORMAL'}`);

  const { prs, branches, hasPRs, hasBranches, outputs } = collectMergeTargets();

  log(`\nSummary:`);
  log(`  Eligible PRs: ${prs.eligible.length}`);
  log(`  Eligible Branches: ${branches.eligible.length}`);
  log(`  Skipped: ${prs.skipped.length + branches.skipped.length}`);

  if (prs.skipped.length > 0) {
    log(`\nSkipped PRs:`);
    prs.skipped.forEach(s => log(`  #${s.number}: ${s.reason}`));
  }

  if (branches.skipped.length > 0) {
    log(`\nSkipped Branches:`);
    branches.skipped.forEach(s => log(`  ${s.name}: ${s.reason}`));
  }

  if (prs.eligible.length > 0) {
    log(`\nEligible PRs:`);
    prs.eligible.forEach(p => log(`  #${p.number}: ${p.title} (${p.branch})`));
  }

  // Output for GitHub Actions
  writeGithubOutput(outputs);

  log('\nCollection complete.');

  // Exit with error if there are issues but not in dry-run mode
  if (!hasPRs && !hasBranches) {
    warn('No eligible merge targets found.');
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
