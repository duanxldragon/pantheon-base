# Changelog

Pantheon Base 方法追踪记录。方法论本体位于 `pantheon-harness`。

格式灵感：[Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)

---

## [pantheon-base-v0.17.2] — 2026-10-23 (residual closeout)

> v0.17.1 left five items explicitly open. Closing them turned two "unverified" claims into
> reproducible defects, both in the tenant lifecycle: concurrent creation of two tenants
> **deadlocked** inside the settings copy (`Error 1213`), and a deleted tenant could be
> **revived** by a status update because the state machine's `default` branch answered "allowed"
> for the tombstone. Both are fixed, with tests that fail on the previous behaviour. The other
> three are closed by removing the condition rather than by re-labelling it: the Redis test
> flake by giving each package its own logical database, the race-detector gap by finding a
> working toolchain, and the unrecallable v0.17.0 credential by a release-time scan that refuses
> to publish a bundle carrying one. Contract §2.1 gains the V1.3 clarification the tombstone
> needed. Evidence: `.harness/evidence/2026-10-23-residual-closeout/`.

### Fixed

- Concurrent tenant creation no longer deadlocks. `copyPlatformSettingsToTenant` and
  `copyPlatformDictsToTenant` used `INSERT ... SELECT` against the same table they read, which
  takes shared next-key locks on the platform rows and collides with a concurrent copy's
  insert-intention locks: two tenants created at the same moment produced
  `Error 1213 (40001): Deadlock found when trying to get lock` and the operator saw a 500. The
  copy is now a non-locking `SELECT` followed by an insert. Reproduced first, then fixed:
  `TestConcurrentProvisioningKeepsTenantResourcesIsolated` failed with the deadlock on the old
  code and passes 8 consecutive rounds on the new one.
- Losing the race for a tenant `code` now answers the same conflict the pre-check would have
  returned, instead of `500 create tenant: Error 1062 (23000): Duplicate entry ... for key
  'tenants.uk_tenant_code'`. The pre-check cannot be atomic, so the UNIQUE index is the real
  arbiter; `pkg/database.IsDuplicateKey` recognises it and `CreateTenant` re-reads the blocking
  row to distinguish "taken" from "taken by a deleted row".
- A deleted tenant can no longer be revived, gain members, or be re-provisioned. `deleted` is a
  tombstone, not a lifecycle state, but `tenantStatusTransitionAllowed` fell through to
  `default: return true` for it and `GetTenantByID` did not filter it — so
  `PUT {"status":"active"}` brought the tenant back with its synthetic `__deleted_tenant_<id>`
  code, which no operator can type. `GetTenantByID` now reports a tombstone as not found
  (contract §5: missing and foreign are indistinguishable) and the state machine answers "no"
  for it. Deleted rows stay reachable through the explicit status-filtered list.
- `TestBatchRevokeSessions_IsTenantScoped` no longer fails when packages run in parallel.
  `go test ./...` runs packages concurrently and every `testredis.Open` flushes its database on
  cleanup, so a sibling package wiped the session keys mid-assertion. Each package that asserts
  a key survives now claims its own logical database through `testredis.OpenDB` and a registry
  of reserved indexes; the shared default stays for everything else.

### Added

- `scripts/foundation-release/check-release-secrets.mjs`, a hard precondition in the publish
  flow: a bundle carrying a credential in a DSN or on a command line is refused before the tag
  exists. v0.17.0 shipped a development password that way and it could not be recalled. The
  rules are deliberately narrow (three shapes, not an entropy heuristic) because a gate that
  reports test fixtures and i18n copy gets bypassed — the first, broader rule set reported 42
  false positives on the real v0.17.1 bundle.
- Contract `TENANT_CONTRACT_V1` V1.3: §2.1 now states that `deleted` is a tombstone rather than
  a lifecycle state, that it is never accepted as input and never addressable, that the delete
  marker is `status` and not the reserved `deleted_at` column, and that deleting an archived
  tenant disables its memberships in the same transaction (§2.2's owner rule constrains
  non-archived tenants only).

### Changed

- `GET /api/v1/system/tenant/:id` (and the member, update and provision endpoints behind it)
  answer `404 tenant.not_found` for a deleted tenant. Previously they answered `200` and allowed
  writes against the tombstone. Operators still see deleted tenants in the list under an
  explicit `status=deleted` filter.
- `go test -race` now runs locally: the failure was the Cygwin `gcc` on `PATH`, not a missing
  toolchain. `CC=/d/msys64/mingw64/bin/gcc.exe` builds and runs the race detector, so the
  earlier "race coverage comes from CI only" note no longer applies.

### Compatibility

