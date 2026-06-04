# Pantheon Base Main Sonar Remediation Method Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize `pantheon-base` main-branch quality remediation by separating CI gate closure, Sonar auxiliary review, and module-by-module debt cleanup into one repeatable workflow.

**Architecture:** Treat GitHub-native checks as the correctness gate and Sonar as the main-branch debt dashboard. Work in batches: document baseline first, reproduce whole-repo checks locally, classify findings by layer and risk, land small verified fixes to `main`, then run a fresh full-repo Sonar scan on real merged code.

**Tech Stack:** Go, Node.js, GitHub Actions, SonarCloud, PowerShell, MySQL-backed backend tests, frontend lint/build/smoke contracts.

---

### Task 1: Lock the source of truth before fixing anything

**Files:**
- Read: `DESIGN.md`
- Read: `docs/README.md`
- Read: `docs/designs/PANTHEON_BASE_ARCHITECTURE_OVERVIEW.md`
- Read: `docs/designs/QUALITY_AND_SECURITY_STRATEGY.md`
- Read: `docs/designs/WORKFLOW.md`
- Read: `docs/acceptances/CODE_REVIEW_STANDARD.md`
- Read: `docs/acceptances/ACCEPTANCE_CHECKLIST.md`
- Read: `docs/designs/I18N_MODULE_DESIGN.md`
- Read: `docs/designs/SYSTEM_ORG_DESIGN.md`

- [ ] **Step 1: Re-read the platform and quality governance docs before any code change**

Run:

```powershell
Get-Content DESIGN.md
Get-Content docs/README.md
Get-Content docs/designs/PANTHEON_BASE_ARCHITECTURE_OVERVIEW.md
Get-Content docs/designs/QUALITY_AND_SECURITY_STRATEGY.md
Get-Content docs/designs/WORKFLOW.md
Get-Content docs/acceptances/CODE_REVIEW_STANDARD.md
Get-Content docs/acceptances/ACCEPTANCE_CHECKLIST.md
```

Expected: clear confirmation of layer boundaries, acceptance rules, and the current policy that GitHub checks are the merge gate while Sonar is an auxiliary review tool.

- [ ] **Step 2: Re-read the design anchors for the modules currently failing or likely to drift**

Run:

```powershell
Get-Content docs/designs/I18N_MODULE_DESIGN.md
Get-Content docs/designs/SYSTEM_ORG_DESIGN.md
```

Expected: `i18n` fixes align to builtin-locale and `locale + key` runtime rules; `org` fixes align to `system_dept/system_post/system_user` governance rules instead of ad hoc test assumptions.

- [ ] **Step 3: Record the working rules for this remediation batch**

Rule set:

```text
1. Fix pantheon-base first, because ops inherits the system core from base.
2. Scan and test the whole repository; do not narrow Sonar scope to make numbers look better.
3. Do not trust a Sonar failure until GitHub-native tests and coverage generation are green.
4. Keep fixes small, module-scoped, and merged into main before trusting a new main-branch Sonar result.
```

### Task 2: Rebuild the real baseline from main instead of chasing stale branch signals

**Files:**
- Read: `.github/workflows/quality.yml`
- Read: `.github/workflows/duplication.yml`
- Read: `.github/workflows/sonar.yml`
- Read: `sonar-project.properties`
- Read: `package.json`
- Read: `frontend/package.json`

- [ ] **Step 1: Verify what actually gates merges and what only produces review data**

Run:

```powershell
Get-Content .github/workflows/quality.yml
Get-Content .github/workflows/duplication.yml
Get-Content .github/workflows/sonar.yml
Get-Content sonar-project.properties
```

Expected:

```text
- Quality Gates is the GitHub-native merge gate.
- Duplication Gate is a separate GitHub-native gate.
- SonarCloud Auxiliary Scan is manual workflow_dispatch only.
- sonar.sources covers backend, frontend, scripts, and database for full-repo scans.
```

- [ ] **Step 2: Pull the latest `main` and create one fresh remediation worktree**

Run:

