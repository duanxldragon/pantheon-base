# Summary — 2026-10-22 delivery audit remediation

## Purpose

This packet tracked the remediation of the independent delivery audit that returned **FAIL on delivery
completeness** against `main 92b94474`. Its findings (A1, A2, A3, B1, B2, C1) are closed here; the release
that ships them is recorded under the sibling packet
`2026-10-22-v0171-release-closeout` (`.harness/evidence/2026-10-22-v0171-release-closeout/`).

The two packets are deliberately separate: this one owns *"the audit findings are fixed and verified"*, the
sibling owns *"the fix is committed, gated and published"*. Freezing on a green local build while the work
sits uncommitted is exactly the defect A2 named, so the closure of A2 is evidenced by the release packet, not
by this one.

## Finding disposition

| ID | Severity | Finding | Disposition | Evidence |
|---|---|---|---|---|
| A1 | P1 | `Release Gate` red on `main` with 8 unresolved SonarCloud issues | fixed in code, no suppression | §1 below |
| A2 | P1 | remediation lived only in an uncommitted worktree | committed, PR'd, gated, merged, released | sibling packet |
| A3 | P1 | consumer docs contradicted code and published release | fixed | §2 below |
| B1 | P2 | archived tenant could never be deleted (lifecycle deadlock) | fixed | §3 below |
| B2 | P2 | failed provisioning stranded the tenant row | fixed | §4 below |
| C1 | P3 | dictionary governance bar rendered per-metric descriptions | fixed | §5 below |

## 1. A1 — SonarCloud debt removed without suppression

| Rule | Location | Remediation | Local re-check |
|---|---|---|---|
| `go:S1192` | `tenant_provision.go` | constant `sqlSelectMenuIdentity` = `"id, module, path"` | literal appears once |
| `go:S1192` | `tenant_provision.go` | constant `condTenantScopedRow` = `"tenant_id <> ?"` | literal appears once |
| `go:S3776` | `tenant_provision.go` (complexity 17 > 15) | split into `collectPlatformOnlyMenuIDs`, `deleteTenantMenuGrants`, `collectTenantPlatformPermissionKeys`, `deleteTenantPermissionGrants` | `gocyclo`-equivalent manual count; behaviour covered by the existing provisioning tests |
| `typescript:S3776` | `useLayoutMenu.tsx` (19 > 15) | complexity extracted into a pure helper | menu-tree regression tests |
| `typescript:S6759` | `PlanFeatureGuard.tsx`, `TenantPlanMatrix.tsx` | `Readonly<Props>` | `tsc` |
| `typescript:S6582` | `useTenantSessionStore.ts` | optional chaining | `tsc` + store tests |

No `// NOSONAR`, no rule exclusion, no `solo-override` label. The authoritative judgement is SonarCloud's and
only CI can produce it; see the sibling packet for the gate result.

## 2. A3 — docs aligned to measured behaviour

- `README.md` / `README.en.md`: current foundation release → v0.17.1, changelog link → `RELEASE_NOTES_v0.17.1.md`.
- `docs/api/TENANT_API.md`: documents `/api/v1/system/tenant/*`, which is what the running build answers.
  `/api/v1/tenants` and `/api/v1/tenants/my` were measured returning `404` and are no longer presented as the
  consumer surface.
- `docs/designs/TENANT_RESOURCE_SCOPE_MATRIX{,.en}.md`: the runtime statement no longer claims single-tenant.
- `docs/DEPLOYMENT_GUIDE.md`: documents `platform.tenant_mode`.
- `.harness/STATUS.md`: no longer claims "no P0–P3 residue" while the gate was red.

## 3. B1 — archived tenant deletion

`DeleteTenant` loads `id, code, status` before counting members. An archived tenant with active members is
allowed through: the transaction disables the memberships, releases the code and sets `deleted`. A live tenant
with members still returns `tenant.has_active_members`. Contract §2.2 keeps its meaning because it constrains
non-archived tenants; §2.1's retirement path becomes reachable.

Test: `TestDeleteTenantArchivedWithMembersSucceeds` (real MySQL) — asserts memberships end `disabled` and the
row ends `deleted`.

## 4. B2 — provisioning failure compensation

`CreateTenant` deletes the tenant row when `ProvisionTenant` fails, so the UNIQUE `code` is released and the
operator's retry is a plain re-create. If the compensating delete itself fails, both errors are logged and the
original failure is still returned.

Test: `TestCreateTenantRollsBackWhenProvisioningFails` (real MySQL) — injects a failure through a GORM create
callback on `system_user`, then asserts the tenant row is gone.

## 5. C1 — dictionary governance bar

`DictPage.tsx` no longer passes `description` for its three metrics; the three now-unused i18n keys
(`system.dict.hero.{typeHint,activeHint,itemHint}`) were removed from all five locales.

Browser check, same session and viewport:

| Route | `.governance-summary-bar__metric-desc` |
|---|---|
| `/system/dict` | 0 (was 3) |
| `/system/user` | 0 |
| `/system/post` | 0 |

## 6. Verification

See `commands.json` for the recorded commands and results, and the sibling release packet for the gate
outcome. Notable limits, stated rather than glossed:

- SonarCloud's unresolved-issue count is CI-only. Local work can only show the code shape changed.
- `go test -race` cannot run on this host (MinGW linker error); race coverage is CI-only.
- Browser verification is read-only; write paths are covered by Go integration tests.

## 7. Residuals carried forward

Recorded in `docs/reviews/PANTHEON_BASE_DELIVERY_REMEDIATION_2026-10-22.md` §5: the parallel-package Redis
flake, unserialized concurrent provisioning, the invalid credential in the immutable v0.17.0 assets, the
contract's missing `deleted` state, and the local `-race` limitation.
