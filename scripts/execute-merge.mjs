#!/usr/bin/env node
/**
 * execute-merge.mjs
 * Executes the actual merge of PRs and branches.
 * Merges PRs first, then pushes branches to create PRs if needed.
 * Supports solo developer mode (self-approval).
 */

import { execSync } from 'child_process';

const log = (msg) => console.log(`[execute-merge] ${msg}`);
const warn = (msg) => console.warn(`[execute-merge] WARN: ${msg}`);

// Get environment
const PR_LIST = process.env.PR_LIST || '[]';
const BRANCH_LIST = process.env.BRANCH_LIST || '[]';
const GH_REPO = process.env.GH_REPO || '';
const GH_TOKEN = process.env.GH_TOKEN || '';

const prs = JSON.parse(PR_LIST);
const branches = JSON.parse(BRANCH_LIST);

function gh(cmd, options = {}) {
  try {
    const fullCmd = `gh ${cmd} --repo ${GH_REPO}`;
    log(`Running: ${fullCmd}`);
    const result = execSync(fullCmd, {
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    return result;
  } catch (e) {
    if (options.ignoreError) {
      warn(`Command failed (ignored): ${e.message}`);
      return null;
    }
    throw e;
  }
}

// Self-approve PR for solo developer mode
async function selfApprovePR(prNumber) {
  log(`Self-approving PR #${prNumber} for solo developer mode...`);
  try {
    execSync(
      `gh api repos/{owner}/{repo}/pulls/${prNumber}/reviews -X POST -f event=APPROVE -f body="Auto-approved by auto-merge workflow (solo developer mode)" --repo ${GH_REPO}`,
      { encoding: 'utf-8' }
    );
    log(`✓ PR #${prNumber} self-approved`);
    return true;
  } catch (e) {
    warn(`Could not self-approve PR #${prNumber}: ${e.message}`);
    return false;
  }
}

// Merge a PR with squash
async function mergePR(pr) {
  log(`\nMerging PR #${pr.number}: ${pr.title}`);

  try {
    // Self-approve for solo developer
    await selfApprovePR(pr.number);

    // Enable auto-merge
    gh(`pr merge ${pr.number} --auto --squash --delete-branch --admin --force`);
    log(`✓ PR #${pr.number} merged successfully`);
    return { success: true, pr: pr.number };
  } catch (e) {
    warn(`Failed to merge PR #${pr.number}: ${e.message}`);
    return { success: false, pr: pr.number, error: e.message };
  }
}

// Create a PR from a branch if it doesn't exist
async function createPRFromBranch(branch) {
  log(`\nCreating PR for branch: ${branch.name}`);

  try {
    // Check if PR already exists
    const existingPRs = JSON.parse(execSync(
      `gh pr list --state open --json number,headRefName --repo ${GH_REPO}`,
      { encoding: 'utf-8' }
    ));

    const existing = existingPRs.find(pr => pr.headRefName === branch.name);
    if (existing) {
      log(`PR already exists for branch ${branch.name} (#${existing.number})`);
      return { success: true, branch: branch.name, pr: existing.number, action: 'already_exists' };
    }

    // Create PR
    const prUrl = gh(`pr create --title "Merge: ${branch.name}" --body "Auto-created PR from branch ${branch.name}" --base main`, { silent: true });
    log(`✓ PR created for branch ${branch.name}`);
    log(`  URL: ${prUrl}`);

    return { success: true, branch: branch.name, action: 'created' };
  } catch (e) {
    warn(`Failed to create PR for branch ${branch.name}: ${e.message}`);
    return { success: false, branch: branch.name, error: e.message };
  }
}

// Main merge execution
async function main() {
  log('Starting merge execution...');
  log(`PRs to merge: ${prs.length}`);
  log(`Branches to process: ${branches.length}`);

  const results = {
    prs: [],
    branches: [],
    errors: []
  };

  // First, merge all eligible PRs
  for (const pr of prs) {
    const result = await mergePR(pr);
    results.prs.push(result);
    if (!result.success) {
      results.errors.push(result);
    }
  }

  // Then, create PRs for branches if needed
  for (const branch of branches) {
    const result = await createPRFromBranch(branch);
    results.branches.push(result);
    if (!result.success) {
      results.errors.push(result);
    }
  }

  // Summary
  log('\n========== Merge Summary ==========');
  log(`PRs merged: ${results.prs.filter(r => r.success).length}/${results.prs.length}`);
  log(`Branches processed: ${results.branches.filter(r => r.success).length}/${results.branches.length}`);

  if (results.errors.length > 0) {
    log('\nErrors:');
    results.errors.forEach(e => log(`  - ${JSON.stringify(e)}`));
  }

  // Set outputs
  if (process.env.GITHUB_OUTPUT) {
    const outputs = [
      `merged_prs=${results.prs.filter(r => r.success).length}`,
      `failed_prs=${results.prs.filter(r => !r.success).length}`,
      `processed_branches=${results.branches.filter(r => r.success).length}`,
      `failed_branches=${results.branches.filter(r => !r.success).length}`,
      `results<<EOF\n${JSON.stringify(results, null, 2)}\nEOF`
    ].join('\n');

    execSync(`echo "${outputs}" >> ${process.env.GITHUB_OUTPUT}`, { shell: 'bash' });
  }

  // Exit with error if there were failures
  if (results.errors.length > 0) {
    warn(`\n${results.errors.length} merge(s) failed. Check logs above.`);
    process.exit(1);
  }

  log('\n✓ All merges completed successfully!');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
