# Review — 2026-10-22 delivery audit remediation

## Verdict

Approve. Six audit findings closed; none silenced, none deferred without a recorded reason.

## Finding-by-finding review

| ID | What was reviewed | Judgement |
|---|---|---|
| A1 | The eight SonarCloud fixes in `tenant_provision.go`, `useLayoutMenu.tsx`, `PlanFeatureGuard.tsx`, `TenantPlanMatrix.tsx`, `useTenantSessionStore.ts` | Behaviour-preserving. The `tenant_provision.go` extraction keeps the same SQL predicates in the same order; the `useLayoutMenu` extraction returns the same tree; `Readonly<Props>` and optional chaining change no runtime value. No suppression comment, no rule exclusion, no `solo-override`. |
| A2 | Committing the worktree and running the gates on the commit | Cannot be judged from local evidence — that is the whole point of the finding. Closed by the sibling release packet; this review does not assert it. |
| A3 | `README{,.en}.md`, `docs/api/TENANT_API.md`, `TENANT_RESOURCE_SCOPE_MATRIX{,.en}.md`, `DEPLOYMENT_GUIDE.md`, `.harness/STATUS.md` | Each corrected claim was measured, not assumed. The tenant API surface was confirmed by calling both the documented and the mounted paths in a running build (`/api/v1/tenants` → 404, `/api/v1/system/tenant/list` → 200). |
| B1 | `DeleteTenant` archived path | The guard moved from "no active members" to "no active members unless archived". This is the minimum change that makes §2.1's retirement path reachable without weakening §2.2, because §2.2 constrains non-archived tenants only. Memberships are disabled inside the same transaction, so there is no window where a deleted tenant still has active members. |
| B2 | `CreateTenant` compensating delete | The row being removed never became usable: provisioning rolled back, no owner exists. The compensation is `Unscoped()` because the row must not linger even as a soft-deleted UNIQUE-code holder. A failed compensation logs both errors and still returns the original failure, so it cannot mask the real cause. |
| C1 | `DictPage.tsx` and the three i18n keys | Presentation only. Verified in the browser against two sibling pages rather than by reading the component, because the defect was a cross-page inconsistency and only a side-by-side render proves it gone. |

## Risk analysis

- **Error-code changes** (`500 → 404` for foreign/missing users, `500 → 400` for reserved role keys) make the
  API strictly more correct and, in the 404 case, less informative to a prober. No test asserted the old codes.
- **Compensating delete** cannot destroy usable state; the only thing lost is an id the caller never received.
- **Docs**: the risk of an incorrect doc is a wrong decision downstream, which is exactly finding A3. Each
  corrected statement is tied to a measurement.
- **No schema change**, no migration, no permission-semantics change, no route added or removed.

## Verification reviewed

- `go build` / `go vet` / `gofmt -l` clean.
- `go test -count=1 -p 1 ./...` on real MySQL 8.0.36 + Redis 7 with both `*_REQUIRED=true`: 46 packages ok,
  0 FAIL, 0 SKIP.
- The two new lifecycle tests plus the three earlier guards, run individually and verbose.
- Frontend `tsc`, `eslint --max-warnings 0`, `vitest` (30 files / 214 tests), `prebuild` (13 steps), `vite build`.
- `check:docs-frontmatter`, `check:structure`, `check:task-packet`, `check:task-packet-template`, `check:generated`.

## Residuals

Carried into `docs/reviews/PANTHEON_BASE_DELIVERY_REMEDIATION_2026-10-22.md` §5:

1. Parallel-package Redis flake in `TestBatchRevokeSessions_IsTenantScoped`.
2. Unserialized concurrent provisioning for distinct codes.
3. Invalid credential inside the immutable v0.17.0 assets.
4. Contract §2.1 missing the `deleted` state.
5. `go test -race` not runnable on this host.
6. SonarCloud verdict is CI-only.


## Machine Readable

```json
{
  "taskId": "2026-10-22-delivery-audit-remediation",
  "verdict": "approved with documented P2 follow-up",
  "verdictRationale": "Approve: six audit findings closed, none silenced; the SonarCloud verdict stays CI-only as a residual.",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-22-delivery-audit-remediation/manifest.json",
    "evidence": ".harness/evidence/2026-10-22-delivery-audit-remediation/commands.json",
    "reviewFile": ".harness/evidence/2026-10-22-delivery-audit-remediation/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-22-delivery-audit-remediation.task.md"
    ]
  }
}
```

> This block was backfilled on 2026-10-26 during the governance-schema repair round. It restates the verdict already written above in machine-readable form and links the artifacts that existed for this task; no conclusion, finding or verification claim was added, removed or reworded. The prose remains authoritative.
