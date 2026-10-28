# Review — W7 `2026-10-27-tenant-plan-ladder-decision`（套餐能力阶梯语义决策）

Reviewed against branch `decision/tenant-plan-ladder-w7-2026-10-28` (base `3e7fe8ff`).
The packet is a decision packet: the review question is whether every option is honestly
costed, the recommendation is implementable as written, and nothing outside the packet's
scope changed. Each reviewer posture item is answered with the artefact that settles it.

## Reviewer posture, item by item

| Posture item | Reading |
|---|---|
| Every option states what changes, what it fixes and what it breaks | Decision doc §2 gives each of A/B/C: the change list, the schema/migration impact, the fixed failure case (TC-07), and newly-introduced failure cases. A's copy-ambiguity risk (operator misreading quota fallback), B's misconfiguration surface + missing entitlements test coverage (230 vitest, none over entitlements — verified against the 2026-10-27 baseline table), and C's paid-surface regression are all named. |
| The current behaviour is NOT described as a defect discovered by this review | §1 opens from the packet's implementation notes: the limitation is documented in three code sites (`planOptions.ts:4-20`, `TenantList.tsx:265-267` comment, `plans.ts:1-15`), and the review's contribution is stated as "the consequence is not told to the operator and the contract does not state the boundary" — not "a silent bug was found". |
| The recommendation follows the smallest complete change | §0/§3: A is copy + docs (one L1 PR, no schema, no logic); B is the only option that keeps custom plans fully featured and the only one that changes schema, so it is registered as a V2 migration packet rather than forced into this programme; C is rejected with the product reasoning stated plainly (removing the gate gives paid lowcode surfaces to every tenant holding page permission). |
| The fail-closed normalization is preserved | §2 option A design constraints and §5 both forbid fail-opening `normalizeTenantPlan` or forging a rank for custom codes in the frontend, citing the "must not silently receive paid surfaces" security semantic (`plans.ts:65-69` comment). Any rank-granting move is explicitly assigned to B, not A. |
| No file outside the decision doc + evidence changed | `git status` on the branch: the new decision document, this evidence directory, the manifest status flip, and the STATUS.md bookkeeping rows — nothing else. `backend/**` and `frontend/src/**` untouched, matching the packet's doNotTouch. |

## Fact-checks run before signing (all against main `3e7fe8ff`)

- Quota authority really is data-driven today: `tenant_plan_model.go:11` ("carries the quota
  thresholds a tenant's plan code resolves to"), `:70` `UnlimitedQuota = -1`, `:93` `AsQuota()`
  — custom codes are already full quota buckets; only the feature matrix is tier-limited.
- The gate closes to four codes: `plans.ts:16-23` union + `TENANT_PLANS`, `:58-63` `PLAN_RANK`
  0-3, `:70-75` `normalizeTenantPlan` fail-closed to `free`.
- The warning exists but does not state the cost: `TenantList.tsx:272-273` `planOutsideLadder`,
  `:890-893` renders `TenantPlanMatrix` + `system.tenant.plan.outsideLadder` (five i18n files).
- Gate consumers confirmed: `usePlanEntitlements` is consumed by `AppLayout.tsx` (routes),
  `lowcode/generator/pages/ModuleWizard.tsx` (the "trial tenant cannot see the generator"
  consequence), and `platform/Dashboard.tsx` (widgets); platform scope bypasses (`plans.ts:12-14`).

## Governance notes

- **Human gate (choose A/B/C)**: resolved as a maintainer-delegated decision recorded in
  [decision.md](decision.md), open for maintainer review; overriding to B means a new
  migration packet per §2's prerequisite list, overriding to C requires revising the
  rejection reasoning first.
- **V1 completeness**: per the programme document, W7's outcome (keep status quo or start a
  V2 workstream) is explicitly excluded from V1 completion; the decision doc and this file
  both state it.

## Machine Readable

```json
{
  "taskId": "2026-10-27-tenant-plan-ladder-decision",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-tenant-plan-ladder-decision/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-tenant-plan-ladder-decision/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-tenant-plan-ladder-decision/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-tenant-completeness-remediation.task.md",
      "docs/reviews/TENANT_FUNCTIONAL_COMPLETENESS_REVIEW_2026-10-27.md",
      "docs/reviews/TENANT_PLAN_LADDER_DECISION_2026-10-28.md",
      "docs/contracts/TENANT_CONTRACT_V1.md"
    ]
  }
}
```
