# 2026-09-23 governance residual closeout

Close the residuals the 2026-09-22 rounds flagged but could not fix inside their
own scope. Every item below was named in a prior packet's `technicalDebtNote`,
evidence `knownGaps` or review `residualRisks` — none is new scope invented here.

## Items and what actually changed

| # | Residual | Fix | Ratchet |
| --- | --- | --- | --- |
| 1 | Two real dev credentials committed (`docs/README.md`, 2 evidence transcripts, plus a hardcoded fallback list in `frontend/scripts/database-import-qa-setup.mjs`) | Placeholders in docs; redaction in transcripts; the QA script now takes probe passwords from `PANTHEON_SMOKE_MYSQL_PASSWORD_CANDIDATES` | `tests/scripts/generated-marker-consistency.test.mjs` neighbours a credential sweep in review; the QA-script test pins that no credential is hardcoded |
| 2 | `pkg/testredis` read only `PANTHEON_TEST_REDIS_ADDR`, but `quality.yml`'s required `backend-tests` job sets `PANTHEON_REDIS_ADDR` → every Redis-backed test in that gate skipped silently | Helper accepts `PANTHEON_TEST_REDIS_ADDR` / `PANTHEON_REDIS_ADDR` / `REDIS_ADDR` (same for passwords); `PANTHEON_TEST_REDIS_REQUIRED=true` turns a missing address into a failure; both Go test jobs set it | `backend/pkg/testredis/redis_test.go` pins the accepted names and the fail/skip decision |
| 3 | Three stale `auth -> system/iam/user` baseline entries survived the `pkg/contracts/authuser` port | Entries removed; `--strict` now fails on any stale entry (an entry still whitelists its file+import pair) | Negative probe in evidence: one stale entry ⇒ exit 1 |
| 4 | `scripts/check-arch-boundaries.mjs` unwired, overlapping, and its `checkSystemCrossDependency` matched `service|repository|handler` dirs that do not exist | Deleted. Its only live intent is now a real rule in `check-boundaries.mjs`: a `system/*` subdomain may not import a sibling subdomain, only the composition root wires them | Probe import is reported as a finding |
| 5 | `check-task-packet.mjs` reported 166 errors over 28 docs, all of them pre-template history, so a plain run was meaningless | Legacy docs listed by name in `config/task-packet-legacy-docs.json`; a listed doc that disappears is an error; `--include-legacy` still reproduces the old report; wired into the docs-governance job | Stale-entry probe exits 1 |
| 6 | The generator emitted module files that `check:generated` could not identify | `ModuleExporter.generateAll()` prefixes the contract marker (Go's `^// Code generated .* DO NOT EDIT\.$` convention) | Marker sentence pinned across generator, gate and reset tooling |
| 7 | `2026-07-20-security-audit-governance-round` review said `blocked` while its manifest said `completed` | Both blocking conditions had been satisfied since (governance smoke in `test:smoke:all` green on `f9134a4f`; rendered PNGs present); verdict moved to `approved` with the closure recorded | — |

## Explicitly deferred

**pantheon-ops synchronization.** `pantheon-ops/.foundation/foundation-release.lock.json`
locks `pantheon-base-v0.12.1` (`baseCommit 884465c0`, an ancestor of base `main`,
which is 31+ commits ahead) and already lists `baseline-swap` as `pendingWork`
blocked by *"uncommitted changes in ops working tree from another session
(casbin/csrf middleware, go.mod/go.sum, main.go); swapping baselines over a dirty
tree risks mixing lineage"*. That blocker is still true: `git status --short` in
ops reports 269 changed entries. The three shared artifacts this round touches
(`pkg/testredis`, the generator marker, the QA setup script) therefore reach ops
with the **next** foundation release, not by hand-copying files.

## Not changed on purpose

Runtime behaviour, API, permissions, menus, i18n, database and seed are untouched;
this round is tooling, docs and tests. The generator still does not mark the 11
stable artifacts it rewrites (it marks the module files it generates), the 17
legacy task docs stay listed, and the flaky full-smoke generator suite plus the
`.golangci.yml` v2 key drift remain open.
