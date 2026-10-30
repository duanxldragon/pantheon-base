# Upgrade Notes

## pantheon-base-v0.18.1

Patch upgrade on `release/0.18`, on top of v0.18.0.

### Steps

1. Move `foundation-release.lock.json` to `releaseVersion: pantheon-base-v0.18.1`,
   `releaseLine: release/0.18`, the new `baseCommit`, and the `bundle` / `repoSnapshot` SHA-256
   values from the release.
2. Run `npm run rebuild:from-base`.
3. Re-run the consumer builds: backend `go build ./...` and frontend `npm run build`.

### What does not change

- No migration runs; the chain still ends at `000030_tenant_plan_definitions` (schema 30).
- No route, permission code, menu key or i18n key moves.
- No configuration or environment variable is added.

### Behaviour

The only source difference from v0.18.0 is that `frontend/src/api/request.ts` exports
`isForbiddenRequestError` again. Code that does not import it sees no change; code that does (as
`pantheon-ops` does in its deploy task detail page) compiles again.

### Rollback

Re-point the lock at `pantheon-base-v0.18.0` and rebuild. Because v0.18.0's only defect is this
missing export, rollback is only meaningful if the consumer stops importing the predicate; otherwise
v0.18.1 is the buildable target.
