# Review — 2026-10-22 v0.17.1 delivery closeout

## Verdict

Approve. Every change either closes a gate that was already red or makes a documented contract obligation
reachable. One behaviour change is consumer-visible and is called out below
(`DELETE /system/tenant/:id` on an archived tenant). No schema change, no permission-semantics change,
no route removal.

## Diff scope

| Area | File | Review |
|---|---|---|
| Tenant lifecycle | `backend/modules/system/iam/tenant/tenant_service.go` | `DeleteTenant` reads `id/code/status` before counting members, so the archived path can be distinguished from a live tenant. An archived tenant with members disables the active memberships inside the same transaction that releases the code and sets `deleted`; a live tenant with members still returns `tenant.has_active_members`. `CreateTenant` adds a compensating `Unscoped().Delete` when provisioning fails; if the compensation itself fails both errors are logged and the original failure is still returned, so nothing is swallowed. |
| Tenant lifecycle tests | `backend/modules/system/iam/tenant/tenant_lifecycle_guard_test.go` | Real-MySQL tests. `TestDeleteTenantArchivedWithMembersSucceeds` asserts the memberships end `disabled` and the row ends `deleted`. `TestCreateTenantRollsBackWhenProvisioningFails` injects a failure through a GORM create callback on `system_user` and asserts the tenant row is gone, so the same code can be created again. Neither test asserts on log output. |
| Tenant provisioning | `backend/modules/system/iam/tenant/tenant_provision.go` | SonarCloud-driven extraction only: `sqlSelectMenuIdentity` / `condTenantScopedRow` constants and four single-purpose helpers. The SQL predicates and their order are unchanged. |
| Tenant handlers | `tenant_handler.go`, `tenant_platform_handler.go` | Error paths routed through `common.Fail` / `common.FailWithError` with sentinel mapping. Success payload shape unchanged. |
| User scope | `user_service.go`, `user_handler.go` | `loadTenantUser` returns `common.NewNotFound("user.not_found")`, so a foreign tenant id and a missing id answer identically (contract §5). The write path resolves the row before mutating. |
| Role handler | `role_handler.go` | `role.key.reserved` maps to envelope code `400` via `common.CodeForError` instead of `500`. |
| Frontend entitlement | `PlanFeatureGuard.tsx`, `TenantPlanMatrix.tsx` | `Readonly<Props>` only. No logic change. |
| Frontend menu | `useLayoutMenu.tsx` | Complexity extraction into a pure helper; the menu tree result is identical. |
| Frontend store | `useTenantSessionStore.ts` | Optional chaining only. |
| Dictionary page | `DictPage.tsx` | The three metrics no longer pass `description`. Label, value, action and the governance rail are untouched. Verified in the browser against `/system/user` and `/system/post`: all three render 0 `.governance-summary-bar__metric-desc`. |
| i18n | `zh-CN/en-US/ja-JP/ko-KR/fr-FR.ts` | Removes exactly the three keys that became unused (`system.dict.hero.{typeHint,activeHint,itemHint}`). No other key touched; the five locales stay aligned. |
| Migration rollback | `000020_tenant_phase1_core_tables.down.sql` | Was an unreviewed worktree edit; exercised rather than trusted. The previous file drops `tenant_id` unconditionally while `000024.down` already removed it, so `migrate down` aborted with `Error 1091` and left the version dirty. Every destructive step now checks `information_schema` first. The guards are all `IF(@x > 0, ...)` shapes, so a no-op path degrades to `SELECT 1` rather than an error. Forward path untouched. |
| Version material | `VERSION`, `CHANGELOG.md`, `README.md`, `README.en.md`, `RELEASE_NOTES_v0.17.1.md`, `.harness/STATUS.md` | All state 0.17.1 / 2026-10-22 and point at the same evidence directory. |
| Docs | `docs/api/TENANT_API.md`, `docs/designs/TENANT_RESOURCE_SCOPE_MATRIX{,.en}.md`, `docs/DEPLOYMENT_GUIDE.md` | Runtime-truth corrections: the mounted tenant surface, the multi-mode runtime statement, and the `tenant_mode` switch. |

## Risk analysis

- **Archived-tenant delete (consumer-visible)**: previously impossible; now allowed. It cannot widen
  accidental data loss because it requires the tenant to be archived first, and archiving is already the
  declared retirement path in contract §2.1. A live tenant is still refused. Called out in the release notes
  under Compatibility.
- **Compensating delete**: the row it removes never became usable — no owner, provisioning rolled back — so
  there is no partial state to preserve. The only loss is the id, which the caller never received on failure.
- **Error-code changes**: `500 → 404` for foreign/missing users and `500 → 400` for reserved role keys make
  the API *less* informative to an attacker (foreign and missing become indistinguishable) and more correct
  for a client. No test asserts the old codes.
- **Sonar refactors**: behaviour-preserving by construction; the IAM packages (`tenant`, `user`, `role`,
  `permission`) were re-run against real MySQL after the change.
- **Rollback guards**: only the down path changes. A guarded statement is strictly more permissive than an
  unguarded one — it either performs the same drop or skips it — so a deployment that previously rolled back
  successfully still does. The risk of the change is that a guard could skip a drop it should have performed;
  `TestMigrationChainRollsBackAndReapplies` asserts the tenant columns are actually gone after `Down()` and
  present again after `Up()`, which closes that gap.
- **Dictionary bar**: presentation only; no data path.
- **Release**: v0.17.1 is a new tag. The published v0.17.0 tag and assets are not rewritten.

## Verification reviewed

- `go build ./...`, `go vet ./...`, `gofmt -l .` — clean.
- `go test -count=1 -p 1 ./...` against real MySQL 8.0.36 + Redis 7 with `PANTHEON_TEST_DSN_REQUIRED=true`
  and `PANTHEON_TEST_REDIS_REQUIRED=true` — see `commands.json` for the recorded result.
- IAM regression (`tenant`, `user`, `role`, `permission`) after the lifecycle change — green.
- `TestMigrationChainRollsBackAndReapplies` — up → down → up on a throwaway database, back to the same clean
  version. Reverse-checked: the previous `000020.down` fails it with `Error 1091`.
- `tsc --noEmit`, `eslint src --max-warnings 0`, `vitest run` (30 files / 214 tests), `npm run prebuild`
  (13 steps), `vite build` — green.
- Browser: the three governance bars compared directly; 0 metric descriptions on all three.
- Governance: `check:docs-frontmatter` (343 docs), `check:task-packet`, `check:structure` (2498 files),
  `check:task-packet-template`, `check:generated` — pass.

## Residuals

1. `TestBatchRevokeSessions_IsTenantScoped` flakes when many packages run in parallel (shared Redis key
   space). Single-package 3/3 and serial full-suite runs pass. Test-isolation debt, not a product defect.
2. Concurrent `CreateTenant` for two different codes is not serialized. The UNIQUE `code` constraint prevents
   duplicates; resource contention during simultaneous provisioning is unverified.
3. The published v0.17.0 assets still contain the pre-rotation (now invalid) development credential.
   Immutable by design.
4. The tenant `deleted` status is a fourth state not described in contract §2.1. Amending the contract needs
   an L2 review, so it is recorded rather than changed here.
5. `go test -race` cannot run on this host (MinGW linker). Race coverage comes from CI only.
6. SonarCloud's unresolved-issue count and `Release Gate` can only be decided by CI; this review does not
   claim them green from local evidence.
