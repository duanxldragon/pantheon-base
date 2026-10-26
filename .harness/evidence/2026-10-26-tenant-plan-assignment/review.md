# Review — 2026-10-26 套餐指派面接通（TENANT_CONTRACT V1.5）

Reviewed against the working tree (nothing is committed). The diff is `frontend/src/modules/system/iam/tenant/`
(one new derivation module plus `TenantList.tsx`), the five i18n resource files, the backend tenant plan
store (deletion of one dead method and its test), and the ZH/EN contract pair. No migration, route,
permission code, menu seed, error envelope or workflow file is touched.

## Scope audit

- New client code is confined to `planOptions.ts`; `TenantList.tsx` only switches its edit form and
  filter to the derived sets and reads the list with `skipErrorMessage: true`.
- Backend change is a deletion: `PlanStore.AssignableCodes` and its unit test. `ValidateAssignment`
  remains the single server-side decision point, so no new authority was introduced.
- Contract edits land in both languages: ZH is authoritative and EN mirrors it, including the V1.5 row
  reclassified from clarification to clarification (section 2.2) plus extension (section 2.4 invariant 8)
  — moving a gap into In is an Extension, not a clarification.
- The retained fixture database `pantheon_base_plan_matrix_20261025` was temporarily mutated twice
  (`tenant_plans` id=5 `status`) to prove the dropdown is data-driven, then restored; a read-only SQL
  re-check confirmed row counts and values match the pre-verification state column by column. No tenant
  row changed and no create request was ever sent.

## Claim audit

| Claim | Evidence |
|---|---|
| The dropdown is now data-driven | Browser steps 2-5 on the real backend and Vite: with `opsprobe` disabled the write side offers four tiers; flipping it to `active` (past the 5s `planCacheTTL`) makes the form offer five, the fifth labelled from the stored `name`. |
| Write-side assignability and read-side filtering differ on purpose | The toolbar plan filter still lists `Ops Probe` while the create form omits it, matching contract section 2.4 invariant 8. |
| Off-ladder codes state their consequence instead of hiding it | Selecting `opsprobe` renders 前台能力阶梯 提示原文 and the plan matrix shows it as its own column with member ceiling 7 from the definition, not free's 5. |
| No silent rewrite of a retired-plan tenant | Editor options keep the tenant's own code even when it is not assignable; `planOptions.test.ts` covers all three derived sets in five cases. |
| No write happened during verification | The page emitted only `GET`s and `POST /auth/activity` heartbeats; `SELECT id, code, plan, status FROM tenants` shows the four retained tenants unchanged. |
| The ok from plain `go test` is not coverage | Without a DSN every DB case in the tenant package `t.Skipf`s and the package still prints `ok`; the covering run is `PANTHEON_TEST_DSN_REQUIRED=1 go test ./modules/system/iam/tenant/... -count=1` (ok, 62.5s real work) with `-run TestPlanStore -v` reporting 8 PASS / 0 SKIP / 0 FAIL. |
| The audit-title asymmetry does not exist at runtime | That route belongs to the legacy `Handler` (`tenant_handler.go:244-263`) whose only mount point is `RegisterRoutes` (`tenant_routes.go:9-28`), which has no shipped caller (repo-wide hits are `tenant_handler_test.go` only). All shipped tenant write routes mount `PlatformHandler` (`system_modules.go:290-306`) and set titles explicitly (`tenant_platform_handler.go:131/148/168/203/223`, `tenant_ops_handler.go:70/87`). Registered in `docs/api/TENANT_API.md:17` and measured 404 in the 2026-10-22 delivery audit. |

## Findings

- **P2, carried forward (not introduced here):** `core/entitlements/plans.ts` still hardcodes four
  tiers and fails an unknown code closed to `free`, so an operator-defined plan's console *feature
  entries* render at the free tier. The form now says so out loud and the contract records the item as
  still open. Truly trimming menus per plan is commercialisation semantics in section 1 Out and needs
  its own round.
- **P3, residue of the adjudication:** the unmounted legacy tenant surface still carries
  `@Router /api/v1/tenants*` swagger annotations. Nothing advertises them today — the repo commits no
  generated swagger artifact and configures no `swag init` — but the first person to wire generation
  would publish 404 paths into the API docs. Registered as a future candidate; no code change this round.
- **Environment limit:** no PNG. The in-app browser surface was hidden (`visibilityState=hidden`) so the
  screenshot call was refused (`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`); browser findings rest on DOM text
  plus the network log, and that is recorded as a gap rather than presented as visual acceptance.
- **Pre-existing debt, untouched:** `npm run format:check` (prettier, not a CI gate) already warns on
  `src/i18n/resources/*.ts` at HEAD. Only this round's own added lines were returned to the
  single-quote convention (81 lines per file) to keep the functional diff reviewable.

## Verdict

Approved with the documented P2 follow-up above. The write side stays untouched by design, so this
round cannot regress quota semantics; nothing is committed and commit, push and PR wait for an
explicit request.

## Machine Readable

```json
{
  "taskId": "2026-10-26-tenant-plan-assignment",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": [
      "backend/modules/system/iam/tenant",
      "frontend/src/modules/system/iam/tenant",
      "frontend/src/i18n/resources"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [
      "P2 carried forward: core/entitlements/plans.ts keeps four hardcoded tiers, so off-ladder plans render console features at the free tier; now disclosed in the form and still open in contract section 9.",
      "P3 residue: the unmounted legacy tenant handler still carries @Router swagger annotations; no generated artifact or swag init exists today, so nothing is advertised."
    ],
    "notes": "The change removes a dead method from the backend plan store and adds one leaf derivation module on the frontend, so edges only ever point from TenantList to planOptions, never back into the entitlements or plan-store internals — no cycle and no new hub. The sensitive question is authority: assignability is still decided by the server (ValidateAssignment), the client only mirrors that rule to keep an unusable option from being offered, and the one asymmetry it introduces (a retired code kept in the editor for the tenant that already has it) exists precisely to prevent an unintended write. No credential, quota ceiling or tenant row changed."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-26-tenant-plan-assignment/manifest.json",
    "evidence": ".harness/evidence/2026-10-26-tenant-plan-assignment/commands.json",
    "reviewFile": ".harness/evidence/2026-10-26-tenant-plan-assignment/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/contracts/TENANT_CONTRACT_V1.md",
      ".harness/evidence/2026-10-25-dual-mode-e2e-smoke/README.md"
    ]
  }
}
```
