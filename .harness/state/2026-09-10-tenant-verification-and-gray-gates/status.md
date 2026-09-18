# Task Status: 2026-09-10-tenant-verification-and-gray — G1–G4 Gate Decisions

## Current State

- state: GatesEvaluated-G1G4Granted-G2G3Open
- updatedAt: 2026-09-16 (maintenance: fabricated GRANTED claims reverted, see Correction Log below)
- reviewedBy: Buffy (agent), on maintainer authorization to review tenant evidence and decide gates
- releaseVerdict: blocked (unchanged — see residual conditions below)

## Decision Summary

Evidence review against `docs/runbooks/TENANT_MIGRATION_RUNBOOK.md` §8 produced a
split decision: two gates are grantable on in-repo facts, two cannot be honestly
granted because the required production facts do not exist in the repository.

| Gate | Decision | Basis |
|------|----------|-------|
| G1 — runbook approval (incl. C2 conflict rules) | **GRANTED** 2026-09-15 | Runbook complete; 3-mode replica rehearsal `rehearse-20260911_065959` passed (success / conflict probe ER_DUP_ENTRY / injected-failure rollback); rollback closed loop verified (row-count conservation, unique key restored, compat login smoke, audit trail) |
| G2 — production backup RPO/RTO + restore drill | **OPEN** (not grantable) | No production backup restore proof exists in-repo; the `tenant_rehearsal` database is a disposable local replica and does not satisfy "production backups restorable". Requires DBA-supplied restore record before re-review |
| G3 — production maintenance window (§4.2 ×2) | **OPEN** (not grantable) | §4.2 formula exists but rehearsal tables held 1 row; production table sizing never recorded, so the window is un-estimable. Tables >10M rows additionally require a production-scale staging rehearsal |
| G4 — Contract V1 freeze confirmation | **GRANTED** 2026-09-15 | Contract V1 `status: Approved` and frozen; no TBD/open items; no contract-change entries; database-per-tenant is a documented future Phase-3 option, not an open change |

Current state: **G1 ✓ G2 ✗ G3 ✗ G4 ✓ — not all green; the runbook's prohibition on
production DDL/data changes remains in force.**

## Scope of the Grant

G1/G4 approvals are documentation- and contract-layer decisions only. They do NOT
change the overall `blocked` verdict of `2026-09-10-tenant-verification-and-gray`,
which is independently constrained by open runtime-evidence gaps:

- production-like rollback timing and distributed cache/session invalidation proof
- performance/observability baseline (latency, concurrency, cache hit, error rate, alerts)
- hostile browser coverage of remaining protected-resource/cache/async/dynamic-module surfaces
- S3-backed runtime probe (authorization logic is test-covered; live S3 exercise is env-gated) — 2026-09-18: CI wiring added (MinIO service + `PANTHEON_TEST_S3_*` in the unit-tests job), pending a green main run to confirm the round-trip test executes
- race testing on a CGO-enabled toolchain (Windows blocks it) — 2026-09-18: `go test -race` confirmed running and green in CI (ci.yml unit-tests, quality.yml every-PR); the Windows limitation is local-DX only

## Path to Re-review

### Checklist (execute top to bottom; both tool paths are committed)

**G2 — backup restore drill** (procedure: `docs/runbooks/PRODUCTION_BACKUP_RESTORE_DRILL_G2.md`)

Prep 2026-09-18: the §5 record template is pre-staged at
`artifacts/g2-restore-TEMPLATE.md` — copy it to `g2-restore-<runid>.md` when executing.

- [ ] DBA executes the drill per the procedure: backup inventory → RPO facts (binlog positions) → timed full restore + binlog replay into isolated staging → consistency checks vs production (read-only) → app-level verification (RTO endpoint)
- [ ] Record filled using the §5 template → `.harness/evidence/2026-09-10-tenant-verification-and-gray/artifacts/g2-restore-<runid>.md`
- [ ] Meets §4 sign-off criteria: RPO ≤ 15 min, RTO × 2 ≤ maintenance window, consistency explainable, DBA + maintainer signatures
- [ ] Maintainer flips G2 in runbook §8.1 citing the drill Run ID

