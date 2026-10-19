# Evidence Summary — 2026-10-13-tenant-true-isolation

## What this task changed

`docs/TENANT_INITIALIZATION_FINDINGS_2026-10-13.md` established, with live evidence, that multi mode
shipped a **tenant *claim* pipeline, not tenant *isolation***: creating a tenant produced one `tenants`
row and nothing else; membership roles never mapped to Casbin permissions; and
`system_user` / `system_role` / `system_dept` / `system_post` had no `tenant_id` column at all, so IAM
data was global.

This task closes that gap against three maintainer-confirmed product decisions:

| Decision | Implementation |
|---|---|
| Username unique **per tenant** (true multi-tenancy) | `system_user` unique key `(tenant_id, username)`; login resolves `(tenant_id, username)` when a tenant is named |
| Tenant administrator = **full console, automatically confined to its tenant** | `tenant_admin` receives `/api/v1/*` in its Casbin domain; confinement is enforced by `tenant.WithTenantScope`, not by narrowing the path surface |
| Isolation scope = **all of IAM** (user / role / dept / post / permission) | `tenant_id` on 18 core tables; every IAM service reads scoped and writes stamped |

## Root causes, by layer

**Schema layer.** `000024_tenant_core_tables_repair` adds `tenant_id BIGINT UNSIGNED NOT NULL DEFAULT 0`
to 18 tables (guarded, idempotent) plus the two composite unique keys that make per-tenant uniqueness
real. Verified live: 18 tables carry the column; `schema_migrations` = 24.

**Service layer.** Every IAM service gained a `tenantCtx` field, a `WithTenantContext` clone, a
`scoped(db)` helper and a `tenantOwnerID()` for writes. This is where the subtlest failure mode lives —
see "GORM statement reuse" below.

**Middleware layer.** `X-Tenant-Id` is now validated against a real, active tenant; the tenant-console
route group gained a platform-capability gate; the data-scope middleware learned to recognise a tenant
administrator.

**Auth layer.** Credential lookup became tenant-aware; the session gained a tenant switch that preserves
the session id and re-signs the token pair.

## Four real defects found only by running it

These were not visible from reading the code, and each would have shipped a broken feature:

1. **Tenant creation failed outright.** `copyPlatformSettingsToTenant`'s `INSERT ... SELECT` omitted
   `group_key`, which is `NOT NULL` with no default → MySQL 1364 inside the provisioning transaction.
   The tenant row survived, everything else rolled back. *Fixed by copying the full descriptive column set.*
2. **The member list 500'd.** `activeTenantMemberPredicate` was unqualified, and the isolation migration
   itself made `tenant_id` ambiguous in the `LEFT JOIN system_user` → MySQL 1052. *Fixed by qualifying the
   predicate with `tenant_memberships.`*
3. **A tenant's own `admin` could not log in** (401 password_wrong). `FindByUsername` had no tenant filter,
   so the platform `admin` (id 1) always shadowed the tenant `admin` (id 527). This is precisely the failure
   the `(tenant_id, username)` decision exists to prevent. *Fixed with a tenant-scoped port lookup plus a
   deterministic platform-first ordering for the unnamed-tenant path.*
4. **The tenant administrator's console was empty.** `hasAdminRole` only matched the platform key, and
   `tenant_admin` has no `system_role_data_scope` row, so the scope fell through to custom + empty dept set
   and denied every row. The "full console" decision produced a console showing nothing. *Fixed by
   recognising both administrative keys, with a companion test pinning that a policy-less non-administrative
   role still fails closed.*

A fifth defect was caught on the frontend: the create-tenant form sent `adminUsername` (camelCase) while
`CreateTenantDTO` binds `admin_username` (snake_case). Gin silently ignores unknown keys, so the form
looked correct and produced a tenant with no administrator.

## The single most dangerous trap: GORM statement reuse

Sharing one `s.scoped(db)` handle across several `Where` / `Table` calls leaks conditions and the table
name into later queries, because GORM reuses the statement. Symptoms observed: `Unknown column 'parent_id'
in 'where clause'` (dept delete guard) and a corrupted user-count query in `loadDeletableRole`. The rule
adopted throughout is: **every query derives a fresh scoped handle from the pristine `tx`.** This is called
out in the task packet's Implementation Notes so it is not rediscovered the hard way.

## Verification

**Primary evidence — live, end to end.** `.tmp/verify_tenant_isolation_phase_g.py` runs against the real
multi-mode stack and passes **34/34**. It creates two tenants with the *same* admin username and different
passwords, then asserts: both can log in; each tenant's password is rejected against the other tenant; each
administrator resolves to its own tenant; each sees only its own users/roles/depts/posts; a user created in
tenant A is invisible in tenant B and unreadable by id; the tenant console returns 403 for a tenant admin;
`X-Tenant-Id` rejects a bogus tenant and accepts a real one; a no-op switch and a non-member switch are both
refused. It tears down everything it creates.

