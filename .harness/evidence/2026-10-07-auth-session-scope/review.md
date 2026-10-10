# Review — auth-session-scope (F02 + F03)

## Route → policy mapping (reviewer walkthrough)

| Route | Handler | Policy after fix |
| --- | --- | --- |
| `DELETE /auth/sessions/:id` | RevokeSession (self) | `RevokeOwnedSession`: ownership (user_id match) + current-session rejection |
| `GET /auth/sessions` | GetSessions | userID-scoped (unchanged, self only) |
| `POST /logout` (both groups) | LogoutHandler | `RevokeSession(current sessionID)` — current session owned by definition |
| `GET /system/session/list` | GetSessionList | tenant-scoped via `WithTenantContext(FromGin)` |
| `POST /system/session/batch-revoke` | BatchRevokeSessions | tenant-scoped candidates + artifacts; current-session check intact |
| `DELETE /system/session/:id` | RevokeAnySession | tenant-scoped UPDATE; artifacts only on revoked rows |

## Criteria check

1. Self-service rejects foreign session + documented current-session rule — PASS (`ErrUnauthorized` on both; logout owns the current-session path).
2. Tenant managers cannot see/touch other tenants; compat exception tested — PASS (6 tests incl. token-closure assertions).
3. Hostile tests pass; mapping reviewed — PASS.

## Notes

- Cross-tenant revoke is a silent no-op (success, 0 affected) rather than an
  error: no data/token leak, and error-free semantics keep batch UX simple.
  Documented in code comment.
- Old handler test `TestAuthHandler_RevokeSession` encoded the vulnerable
  behavior (no userID set); updated to the new contract.
- `RevokeOwnedSession` self-service is tenant-agnostic by design: ownership is
  a stronger bound than tenant scope.

## Machine Readable
```json
{
  "taskId": "2026-10-07-auth-session-scope",
  "verdict": "approved",
  "reviewer": {
    "independence": "self-review",
    "note": "No independent reviewer artifact was available in this workstation session; residual runtime and hosted gaps remain explicit.",
    "role": "platform-coordinator"
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-07-auth-session-scope/manifest.json",
    "evidence": ".harness/evidence/2026-10-07-auth-session-scope/commands.json",
    "reviewFile": ".harness/evidence/2026-10-07-auth-session-scope/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-07-release-readiness-remediation.task.md",
      "docs/reviews/ENTERPRISE_RELEASE_READINESS_REVIEW_2026-10-07.md"
    ]
  }
}
```
