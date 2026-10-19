# Summary — 2026-10-13-tenant-console-remediation

## What was broken, and why it was three separate defects

A walkthrough of the tenant console on a live `platform.tenant_mode = multi` deployment produced two
screenshots: the workbench reading **服务异常**, and the tenant page rendering raw i18n keys, a
`1-01-01 08:05:43` timestamp and the counters `1 / 0 / 0`. Those symptoms have three unrelated root
causes, in three different layers. Fixing only the visible one would have left the deployment
unrecoverable, which is why they were closed together.

### P0-1 — the column the whole console writes does not exist

`tenant_model.go` declares `Metadata string` with `gorm:"type:text"`; `CreateTenantDTO` carries it;
`CreateTenant` writes it on every insert; and `UpdateTenant` has an `if dto.Metadata != nil` branch
that the edit form always satisfies because it submits `''`. But the `tenants` DDL from migration
000013 declares only `id / code / name / status / plan / created_at / updated_at / deleted_at`.

Every console write therefore failed with `Error 1054 (42S22): Unknown column 'metadata' in 'field
list'`. **Reads stayed green**, because the list projection is `SELECT *` and the field is
`json:",omitempty"` — which is exactly why this survived review. The console looked half-alive: the
table rendered, nothing could be saved.

Fixed **forward** with `000023_tenant_metadata.up.sql`, not by editing 000013. golang-migrate applies
versioned files in order and 000013 is already recorded on every environment; appending keeps the
applied history immutable and is safe on a fresh database too. The column definition mirrors the
struct exactly (`TEXT NULL`, no default) so `Metadata string` round-trips.

### P0-2 — multi mode denied the platform console its own context

`pkg/tenant.GateSessionIssuance` deliberately issues a **claim-less** session to a user with zero
memberships — the "platform population". But `TenantContextMiddleware` denied any claim-less subject
under multi mode, and `parseTenantID` refused the value `0`, so tenant 0 could never become a legal
context.

Live probe before the fix: `GET /api/v1/dashboard/summary`, `/system/dict/type/list`,
`/system/setting/overview`, `/system/operation-log/list` and `POST /api/v1/auth/operation-verify` all
returned **`500 tenant.context.missing`**. Because the settings page failed the same way, the UI had
no route back to compat either — and contract §6 forbids switching back regardless. The deployment
was recoverable only by editing the database by hand.

This is a **contract gap, not a coding slip**. §3.3 requires the platform admin API to be
"explicitly declared", but §3.1 never said how a declared route resolves a context under multi mode.
The implementation granted the §3.1 fallback in compat only, so a platform-level subject fell into
§3.2's "missing context" branch.

### P0-3 — the reserved placeholder landed at id 1

Contract §2.3 reserves `tenant_id = 0` for platform/global rows, and 000013 intends to place the
`__global__` placeholder there — but it writes it with `INSERT ... SELECT 0, ...`. MySQL reads an
inserted `0` in an AUTO_INCREMENT column as *"assign the next counter value"* unless
`NO_AUTO_VALUE_ON_ZERO` is set, and neither the local test DSN nor CI enables it. A scratch-table
experiment proved the asymmetry: the INSERT-of-0 idiom landed the row at id 2 while
`UPDATE ... SET id = 0` assigned 0 literally.

Live state was `id=1, code='__global__', status='archived'`. Consequences: `GET /system/tenant/0`
returned 400 while `GET /system/tenant/1` returned 200; `ListTenants` had no exclusion so the
internal row rendered as an ordinary tenant — **the direct source of the bare `__global__` row and
the `01-01-01 08:05:43` cell**; and `DeleteTenant` only checked active members, so the UI could
soft-delete the platform's own placeholder.

## The design question: is tenant/non-tenant inherently exclusive?

The user asked whether supporting both modes means the UI can only keep one. It does not — but the
answer required a contract amendment, because the *implementation* was exclusive in a way the
contract never intended.

**Chosen: option b+c** — gate the fallback on **platform capability** *and* on the **route declaring
the platform scope**. Concretely, `Resolve` gains a branch that fires only when all three hold:

1. the route group declared the platform scope (`PlatformScopeTenantContextMiddleware`);
2. the subject carries a platform-level grant (the `platform_ops` role key, **or** any global
   domain-less Casbin policy allowing the requested route);
3. the subject holds **no** active membership (fail-closed when the answer is unavailable).

All three are needed. Declaration alone would let a tenant subject widen itself to global;
capability alone would let a claim-less tenant member reach the platform namespace; the membership
probe is what keeps the implicit fallback from shadowing a real tenant membership.

Because global Casbin policies are the platform namespace **by construction**, a tenant-domain grant
(`role:<key>@tenant:<id>`) can never satisfy condition 2 — which is what keeps contract §4's "never
merged, never implicitly escalated" true.

Result: **`multi` becomes a superset of `compat`**, and a tenant-less platform operator and tenant
subjects share one deployment.

### UI option 3

The tenant console is no longer hidden by `platform.tenant_mode`. The menu capability filter lost its
tenant gate, and the page renders a compat guidance state (with a link to platform settings) instead
of a table. The mode still gates **behaviour**; it no longer gates **discoverability**.

## Secondary defects closed in the same change

| ID | Defect | Fix |
| --- | --- | --- |
| P1-1 | Search box was decorative: `loadData` never sent the keyword; no `Keyword` field, no LIKE branch. `?keyword=zzz-no-match` returned the same row. | Keyword threaded through DTO → service → escaped LIKE, plus the frontend query field. |
| P1-2 | Status dimension not closed: `Filter.Status` bound `oneof=active suspended deleted`, so `?status=archived` (a §2.1 lifecycle value) was rejected with 400; the edit form had no status control at all, so a tenant could never leave `active`. | `archived` added to the filter and to `UpdateTenantDTO.Status`; edit form gains a status Select. |
| P1-3 | Soft-deleted rows still listed: `DeleteTenant` only sets `status='deleted'` and `ListTenants` had no exclusion. | Deleted hidden by default, reachable via an explicit `status=deleted`. |
| P1-4 | Summary not self-consistent: `总数` read the global `state.total` while `启用中`/`已禁用` counted the current page, so any multi-page result disagreed — and archived/deleted were invisible entirely (the screenshot's `1 / 0 / 0`). | Server-side `summary` facets (every filter except `status`), so counts are page-independent; `deleted` reported separately instead of inflating `total`. |
| P1-5 | `check:menu-contract` red with 10 findings: five `system.permission.tenant.*` keys are seeded as backend action permissions but were absent from the zh-CN and en-US fallback packs. | All five added to all five locale packs (plus the new display keys). |
| P2-1 | Go's zero time `0001-01-01T00:00:00Z` passed the ISO regex in `parseDate`; year 1 sits at UTC+08:05:43 — precisely the `01-01-01 08:05:43` cells. | `isGoZeroTime` added to the shared formatter, so every page that renders a timestamp benefits. |
| P2-2 | `gofmt -l backend/` reported two files. | Both formatted. |

## Evidence

**Live probe: 30/30 checks passed** against the running multi-mode backend (`.tmp/verify_tenant_remediation.py`).

Notable ones:

- `multi: dashboard/summary reachable -> status=200 code=200 msg=success` (and the same for dict,
  setting, operation-log, menu-tree, operation-verify) — the P0-2 regression, previously 500.
- `reserved placeholder not listed -> codes=[]` and `GET /system/tenant/0 rejected as invalid ->
  code=400` and `DELETE /system/tenant/0 rejected -> code=400` — P0-3 closed on all three read paths.
- `create tenant (metadata column present) -> status=200 code=200` — P0-1 closed.
- `summary facets are self-consistent` and `summary total matches unfiltered list total` — P1-4.
- `LIKE metacharacter is escaped -> items=0` — P1-1.
- `soft-deleted tenant leaves the default view` / `reachable via status=deleted` — P1-3.

Database state after the run: `schema_migrations` version **22 → 23**; `tenants` holds exactly one
row — `id=0, code='__global__', status='archived'`; `tenants.metadata` is `text / NULL / nullable`.

**Backend:** `go build ./...` exit 0 · `go vet` clean · `gofmt -l` clean · `pkg/tenant` PASS
(0.483s) · `internal/middleware` PASS · `modules/auth/*` all PASS · platform-scope matrix **8/8**,
membership guard **4/4 against real MySQL**, failure envelopes PASS.

**Frontend:** all **13** contract gates PASS (`check:menu-contract` now green — the ratchet this
packet records) · `tsc -b` exit 0 · `dateTime` unit tests **21/21**.

**Harness:** `check-task-packet` PASS · `check-evidence --strict` PASS · `check-adoption` 0 findings ·
`check-doc-frontmatter` / `check-doc-links` / `check-doc-inventory` 0 findings each.

## Follow-up defects found in manual UI review

Two further defects surfaced when the maintainer walked the restarted stack by hand. Both are now
fixed and verified.

### P1-6 — the tenant permission rows rendered at the menu root

In **菜单管理**, the five tenant permission rows (`租户新增 / 租户编辑 / 租户删除 / 租户成员添加 /
租户成员移除`) appeared as **top-level entries** instead of nesting under `访问控制 → 租户管理`.

`resolveMenuParentID` turns a seed's `ParentKey` into a `parent_id` through a **hardcoded
`parentPaths` map**, and that map had no `"tenant"` entry. `tenantMenuSeeds` declares
`ParentKey: "tenant"`, so the lookup missed — and the function **returned `0` silently**. All five
F-type rows therefore got `parent_id = 0`. The parent row itself was fine (`parent_id = 1`), because
`"access"` *was* in the map, which is why the sidebar looked correct while the management table did
not.

Confirmed at the data layer: ids **166–170 had `parent_id=0`** while id **165 had `parent_id=1`**.

The fix is one map entry (`"tenant": "/system/tenant"`). No data migration was needed:
`ensureSingleMenuSeed` finds the existing row by `perms` and calls `updateSeedMenu`, which re-writes
`parent_id` — so **the ordinary startup re-seed repaired the rows**. After restart all five read
`parent_id=165`.

Because the *silent* fallback is what let this pass review, `resolveMenuParentID` now logs a warning
when a seed declares a parent key the map does not know, while still creating the menu (at the root)
rather than failing the whole seed. A sweep of every `ParentKey` used by every seed confirmed
`tenant` was the only unmapped one, and the warning logged **zero times** on a clean boot — so no
other menu is misplaced.

### P1-7 — 租户管理 must leave 访问控制 under 单租户

The first implementation of UI option 3 deliberately kept the tenant console visible in both modes
and rendered a compat guidance state instead of a table. The maintainer's refinement: under
**单租户 (compat)** the `租户管理` menu should be **removed** from `访问控制`; under **多租户 (multi)**
it stays.

Implemented as a `tenantEnabled` capability on the **existing** menu capability filter — the same
mechanism that already gates `system.org` on `org.enabled`:

```ts
if (!caps.tenantEnabled && item.module === 'system.tenant') return false;
```

The gate lives in the frontend rather than as a `visible` column flip because the mode is a runtime
setting that can change without a re-seed, and the frontend already receives it through the public
settings payload. The compat guidance state on the page itself is **kept**: with the menu entry gone
the page is reachable only by direct URL or a stale bookmark, and it still answers with guidance plus
a link to platform settings rather than an empty table.

### Verification

`python .tmp/verify_tenant_menu_fix.py` → **18/18**:

- **A (nav tree):** `/system/tenant` exists, is nested under `/system/access`, carries module
  `system.tenant`, is not a top-level entry, and no orphan tenant permission node appears.
- **B (manage scope — the view 菜单管理 renders):** the tenant menu has **exactly** the five expected
  permission children; **no** tenant permission row sits at the root; none is orphaned elsewhere.
- **C (compat visibility):** the frontend filter keeps `租户管理` under multi, removes it under
  compat, keeps `访问控制` itself, drops **exactly one** child (5 → 4, leaving
  user/role/permission/menu), and does not disturb `system.org` or `system.config`.

No regression: the original probe re-ran **30/30**, `tsc -b` exit 0, and all **13** frontend gates
pass (`check:menu-contract` included). `go test ./modules/system/` also passes (`ok 0.241s`) — the
package's seed tests **do** run on this host, unlike `modules/system/iam/tenant`, so the change to
`resolveMenuParentID` is covered by the existing seed suite as well as by the live probe.

## Scope honesty: what this task does *not* cover

Reviewing the packet against `git diff` rather than against its own prose caught three things worth
stating plainly.

**1. The tenant console menu was created by this task, not merely displayed.** Before this change the
console had a URL and five backend action-seed permission keys — but no menu rows, no component
registration and no translations. That is why `modules/system/seed.go`, `modules/system/i18n/
seed_data.go`, `builtin_locale_resources.json` and `menu/component_registry.go` are in the change, and
why the `system:tenant:*` permission→route mappings were added to the permission workbench. These are
*declarations*: **no Casbin policy is granted to any role**, so the console's permissions still have
to be assigned through the normal IAM flow.

**2. `platform.tenant_mode` was made public.** The setting's `is_public` flag was flipped 0 → 1
(appended as migration `000022_tenant_mode_public` and mirrored in `setting_seed.go`), because the
frontend cannot choose between the tenant table and the compat guidance state without reading the
mode. The setting's **value** is untouched: the seed default stays `compat` and the live row stays
`multi`. This is a visibility change, not a mode change.

**3. The working tree carries a second, unrelated changeset.** Log-governance retention-option refresh
plus CSV export for admin sessions and security events is also uncommitted in the same tree
(`backend/modules/auth/login/*`, `auth/security/security_service.go`, `auth/session/session_service.go`,
the `system:session:export` / `system:security-event:export` rows, `frontend/src/modules/auth/*`,
`GovernanceCleanupBar.tsx`, `OperationLogList.tsx`, `config/setting/*`, and a one-line hero key rename
in `menu/MenuList.tsx`). **None of it is covered by this task's evidence.** Two files are genuinely
shared and touched by both changesets: `backend/modules/auth/module.go` and
`backend/modules/system/iam/permission/permission_workbench.go`.

**4. Repo-wide `check-evidence --strict` is red for pre-existing reasons.** Nine historical
`commands.json` files fail the current schema and are untouched here (stale `planRefs`, out-of-
allowlist `agent.tool`, invalid statuses, non-object `linkage`, non-array `knownGaps`). Run against
this task's file alone the gate reports **1 file, 0 errors, 0 warnings, exit 0**.

## Residual risk

- **The tenant module's unit tests did not run.** `go test ./modules/system/iam/tenant/...` fails at
  the cgo/SQLite **link** step (`gcc.exe exit status 1`), not at compile: `go build`, `go vet` and
  `gofmt` all pass on the package. The new list/filter/summary cases are therefore written and
  reviewed but unexecuted. Compensating evidence is the 30-check live probe, which covers the same
  behaviours end to end against MySQL.
- **`check-encoding.mjs` did not run.** It shells out via `spawnSync(git ...)` and Node cannot spawn
  any subprocess on this host (`EBUSY`, unchanged with the sandbox disabled). The encoding sweep is
  not part of the evidence set.
- **No in-browser visual pass.** The UI change is asserted at the contract level (`tsc`, 13 gates,
  i18n keys) and via the backend probe, not by driving a browser.
- **The contract amendment invalidates runbook §8 gate G4** ("no open contract-change"). Only a
  maintainer can re-grant it; this task does not declare it granted. The production DDL/data-change
  ban is untouched.
- **`tenants` CRUD ownership is still wrong** per contract §7 (it says `system/org`; the console lives
  in `system/iam`). That predates this task and is recorded as a follow-up rather than silently
  re-homed here.
- **`platform.tenant_mode` stays `multi`.** Contract §6 makes the switch one-way, and the deployment
  is now fully functional on multi, so there is nothing to switch back to.