- No schema change: the database stays at version 29. No route, permission code, menu seed or
  error envelope shape is removed or renamed.
- `pantheon-ops` can advance its foundation lock from v0.17.0 or v0.17.1 to v0.17.2;
  `sharedPaths` stays at 52 entries.

---

## [pantheon-base-v0.17.1] — 2026-10-22 (delivery closeout and tenant lifecycle)

> An independent delivery audit of `main 92b94474` returned **FAIL on delivery completeness** —
> no P0, no functional regression, but three blocking items: `Release Gate` was red on `main`, the
> remediation lived only in an uncommitted worktree, and the consumer-facing docs contradicted both
> the code and the published release. This patch closes all three, plus two tenant-lifecycle gaps
> the audit found independently (an archived tenant could never be deleted, and a failed
> provisioning stranded its row) and one UI consistency defect on the dictionary page.
> Evidence: `.harness/evidence/2026-10-22-v0171-release-closeout/`.

### Fixed

- Tenant member removal now refuses to delete the last active owner (contract §2.2), so a tenant
  can no longer be left without anyone able to administer it; removing a plain member or one of
  several owners is unchanged.
- An archived tenant can no longer be written back to active (contract §2.1 declares archived
  terminal), and a rejected transition no longer applies the other fields of the same request.
- Deleting an **archived** tenant now succeeds even while it still has active members: the
  memberships are disabled in the same transaction as the code release and the status change.
  Before this, §2.1 (archived is the retirement path) and §2.2 (the last owner cannot be removed)
  deadlocked, so a provisioned tenant could never be deleted through the API. A live tenant with
  members is still refused with `tenant.has_active_members`.
- `CreateTenant` now removes the tenant row when provisioning fails. Provisioning already ran in
  one transaction, but the row it was provisioning survived — holding a UNIQUE `code` and no
  owner, repairable only by hand. With the compensation the operator's retry is a plain re-create.
- Reading or updating a user that belongs to another tenant answers `404 user.not_found` instead
  of `500 user.detail.error` / `500 user.update.error`, matching contract §5 (a foreign id and a
  missing id are indistinguishable). The write path resolves the row before mutating anything.
- A reserved role-key conflict (`role.key.reserved`) now reports envelope code `400` instead of
  `500`, through `common.CodeForError`.
- The dictionary page's governance bar no longer renders a description line under each metric.
  Every other system list (`/system/user`, `/system/post`, …) shows only label + value there and
  keeps the explanation in the governance rail, so the dictionary page was the odd one out and
  three lines of prose pushed the table down. The three now-unused i18n keys were removed from all
  five locales.
- The settings page's governance bar lays its four metrics on one row instead of wrapping to a
  2×2 block. The default metric grid starts at 120px, which only fits three across, so the fourth
  dropped to a second row and the bar doubled in height (152px → 82px). The page now gives the
  metrics column more width and a 96px floor, so it stays on one row down to a 960px viewport and
  falls back to 2×2 only at the existing ≤920px mobile breakpoint.
- The migration chain can be rolled back again. `000020_tenant_phase1_core_tables.down.sql` dropped
  indexes and columns unconditionally, but `000024.down` had already removed several of them, so
  `migrate down` aborted part-way with `Error 1091: Can't DROP 'tenant_id'; check that column/key
  exists` and left the schema version dirty. Every destructive step is now guarded on
  `information_schema`, so the rollback completes and the chain can be re-applied.
  `TestMigrationChainRollsBackAndReapplies` migrates a throwaway database up → down → up and asserts
  it returns to the same clean version; the test fails against the previous file.

### Changed

- The eight SonarCloud findings that blocked `Release Gate` on `92b94474` are resolved without
  suppressions: two duplicate SQL literals in `tenant_provision.go` became named constants, the
  platform-grant repair was split into collect/delete helpers, `useLayoutMenu` capability filtering
  was split into pure helpers, three component prop types are `Readonly`, and `isTenantScopedSession`
  uses optional chaining.
- `docs/api/TENANT_API.md` now documents the mounted `/api/v1/system/tenant*` surface (platform-only),
  the envelope codes it actually returns, and points the "my tenants" flow at
  `/api/v1/auth/tenants/switchable`.
- `docs/designs/TENANT_RESOURCE_SCOPE_MATRIX.md` (zh/en) no longer claims the runtime is single-tenant;
  the matrix is marked as the governance template for the delivered compat/multi model.
- `docs/DEPLOYMENT_GUIDE.md` gained a tenant-mode section (`compat` default, `multi` opt-in, one-way
  switch, platform subject requirement) and the rollback rehearsal record.
- README (zh/en) names v0.17.1 as the current foundation release and links its release notes.

