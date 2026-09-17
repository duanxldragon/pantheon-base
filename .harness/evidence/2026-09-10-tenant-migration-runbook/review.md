# Review: 2026-09-10-tenant-migration-runbook

Reviewer posture: database reliability & security reviewer (challenge irreversibility and hidden side effects).

## Findings

1. **Reversibility**: Every phase has an explicit down path; only Phase E rewrites data and it is gated behind G2 backup proof + restore verification. Rollback verified in rehearsal (`rehearse-20260911_065959`): schema restored, 0 residual `tenant_id` columns, row counts match baseline. ✅
2. **Hidden side effects covered**: Redis (casbin watcher flush), upload object keys (no rename needed — fact recorded), audit/async paths (carry tenant context; export blocked during window). ✅
3. **Irreversibility challenge — unique-key rewrite**: the runbook requires old and new indexes to coexist through an observation window (C4) before dropping the old key (C5); conflict handling is deterministic (id ASC keep-first, suffix + disable), no manual ad-hoc decisions. Accepted.
4. **Compat invariant**: all DDL/backfill under `tenant.mode=compat` with `DEFAULT 0`; existing single-tenant behavior unchanged — matches TENANT_CONTRACT_V1 §6 regression baseline. ✅
5. **Boundary**: no runtime/auth/IAM code touched; no production data touched; replica is a disposable local DB; no `pantheon-ops` files modified. ✅

## Conditions / Notes

- Production execution prohibited until G1–G4 pass (runbook §8). This is an explicit gate, not an omission.
- Model-level `gorm uniqueIndex` tags must change in the same PR as the SQL migration when Phase B/C is actually scheduled (runbook §2.2 note) — flagged to the future migration task, not actionable in this runbook-only task.
- Windows (RPO/RTO, production maintenance window) are maintainer decisions recorded at gate time; open per task assumptions.

## Verdict

**Approved for rehearsal-only scope. Production migration blocked pending G1–G4.**
