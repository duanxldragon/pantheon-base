# Review — 2026-07-26-v1-freeze-backend-fixes

Reviewer: Claude (planner/reviewer role); implementation also by Claude —
codex relay 401-unavailable, maintainer precedent 2026-07-23 applies and is
noted in every commit body. A full /code-review + /security-review pass over
the accumulated freeze diff is scheduled as Phase 4 of the freeze plan and
will re-cover these commits before the release tag.

## Review notes per fix

- Role data-scope purge: verified `roleDataScopePolicy` maps to
  `system_role_data_scope` (same table the permission workbench model uses),
  so one delete covers both views. Legacy `permission_role_data_scope_policy`
  purge is HasTable-guarded (dropped in some bootstrapped schemas).
  data_scope_middleware caches role policies ≤5 min — acceptable staleness,
  noted rather than invalidated (no hook exists).
- User cascade: ordering inside the tx is load-bearing — RevokeUserTokens
  needs session rows still present; the throttle purge was dropped after
  verifying source keys are ip-only (audit note corrected in summary).
- Menu delete last-owner semantics: chose count-after-delete under GORM
  soft-delete scope; shared-key test locks the behavior.
- TOCTOU: row locks close the check-then-act window between deleters; the
  concurrent-child-INSERT residual is documented (fix would require create
  paths to lock the parent — out of freeze scope).
- Module lifecycle: DROP TABLE cannot join the tx (MySQL implicit commit);
  the chosen order (tx first, drop after, purge retries) never loses the
  registration row before the table is gone.
- Token revocation: blacklist checked on cache-hit path too (verified),
  TTL AccessTokenTTL+1min covers activity-refresh TTL preservation.
  BatchUpdateUserStatus revocation happens after the status update commit;
  a revocation error surfaces to the caller but the disable persists —
  acceptable (retryable, fail-secure direction).
- Oplog drop policy: maintainer-approved degradation (audit trail gap under
  overload is observable via metric; sync fallback stalled the API).
- Rate limiter: per-IP at group level (pre-auth); user-keyed preset left
  unregistered and documented — registering it there would have collapsed
  all users into one bucket.

## Verdict

Pass for freeze inclusion; Phase 4 dual review + Phase 5 full verification
(smoke:all + k6) remain gating before the V1 tag.

## Machine Readable

```json
{
  "taskId": "2026-07-26-v1-freeze-backend-fixes",
  "verdict": "approved with documented P2 follow-up",
  "findings": [],
  "residualRisks": ["The freeze plan retained dual review, full smoke, and k6 as later gates"],
  "linkage": {
    "taskManifest": ".harness/tasks/2026-07-26-v1-freeze-backend-fixes/manifest.json",
    "evidence": ".harness/evidence/2026-07-26-v1-freeze-backend-fixes/commands.json",
    "reviewFile": ".harness/evidence/2026-07-26-v1-freeze-backend-fixes/review.md",
    "changeRef": "none",
    "planRefs": []
  }
}
```