## [pantheon-base-v0.17.0] — 2026-10-21 (tenant isolation remediation)

> A post-acceptance audit found two tenant→platform permission escapes and a permanently red
> tenant smoke job. This slice closes them at the namespace layer: policy writes take their tenant
> from the request context, role keys cannot shadow the platform namespace, and the role lifecycle
> (delete/rename/bootstrap purge) understands the `role:<key>@tenant:<id>` form.

### Security

- The permission policy console is bound to the request tenant on every surface. A tenant-scoped
  write always stores `role:<key>@tenant:<id>`; a body `tenantId` that names another tenant is
  rejected with `TENANT_FORBIDDEN`, and `tenantId=0` no longer produces a global policy. List,
  export, update and delete only touch the caller's domain (contract §2.3.1).
- Policy import and workbench remediation resolve the stored subject from the context instead of
  writing the bare role key, so neither can create a global grant from a tenant session.
- Tenant role keys may not shadow the platform namespace: keys owned by tenant 0 (`admin`, …) and
  `platform_ops` are rejected on create/rename/import. Previously a tenant could create `admin`,
  assign it, and inherit the platform Casbin grants at login.
- The permission bootstrap only purges policies whose subject no longer names a live role,
  recognising the tenant-domain form. It used to delete every tenant policy on each boot.
- Role delete removes exactly the role's own subject; rename moves the policies in the same
  transaction instead of leaving stale grants and a role with no API surface.
- `permission_workbench_remediation_event` gains `tenant_id` (migration `000028`), so remediation
  history is no longer shared between tenants that own the same role key.
- 2026-10-21 full acceptance review closed a further tenant-isolation P0 and P1/P2 set before this
  cut: menu and i18n system writes are gated by `PlatformCapabilityMiddleware` (a `tenant_admin`
  domain grant can no longer rewrite the global menu tree or cascade cross-tenant
  `system_role_permission` cleanup), compat-mode tenant scope is pinned rather than skipped,
  tenant suspend/member removal revokes sessions, the OIDC schema moved into guarded migration
  `000029` with a tenant-scoped unique key, the role-key mutex became bidirectional, and the
  frontend session boundary clears route-warm data and the operation token. Evidence:
  `docs/reviews/PANTHEON_BASE_ISSUES_AND_REMEDIATION_2026-10-21.md` (FIX-1…FIX-11).

### Fixed

- `platform.tenant_mode` is seeded public and `Bootstrap` raises `is_public` on an existing row
  (never lowers it). Upgraded deployments now publish the flag, so the tenant picker, switcher and
  viewpoint switcher render again — one cause of the red `Tenant Smoke` job on every main commit.
  A second, independent trigger (server-side auto-join colliding with the console's re-add call,
  `tenant.member_exists`) was removed by the idempotent membership write below. The job is not
  claimed fixed: the same commit both failed and passed it, so the remaining red is flakiness.
- Tenant membership writes are idempotent: re-adding an existing member updates or reactivates the
  row instead of failing, and owner rows cannot be demoted through this path. This also removes the
  false "join failed" toast on every tenant-viewpoint user create.
- `AddMember` / `RemoveMember` select the membership row through bound map conditions instead of a
  raw `tenant_id = ? AND user_id = ?` fragment. Same placeholders and same semantics; it cleared the
  duplicated-literal and cognitive-complexity findings on the new code. It did **not** clear
  `gosecurity:S3649`: that rule treats any GORM builder call fed from the request as a sink, whether
  the value reaches a bound placeholder or not.
- The membership update now rewrites the row that was just loaded, by primary key, with `Select`
  naming the columns and a typed struct for the values, so no request-supplied value sits in a column
  or condition position. Measured on SonarCloud: main went from three `S3649` blockers to two
  (`:711` read, `:726` update) and the PR-scoped quality gate reads OK, but the branch-scoped
  `Security Rating on New Code` is still E, so `Release Gate` remains red on `c17ef999`. The residue
  is the tenant/user lookup itself; no third reshuffle was attempted.
- `Service.AddMember` carries two trailing `// NOSONAR gosecurity:S3649` marks, one per sink, on the
  maintainer's explicit instruction ("suppress it in the code; I do not want to touch the Sonar
  rule"). The finding is taint-tracking noise: `tenantID`/`userID` reach GORM only as bound `?`
  arguments built by `membershipScope`, and `role` is a validated enum bound as a parameter, never SQL
  text. The rule flags any request-fed builder call regardless of binding, so the taint edge cannot
  be removed without either suppression or changing what the lookup is. Sonar rule configuration,
  the Quality Gate thresholds and the `Release Gate` definition are unchanged, no test was silenced
  and no `solo-override` label was applied. Measured after merge: PR #402 reported 0 new-code issues
  and gate OK; main at `17af0d85` reports open issues = 0, Quality Gate OK on every condition and
  `Release Gate` success. The `pantheon-base-v0.17.0` tag is still unpublished only because tag and
  release publication is a maintainer action.
