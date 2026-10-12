# Release Notes

## pantheon-base-v0.16.1

Patch release. Root-causes the two recurring `main`-branch flakes that were being dismissed as
noise, and closes the release-artifact gap that let three consecutive releases ship without a
consumable bundle. No consumer-facing interface changed.

### Fixed

- **Data-scope caches were keyed by the connection pool's pointer address.**
  `buildDatabaseCacheNamespace` used `fmt.Sprintf("%p", sqlDB)`, so the process-local
  "does `system_role_data_scope` exist" and user-dept caches were scoped to a memory address
  rather than to a database. `testmysql.Open` drops each per-test database in `t.Cleanup`, which
  makes the pool unreachable and lets Go recycle the address; a fresh test database then inherited
  the previous one's cached verdict, `MigrateDataScopePolicy` skipped its `CREATE TABLE`, and the
  next `INSERT` failed with `Error 1146 (42S02)`. The cache key is now derived from the DSN's
  `host:port/dbname`, with a fallback to the pool pointer for non-MySQL dialectors. The defect was
  reachable only through test fixtures — production always passes the process-wide singleton pool —
  so this is hardening rather than a product-visible fix.

- **`platform-shell-critical.spec.ts` sampled a CSS transition mid-flight.**
  The spec read the sidebar's `boundingBox()` immediately after clicking the collapse toggle, while
  Arco Sider's 200 ms width transition was still running (248 vs 248 on one attempt, 215.5625 vs
  108.265625 on the retry). The `toBeVisible` wait that followed the click returned immediately
  because the sidebar is always visible. Browser layout measurements now go through a shared
  `settleElementLayout` helper that waits for the box signature to stabilise and for
  `getAnimations()` to finish. Both flakes were fixed at the race, not by relaxing an assertion, so
  the pre-existing bounds stay in force.

### Added

- **A gate that asserts a published foundation release actually carries its artifacts.**
  `scripts/foundation-release/check-release-assets.mjs` verifies the four-asset consumable set
  (`foundation-release-<version>.tgz`, its `.sha256`, `repo.tar`, `repo.tar.sha256`) and validates
  each local archive against its checksum sidecar. It reuses the publish path's own
  `validateReleaseAssetChecksum`, so verification semantics cannot drift from publication.

- **A release-cut workflow.** `foundation-release-cut.yml` runs the canonical
  `release:foundation:cut` and `release:foundation:publish` scripts on a runner where git, tar and
  gh all work, which is what v0.14.0/v0.15.0/v0.16.0 lacked. It is dispatch-only and defaults to
  `dry_run: true`.

### Changed

- `Foundation Release Verify` now runs on `release: published` and fails the moment a release is
  published without its complete artifact set, instead of letting the next consumer discover it.
- `Foundation Release Backfill` was added to repair a release that was published without assets.
  It is dispatch-only and defaults to `dry_run: true`. It is **not** used by this release.

### Verification

- All required checks green on the release commit.
- The two flake fixes are covered by deterministic tests rather than timing tolerances:
  `connection_cache_namespace_test.go`, `TestDataScopeCacheKeysAreScopedPerConnection` and
  `TestMigrateDataScopePolicyIgnoresForeignCachedVerdict`.
- The asset gate carries 21 hermetic unit tests (no network, no subprocess).