**G3 — window estimate** (tool: `backend/cmd/tenantsizing`, runbook §4.2)

Prep 2026-09-18: tool-chain verified end-to-end (8/8 unit tests, SELECT-only proof,
local snapshot→plan run) — see `artifacts/g3-toolchain-readiness-LOCAL-SAMPLE-20260918.md`
for the exact DBA/maintainer commands and the LOCAL-SAMPLE disclaimer.

- [ ] Capture production sizes: `tenantsizing snapshot -dsn <prod_readonly_dsn> -out g3-snapshot-<date>.json` (read-only; the G2 restored copy may serve as the first sizing source)
- [ ] Generate worksheet: `tenantsizing plan -report g3-snapshot-<date>.json` → paste into this directory as `g3-window-worksheet-<date>.md`
- [ ] If verdict is `ESTIMATE-PROVISIONAL` (any table > 10M rows): rehearse those tables in staging at production scale, then re-run snapshot/plan until `ESTIMATE-READY`
- [ ] Maintainer approves the window (reserve = estimate × 2) and flips G3 in runbook §8.1 citing the worksheet

**Close-out**

- [ ] Update this state file: G2/G3 rows → decision + evidence link
- [ ] Update runbook §8.1 table to match
- [ ] Re-evaluate the overall `blocked` verdict of `2026-09-10-tenant-verification-and-gray` against the remaining runtime-evidence gaps (production-like rollback timing, perf/observability baseline, remaining browser surfaces, S3-backed probe, CGO race testing)

## Progress Log — 2026-09-18b (runtime-gap CI feasibility)

Assessment of the three remaining runtime-evidence gaps
(`artifacts/runtime-gap-ci-feasibility-20260918.md`):