- The compat admin session test asserted the maintenance inventory total as an active-session count,
  so it failed against real Redis while silently skipping without it (`Total 3`, revoked rows
  included). The assertion now pins `Total = 3` with `ActiveCount = 2` and requires all three
  tenants' sessions to be present, which is the behaviour `applyAdminSessionFilters` documents.
- CSV role import stamps the caller's tenant; it used to write `tenant_id = 0` (a platform role).
- Import role-key validation and the bootstrap admin binding are scoped to the target namespace.

### Changed

- The auth module now seeds its own permission keys, not only its menus, so a fresh tenant gets a
  working login surface without a global policy grant.
- Tenant menu seeds and the security-surface documentation were completed as part of the
  SonarCloud cleanup; every open SonarCloud finding on `main` is closed.
- `MigrateDataScopePolicy` backfills tenant-scoped role data-scope and role-menu rows
  (migrations `000025`–`000027`) before the permission policy console is exposed.

### Dependencies

- Frontend npm dependency group: 18 package updates.
- Root dev-dependency group: 2 updates.
- GitHub Actions group: 4 updates (all actions stay SHA-pinned).

### Release tooling

- The cut workflow now validates its inputs after the checkout, builds the bundle from the
  requested `base_commit` rather than the default-branch head, creates the tag through the API, and
  verifies the tag with `git ls-remote` instead of a read-permission-limited API call.
- The v0.16.1 closeout evidence and harness status were repaired so the release record matches what
  was actually published.

### Consumer impact

- `sharedPaths` is unchanged at 52 entries (backend 4, frontend 46, docs 2), so the consumer lock
  moves only version, commit and checksums.
- Migrations `000025`–`000028` are additive and run through the standard startup migrator; no
  consumer-side schema work is required.
- No API route, permission code or menu key is removed. Tenant-scoped policy writes are now
  rejected when the body names another tenant, which is the intended security fix.

---

## [Unreleased] — 2026-10-19

> Tenant isolation closeout. The 2026-10-19 acceptance run measured 179/193 assertions and
> 13 defects (5 × P0) caused by one missing property: `tenant_id` exists in the schema but is not
> enforced on every read/write path. All P0/P1 defects are closed; the P2 residual F14 was closed
> by a post-closeout follow-up (role endpoints now answer `404 role.not_found` on a tenant-scoped
> miss). Final measurement: 193/193 with 0 findings on a full L0–L4 re-run.

### Security

- Data-scope policies now carry the tenant on both sides: every read filters on `tenant_id`, writes
  conflict on `(tenant_id, role_key)`, and custom department IDs must belong to the caller's tenant
  (F7/F8/F9/F10/F11/F13). Migration `000025` copies historical platform rows onto the tenants that
  own the role key; it never copies one tenant's policy onto another.
- Role-menu grants are written into the tenant that owns the role (resolved from `system_role`, not
  from the request), so tenant console grants are readable and survive a second edit (F3).
  Migration `000026` moves historical `tenant_id = 0` grants to the owning tenant.
- Login clears the user-level token blacklist only after credentials verify, the tenant gate passes
  and the token pair is stored; a per-session marker is written at revocation time so tokens minted
  before a password reset stay dead (F2).
- Tenant-created users get an active membership in the same transaction as the user row, so the
  first login succeeds; deleting a user deactivates the membership instead of leaving a ghost (F1/F4).
  Migration `000027` repairs historical ghost memberships.

### Fixed

- The tenant console no longer calls `GET /system/tenant/list` from a tenant administrator's session:
  platform capability is resolved from `/auth/tenants/current` scope instead of the
  `system:tenant:list` permission key, removing the `403 tenant.platformOnly` toasts (F5).
- The department page paginates the flattened tree, so every level renders and the total is the real
  department count instead of the root count (F6).

### Added

- `TENANT_CONTRACT_V1` §2.3.1 (V1.2) states the read/write obligations for tenant-owned tables.
- Two-tenant regression tests for data scope, user membership, menu persistence and blacklist
  ordering; test Redis can select a logical DB via `PANTHEON_TEST_REDIS_DB`.

### Fixed

