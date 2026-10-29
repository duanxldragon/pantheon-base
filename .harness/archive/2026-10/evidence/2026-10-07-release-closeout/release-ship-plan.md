# Release & Ship Plan — pantheon-base foundation closeout

Author: gstack-qa-lead · 2026-10-10 · assessment/planning only (nothing published, tagged, pushed or deleted)

## 0. Evidence snapshot (verified live)

| Fact | Value |
| --- | --- |
| GitHub main HEAD | `5bcbad32c5f9440eed0cac98f98151ed4a9892f9` (PR #367) |
| Latest GitHub Release | `pantheon-base-v0.14.0` → main@`722fa9e1` (2026-10-03) |
| Local `VERSION` | `0.14.0` · `SHELL_VERSION.json` = 1.4.0 |
| Open PRs | **#368** `fix/sonar-open-issues-zero` → main (head `45b5d71c`) |
| Remote branches | `main`, `fix/sonar-open-issues-zero`, `fix/post-merge-main-gates` |
| Stray local tag | `pantheon-base-v0.14.1` → `f767b9cc` (LOCAL ONLY, no GH Release, not on main) |
| main CI (5bcbad32) | FAIL: `Full Smoke` (1 test), `Release Gate`; Sonar job skipped |
| SonarCloud main | Quality Gate **OK**, but **6 unresolved `go:S1313` CODE_SMELL** in `backend/pkg/security/ssrf/validator.go` |

## 1. Version decision → **`pantheon-base-v0.15.0`** (locked by user)

Delta `722fa9e1..main` (+ PR #368) is content-wise patch-level (dependency dev bumps #359/#361/#362/#363, docs evidence #364, `VERSION` sync #360, CI/main-gate restoration #365/#366, Sonar cleanup #367/#368). **No new features, no API/DB/behavior change, no breaking change.**

- Exact version string: `0.15.0` (`VERSION` file) → tag `pantheon-base-v0.15.0` (annotated, `pantheon-base-vX.Y.Z` format).
- `release-line` argument: **`release/0.15`** (format is `release/<major>.<minor>`).
- **The user explicitly chose `v0.15.0`** (asked directly by team-lead). This is a deliberate minor-number bump over patch-level content and **overrides** the earlier maintainer-documented `v0.14.2` intent in `docs/harness/tasks/2026-09-29-v0140-release-completion.task.md:76` (*"maintainer selected `v0.14.2`…"*).
- Rationale for the number: it avoids collision with the in-tree `RELEASE_NOTES_v0.14.1.md` and the stale local-only `v0.14.1` tag, and sidesteps the v0.14.2-vs-v0.14.1 ambiguity entirely.
- Write a new `RELEASE_NOTES_v0.15.0.md`. Leave historical `RELEASE_NOTES_v0.14.1.md` as-is (never-published attempt).

## 2. Release Gate mechanics (`.github/workflows/release-gate.yml`)

Triggers: `push` to `main` and `workflow_dispatch` with input **`candidate_sha`** (defaults to HEAD). Pass requires ALL of:

1. **candidate-checks** — on the candidate SHA, these 6 check-runs present & `success`:
   `CI Summary`, `Quality Gates`, `Security Gates`, `Actionlint`, `Full Smoke`, `SonarCloud Code Analysis`.
2. **codeql-alerts** — 0 open CodeQL error/critical alerts.
3. **dependabot-alerts** — 0 open Dependabot high/critical alerts.
4. **sonarcloud-gate** (`needs: candidate-checks`) — analysis exists for candidate SHA on branch `main`, Quality Gate `OK`, **and 0 unresolved BUG/VULNERABILITY/CODE_SMELL**.
5. **open-prs** — advisory warning only.

`Release Gate Summary` fails if any of candidate/CodeQL/Dependabot/Sonar ≠ success. Note: on 5bcbad32 `SonarCloud Code Analysis` passed, but `SonarCloud Gate` was **skipped** because `candidate-checks` failed — Sonar skip is a *consequence*, not a root cause. `release:foundation:publish` independently requires a `success` **`Release Gate Summary`** check-run on the target commit.

## 3. Ship sequence (ordered runbook)

Legend: 🔒 = irreversible / needs human confirmation.

```bash
# ── STEP 0 — pre-flight (no writes)
git fetch --all --tags --prune
gh pr list --state open
gh run list --branch main --limit 10
```

**STEP 1 — fix the two hard blockers on main**
- 1a. **Full Smoke** — `frontend/tests/smoke/platform/shell-top-panels.spec.ts:67` fails at 390px: non-polled assertion `box.x + box.width <= viewport.width+1` (Expected ≤ 391). **Triage verdict: most likely a timing FLAKE, NOT a #367 layout regression** (see §1a-triage). Discriminator first, then harden the test.

### 1a-triage — regression vs flake (evidence)

- **#367 diff is layout-neutral.** `4648ce01`(last green Full Smoke) → `5bcbad32` = PR #367 only. #367 frontend changes are Sonar promise-shape refactors — `theme.ts` (`async` → `Promise.resolve`), `useRequest.ts` (`async () => run()` → `() => run()`), `i18n/index.ts` (`async () => ({})` → `() => Promise.resolve({})`), `UserFormModal.tsx` (default param) — all semantically equivalent — plus `smoke-core-fixtures.ts` in a *different* suite. **It touches no `frontend/src/core/layout/*` CSS/JSX and no panel data path** (confirmed by `git show 5bcbad32 --stat`).
- **Mechanism is a known race.** The notice panel is an Arco `<Dropdown trigger="click" position="br" triggerProps={{ autoFitPosition: true }}>`; `autoFitPosition` repositions asynchronously after mount. The test navigates with `waitUntil:'domcontentloaded'` (a pattern introduced in #263) and then does a **single, non-polled** `boundingBox()` read. Early navigation + async auto-fit + open transition ⇒ transient overflow. Panel width at 390px is CSS-deterministic (`@media max-width:768px` → `width: min(336px, calc(100vw-48px))` = 336px), so the failure is transient *position*, not a width change.
- **Caveat.** CI uses `retries:1` (`playwright.config.ts`), and *both* attempts failed in run 38045289645 — which leans toward a deterministic-on-CI race rather than a one-off. Still not attributable to #367 layout.

**Discriminator (do this first):**
```bash
gh run rerun 38045289645 --failed     # re-run Full Smoke on the SAME sha 5bcbad32
# or re-dispatch on current main:  gh workflow run smoke-full.yml --ref main
```
- Re-run **passes** ⇒ confirmed flake.
- Re-run **fails** ⇒ deterministic CI race; fix the test (below), not #367.

**Fix (hardens the measurement, keeps the containment guarantee):** replace the non-polled box read with a transition-settled poll:
```ts
await noticePanel.evaluate((el) =>
  Promise.all(el.getAnimations().map((a) => a.finished)).then(() => undefined));
await expect.poll(async () => {
  const b = await noticePanel.boundingBox();
  return b ? Math.round(b.x + b.width) : Number.POSITIVE_INFINITY;
}).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
```
(Do NOT relax the `≤ viewport+1` bound.) Land the smoke fix + #368 via squash-merge PR.
- 1b. **Sonar S1313**: merge **PR #368** (`fix/sonar-open-issues-zero`) which replaces hardcoded IPv4 literals in `backend/pkg/security/ssrf/validator.go`. After merge, confirm Sonar main = 0 unresolved.
- 1c. 🔒 Merge strategy: **squash merge is the only allowed strategy** on `main` (4 required checks; see `docs/harness/tasks/2026-09-29-v0140-release-completion.task.md:75`). Merging to `main` is a public, effectively irreversible action.

**STEP 2 — release-prep commit on main (must be the FINAL code SHA)**
- Edit `VERSION` → `0.15.0`; add `CHANGELOG.md` `## [pantheon-base-v0.15.0] — 2026-…` entry; write new `RELEASE_NOTES_v0.15.0.md` for the real delta (dep bumps + main-gate restore + Sonar cleanup); update `README.md` version/release-status lines (remove stale "v0.14.0 delivered / 所有 P0 阻塞项已解决 / 96%成熟度 生产就绪" claims at lines 19/21/23/34/202 — product-reviewer to supply wording).
- Commit + push to `main` via PR. Record the resulting **final SHA** `<FINAL_SHA>`.

**STEP 3 — wait for green on `<FINAL_SHA>` (all on that one SHA)**
```bash
gh run list --branch main --limit 12
gh api repos/duanxldragon/pantheon-base/commits/<FINAL_SHA>/check-runs?per_page=100
# require: CI Summary, Quality Gates, Security Gates, Actionlint, Full Smoke,
#          SonarCloud Code Analysis == success; Release Gate == success
curl -sf "https://sonarcloud.io/api/issues/search?componentKeys=duanxldragon_pantheon-base&branch=main&resolved=false&types=BUG,VULNERABILITY,CODE_SMELL&ps=1"   # total must be 0
```
If Release Gate did not auto-run green, re-dispatch on the same SHA:
```bash
gh workflow run release-gate.yml -f candidate_sha=<FINAL_SHA>
```

**STEP 4 — reconcile the stray branch `fix/post-merge-main-gates`** (3 unmerged commits: `47318dc6`, `0a54593b`, `007d079f`)
```bash
git log --oneline origin/main..origin/fix/post-merge-main-gates
git cherry -v origin/main origin/fix/post-merge-main-gates
```
Decide: **merge** (if the duplication refactor is still wanted) or **delete** (if superseded). 🔒 Deletion needs human confirmation.

**STEP 5 — main-only cleanup**
```bash
# delete the unpublished local phantom tag (content already on main; frees the v0.14.1 number)
git tag -d pantheon-base-v0.14.1                    # 🔒 local only, safe
# after merge/delete of stray branches:
git branch -d fix/sonar-open-issues-zero fix/post-merge-main-gates   # 🔒
git push origin --delete fix/sonar-open-issues-zero fix/post-merge-main-gates   # 🔒
```
Also flag the local/remote divergence of `pantheon-base-v0.14.0` (local annotated → `f7b11e38`, origin → `722fa9e1`) to maintainer before any tag op.

**STEP 6 — cut + publish the foundation release on `<FINAL_SHA>`** (clean worktree required; `dist/` and `releases/*/` are git-ignored so no new commit)
```bash
npm run release:foundation:cut \
  -- --release-version pantheon-base-v0.15.0 --release-line release/0.15 --base-commit <FINAL_SHA>
# dry-run first:
npm run release:foundation:publish -- \
  --release-version pantheon-base-v0.15.0 --release-line release/0.15 --base-commit <FINAL_SHA> --dry-run
# then real publish (creates annotated tag, pushes tag, creates GH Release, uploads assets):
npm run release:foundation:publish -- \
  --release-version pantheon-base-v0.15.0 --release-line release/0.15 --base-commit <FINAL_SHA>   # 🔒 IRREVERSIBLE
```
Publish validates: manifest version + `baseCommit==targetCommit`, clean worktree, `Release Gate Summary==success`, non-placeholder notes, tag/release not pre-existing.

**STEP 7 — consumer handoff note for `pantheon-ops`**
- Record released tag `pantheon-base-v0.15.0`, target `<FINAL_SHA>`, asset `foundation-release-pantheon-base-v0.15.0.tgz` + `.sha256`.
- Tell ops to update `foundation-release.lock.json` (version + sha256), bump `go.mod`/`package.json`, and re-run ops-side inherited smoke. No schema/migration change in this patch (compat mode unchanged).

## 4. Rollback plan

| Failure point | Action |
| --- | --- |
| Bad merge to `main` | `git revert <merge> && git push` (never force-push `main`). |
| Bad **local** tag | `git tag -d pantheon-base-v0.15.0` (safe, unpublished). |
| Bad **pushed** tag, no Release yet | `git push origin :refs/tags/pantheon-base-v0.15.0` then re-tag (🔒). |
| Bad GitHub Release | Delete the Release (🔒, `gh release delete … --cleanup-tag` only if the tag is also wrong), then re-publish after re-fixing; release assets are immutable — never overwrite, re-cut the version. |
| Deleted branch/tag needed again | Recreate from reflog/`origin` if the commit is still reachable; a force-deleted *remote* branch is unrecoverable without a known SHA. |
| Consumer pulled a bad bundle | Ops pins back to previous `pantheon-base-v0.14.0` lock (compat mode, no schema change). |

## 5. Verification checklist (prove each acceptance criterion)

```bash
# local branches == only main
git branch -a
git status --short --branch
# all PRs merged / none open
gh pr list --state open          # expect empty
gh pr list --state merged --limit 10
# CI green on main HEAD
gh run list --branch main --limit 12
# GitHub Release exists & points to <FINAL_SHA>
gh release list
gh release view pantheon-base-v0.15.0 --json tagName,targetCommitish,publishedAt
gh api repos/duanxldragon/pantheon-base/git/refs/tags/pantheon-base-v0.15.0
# tags on remote
git ls-remote --tags origin | grep 0.14
# harness tasks all completed
grep -L '"status": "completed"' .harness/tasks/*/manifest.json   # expect empty
```

## 6. Go / No-Go

**NO-GO (today).** Two hard blockers on the current main SHA: (1) `Full Smoke` failing `shell-top-panels.spec.ts`; (2) 6 unresolved Sonar `go:S1313`. Both have a clear fix path (STEP 1). **GO** once PR #368 is merged, the smoke regression is fixed, and Release Gate Summary is green on a single final main SHA.

## 7. Risks / unknowns

- **Environment limits**: `jq` is not on PATH in this Git-Bash (use the raw `curl` + API JSON, or Node). Go 1.26.9 download / native-cgo `tenant`+`race` remain un-runnable locally (hosted-only) — must be confirmed green in CI, not claimed locally.
- **Stray branch content**: `fix/post-merge-main-gates` may be intentionally superseded; merge-vs-delete is a human call.
- **Tag divergence**: local vs origin `v0.14.0` differ (`f7b11e38` vs `722fa9e1`); resolve before any tag operation to avoid publishing to the wrong base.
- **Sonar re-analysis timing**: the final SHA needs a fresh Sonar analysis before the gate's `sonarcloud-gate` can find 0 issues; allow the main-push analysis to complete.
- **README milestone**: no literal V1.0 milestone remains (dropped in #356), but README lines 21/23 still assert v0.14.0 "delivered / all P0 resolved", contradicting `.harness/STATUS.md` — confirm the intended "milestone removal" scope with product-reviewer.
