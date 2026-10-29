# Consumer Impact

## pantheon-ops

**Impact level: low. Upgrade recommended, not required. No overlay changes needed.**

### Why this release exists for the consumer

`pantheon-ops` consumes Base only through immutable releases: it materializes `repo.tar` plus the
bundle archive from the locked GitHub release and verifies both by SHA-256. Because v0.14.0,
v0.15.0 and v0.16.0 were published with **zero assets**, the lock could not advance past
`pantheon-base-v0.13.0` — there was nothing to materialize — so the ops baseline has been sitting
three minor versions behind. v0.16.1 is the first release since v0.13.0 that carries a complete,
consumable asset set.

### What changes for the consumer

Nothing structural. The 52 declared `sharedPaths` are byte-identical to the ones the ops lock
already declares, so no path list needs rewriting. What arrives inside those paths:

| Area | Change | Consumer effect |
| --- | --- | --- |
| `backend/pkg/database` | New `connection_cache_namespace.go`; data-scope caches keyed by DSN instead of pool pointer | None at runtime. Production passes the process-wide singleton pool, so the defect was only reachable through per-test databases. |
| `backend/internal/middleware` | `data_scope_middleware.go` uses the new namespace | None. No exported symbol changes. |
| `frontend/tests/smoke/helpers` | New `layout-settle.ts`; smoke specs consume it | Test-only. |
| Release tooling | `check:release-assets`, two release workflows | Base-repo only; the consumer's `mergePackages` already strips `release:foundation*` and `test:foundation-release` from the merged `package.json`. |

### Overlay compatibility

The business overlay assembles Base by anchoring on exact source lines
(`rebuild-from-base.mjs` → `wireBusinessRegistries`) and throws
`Base assembly contract changed` if an anchor does not appear exactly once. All six anchors were
checked against the v0.16.1 base tree before this release was cut and each still resolves exactly
once:

- `backend/modules/business/business.go`
- `frontend/src/core/router/modules.ts` (two anchors)
- `frontend/src/core/router/componentRegistry.ts` (two anchors)
- `backend/modules/system/iam/menu/component_registry.go`

This matters because v0.16.0 renamed Go packages and moved `frontend/src/modules/system/*`, which
is exactly the class of change that breaks an anchor. It did not break these.

### Residual risk

The ops rebuild (`npm run rebuild:from-base`) could not be executed on the machine that cut this
release, because Node cannot spawn subprocesses there (`spawnSync` returns `EBUSY` for git, gh and
tar alike), so the assembly could not be run end to end locally. The anchor check above is a
text-level substitute for the single most likely failure mode, not a full rebuild. The first real
rebuild against v0.16.1 should be treated as the authoritative verification.

### Rollback

Re-point the lock at a release that has assets — `pantheon-base-v0.13.0` is the most recent one
that does.