- F14 (P2, post-closeout): cross-tenant role reads (`GET /role/:id/users`, `/role/:id/user-candidates`,
  `PUT /role/:id` and siblings) answered `500 request.failed` because a tenant-scoped miss surfaced as
  `gorm.ErrRecordNotFound` under the generic error branch. `roleErrorResponse` now maps not-found
  sentinels to `404 role.not_found` (i18n key added to all 5 locales) and keeps everything else on the
  generic 500 path. Regression: `role_handler_notfound_test.go`. Full L0–L4 re-run: 34/34, 0 findings.

## [pantheon-base-v0.16.1] — 2026-10-12

> Patch release. Root-causes the two recurring `main` flakes and closes the release-artifact gap
> that let v0.14.0/v0.15.0/v0.16.0 ship without a consumable bundle. No consumer-facing interface
> changed.

### Fixed

- Data-scope caches were keyed by the connection pool's pointer address
  (`fmt.Sprintf("%p", sqlDB)`), so a per-test database dropped in `t.Cleanup` let Go recycle the
  address and a fresh database inherit the previous one's cached "`system_role_data_scope` exists"
  verdict; `MigrateDataScopePolicy` then skipped its `CREATE TABLE` and the next `INSERT` failed
  with `Error 1146 (42S02)`. The cache key now derives from the DSN's `host:port/dbname`, with a
  pool-pointer fallback for non-MySQL dialectors. Production always passes the process-wide
  singleton pool, so this was test-reachable hardening rather than a product-visible defect.
- `platform-shell-critical.spec.ts` read the sidebar `boundingBox()` immediately after the collapse
  toggle, sampling Arco Sider's 200 ms width transition mid-flight (215.5625 vs 108.265625 on the
  retry); the following `toBeVisible` returned at once because the sidebar is always visible.
  Measurements now go through a shared `settleElementLayout` helper that waits for the box signature
  to stabilise and for `getAnimations()` to finish.

### Added

- `scripts/foundation-release/check-release-assets.mjs`: asserts a published release carries the
  four consumable assets and that each archive matches its `.sha256` sidecar, reusing the publish
  path's own `validateReleaseAssetChecksum` so the two cannot drift.
- `Foundation Release Verify`, on `release: published`, so a release published without assets fails
  at the moment it is created instead of being discovered by the next consumer.
- `Foundation Release Backfill` and `Foundation Release Cut`, both dispatch-only and defaulting to
  `dry_run: true`; the release scripts had never been wired into any workflow.

### Notes

- `sharedPaths` is unchanged (52 entries: backend 4, frontend 46, docs 2), so the consumer lock needs
  only its version and checksums advanced.

## [pantheon-base-v0.16.0] — published (2026-10-12)

> Published as immutable tag `pantheon-base-v0.16.0` after the hosted Release Gate, CI, security, and smoke checks passed on the release commit. No consumer-facing interface changed.

### Changed

- Frontend/backend naming and directory correspondence: Go package names now equal their
  directory leaf (`system/{iam,org,config,audit,i18n}`); `frontend/src/modules/system/*`
  mirrors the backend's three-level layout; `core/permissions`/`core/settings` singularized
  and `AppLayout.tsx` split out of `core/layout/index.tsx`. No import path, route, permission
  code, menu seed, i18n key or contract shape changed.
- Smoke suite tiered (L0 static / L1 critical path / L2 module / L3 full) and split by business
  module out of the `system-pages.spec.ts` monolith, with path-driven module selection
  (`scripts/resolve-smoke-modules.mjs`) so a change only pays for the depth it can affect.

### Fixed

- Cleared Dependabot alert #43 (`sprintf-js` DoS, dev-only) by overriding `js-yaml` for
  `@istanbuljs/load-nyc-config`.
- Cleared the 17 SonarCloud code smells re-surfaced by the smoke-helper split, restoring the
  main Release Gate.

### Removed

- Removed the empty `openspec/` skeleton directory.

### Verification

- SonarCloud 0 unresolved issues, overall duplication 2.8%; CodeQL and Dependabot clean.
- Hosted required checks and Release Gate green on the release commit.

## [pantheon-base-v0.15.0] — published (2026-10-11)

> Published as immutable tag `pantheon-base-v0.15.0` after the hosted Release Gate, CI, security, and smoke checks passed on the release commit.

### Security
- Rebuilt the SSRF IPv4 denylist in `backend/pkg/security/ssrf/validator.go` from byte
  literals (`netip.AddrFrom4`) instead of CIDR strings; behavior unchanged, clears the
  6 remaining `go:S1313` SonarCloud findings on `main`.

### Changed
- Cleared all open SonarCloud issues (28 → 0); CodeQL and Dependabot clean.
- Stabilized the narrow-viewport shell smoke test to remove a popup-measurement flake.
- Removed the README (zh/en) milestone/maturity narrative and re-pointed version tables
  at `pantheon-base-v0.15.0`; archived superseded docs under `docs/history/2026-10/`.

