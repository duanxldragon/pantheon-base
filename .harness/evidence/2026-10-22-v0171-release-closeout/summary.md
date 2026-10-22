# Summary — 2026-10-22 v0.17.1 delivery closeout

## Why this release exists

An independent delivery audit of `main 92b94474` asked one question: *has the latest code reached the point
where the base platform can be frozen and effort moved to `pantheon-ops`?* The answer was **no — FAIL on
delivery completeness**, with three blocking items and no P0 or functional regression:

| # | Blocker | Evidence |
|---|---|---|
| A1 | `Release Gate` was red on `main`, so no release could be cut from it | run `39733491324`: `Release blocked: 8 unresolved SonarCloud issue(s)`; the Sonar *quality gate* itself was `OK` — only the unresolved-issue count was non-zero |
| A2 | The remediation existed only in an uncommitted worktree | branch `fix/tenant-plan-entitlements-and-audit` @ `3a446e3b`, 34 changed files, `1/3` diverged from `origin/main`, task packet still `in-progress` |
| A3 | Consumer-facing docs contradicted the code and the published release | README named an older version; `TENANT_API.md` documented `/api/v1/tenants*` which answers `404`; the scope matrix still called the runtime single-tenant; `STATUS` claimed "no P0–P3 residue" |

The same audit found two tenant-lifecycle gaps and one UI inconsistency that this release also closes.

## What changed

### A1 — eight SonarCloud issues removed without suppression

| Rule | Location | Fix |
|---|---|---|
| `go:S1192` ×2 | `tenant_provision.go` | constants `sqlSelectMenuIdentity`, `condTenantScopedRow` |
| `go:S3776` | `tenant_provision.go` | split into `collectPlatformOnlyMenuIDs` / `deleteTenantMenuGrants` / `collectTenantPlatformPermissionKeys` / `deleteTenantPermissionGrants` |
| `typescript:S3776` | `useLayoutMenu.tsx` | complexity extracted into a pure helper |
| `typescript:S6759` ×3 | `PlanFeatureGuard.tsx`, `TenantPlanMatrix.tsx` | `Readonly<Props>` |
| `typescript:S6582` | `useTenantSessionStore.ts` | optional chaining |

No `solo-override`, no rule change, no `// NOSONAR`. `AGENTS.md` reserves that label for the maintainer, and
silencing the gate would have re-created the exact defect the audit found.

### A2 — the remediation became a real deliverable

Logical commits on a release branch → PR → CI/Sonar/Release Gate on the release commit → merge to `main` →
tag `pantheon-base-v0.17.1`. The `2026-10-22-delivery-audit-remediation` packet moves to `completed`; this
directory is its missing evidence.

### A3 — docs now state the measured facts

`README.md` / `README.en.md` / `CHANGELOG.md` / `VERSION` / `.harness/STATUS.md` all say 0.17.1.
`docs/api/TENANT_API.md` documents the surface that actually answers (`/api/v1/system/tenant/*`, not
`/api/v1/tenants*`). `TENANT_RESOURCE_SCOPE_MATRIX{,.en}.md` no longer calls the runtime single-tenant.
`DEPLOYMENT_GUIDE.md` documents `platform.tenant_mode`.

### B1 (P2) — an archived tenant could never be deleted

Contract §2.1 says archived is the retirement path; contract §2.2 says the last owner cannot be removed.
Together they deadlocked: to delete a tenant you needed zero active members, and the last owner could not be
removed, so a provisioned tenant could never be deleted through the API.

`DeleteTenant` now reads `id/code/status` first. For an archived tenant it disables the active memberships
inside the same transaction that releases the code and sets `deleted`. A live tenant with members still
returns `tenant.has_active_members`. §2.2 keeps its meaning (it constrains *non-archived* tenants); §2.1's
retirement path becomes reachable.

### B2 (P2) — a failed provisioning stranded its row

`ProvisionTenant` already ran in one transaction, but the tenant row it was provisioning was inserted
outside it. A failure left the row holding a UNIQUE `code` with no owner — repairable only by hand, and it
made the operator's retry fail on the code. `CreateTenant` now compensates with `Unscoped().Delete`; when the
compensation itself fails, both errors are logged and the original failure is still returned.

### C1 (P3) — the dictionary governance bar was the odd one out

