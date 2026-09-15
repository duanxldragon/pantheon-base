# Task Status: 2026-09-10-tenant-verification-and-gray — G1–G4 Gate Decisions

## Current State

- state: GatesEvaluated-G1G4Granted-G2G3Open
- updatedAt: 2026-09-15 (agent session, maintainer-authorized review)
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
- S3-backed runtime probe (authorization logic is test-covered; live S3 exercise is env-gated)
- race testing on a CGO-enabled toolchain (Windows blocks it)

## Path to Re-review

### Checklist (execute top to bottom; both tool paths are committed)

**G2 — backup restore drill** (procedure: `docs/runbooks/PRODUCTION_BACKUP_RESTORE_DRILL_G2.md`)

- [ ] DBA executes the drill per the procedure: backup inventory → RPO facts (binlog positions) → timed full restore + binlog replay into isolated staging → consistency checks vs production (read-only) → app-level verification (RTO endpoint)
- [ ] Record filled using the §5 template → `.harness/evidence/2026-09-10-tenant-verification-and-gray/artifacts/g2-restore-<runid>.md`
- [ ] Meets §4 sign-off criteria: RPO ≤ 15 min, RTO × 2 ≤ maintenance window, consistency explainable, DBA + maintainer signatures
- [ ] Maintainer flips G2 in runbook §8.1 citing the drill Run ID

**G3 — window estimate** (tool: `backend/cmd/tenantsizing`, runbook §4.2)

- [ ] Capture production sizes: `tenantsizing snapshot -dsn <prod_readonly_dsn> -out g3-snapshot-<date>.json` (read-only; the G2 restored copy may serve as the first sizing source)
- [ ] Generate worksheet: `tenantsizing plan -report g3-snapshot-<date>.json` → paste into this directory as `g3-window-worksheet-<date>.md`
- [ ] If verdict is `ESTIMATE-PROVISIONAL` (any table > 10M rows): rehearse those tables in staging at production scale, then re-run snapshot/plan until `ESTIMATE-READY`
- [ ] Maintainer approves the window (reserve = estimate × 2) and flips G3 in runbook §8.1 citing the worksheet

**Close-out**

- [ ] Update this state file: G2/G3 rows → decision + evidence link
- [ ] Update runbook §8.1 table to match
- [ ] Re-evaluate the overall `blocked` verdict of `2026-09-10-tenant-verification-and-gray` against the remaining runtime-evidence gaps (production-like rollback timing, perf/observability baseline, remaining browser surfaces, S3-backed probe, CGO race testing)

## References

- Runbook §8 + §8.1 decision table: `docs/runbooks/TENANT_MIGRATION_RUNBOOK.md`
- G2 drill procedure: `docs/runbooks/PRODUCTION_BACKUP_RESTORE_DRILL_G2.md`
- G3 sizing tool: `backend/cmd/tenantsizing` (snapshot → plan; §4.2 formula + 10M-row rule enforced)
- Rehearsal log: `.harness/evidence/2026-09-10-tenant-migration-runbook/rehearsal-log.md`
- Independent review (verdict: blocked): `.harness/evidence/2026-09-10-tenant-verification-and-gray/review.md`
- Browser matrix evidence: `.harness/evidence/2026-09-10-tenant-verification-and-gray/artifacts/browser/tenant-hostile-browser-matrix-20260915.json`
- Task manifest: `.harness/tasks/2026-09-10-tenant-verification-and-gray/manifest.json`