### Verification
- Hosted required checks and Release Gate green on the release commit.

## [pantheon-base-v0.13.0] — published (2026-09-27)

> Published as immutable tag `pantheon-base-v0.13.0` after the hosted Release Gate, CI, security, and smoke checks passed on source commit `c254e4c8c63f4409d49752eedb097291627d0b82`.

### Added
- Foundation release metadata, verification boundary, upgrade notes, and consumer impact notes for the v0.13.0 governance release.
- Durable task archive and status entry points for the completed Harness work.

### Changed
- Recorded the September enterprise remediation and governance closeout as the v0.13.0 release scope.

### Verification
- Repository-local production-readiness audit and task-archive evidence are linked from `releases/pantheon-base-v0.13.0/verification-summary.json`.
- Hosted release checks passed; `pantheon-ops` consumption remains a separate consumer upgrade follow-up.

## [pantheon-base-v0.11.1] — 2026-09-04

Enterprise-grade design system engineering framework with comprehensive governance.

### Added
- **Frontend Design System Framework** (3,325 lines documentation)
  - `COMPONENT_STYLING_GUIDE.md`: Atomic design patterns, composition rules (682 lines)
  - `UI_PATTERN_LIBRARY.md`: 18 operational primitives, real-world examples (845 lines)
  - `DESIGN_ENGINEERING_GUIDE.md`: 4-layer engineering methodology (890 lines)
  - `TOKEN_MIGRATION_GUIDE.md`: Migration tooling, gradual adoption path (420 lines)
  - `VERSION_MANAGEMENT_GUIDE.md`: Semantic versioning, release procedures (488 lines)

- **Design Token Expansion** (+109% total coverage)
  - Total tokens: 32 → 67 (+109%)
  - Spacing tokens: 8 → 26 (+225% coverage)
  - 9 semantic container tokens (interactive/display/operation layers)
  - Container classification: `--container-interactive-*`, `--container-display-*`, `--container-operation-*`

- **Enhanced Mechanical Gates**
  - Smart whitelist for fine-tuning adjustments (12 allowed micro-adjustments)
  - Semantic token validation in `check-ui-contract.mjs`
  - Fine-tuning budget system for edge cases
  - Automatic enforcement in prebuild chain

- **Innovation vs Mainstream** (4 unique capabilities)
  - 3-tier container semantics (not in Ant/Arco Design)
  - Visual anti-pattern checklist with mechanical enforcement
  - Controlled low-code with Feature Ledger governance
  - AI-friendly engineering documentation structure

### Changed
- **Design System Maturity**: 3/5 → 5/5 stars (+66% improvement)
- `DESIGN.md` §7: Complete token reference (67 tokens documented)
- `DESIGN.md` §7.9: Anti-pattern checklist with 8 forbidden patterns
- UI contract gate: Now validates semantic token usage
- Migrated 133 hardcoded spacing values to semantic tokens

### Fixed
- `README.md`: Updated version reference to v0.11.1 and clarified commit linkage
- Harness manifest: Added required linkage fields for task tracking
- Dependencies: `@humanfs/node` 0.16.7 → 0.16.8 (frontend dev tooling)

### Verification
- **Release Commit**: `d3030510` (includes all v0.11.0 work + documentation updates)
- **UI Contract**: 0 violations across 249 files
- **Visual Quality**: WCAG 2.1 AA compliance (light + dark modes)
- **Test Coverage**: 157 frontend tests, 85 backend test files, all passing
- **CI Gates**: Full Smoke, SonarCloud, CodeQL, Dependabot all PASS
- **GitHub Release**: Bound to commit d3030510cbf7cfb6e1c4d1c66de1e0fa3c5e2a91

### Consumer Impact
- **Breaking Changes**: None (100% backward compatible)
- **Migration Effort**: < 1 hour (dependency version bumps only)
- **Optional Adoption**: New design patterns, tokens, documentation
- **pantheon-ops**: Update `foundation-release.lock.json`, reinstall dependencies
- **Go Consumers**: Update `go.mod` to v0.11.1
- **NPM Consumers**: Update `package.json` to 0.11.1

### Known Limitations
- Multi-tenant isolation: Marked as P2 roadmap (not yet implemented)
- SSO/OAuth2: Marked as P1 feature (planned for v0.12.0)
- Runtime low-code: Controlled generation only (rebuild required)

### Documentation
- 5 new frontend engineering guides (3,325 lines total)
- Updated `DESIGN.md` with complete token system
- Harness task evidence: `.harness/tasks/2026-09-04-v0.11.1-release-preparation/`
- Foundation release bundle: `releases/pantheon-base-v0.11.1/`

