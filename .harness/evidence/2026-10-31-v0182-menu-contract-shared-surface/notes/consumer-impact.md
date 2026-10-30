# Consumer Impact

## pantheon-ops

**Impact level: low. Upgrade recommended; two shared files change and one shared-list entry is added.**

### Why the consumer should move

`pantheon-ops` runs `frontend/scripts/check-menu-contract.mjs` from its frontend `prebuild`, and its copy
is byte-identical to the pantheon-base v0.18.1 copy. Against v0.18.1 the consumer therefore keeps the
pre-#471 parser: a seed field that references an inline Go constant is resolved by prefix match, and a
reference the constant table cannot resolve collapses to `''` and is compared as if it were a real
value. v0.18.2 replaces that copy with the repaired sensor and registers the file as shared so the next
repair arrives the same way.

### Lock shape

`sharedPaths` moves from 52 to 53 entries with `frontend/scripts/check-menu-contract.mjs` added to the
`frontend` group. `rebuild-from-base.mjs` and `check-shared-drift.mjs` need no change; they read the list
from the lock. The lock otherwise moves version, release line, commit, bundle checksum and `repo.tar`
checksum as usual.

### What arrives in the ops tree

| Area | Change | Consumer effect |
| --- | --- | --- |
| `frontend/scripts/check-menu-contract.mjs` | Post-#471 parser: inline consts resolved, bare-identifier matching tightened, unresolved references fail the check | `prebuild` now fails on a seed it cannot read instead of comparing an empty string. |
| `backend/modules/business/retired_modules.go` | Menu filter clauses are package-level constants | No behaviour change; the file matches what the consumer already converged to. |
| Everything else | Identical to v0.18.1 | None. |

### Transition reading

`check:shared-drift` reports the two files as modified while the live tree still carries the v0.18.1
copies. That is the expected shape of a widened shared surface, not a regression: `npm run
rebuild:from-base` writes the release versions over the live tree and the next run reads 0 modified.

### Overlay compatibility

The business overlay anchors are untouched. `check-menu-contract.mjs` is a check script, not an overlay
anchor, and the retired-module filter file already carries the consumer's converged form.
`npm run rebuild:from-base` re-checks the anchors during the sync.

### Residual risk

- A consumer seed that references a constant declared in a different package would now fail the check
  loudly; the fix is to declare it in the seed's package, not to relax the sensor.
- If the consumer pins the shared entry count in its own tooling, that pin must move to 53.

### Rollback

Re-point the lock at `pantheon-base-v0.18.1` and rebuild. The consumer returns to the 52-entry list and
the pre-#471 parser; nothing depends on v0.18.2 to compile.
