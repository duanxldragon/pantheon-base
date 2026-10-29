# Summary — W6 `2026-10-27-tenant-console-ui-automation`（租户控制台 UI 自动化）

## What was delivered

**New: `frontend/tests/smoke-core/tenant-console.spec.ts`** — six serial Playwright tests against the live tenant console, using only its own disposable data (timestamp-suffixed codes) so it never touches the matrix pair the isolation specs depend on:

1. **List renders** — summary cards (租户总数 / 启用中) and the table are visible; the 新增 entry exists.
2. **Create** — a tenant with its initial administrator is created through the form; the row shows the name and 启用中.
3. **Edit** — rename and switch plan to 基础版 through the edit form; the row reflects both.
4. **Lifecycle gating (W1)** — 已停用 rows keep 删除 disabled; switching to 已归档 enables it; the delete confirm goes through the secure-action flow (below) and the row leaves the default list. Screenshots before/after are in `screenshots/`.
5. **Member dialog (W2)** — pin the tenant viewpoint through the switcher; the dialog shows the provisioning owner plus a seeded member; removing the last owner is refused (最后一名…); removing the other member succeeds; re-adding through the searchable selector restores two rows; the viewpoint is exited and the tenant archived+deleted.
6. **Ops overview + plan editor** — overview metrics render; the plan drawer shows the four builtin codes; a custom `plan_console_<run>` plan is created, assigned to a tenant (row shows the raw code — `planLabel` falls back to the code for non-builtin plans), retire is refused while in use (仍有租户使用该套餐)， succeeds after the tenant is moved back to 免费版； the test tenant is archived+deleted.

**Secure-action flow built into the spec**: `DELETE /system/tenant/:id` sits behind `SecureActionMiddleware`, so the first destructive request of a browser session is answered 403 `auth.operation.verification_required` and the frontend opens the SecondaryVerifyModal. The spec registers `waitForResponse` *before* the confirm click and fills the modal on 403 — the W1 delete test exercises the real frontend verification path end to end.

**Repairs to previously-red specs** (both pre-existing on main, both report-only in CI so they never gated):

- `tenant-hostile-browser-matrix.spec.ts` asserted `/auth/current` — a route that has never existed. The mounted route is `/auth/tenants/current` (W4). Fixed in the spec and in the stale comment in `backend/modules/auth/login/login_tenant_switch.go` (comment-only). After the repair, W4's strengthened picker assertions (refusal key, `tenantSelectionRequired`, resolved owning tenant) actually run and pass.
- `tenant-viewpoint-switcher.spec.ts` test 4 failed at login since W4: the user created in test 3 had a membership but no role binding, and W4's `HasRoleBindingInTenant` gate refuses roleless logins. Test 3 now assigns the provisioned 租户成员 role; no assertion was weakened.

**Wiring**: `test:smoke:tenant` in `frontend/package.json` lists the console spec first. The CI smoke-tenant job runs that npm script directly (smoke-core.yml:230), so the spec runs in CI with no workflow edit; the job stays **report-only** — the packet's human-gate default, taken under the maintainer's standing delegation.

## How it was verified

- Console spec: 6 passed standalone three times (46.6s / 43.8s / 48.2s — `playwright.txt` holds the last, which also produced `screenshots/`).
- Viewpoint spec: 5 passed (31.8s — `viewpoint.txt`), including the previously-red test 4.
- Full `npm run test:smoke:tenant` two-leg run against the isolated stack: leg 1 16 passed / 0 failed (1.3m), leg 2 5 passed / 0 failed (32.9s). Session-recorded; not re-run for a persisted log to avoid provisioning another matrix pair (see commands.json knownGaps).
- `npx tsc -b` and `npm run lint` exit 0.
- Every run used the isolated stack (backend 127.0.0.1:8081 built from this working tree, runner-spawned disposable Vite). The maintainer's processes (ops backend 8080, dev Vite 5173) were never targeted.

## Premise deltas (packet assumptions the shipped behaviour overrode)

- **Member add is remove-then-re-add.** `ensureTenantMembership` auto-provisions membership for every user created under tenant scope, so the picker's candidate pool only contains users whose membership was removed; a platform-pool user is refused by W4's `tenant.member.user_not_in_tenant`. The spec seeds a tenant-owned user via API (`X-Tenant-Id` header) and re-adds after removal.
- **Pinning a viewpoint redirects the shell** to the tenant workbench, so the spec re-opens the tenant list after pinning instead of assuming the platform page survives.
- **Plans accumulate and cannot be deleted** (retire is terminal), so builtin coverage asserts the four codes individually and afterAll retires leftover active `plan_console_*` plans.
- **Custom plan rows display the raw code** (`planLabel` has no i18n entry for non-builtin codes); the assignment assertion uses the code, not the display name.

## Residue

- pantheon_base test DB: this session's runs provisioned one additional matrix pair (fixture design; CI's down step owns cleanup), plus the self-cleaned disposable console tenants. Earlier probe tenants/user were deleted during the session (API 200s).
- **Maintainer's ops database**: early W6 runs (before the isolated stack existed) reused the dev stack and wrote test-named rows (`console-*` tenants, `plan_console_*` plans) into it; no credentials to clean them from here — grep by `console-` / `plan_console_`. Full disclosure in commands.json knownGaps.
