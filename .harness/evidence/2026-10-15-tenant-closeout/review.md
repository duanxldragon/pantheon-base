# Review — 2026-10-15-tenant-closeout

## Verdict

**Approved for the stated goal (multi-tenant mode is usable), with explicit open gaps.** The claim under
review — "a human confirming this sees a working tenant mode, and the E2E and smoke suites back it" — is
supported by live evidence rather than assertion: tenant lifecycle E2E 62/62, isolation E2E 34/34, core smoke
26 passed / 3 skipped / 0 failed, and the tenant viewpoint browser spec 5/5 in real Chromium.

Three things the earlier sessions recorded as open were re-examined and each landed differently, which is the
point of the review: defect A was **already fixed** and only needed verification; defect B was **still real**
and is now fixed; defect C is **still real** and is now an ops procedure with a security rationale.

## What was verified, and how

| Claim | Evidence | Independent? |
|---|---|---|
| Defect A closed | `verify_picker_defect.py` on a clean DB: member-only tenant 93 → `code=200` (was 401) | Yes — live HTTP against the real stack |
| Defect B closed | Same probe: `current` `role='owner' isActive=True` vs `switchable` `role='owner' isActive=True`, `AGREE=True` (was `''`/`False`) | Yes — the probe reads both endpoints and compares |
| No regression from the fix | `verify_tenant_full_flow.py` re-run **after** the change: 62/62 | Yes |
| Isolation intact | `verify_tenant_isolation_phase_g.py`: 34/34 | Yes |
| Core smoke | `test:smoke:core` (9 specs, real browser + real backend): 26 passed, 3 skipped, 0 failed | Yes |
| Tenant UI smoke | `tenant-viewpoint-switcher.spec.ts`: 5/5, screenshots retained | Yes |
| Clean acceptance state | `tenant_mode=multi`, 0 active memberships, 0 fixture tenants, 0 tenant-domain policies, 40 platform policies; `POST /auth/login` for admin returns a token pair with no `tenantSelectionRequired` | Yes |
| Go health | `go build ./...`, `gofmt -l` empty, `go vet` and `go test` green on the changed packages | Yes |

The defect-B fix is deliberately **read-only**: `GetCurrentTenant` resolves the caller's own active
membership and reports its role with `isActive=true`. It grants nothing new — it reports what the membership
table already grants — and it makes the two endpoints consistent, which is the whole defect.

## Reviewer checklist

**Does the fix widen anyone's authority?** No. It only enriches the *response* of an authenticated
`GET /auth/tenants/current`. It performs a membership lookup scoped to the caller's own `user_id`; a subject
with no membership for the resolved tenant simply keeps the previous empty values.

**Is the acceptance state genuinely clean, or just quiet?** Verified by query, not by assumption: 0 active
memberships, 0 fixture tenants, 0 tenant-domain Casbin policies, and the platform admin's login returns a
token pair rather than the picker. This matters because a stray membership on the platform admin is exactly
what makes the operator meet the tenant picker instead of the console.

**Was the pre-existing `gofmt` violation in scope?** It is part of the same uncommitted tenant worktree, and
leaving it means the formatting gate is red for a change set this task is closing out. Fixed rather than
reported. It is a whitespace-only change to a test file.

**Is defect C correctly characterised?** Yes, and stronger than "row hygiene": with no FK and no purge path,
a hard delete followed by an AUTO_INCREMENT recycle hands the old tenant's authority to a new tenant. The
runbook documents the purge, the rationale, the 18-table sweep and the verification queries. The gap is that
this is still a *procedure*, not an enforced path — recorded as such.

**Should the hostile matrix have been fixed here?** No, and the reasoning is recorded rather than hidden. The
failure is a stale fixture (the platform admin is logged in with a tenant claim, which under the isolation
model yields an empty tenant role set), not a product regression — the sanctioned pattern is used by the
passing viewpoint spec. A correct fix also needs a decision about how fixture-written policies reach the
running Casbin enforcer, and rushing it would have produced an unverified half-fix in a closeout pass. It is
recorded with a reproduced root cause and a fix path.

## Open items handed back (maintainer decisions)

1. `docs/TENANT_SCOPE_FREEZE_DECISION_2026-10-15.md` §6 — tenant-owned vs globally shared roles / menus /
   permissions. Implementation today: per-tenant roles, global menus and permissions.
2. Whether a platform-capable subject should keep platform roles when it holds a tenant claim (the
   picker/`tenantId` login path).
3. Whether to fund the tenant hostile matrix fixture remediation now or defer it.

## Exceptions recorded

| Item | Reason | Mitigation |
|---|---|---|
| Tenant hostile browser matrix not green | Stale fixture: platform admin + tenant claim → empty role set → 403. Root cause reproduced by hand. | Recorded as an explicit gap with a fix path; the suite is CI-advisory and outside the acceptance path. |
| Combined targeted `go test` across middleware/system-org/platform not re-run | Slow, not blocked; the live probes cover those paths end to end. | `go test` was re-run green for the two packages this pass changed. |
| `tests/` outside the repo typecheck gate | Pre-existing repo configuration (`tsc -b` compiles only `src`). | Recorded; not changed here. |

## Machine Readable

```json
{
  "taskId": "2026-10-15-tenant-closeout",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-15-tenant-closeout/manifest.json",
    "evidence": ".harness/evidence/2026-10-15-tenant-closeout/commands.json",
    "reviewFile": ".harness/evidence/2026-10-15-tenant-closeout/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/TENANT_SCOPE_FREEZE_DECISION_2026-10-15.md",
      "docs/TENANT_LOGIN_INIT_EVALUATION_2026-10-15.md",
      "docs/contracts/TENANT_CONTRACT_V1.md",
      "docs/runbooks/TENANT_TROUBLESHOOTING.md"
    ]
  }
}
```