```powershell
git fetch origin
git checkout main
git pull origin main
git worktree add .worktrees/main-sonar-remediation -b fix/base-main-sonar-remediation origin/main
```

Expected: a clean worktree based on the latest merged `main`, not an older PR branch with stale checks.

- [ ] **Step 3: Capture the exact baseline before changing code**

Run:

```powershell
git status --short --branch
gh run list --limit 10
gh pr list
```

Expected: one clean branch, a short list of active PRs only, and a baseline record of the current GitHub workflow state before remediation begins.

### Task 3: Reproduce the whole-repo quality path locally before touching Sonar

**Files:**
- Read: `frontend/tests/smoke/README.md`
- Modify later as needed: backend tests and frontend contract scripts implicated by failures

- [ ] **Step 1: Run the backend path that the real gate depends on**

Run:

```powershell
go test -race ./...
```

Expected: reproduce backend and shared Go package failures exactly as `Quality Gates` sees them.

- [ ] **Step 2: Run the frontend contract path that the real gate depends on**

Run:

```powershell
Set-Location frontend
npm ci
npm run lint
npm run build
Set-Location ..
```

Expected: reproduce menu contract, i18n hardcode, build, and smoke coverage drift before any Sonar scan discussion.

- [ ] **Step 3: Run the repository-level duplication gate**

Run:

```powershell
npm ci
npm run check:duplication -- --json
```

Expected: a real duplication percentage for the whole repository, with generated and fixture exclusions defined by the in-repo script instead of by Sonar guesswork.

- [ ] **Step 4: Only after local green or known residual failures, run the manual Sonar path**

Run:

```powershell
go test ./... -coverprofile=coverage.out
.\scripts\run-sonar.ps1
```

Expected: Sonar receives a coverage file generated from the same repository state that already passed or nearly passed local CI reproduction.

### Task 4: Triage by finding class, not by whatever failed last

**Files:**
- Modify by batch, depending on findings
- Typical areas: `backend/modules/system/**`, `frontend/src/modules/system/**`, `frontend/scripts/**`, `tests/**`

- [ ] **Step 1: Split findings into four buckets**

Buckets:

```text
A. Gate blockers: failing backend tests, frontend build/lint/contract failures, broken duplication gate
B. Sonar structural debt: hotspots, open issues, duplicated blocks, insufficient new-code coverage
C. Fixture drift: tests that no longer match schema or canonical resources
D. Documentation or workflow drift: CI names, review rules, manual scan instructions
```

Expected: each finding belongs to exactly one first-response bucket before any code patch is written.

- [ ] **Step 2: Prioritize by blast radius**

Priority order:

```text
1. Shared runtime or shared contracts
2. system/auth, system/iam, system/config, system/org, audit, generator, CI
3. Test fixture and smoke drift
4. Sonar-only maintainability cleanup
```

Expected: no time is spent polishing low-risk Sonar issues while gate blockers or shared-module drift still exist.

- [ ] **Step 3: Refuse mixed-purpose patches**

Rule:

```text
One patch = one coherent batch.
Do not combine branch cleanup, workflow rewiring, test fixture repair, and module feature fixes in the same commit.
```

Expected: each remediation commit has a clear verification story and can be rolled forward cleanly.

### Task 5: Fix in vertical batches with contract-aware tests

**Files:**
- Typical backend examples:
  - `backend/modules/system/i18n/*`
  - `backend/modules/system/org/dept/*`
  - `backend/modules/system/audit/*`
  - `backend/modules/auth/*`
- Typical frontend/examples:
  - `frontend/src/modules/system/**`
  - `frontend/scripts/**`
  - `frontend/tests/smoke/**`

- [ ] **Step 1: For each failing module, write down the contract before editing**

Template:

```text
Module:
Contract/design doc:
Runtime source of truth:
Current failure:
Why this is a product bug, test drift, fixture drift, or workflow drift:
```

Expected: no test is changed until the canonical contract and source of truth are explicit.

- [ ] **Step 2: Run targeted tests first, then whole-repo tests**

Run pattern:

```powershell
go test ./backend/modules/system/i18n -count=1
go test ./backend/modules/system/org/dept -count=1
go test ./backend/... -count=1
go test -race ./...
```

Expected: each batch closes locally at module scope before being trusted at repository scope.

- [ ] **Step 3: Keep coverage growth attached to real behavior, not synthetic files**

Rule:

```text
Increase coverage by adding or fixing tests around real services, handlers, contracts, and scripts already included in repository scans.
Do not create throwaway files or narrow scan scope to inflate coverage.
```

Expected: coverage increases survive main-branch scans and remain meaningful for base and inherited ops code.

- [ ] **Step 4: Commit each closed batch immediately**

Run:

```powershell
git add <touched files>
git commit -m "fix(system-config): align i18n builtin locale contract"
```

Expected: a short series of auditable commits instead of one large unstable remediation branch.

### Task 6: Use main as the only trustworthy Sonar target

**Files:**
- No mandatory file edits in this task

- [ ] **Step 1: Open a PR only after local whole-repo verification is done**

Run:

```powershell
git status --short
go test -race ./...
Set-Location frontend
npm run lint
npm run build
Set-Location ..
npm run check:duplication -- --json
```

Expected: the PR is used to transport already-verified changes, not to discover the first real failures.

- [ ] **Step 2: Merge to `main`, then trigger the manual Sonar scan on merged code**

Run:

```powershell
gh pr create
gh pr checks <pr-number> --watch
gh pr merge <pr-number>
gh workflow run sonar.yml --ref main
gh run watch <sonar-run-id>
```

Expected: the Sonar result corresponds to the real `main` branch, which matches the user's stated target.

- [ ] **Step 3: Treat stale Sonar screenshots as a workflow or prerequisite problem first**

Diagnosis rule:

```text
If the dashboard still shows an old result, check:
1. Was main actually updated?
2. Did the manual sonar workflow run on main?
3. Did coverage generation succeed before the scan?
4. Is Sonar still displaying the last successful analysis because the new run failed early?
```

Expected: stale dashboards are debugged systematically instead of triggering more random code edits.

### Task 7: Sync the cleaned base into ops only after base is stable

**Files:**
- Later in `pantheon-ops`, based on the same base-core files

- [ ] **Step 1: Freeze ops remediation until the corresponding base batch is merged**

Rule:

```text
Do not fork base-core fixes manually into ops before the base source of truth is stable on main.
```

Expected: no duplicate debugging across two repositories for the same inherited module.

- [ ] **Step 2: Port base changes into ops as a second pass**

Run:

```powershell
git fetch origin
git checkout main
git pull origin main
git cherry-pick <base-fix-commit>   # or sync via merge/rebase, depending on repo relationship
```

Expected: ops only carries business-specific deltas after the base core is already corrected.

- [ ] **Step 3: Re-run the same gate order in ops**

Run order:

```text
1. GitHub-native tests/contracts/duplication
2. Manual Sonar scan on main
3. Only then handle residual ops-only findings
```

Expected: ops inherits a stable quality process instead of re-learning the same failures independently.

### Task 8: Verification and closeout discipline

**Files:**
- Modify as needed: PR description, acceptance notes, remediation notes

- [ ] **Step 1: Record evidence for every closed batch**

Record:

```text
- local commands run
- exact failing symptom before the fix
- exact passing result after the fix
- whether the issue was product, fixture, contract, CI, or Sonar-only
```

Expected: each fix can be explained and re-verified without re-reading the entire branch history.

- [ ] **Step 2: Do a final repository-wide pass before declaring success**

Run:

```powershell
go test -race ./...
Set-Location frontend
npm run lint
npm run build
Set-Location ..
npm run check:duplication -- --json
gh workflow run sonar.yml --ref main
```

Expected: one consistent proof set for gates plus one fresh Sonar analysis on `main`.

- [ ] **Step 3: Close or delete stale PRs and branches only after the evidence is preserved**

Run:

```powershell
gh pr list
git branch
git branch -r
```

Expected: branch cleanup happens after the quality state is known, not while the repository is still mid-remediation.