Raw output: `live-probe-phase-g.txt`.

**Static gates.** `go build ./...` passes; `gofmt -l internal/ modules/ pkg/` is empty; frontend `tsc -b`
and `eslint` are clean; the shell visual contract passes with the new header control in place.

**Not completed, recorded honestly.** `go vet` and the combined targeted `go test` run did not finish, and
the cause is measured rather than guessed. `go vet ./pkg/tenant/...` consumed **0.03s of user CPU across a
5-minute window** and emitted nothing — it is *blocked*, not slow. `go vet -x` prints 345
`mkdir -p $WORK\...` lines and then blocks before invoking the compiler or the vet tool (`vet.exe` is present
in `GOROOT/pkg/tool`). Three explanations were eliminated by experiment:

| Hypothesis | Test | Result |
|---|---|---|
| Network / module download | `GOPROXY=off go vet ./pkg/tenant/...` | identical hang (a missing module would fail fast) |
| Test-file dependencies | `go vet -tests=false ./pkg/tenant/...` | identical hang |
| Build-cache lock contention | reproduced with **zero** other Go processes, right after a successful `go build` | identical hang |

Warm-cache operations succeed, which is why the failure looks selective: `go build ./...` exits 0 in ~14s and
`go list ./pkg/tenant/...` completes in 2.1s. Because `go vet` and `go test` *always* require a fresh
compile/vet invocation, neither can complete on this host. Packages whose tests did complete earlier in the
session (warm cache): user (`ok 34.137s`), role (`ok 19.526s`), dept (`ok 4.594s`), post, platform,
`pkg/tenant`, `pkg/rbacbind`. The two new regression tests are compiled but their assertions were not
executed in this session; the live probe independently exercises the same code paths end to end.

## Residual risks

- **`copyPlatformSettingsToTenant` uses a hand-written column list.** Adding another `NOT NULL`-without-default
  column to `system_setting` will re-break tenant creation exactly as D1 did. This is flagged in the task
  packet's Human Gates so the migration review catches it.
- **Tenant confinement is a per-service convention, not a framework guarantee.** A new IAM service that
  forgets `WithTenantContext` will read across tenants. The pattern is uniform across user/role/dept/post
  today, but it is a convention to be maintained, not an invariant the compiler enforces.
- **`go vet` could not be run** (any fresh Go tool invocation blocks on this host — see above), so the
  vet-specific checks (printf verbs, unreachable code, struct tags) are unverified for the changed packages
  in this session. This is a host limitation, not a signal about the code: `go build ./...` passes.
- The tenants-CRUD ownership mismatch (contract §7 says `system/org`, the console lives in `system/iam`)
  predates this task and was deliberately left alone.

## Follow-up (2026-10-14): the frontend tenant viewpoint channel, tested and run live

The original change set ended with an explicit gap: the frontend half (viewpoint switcher, `X-Tenant-Id`
attachment, create-user-join-tenant) was covered by static gates only, with no unit tests and no runtime
evidence. This follow-up closes the testable part of that gap.

**New tests (frontend, `vitest`; suite now 24 files / 193 tests, all green).**

| File | What it pins |
|---|---|
| `frontend/tests/unit/core/tenant/viewpoint.test.ts` (13) | viewpoint storage: off / platform-global 0 / pinned > 0, clearing, and that a corrupt or empty stored value degrades to *off* instead of guessing (an empty string would otherwise coerce to `0` and read as platform scope — fixed in `viewpoint.ts` as part of this work) |
| `frontend/tests/unit/api/tenantViewpointHeader.test.ts` (6) | the real axios interceptor chain with a swapped adapter: `X-Tenant-Id` present on reads and writes for a pinned tenant, absent for viewpoint-off, absent for platform-global 0, absent for `/auth/*`, and gone again after `clearTenantViewpoint()` |
| `frontend/tests/unit/modules/system/iam/user/useUserList.joinTenant.test.tsx` (9) | the integration the feature exists for: after `createUser` succeeds inside a pinned view the hook calls `addTenantMember(tenantId, {user_id, role})`; the form-only fields never reach the user API; opt-out, no-viewpoint, platform-global 0 and "no usable id" all skip the membership call; a failed membership call is reported **without** undoing the created user |

