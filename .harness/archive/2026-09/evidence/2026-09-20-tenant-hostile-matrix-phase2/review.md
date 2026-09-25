# Review — 2026-09-20-tenant-hostile-matrix-phase2

## Reviewer disposition

Reviewed as test-only expansion plus a fixture provisioning script. No
product code, no contract, no permission/menu/i18n surface touched.

## Checks

| Question | Answer |
|---|---|
| Does the spec exercise the real product surfaces end to end? | Yes — real login (cookie session), real pages (`.table-card` selectors), real APIs (list/detail/export) against a live multi-mode backend |
| Is tenant pinning asserted, not just 200-OK? | Yes — each surface asserts row `tenantId` fields equal to the acting tenant and foreign-tenant absence |
| Is the matrix environment state restored after the run? | Yes — flag=compat, tenants 101/202 re-provisioned, cleanup script login verified working |
| Does the fixture script avoid duplicating state? | Yes — idempotent: lists before create, tolerates re-runs, asserts exactly 1 row after |
| Any risk to CI? | No — smoke-core is not wired into CI web-base gates; spec naming contract untouched |
| Local-only hazards? | Clash system proxy pitfall documented in summary.md with NO_PROXY workaround |

## Verdict

Approve for PR. Evidence chain complete (commands.json, summary.md, review.md,
pr-body.md); task packet present.