`/system/dict` passed a `description` for each of its three metrics, which `GovernanceSummaryBar` renders as a
`.governance-summary-bar__metric-desc` line. `/system/user` and `/system/post` pass none, so three lines of
prose pushed the dictionary table down and broke the visual rhythm. The descriptions were dropped, and the
three i18n keys that became unused (`system.dict.hero.{typeHint,activeHint,itemHint}`) were removed from all
five locales.

Browser confirmation, same session, same viewport:

| Route | `.governance-summary-bar__metric-desc` |
|---|---|
| `/system/dict` | 0 (was 3) |
| `/system/user` | 0 |
| `/system/post` | 0 |

### C2 (P3, UI) — the settings governance bar wrapped to two rows

`/system/setting` has four metrics, but the shared metric grid starts at `minmax(120px, 1fr)` and its
column is only about 450px wide at a 1440px viewport, so only three fit and the fourth dropped to a second
row — a 2×2 block that doubled the bar's height (152px) and broke the single-row rhythm every other system
page has.

The page now widens the metrics column and lowers the floor to 96px. Measured at six widths, with a
horizontal-overflow check at each:

| Viewport | Metrics per row | Metric width | Horizontal overflow |
|---|---|---|---|
| 1600 | 4 | 165px | none |
| 1440 | 4 | 143px | none |
| 1280 | 4 | 120px | none |
| 1100 | 4 | 119px | none |
| 960 | 4 | 100px | none |
| 900 | 2×2 | 366px | none |

900px is the existing ≤920px mobile breakpoint, where 2×2 is the intended phone layout. Bar height at 1440
went from 152px to 82px.

An earlier attempt pinned `repeat(4, minmax(96px, 1fr))` with a `≤1280px` fallback to 2×2; measuring at
1280 showed that fallback re-created the two-row layout the change was meant to remove, so the fallback was
dropped in favour of `auto-fit`, which only wraps when the metrics genuinely do not fit.


### D1 (P2, found while preparing this release) — the rollback chain aborted

The worktree carried an unreviewed edit to `000020_tenant_phase1_core_tables.down.sql`. Rather than ship it on
trust, it was exercised. The previous version drops indexes and columns unconditionally, but `000024.down`
already removed several of them, so `migrate down` failed part-way:

```
Error 1091 (42000): Can't DROP 'tenant_id'; check that column/key exists
```

That leaves `schema_migrations` dirty with a half-dropped schema — an operator following the rollback runbook
ends up worse off than before the rollback. Every destructive step is now guarded on `information_schema`, so
the rollback completes and the chain can be re-applied.

`TestMigrationChainRollsBackAndReapplies` migrates a throwaway database up → down → up and asserts it returns
to the same clean version. **Reverse check**: restoring the previous `000020.down` makes that test fail with
the exact `Error 1091` above, which is how the defect was confirmed rather than assumed.

Forward migration and the runtime schema are unaffected — this is a rollback-path fix only.


## Verification

| Gate | Result |
|---|---|
| `go build ./...` / `go vet ./...` / `gofmt -l .` | clean |
| `go test -count=1 -p 1 ./...` (real MySQL 8.0.36 + Redis 7, both `*_REQUIRED=true`) | see `commands.json` |
| IAM regression (`tenant` / `user` / `role` / `permission`) | green |
| `tsc --noEmit` / `eslint src --max-warnings 0` | 0 diagnostics |
| `vitest run` | 30 files / 214 tests |
| `npm run prebuild` | 13 steps |
| `vite build` | `✓ built in 1.94s` |
| `check:docs-frontmatter` | 343 docs |
| `check:structure` (strict) | 0 findings / 2498 files |
| `check:task-packet` / `check:task-packet-template` / `check:generated` | pass |

## Known residuals

1. `TestBatchRevokeSessions_IsTenantScoped` flakes under many-package parallelism (shared Redis key space).
   Single-package and serial runs pass. Test-isolation debt.
2. Concurrent `CreateTenant` for two different codes is not serialized. UNIQUE `code` prevents duplicates;
   contention is unverified.
3. Published v0.17.0 assets still carry the pre-rotation, now-invalid development credential. Immutable.
4. Tenant status `deleted` is a fourth state absent from contract §2.1. Amending the contract needs L2.
5. `go test -race` cannot run on this host (MinGW linker); race coverage is CI-only.
6. Sonar unresolved count and `Release Gate` are CI-decided. This document does not claim them from local
   evidence.
