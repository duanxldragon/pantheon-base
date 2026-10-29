# Consumer Impact

## pantheon-ops

**Impact level: low. Upgrade required to build against the 0.18 line.**

### Why the consumer must move

`pantheon-ops` imports `isForbiddenRequestError` from `api/request` in
`frontend/src/modules/business/deploy/task/DeployTaskDetail.tsx:29` and uses it at line 182. Against
`pantheon-base-v0.18.0` the consumer's `npm run build` fails with `TS2614: Module
'"../../../../api/request"' has no exported member 'isForbiddenRequestError'`. Against v0.18.1 the
same build passes.

### Lock shape

`sharedPaths` is unchanged at 52 entries. `foundation-release.lock.json` moves version, release line,
commit, bundle checksum and `repo.tar` checksum. `rebuild-from-base.mjs` and
`check-shared-drift.mjs` need no change.

### What arrives in the ops tree

| Area | Change | Consumer effect |
| --- | --- | --- |
| `frontend/src/api/request.ts` | `isForbiddenRequestError` exported again | Restores compilation of business code that branches on a permission rejection. |
| Everything else | Identical to v0.18.0 | None. |

### Overlay compatibility

The business overlay anchors are untouched: the patch adds two lines to `api/request.ts`, which is not
an overlay anchor for the deploy module. `npm run rebuild:from-base` re-checks the anchors during the
sync.

### Residual risk

- If the consumer instead chooses to stop importing the predicate, that is a consumer-side design
  change and does not remove the need to build against a release that compiles.

### Rollback

There is no useful rollback to v0.18.0 for this consumer, because v0.18.0 does not compile its
frontend. Rollback means re-pointing at v0.17.8, which predates the thirteen simplification waves.