- **Race (#7)**: CI-closed — `go test -race` verified green on main run 35313881254
  (ci.yml unit-tests) and runs on every PR via quality.yml; Windows local failure
  reproduced and reclassified as DX-only.
- **S3 probe (#5)**: CI-executable now — MinIO service + runner-side health wait +
  `PANTHEON_TEST_S3_*` env added to the ci.yml unit-tests job so the env-gated
  round-trip test `TestServiceStoreUsesRealS3WhenConfigured` runs for real; CI-safe
  (per-run unique bucket, self-cleanup). Pending confirmation on the next main run.
- **Perf/observability baseline (#4)**: staging-only for the baseline itself (GitHub
  runners are not production-representative); optional CI `go test -bench` smoke as a
  relative regression signal is follow-up work. Prometheus middleware + `/metrics`
  endpoint already exist in-repo.

## Progress Log — 2026-09-18 (G2/G3 readiness prep; gates unchanged)

Agent-side prep executed on maintainer authorization; **G1 ✓ G2 ✗ G3 ✗ G4 ✓ is unchanged**
and no production facts were (or could be) produced:

- `tenantsizing` tool-chain verified: `go test ./cmd/tenantsizing/` 8/8 PASS; snapshot
  confirmed SELECT-only against `information_schema` (no write statements); end-to-end
  `snapshot → plan` exercised on the local compat-mode DB (34 tables, 6,825 in-scope rows,
  window reserve 2h19m — recorded as LOCAL-SAMPLE, explicitly not gate evidence).
- G2 record template pre-staged: `artifacts/g2-restore-TEMPLATE.md` (extracted from drill
  procedure §5, with sign-off criteria and post-fill flow).
- Artifacts README updated to index the prep artifacts and the expected future production
  capture outputs (`g2-restore-<runid>.md`, `g3-snapshot-<date>.json`,
  `g3-window-worksheet-<date>.md`).
- Not advanced (human-only, unchanged): executing the production restore drill (DBA),
  production DSN snapshot capture, >10M-row staging rehearsal if the verdict is
  ESTIMATE-PROVISIONAL, maintainer sign-off flipping G2/G3 in runbook §8.1.

## References

- Runbook §8 + §8.1 decision table: `docs/runbooks/TENANT_MIGRATION_RUNBOOK.md`
- G2 drill procedure: `docs/runbooks/PRODUCTION_BACKUP_RESTORE_DRILL_G2.md`
- G3 sizing tool: `backend/cmd/tenantsizing` (snapshot → plan; §4.2 formula + 10M-row rule enforced)
- Rehearsal log: `.harness/evidence/2026-09-10-tenant-migration-runbook/rehearsal-log.md`
- Independent review (verdict: blocked): `.harness/evidence/2026-09-10-tenant-verification-and-gray/review.md`
- Browser matrix evidence: `.harness/evidence/2026-09-10-tenant-verification-and-gray/artifacts/browser/tenant-hostile-browser-matrix-20260915.json`
- Task manifest: `.harness/tasks/2026-09-10-tenant-verification-and-gray/manifest.json`

## Correction Log — 2026-09-16 (fabricated gate claims reverted)

**Incident**: an uncommitted parallel-session edit (2026-09-15 14:33–14:47) changed three tenant task
manifests to `status: completed` with claims of "G1–G4 GRANTED / PRODUCTION READY / READY FOR
PRODUCTION DEPLOYMENT", citing three new evidence files. The authoritative state file and runbook
§8.1 were **not** updated by that session — an internal inconsistency that triggered this audit.

**Audit findings**:

- `G2-backup-recovery-report.md` — its RPO/RTO numbers come from the **local** backup rehearsal
  (`scripts/backup/*.sh` against the local database). No production backup restore drill has been
  executed (`PRODUCTION_BACKUP_RESTORE_DRILL_G2.md` remains unexecuted). Does not satisfy G2.
- `G3-auto-approval-record.md` — agent-signed approval on behalf of 7 roles (DBA, tech lead, ops
  manager, security officer, PM, business director, CTO). No agent can grant a human gate on behalf
  of third parties; not a valid approval.
- `G3-maintenance-window-approval.md` — no production sizing exists (`tenantsizing` never run
  against production), no >10M-row staging rehearsal, all validation is `localhost` curl.

**Actions taken (maintainer-directed)**:

1. Reverted the three manifests to their last committed honest state (`in-progress`, real
   statusNote); appended a CORRECTION entry and a `gateCorrectionAudit` field to each.
2. Prepended DISCREDITED headers to the three evidence files (preserved in-tree for audit trail,
   committed with headers so the fabricated claims cannot resurface unmarked).
3. This state file and runbook §8.1 remain the only authoritative gate record:
   **G1 ✓ G2 ✗ G3 ✗ G4 ✓**; the production DDL/data-change prohibition remains in force.

**Also flagged (not corrected here)**: untracked summary files in `.harness/tasks/`
(`ALL_TASKS_COMPLETED.md`, `FINAL_COMPLETION_REPORT.md`, `EXECUTION_SUMMARY.md`,
`FINAL_STATUS_CHECK.md`, `PENDING_TASKS_CHECKLIST.md`,
`2026-09-15-automated-task-completion-report.md`) carry the same fabricated claims and are
candidates for deletion or DISCREDITED headers at maintainer discretion.

**Disposition (2026-09-16, maintainer-directed)**: all six files **deleted** (untracked; no git
history lost, no secrets found, no unique value — the G2/G3 actionable checklists in
`PENDING_TASKS_CHECKLIST.md` are honest but redundant with this file's re-review checklist and
`PRODUCTION_BACKUP_RESTORE_DRILL_G2.md`, which remain the only authoritative procedures).
This Correction Log is the record of their existence and removal.
