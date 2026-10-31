# Release Notes

## pantheon-base-v0.18.2

Patch release on the `release/0.18` line. It publishes the repairs merged since v0.18.1 and closes the
release-surface gap that kept one of them from ever reaching a consumer.

### No contract break

- Schema unchanged at 30. No migration in this release.
- No route, permission code, menu key or i18n key changed.
- `sharedPaths` grows from 52 to 53 entries: `frontend/scripts/check-menu-contract.mjs` is now declared
  shared, because a consumer executes it in its own `prebuild`.

### Fixed

**The menu-contract sensor can no longer pass a seed it cannot read.** #471 (`03e13d48`) resolves
`const ( name = "value" )` blocks and single-line `const` declarations, requires a bare identifier to be
a reference (so `item.Key`, `strings.ToLower(x)` and `menuKey(i)` are no longer mistaken for one), and
records unresolved bare references as a failure instead of collapsing them to `''` and reporting a bogus
mismatch. Helpers are exported and covered by `npm run test:menu-contract`.

**The sensor reaches the consumer at all.** `frontend/scripts/check-menu-contract.mjs` was missing from
`sharedPaths`, so the #471 repair could not propagate: `pantheon-ops` carries a byte-identical copy and
runs it from its frontend `prebuild`. The file joins `sharedPaths.frontend` and
`scripts/foundation-release/frontend-ownership.mjs`, so a future removal fails the manifest build.

**The retired-module menu filter builds its SQL from whole-clause constants.** #477 (`e17eaaa1`) moves
`"module IN ?"`, `"path IN ?"` and `"component IN ?"` into package-level constants annotated for
`scripts/check-gorm-sql-literal.mjs`. The generated SQL is unchanged and the values still bind through
`?`; the clause is simply a literal now. This is the base-first half of the shared-drift convergence that
`pantheon-ops` completed on its side.

### Governance

- Six `githubactions` findings cleared across `ci.yml`, `quality.yml`, `release-gate.yml` and
  `security.yml` (#473, `c1f0b1dd`).
- The release gate treats a transiently failed check-list read as "no verdict yet" and keeps polling
  inside its existing 240 × 30s budget (#478, `beace427`); the terminal timeout still fails closed.
- Completed task packets can be archived as renames and `check-pr-governance` resolves them through the
  documented monthly-archive fallback (#474, `05ee0ec1`).

### Verification

- `node frontend/scripts/check-menu-contract.mjs` → `✅ manifest / menu seed 一致性检查通过（19 个菜单，23 条路由，102 个权限，23 个组件键）`.
- `npm run test:menu-contract` → 10 tests green.
- `node --test tests/scripts/foundation-release/*.test.mjs` → 57 tests green with the 53-entry list.
- The four assets and `Foundation Release Verify` follow the same contract as v0.18.1.
