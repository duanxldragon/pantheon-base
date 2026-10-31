# Upgrade Notes

## pantheon-base-v0.18.2

Patch upgrade on `release/0.18`, on top of v0.18.1.

### Steps

1. Take `sharedPaths` from the release manifest as-is — it now has 53 frontend/backend entries instead
   of 52 — and move `foundation-release.lock.json` to `releaseVersion: pantheon-base-v0.18.2`,
   `releaseLine: release/0.18`, the new `baseCommit`, and the `bundle` / `repoSnapshot` SHA-256 values.
2. Run `npm run rebuild:from-base`.
3. Run `npm run check:business-overlay` and `npm run check:shared-drift`.
4. Re-run the consumer builds: backend `go build ./...` and frontend `npm run build`.

### What does not change

- No migration runs; the chain still ends at `000030_tenant_plan_definitions` (schema 30).
- No route, permission code, menu key or i18n key moves.
- No configuration or environment variable is added.
- No consumer script changes: `rebuild-from-base.mjs` and `check-shared-drift.mjs` both read the shared
  list from the lock.

### The one shape change

`frontend/scripts/check-menu-contract.mjs` is now a declared shared path. Before the rebuild,
`check:shared-drift` reports it as modified (and `backend/modules/business/retired_modules.go` as well if
the consumer has not already converged it); after the rebuild both are identical to the release and the
reading returns to 0 modified. A consumer that pins the entry count must accept 53.

### Behaviour

The menu-contract sensor is stricter: an unresolvable bare identifier in a backend seed block is now a
failure instead of an empty comparison. That is the point of the patch — a seed the sensor cannot read
must not pass as if it matched.

### Rollback

Re-point the lock at `pantheon-base-v0.18.1` and rebuild. The rollback restores the pre-#471 parser and
the 52-entry shared list; nothing in v0.18.2 is required for v0.18.1 to build.