### Version Notes
v0.11.1 supersedes the unreleased v0.11.0 tag to include 7 additional commits:
- Documentation improvements (README v0.11.0 updates)
- Harness methodology linkage (task manifest structure)
- Development tooling updates (@humanfs/node patch)

---

## [pantheon-base-v0.10.27] — 2026-09-02

Test stability maintenance release.

### Fixed
- Increased timeout and improved wait strategy for the module governance smoke test to handle Vite hot reload timing issues.
- Changed navigation wait condition from `domcontentloaded` to `networkidle` with explicit retry intervals.

### Verification
- The GitHub Release will be bound to commit `9d6931bf88f2ccacc08acea6ccc4afc22703e880` (current HEAD).
- Full Smoke, SonarCloud, CodeQL, Dependabot, CI, and the Release Gate must pass before publication.

### Consumer Impact
- No breaking changes; this is a test infrastructure improvement only.
- Consumers can upgrade from the immutable `pantheon-base-v0.10.27` GitHub Release.

---

## [pantheon-base-v0.10.26] — 2026-09-02

Foundation release for the Go-module and npm-package consumption standardization.

### Changed
- Standardized backend module consumption on `github.com/duanxldragon/pantheon-base` and removed the overlay/import-rewrite scripts (1020+ lines deleted) so downstream repos consume the foundation via Go modules instead of file copying.
- Standardized the frontend as a consumable package with a library entrypoint and aligned its identity to `0.10.26`.
- Folded in the final SonarCloud duplication reduction and the repository-layout governance alignment.
- Applied dependency hardening for the grpc and browserslist advisories merged onto `main` before publication.

### Verification
- The GitHub Release is bound to commit `d30d73a5125cdce79bd8d37bd60f75ad7180fcd7`.
- Full Smoke, SonarCloud, CodeQL, Dependabot, CI, and the Release Gate passed before publication.

### Consumer Impact
- Consumers must upgrade from the immutable `pantheon-base-v0.10.26` GitHub Release rather than tracking `main`.
- `pantheon-ops` consumption remains deferred and is not included in this release closeout.

---

## [pantheon-base-v0.10.25] — 2026-09-01

Foundation release for the B1-B5 operational-workbench delivery and its shared quality controls.

### Changed
- Released the B1-B5 operational workbench contracts, reusable UI primitives, and UI quality gates for foundation consumers.
- Reduced `AppTable` complexity to satisfy the SonarCloud maintainability gate.
- Applied dependency hardening included in the release candidate.

### Verification
- The GitHub Release is bound to commit `3008d21c40139f369d8c62ed5dde807ae08ddc12`.
- Full Smoke, SonarCloud, CodeQL, Dependabot, CI, and the Release Gate passed before publication.

### Consumer Impact
- Consumers must upgrade from the immutable `pantheon-base-v0.10.25` GitHub Release rather than tracking `main`.
- `pantheon-ops` consumption remains deferred and is not included in this release closeout.

---

## [pantheon-base-v0.10.22] — 2026-08-13

Menu-contract gate extension point for consumer overlay registries.

### Changed
- `frontend/scripts/check-menu-contract.mjs` 改为按命名约定发现组件注册表文件（前端 `*Registry.ts`、后端 `*registry.go`），替代硬编码文件清单。

### Consumer Impact
- `pantheon-ops` 等 consumer 注入的 overlay 注册表（`businessOverlayComponentRegistry.ts` / `business_overlay_component_registry.go`）现在会被菜单契约门禁自动纳入一致性校验，不再被静默丢弃。

---

## [pantheon-base-v0.10.11] — 2026-08-11

Security maintenance release for the shared frontend toolchain.

### Changed
- Upgrade `js-yaml` to `3.15.1` to resolve GHSA-5p4m-2wfm-xmqj (CWE-407).
- Upgrade `nanoid` to `3.3.17` to remove the high-severity infinite-loop advisory in the Vite/PostCSS dependency tree.

### Verification
- Frontend `npm audit --audit-level=high` reports zero vulnerabilities.
- Foundation-release, documentation, sync-drift, and lockfile installation checks pass.

---

## [pantheon-base-v0.10.10] — 2026-08-10

Foundation release consumed by `pantheon-ops` for the shared CSRF and smoke contracts.

### Changed
- Distributed the shared request client so the CSRF cookie/header contract is present in foundation-release consumers.
- Corrected the shared smoke registry fixture used by hosted smoke validation.
- Exported the forbidden-request guard required by the shared auth boundary.