**Live probe (`frontend-viewpoint-probe.txt`, 22/22 against the running dev stack).** The probe replays the
exact request sequence the frontend now performs: platform subject lists active tenants (the switcher's
data source), no-header platform scope, valid `X-Tenant-Id` → `resolvedBy: header`, the pinned scope lists
that tenant and hides the platform operator, bogus header → 403, `X-Tenant-Id: 0` → platform-global;
create user inside the pinned scope → row stamped into that tenant and absent from the platform scope;
`POST /system/tenant/:id/members` → active `member` row; the created user then logs in with the tenant
selected and resolves to it, while a wrong password still fails. Two safety properties were confirmed at
the same time: a non-platform subject sending *any* `X-Tenant-Id` is refused (403 `tenant.forbidden`,
never unscoped), and a tenant member is refused `/system/tenant/list` (403 `permission.denied`), which is
what hides the switcher for them.

**One documented behaviour corrected by running it.** The frontend comments claimed the backend *ignores*
`X-Tenant-Id` from a non-platform subject. It does not: `TenantContextMiddleware` resolves the header only
when `subjectHasPlatformCapability` is true, so a non-platform subject gets **403 `tenant.forbidden`** even
when the header names its own tenant. The comments in `api/request.ts`, `core/tenant/viewpoint.ts` and
`modules/auth/tenant/TenantViewpointSwitcher.tsx` were corrected to say "refused", which is the stronger
fail-closed guarantee the frontend actually relies on. No behaviour changed — the frontend still only never
attaches the header for viewpoint-off/0, and only a platform-capable subject can reach the control.

**Still open** (see `commands.json` → `knownGaps`): no in-browser click-through of the switcher/banner, and
`tests/` remains outside the repo typecheck gate.

## Browser acceptance (2026-10-14): real Chromium against the real multi-mode stack

The follow-up above closed the HTTP half of the frontend gap but still said "no real browser". This pass
closes that too: `tests/smoke-core/tenant-viewpoint-switcher.spec.ts` drives Chromium against the live stack
(vite dev server on 5173 proxying `/api` to the backend on 8080, MySQL + Redis), 5/5 green in 58s.

It is registered the way this repo expects: `npm run test:smoke:tenant:viewpoint` (leaf) and appended to the
`test:smoke:tenant` aggregate, with a row in `tests/smoke-core/README.md`. The spec provisions its own tenant
through the admin API in `beforeAll`, so it works locally without the 101/202 fixtures, and cleans up in
`afterAll`. Set `PANTHEON_VIEWPOINT_EVIDENCE_DIR=<dir>` to keep screenshots (six were captured here).

| Case | What it asserts in a real browser |
|---|---|
| 1 | Platform admin lands in platform-global scope: **no** `X-Tenant-Id` on any `/api/v1/` business call, no banner, the switcher reads 平台全局 |
| 2 | Pinning through the real dropdown: the shell does a full reload, the banner appears with the tenant name, and **every** `/system/user/list` call carries `X-Tenant-Id=<tenant>`; the tenant's own admin is listed while the platform operator is absent |
| 3 | Create user inside the pinned view: the join-tenant box is **checked by default**, the toast reports 用户已创建并加入租户成员, the row appears, and an API cross-check finds the membership `active` |
| 4 | The created user signs in through the login form: new session, no banner, switcher not rendered (non-platform subject), no header on its calls |
| 5 | Exiting from the banner: banner gone, switcher back to 平台全局, no header afterwards |

### The defect the browser found (and fixed)

Arco's `Form.Item` needs `triggerPropName="checked"` for a `Checkbox`, exactly like the rest of this repo
does (`I18nList`, `SettingGroupForm`, the low-code generators). Without it the field value never reached the
control: `emptyFormValues.joinTenant = true` was set, the membership role select showed 普通成员, and yet the
join box rendered **unchecked**. An operator would have seen "not joined" and could not have told whether the
account was loginable in multi mode — the exact question the gesture exists to answer. The fix also moved the
hint text to the FormItem's `extra` (keeping the control the only child) and dropped the now-dead
`.system-user-list__join-tenant-hint` rule. Static gates and 193 unit tests were green before this fix; only
the browser could see it.

### Teardown lessons recorded

`DELETE /system/tenant/:id` refuses while an active member remains, answering `500 tenant.has_active_members`
(an API-hygiene wart, left alone: shared contract). The spec therefore purges every membership first — including
the owner created by provisioning — deletes its created user, then asserts the tenant delete returns 200. Two
things still survive it, so teardown SQL is required and was run (both counts 0 afterwards): the tenant row is
only *soft*-deleted, and the tenant admin's `system_user` row is not removed. The user prefixes
`smoke_tadmin_` / `smoke_user_viewpoint_` were also added to `scripts/cleanup-smoke-fixtures.mjs` so an
interrupted run is swept by `npm run smoke:cleanup` (that change is covered by `test:api:unit`, 12/12).

### Still not asserted

The six screenshots are for human review, not a golden-image diff: there is no pixel-level visual regression
check for the switcher/banner states, and the switcher's own visual polish was not reviewed against a design
reference in this pass.
