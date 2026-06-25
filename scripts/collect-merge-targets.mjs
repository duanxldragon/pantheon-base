#!/usr/bin/env node
/**
 * collect-merge-targets.mjs
 * Collects PRs and branches that are ready to merge, excluding:
 * - Draft PRs
 * - PRs with CI failures (unless FORCE_MODE=true)
 * - Branches without corresponding PRs
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const DRY_RUN = process.env.FORCE_MODE === 'dry-run';
const FORCE_MODE = process.env.FORCE_MODE === 'true';

const log = (msg) => console.log(`[collect-merge-targets] ${msg}`);
const warn = (msg) => console.warn(`[collect-merge-targets] WARN: ${msg}`);
const error = (msg) => console.error(`[collect-merge-targets] ERROR: ${msg}`);

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
function getPRStatus(prNumber) {
  try {
    const statuses = ghJson(`pr status ${prNumber} --json statusCheckRollup`);
    if (statuses.length > 0 && statuses[0].statusCheckRollup) {
      const checks = statuses[0].statusCheckRollup;
      if (checks.length === 0) {
        return { passing: true, checks: [], hasChecks: false };
      }
      const allPassing = checks.every(c => c.conclusion === 'SUCCESS');
      return { passing: allPassing, checks, hasChecks: true };
    }
    return { passing: true, checks: [], hasChecks: false };
  } catch (e) {
    warn(`Could not get status for PR #${prNumber}: ${e.message}`);
    return { passing: true, checks: [], hasChecks: false };
  }
}

// Get open PRs eligible for merge
function collectOpenPRs() {
  log('Collecting open PRs...');
  const prs = ghJson('pr list --state open --json number,title,headRefName,isDraft,mergeable,additions,deletions,author');

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
    const status = getPRStatus(pr.number);

    if (status.hasChecks && !status.passing) {
      if (FORCE_MODE) {
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
function collectLocalBranches() {
  log('Collecting local branches...');

  // Get all branches that are NOT main
  const branches = ghJson('api repos/{owner}/{repo}/branches?protected=false')
    .filter(b => b.name !== 'main' && !b.name.startsWith('release/'));

  log(`Found ${branches.length} non-main branch(es)`);

  // Get PRs that are already merged
  const mergedPRs = ghJson('pr list --state merged --limit 100');

  const eligible = [];
  const skipped = [];

  for (const branch of branches) {
    // Check if this branch has an associated open PR
    const associatedPRs = branches.filter(b => b.name === branch.name);

    // Find if there's a merged PR for this branch
    const mergedPR = mergedPRs.find(pr => pr.headRefName === branch.name);

    if (mergedPR) {
      skipped.push({ type: 'branch', name: branch.name, reason: 'Already has merged PR' });
      continue;
    }

    // Get the last commit date
    const lastCommit = new Date(branch.commit.commit.author.date);
    const now = new Date();
    const daysOld = (now - lastCommit) / (1000 * 60 * 60 * 24);

    // Skip branches older than 30 days without activity
    if (daysOld > 30 && !FORCE_MODE) {
      skipped.push({ type: 'branch', name: branch.name, reason: `Stale branch (${Math.round(daysOld)} days old)` });
      continue;
    }

    eligible.push({
      type: 'branch',
      name: branch.name,
      lastCommit: branch.commit.commit.author.date,
      daysOld: Math.round(daysOld)
    });
  }

  return { eligible, skipped };
}

function main() {
  log('Starting merge target collection...');
  log(`Mode: ${DRY_RUN ? 'DRY-RUN' : FORCE_MODE ? 'FORCE' : 'NORMAL'}`);

  const prs = collectOpenPRs();
  const branches = collectLocalBranches();

  const hasPRs = prs.eligible.length > 0;
  const hasBranches = branches.eligible.length > 0;

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
  const outputs = {
    has_prs: hasPRs ? 'true' : 'false',
    has_branches: hasBranches ? 'true' : 'false',
    pr_list: JSON.stringify(prs.eligible),
    branch_list: JSON.stringify(branches.eligible)
  };

  // Write outputs to temp file for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    const outputLines = Object.entries(outputs).map(([k, v]) => `${k}<<EOF\n${v}\nEOF`).join('\n');
    execSync(`echo "${outputLines}" >> ${process.env.GITHUB_OUTPUT}`, { shell: 'bash' });
  }

  log('\nCollection complete.');

  // Exit with error if there are issues but not in dry-run mode
  if (!DRY_RUN && (prs.skipped.length > 0 || branches.skipped.length > 0) && !hasPRs && !hasBranches) {
    warn('No eligible merge targets found.');
    process.exit(1);
  }
}

main();