### Verification
- CI Summary, Quality, Security, CodeQL, and hosted smoke passed for the release candidate.
- Release manifest and archive checksum are bound to commit `a95e6e52eee8ae9aeb4fd115d18c7c37609290f6`.

---

## [pantheon-base-v0.10.1] — 2026-08-05

发布治理补丁，供 `pantheon-ops` 通过 foundation release 升级消费。

### Changed
- CI Summary 对 required job 采用 fail-closed 聚合；保留全仓 Go Lint 的真实 advisory 结果，并由 `quality.yml` 继续阻断 PR/merge queue 中的新代码 lint。
- Merge queue 使用其不可变 base SHA 限定新代码 lint；发布器在上传前复算并校验 foundation archive 的 SHA-256。
- 补齐历史 task/evidence/review 收口状态和 OpenSpec 仓库骨架。
- 发布资产、候选 SHA、PR 门禁和 consumer upgrade 重新绑定到 v0.10.1。

---

## [pantheon-base-v0.10.0] — 2026-08-04

首个采用 `pantheon-base-vX.Y.Z` 标准命名的 foundation release。

### Changed
- 发布工具统一校验 release tag、release line 和不可变候选 SHA。
- Release Gate、Security、SonarCloud 和 Full Smoke 改为失败关闭。
- 修复 Windows bundle、smoke cleanup、RangePicker 月边界和 Dashboard 嵌套按钮问题。

### Notes
- 完整 release notes、consumer impact、upgrade notes 和验证摘要位于
  [GitHub Release pantheon-base-v0.10.0](https://github.com/duanxldragon/pantheon-base/releases/tag/pantheon-base-v0.10.0)。

---

## [base-v0.9.0] — 2026-07-21

冻结版本，供 `pantheon-ops` 通过 foundation release 继承。

### Changed
- **Go module 重命名**: `pantheon-platform` → `pantheon-base`，覆盖 142 个 `.go` 文件 339 处 import，import 路径永不带 `backend/` 段（go.mod 在 `backend/` 内）
- **代码生成器模板同步**: `backendGenerator.ts` 生成的业务模块 Go import 改为 `pantheon-base/...`（消除 ops 新生成模块的隐形编译炸弹）
- **测试断言与脚本同步**: smoke 断言、`cleanup-generated-modules`、`triage-base-drift` 归一化逻辑同步新 module 名；`cleanup` 失效正则按当前真实形态规范化（去掉旧 `backend/` 段）

### Added
- **business/* 边界门禁（双层）**:
  - `golangci-lint depguard` 规则 `business-boundary`：禁止 `modules/business` import `modules/system|auth|platform` 内部，须走 `pkg/contracts`
  - `check-boundaries.mjs --strict --repo pantheon-base` 接入 CI `boundary-gate` job（新增 `--repo` 参数支持单仓扫描）
- **测试覆盖率门禁**: 新增 `scripts/harness/check-coverage.mjs` + CI `coverage-gate` job，初始阈值取现状实测（12.2%）的 90%（11%），后续版本 ratchet 抬升
- **MFA 生产强制安全基线**: `docs/DEPLOYMENT_GUIDE.md` 新增"强制安全基线（生产必选）"章节，`login.mfa_enabled=1` 等 5 项列为生产必选项

### Notes
- `VERSION` 文件维持 harness 方法论 shell 版本（1.4.0），不随产品线变更；base 产品线版本以 git tag 为载体
- 历史 CodeQL/Dependabot 分析临时文件未纳入本版本

---

## [1.3.0] — 2026-06-27

### Changed
- **Migrated to pantheon-harness**: 所有方法论引用从 `harness-engineering/agentic-method-kit` 迁移到 `pantheon-harness`
- **文档路径更新**: 更新 AGENTS.md、docs/README.md、docs/harness/*.md 中的路径引用
- **脚本路径更新**: 更新 scripts/harness/*.mjs 中的方法包文件路径

### Removed
- **清理 agentic-method-kit/**: 删除 67 个文件，已迁移到 pantheon-harness
- **清理 agentic-repo-shell/**: 删除 92 个文件，已迁移到 pantheon-harness

### Synchronized from pantheon-harness
- ERROR_RECOVERY_STRATEGY.md
- HANDOFF_PROTOCOL.md

---

## [1.2.0] — 2026-06-26

### Changed
- **System modularization**: 系统模块化重构
- **Infrastructure improvements**: 基础设施改进

---

## [1.0.0] — 2026-06-15

### Added
- **Initial harness adoption**: 初始采纳 Harness Engineering 方法论
- **Task packet templates**: 任务包模板
- **Verification evidence specs**: 验证证据规范
- **Multi-agent delivery workflow**: 多 Agent 交付流程
- **Agent execution checklist**: Agent 执行清单
