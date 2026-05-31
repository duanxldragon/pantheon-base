# GitHub Native Quality Gates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Sonar-based gatekeeping with GitHub-native checks, add a repository-wide duplication gate, and make smoke-generated low-code artifacts ephemeral.

**Architecture:** Split the work into three independent lanes: CI gate wiring, smoke cleanup hardening, and docs/branch-protection updates. The CI lane owns workflow files and the duplication/security checks; the smoke lane owns cleanup behavior and its tests; the docs lane keeps the review contract and GitHub setup guidance aligned with the new gates.

**Tech Stack:** GitHub Actions, Node.js ESM scripts, Go tests already in-repo, `gh api` for branch protection.

---

### Task 1: Remove Sonar from required gate paths

**Files:**
- Modify: `.github/workflows/quality.yml`
- Modify: `.github/workflows/security.yml`
- Delete: `.github/workflows/sonar.yml`
- Modify: `.github/PULL_REQUEST_TEMPLATE.md`

- [ ] **Step 1: Read the current workflow and PR template text**

```bash
Get-Content .github/workflows/quality.yml
Get-Content .github/workflows/security.yml
Get-Content .github/PULL_REQUEST_TEMPLATE.md
```

- [ ] **Step 2: Remove Sonar jobs, status references, and template fields**

```yaml
# Keep GitHub-native checks only.
```

- [ ] **Step 3: Verify no Sonar references remain in required gate files**

```bash
rg -n "sonar|Sonar" .github/workflows .github/PULL_REQUEST_TEMPLATE.md
```

### Task 2: Add repository-wide duplication gate

**Files:**
- Add: `scripts/check-duplication.mjs`
- Add: `tests/scripts/check-duplication.test.mjs`
- Modify: `package.json`
- Add: `.github/workflows/duplication.yml`

- [ ] **Step 1: Write failing tests for the duplication gate script**

```js
test('reports duplicated code across two files and enforces the threshold', () => {});
```

- [ ] **Step 2: Run the test file and confirm it fails before implementation**

```bash
node --test tests/scripts/check-duplication.test.mjs
```

- [ ] **Step 3: Implement a dependency-free repository duplication checker**

```js
// Scan the repo, ignore generated/fixture paths, and fail when total duplication exceeds 3%.
```

- [ ] **Step 4: Wire the checker into npm scripts and GitHub Actions**

```json
{
  "scripts": {
    "check:duplication": "node scripts/check-duplication.mjs"
  }
}
```

- [ ] **Step 5: Re-run the tests and the new command**

```bash
node --test tests/scripts/check-duplication.test.mjs
npm run check:duplication
```

### Task 3: Harden smoke cleanup for generated low-code artifacts

**Files:**
- Modify: `frontend/scripts/run-smoke-suite.mjs`
- Modify: `frontend/scripts/run-smoke-suite.test.mjs`
- Modify: `frontend/scripts/cleanup-generated-modules.mjs`
- Modify: `frontend/scripts/cleanup-generated-modules.test.mjs`
- Modify: `frontend/package.json`
- Modify: `frontend/tests/smoke/README.md`

- [ ] **Step 1: Add failing tests for pre-run/post-run cleanup and empty generated dirs**

```js
test('run-smoke-suite cleans generated artifacts before and after playright runs', async () => {});
```

- [ ] **Step 2: Run the tests and confirm the missing cleanup behavior fails**

```bash
node --test frontend/scripts/run-smoke-suite.test.mjs frontend/scripts/cleanup-generated-modules.test.mjs
```

- [ ] **Step 3: Extend the runner so generated-module cleanup is enforced and fixture cleanup is opt-in by scope**

```js
// Cleanup before tests, after tests, and on failure when configured.
```

- [ ] **Step 4: Expand the generated-module cleanup to remove empty low-code smoke directories and stale registry markers**

```js
// Treat business/cmdb and similar smoke outputs as ephemeral.
```

- [ ] **Step 5: Update smoke scripts and README guidance to reflect the new cleanup contract**

```json
{
  "scripts": {
    "smoke:cleanup": "node scripts/cleanup-smoke-fixtures.mjs"
  }
}
```

### Task 4: Update governance docs and branch protection

**Files:**
- Modify: `docs/GITHUB_REPOSITORY_SETUP.md`
- Modify: `docs/GITHUB_REPOSITORY_SETUP.en.md`
- Modify: `docs/GITHUB_GOVERNANCE_CHECKLIST.md`
- Modify: `docs/GITHUB_GOVERNANCE_CHECKLIST.en.md`
- Modify: `docs/acceptances/CODE_REVIEW_STANDARD.md`
- Modify: `docs/acceptances/CODE_REVIEW_STANDARD.en.md`
- Modify: `docs/designs/WORKFLOW.md`
- Modify: `docs/designs/WORKFLOW.en.md`

- [ ] **Step 1: Remove Sonar required-check language and replace it with GitHub-native gate names**

```md
Quality Gates, Security Gates, Duplication Gate
```

- [ ] **Step 2: Update the review contract so duplication and security checks are first-class**

```md
full-repo duplication <= 3%
```

- [ ] **Step 3: Apply branch protection to `main` with the new required checks**

```bash
gh api repos/duanxldragon/pantheon-base/branches/main/protection
```

- [ ] **Step 4: Re-read the docs and confirm Sonar is gone**

```bash
rg -n "sonar|Sonar" docs .github
```

### Task 5: Verify, review, and commit

**Files:**
- All files changed in prior tasks

- [ ] **Step 1: Run the targeted test suite and workflow/script checks**

```bash
node --test tests/scripts/check-duplication.test.mjs frontend/scripts/run-smoke-suite.test.mjs frontend/scripts/cleanup-generated-modules.test.mjs
```

- [ ] **Step 2: Inspect the final diff for accidental Sonar leftovers or unrelated edits**

```bash
git diff --stat
```

- [ ] **Step 3: Commit the implementation**

```bash
git add .
git commit -m "feat: replace sonar gates with github-native checks"
```