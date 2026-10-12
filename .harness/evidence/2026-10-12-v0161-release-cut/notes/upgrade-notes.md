# Upgrade Notes

## From pantheon-base-v0.16.0 to pantheon-base-v0.16.1

No action is required. This is a patch release with no contract, API, schema, permission, menu,
route or i18n change.

### Steps

1. Advance the lock in `pantheon-ops/foundation-release.lock.json` to
   `releaseVersion: pantheon-base-v0.16.1`, `releaseLine: release/0.16`, and the corresponding
   `baseCommit`, `releaseArtifact.assetName`, `releaseArtifact.checksum` and
   `repoSnapshot.sha256`.
2. Materialize the bundle, or let `npm run rebuild:from-base` fetch it: when the snapshot is not
   already cached under `releaseArtifact.localPath`, the consumer downloads both assets from the
   locked GitHub release and verifies them against the lock's checksums.
3. Run `npm run rebuild:from-base` and the business-overlay checks.

`sharedPaths` is unchanged from v0.13.0 onward — the same 52 entries (backend 4, frontend 46,
docs 2) — so the lock's path declaration does not need to be rewritten, only its version and
checksums.

### What the consumer actually receives

- `backend/pkg/database/connection_cache_namespace.go` (new) and the cache-namespace fix in
  `backend/internal/middleware/data_scope_middleware.go`. Production behaviour is unchanged: the
  defect was only reachable through per-test databases.
- `frontend/tests/smoke/helpers/layout-settle.ts` (new) and the smoke specs that consume it.

Both land inside declared shared paths, so they are delivered by the normal baseline-swap. Neither
alters an exported symbol the business overlay depends on.

### Breaking changes

None.

### Rollback

Re-point the lock at `pantheon-base-v0.16.0` and re-run `npm run rebuild:from-base`. Note that
v0.16.0 was published without its assets, so a rollback must either restore a previously
materialized `.foundation/releases/pantheon-base-v0.16.0/` directory or be taken back to
`pantheon-base-v0.13.0`, which does carry a complete asset set.
