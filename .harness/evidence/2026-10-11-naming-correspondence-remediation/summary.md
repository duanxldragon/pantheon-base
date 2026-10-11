# Frontend/backend naming and correspondence remediation — verification summary

## What the findings were

The 2026-10-11 read-only review
(`deliverables/gstack/code-review-frontend-backend-naming-2026-10-11.md`) produced 18 findings and a
12-item action list. They fall into three groups.

**Naming drift (readability).** Go `package` clauses disagreed with their directory names in six
package groups (`iam`, `org`, `config`, `audit`, `i18n`); the frontend carried nine naming
violations (four camelCase `.tsx` files that render components, five PascalCase `.ts` files that do
not); and two `core/` directories were plural where their siblings were singular
(`core/permissions`, `core/settings`).

**Correspondence gaps (navigation).** The backend groups `system/iam`, `system/org`,
`system/config` were flat on the frontend, so a reader moving between the two trees could not
follow the same path. There was no canonical frontend↔backend correspondence table anywhere in the
contract docs, and there was no `@/` path alias, so 403 imports were positional (`../../../../`).

**Two gates that were passing without enforcing (the serious ones).** `check-boundaries.mjs`
resolved the repository root to a stray empty directory and therefore scanned **zero files** while
reporting `0 finding(s)`. Its `systemDomainRules().ts` returned an **empty array**, so even once the
system directories existed there was nothing to enforce. `check-structure-contract.mjs` had **no
rules at all** covering `frontend/src/modules/**`, so the whole frontend module tree was outside
the structure contract.

## Root cause

The naming drift was accumulation: files were added over many releases without a mechanical check,
so each author's local convention stuck. `core/permissions`/`core/settings` predate the singular
convention that the rest of `core/` adopted.

The gate failures had two distinct causes. First, `scanRepository` accepted *any* directory whose
name equalled the repository name; a locally-created shell `pantheon-base/pantheon-base/` (holding
one empty `docs/`) satisfied that test, so the resolver picked an empty directory instead of the
real root. On CI the cwd is the repository root and no such directory exists, so CI fell back to the
correct root — which is exactly why the defect was invisible: **the gate was green everywhere except
where someone would notice it was doing nothing.** Second, the frontend `ts` boundary rules were
never written, and the structure contract's rule set was scoped to `backend/` only. Both were
"configured to pass" rather than "configured to check".

## Fix

Six commits, in dependency order:

1. **`217232ab` backend package names (128 files).** Every Go package clause now equals its
   directory name (213 insertions / 213 deletions, mechanically verified 213/213). Import *paths*
   were not touched, so callers outside the renamed packages are unaffected.
2. **`d6b308b9` frontend system nesting (68 files).** `modules/system/{iam,org,config}` now
   physically mirror the backend, so the same subdomain name resolves to the same relative path in
   both trees.
3. **`99f99a17` frontend file naming (25 files).** The nine drift cases resolved to the layout
   contract's own rule (components are PascalCase `.tsx`; non-component modules are camelCase
   `.ts`/`.tsx`), plus the `core/permission` and `core/setting` singularisation.
4. **`88babfc4` `list-page.css` promotion (26 files).** The stylesheet moved out of
   `modules/system/components/shared/` to `frontend/src/assets/list-page.css`, which retired the
   `modules/system/components/` directory *and* populated the whitelisted-but-absent
   `frontend/src/assets/`.
5. **`d25db765` gate repair (4 files).** `check-boundaries.mjs` gained `looksLikeRepoRoot()`, an
   `unresolved` flag that fails `--strict`, resolution-aware import matching
   (`resolveImportPath`/`matchResolved`) and a non-empty `ts` rule for system subdomains.
   `check-structure-contract.mjs` gained four rule families: `go-package-dir-match`,
   `frontend-file-naming`, `barrel-only`, `domain-correspondence`.
6. **`3dba49e1` contract docs.** `REPOSITORY_LAYOUT.md`/`.en.md` §5, §8.2, §8.3, §9, §10.1 and a
   new §11 correspondence table.

The baseline was **ratcheted, not renewed**: `config/boundary-baseline.json` went from 5 entries to
1. The four retired entries were the auth→system findings whose own recorded remedy was *"promote
list-page.css to a shared location that both auth and system import"* — commit 4 executed that
remedy, so the entries were deleted rather than re-dated. The one remaining entry
(`platform/widgets.tsx` → `../system/iam/menu/api`, type-only) is a genuine architectural seam.

## Verification performed

1. **Backend:** `go build ./...` clean; `CGO_ENABLED=0 go vet ./...` clean; `gofmt -l .` empty.
   `go vet` found one real defect introduced by the rename — a local variable named `setting` in
   `modules/auth/login/login_runtime_test.go` shadowed the newly renamed `setting` package — which
   was fixed rather than suppressed.
2. **Boundary gate, before/after:** before, `0 finding(s)` over zero files; after,
   `0 finding(s), 1 baselined, 0 stale baselined, 0 unresolved repo root(s)`. Five synthetic
   fixtures confirm the new rules fire in both directions, including the regression guard that
   `system/config/setting` importing `../../../../i18n` (the *global* `src/i18n`) is **not**
   flagged while a sibling-subdomain internal import is.
3. **Structure gate:** `0 finding(s) across 2195 tracked file(s)` with all four rule families
   active, plus nine synthetic fixtures (one per rule direction). Fixture N2 caught a real bug in
   the detector: the first version only matched PascalCase declaration names, so a camelCase-named
   `React.FC` component slipped through.
4. **Frontend:** `tsc -b --noEmit` 0; `eslint .` 0; `npm run build` passes all 13 pre-build
   contract gates and completes in 1.67s; `test:unit:coverage` 21 files / **163 passed**, thresholds
   met (92.57% lines / 86.22% branches / 98.5% functions).
5. **Docs and generated artifacts:** frontmatter (315 docs), doc links (0 findings), harness
   inventory/sync/method, generated artifacts (11), generated modules, UI quality gate, failure
   registry, visual evidence and task-packet checks all pass.
6. **Runtime contract, verified mechanically rather than asserted:** the 20 `componentKey` registry
   keys, the 116 permission-code literals under `backend/modules/system` and the 60 API route path
   literals across `backend/` and `frontend/` are each **byte-identical between `main` and `HEAD`**.
   Only physical paths and import specifiers moved. `check:menu-contract` (16 menus / 20 routes /
   89 permissions / 20 component keys) passes in the pre-build gate chain.

## The defect CI caught that no local check could

The first CI run failed `Frontend Contract`, `Frontend Unit Tests` and `Quality Gates`. The cause
was real and it was introduced by this change: **five case-only renames were never recorded by
git.**

The naming fix renamed five non-component `.ts` modules in place from PascalCase to camelCase
(`TableAction.ts` → `tableAction.ts`, and the same for `TableColumnWidth`, `TableColumnPriority`,
`RailSummary`, `AppModalActions`). Windows and macOS filesystems are case-insensitive, so git did
not see a rename at all — the index kept the **old** casing while the working tree had the new one.
Every local check therefore passed: `tsc`, `eslint`, `vite build` and `vitest` 163/163 all resolve
imports through a case-insensitive lookup and find the file either way. On Linux the specifiers no
longer matched the tracked filenames, so `check:import-path-case` reported 13 problems and five test
suites died with `Failed to resolve import "./patterns/table/tableAction"`.

Fixed with a two-step move (`git mv Old.ts __tmp__.ts && git mv __tmp__.ts new.ts`), because a
single-step `git mv` is a no-op on a case-insensitive filesystem. Re-verified with a purpose-built
index-vs-disk name comparison: `tracked files: 2199, not on disk: 0, case mismatch: 0`, and
`check:import-path-case` → `passed for 248 source files`.

This is worth recording for two reasons. It is exactly the class of defect the review's
*correspondence* axis was meant to surface, and it is the strongest possible argument for keeping
these gates blocking rather than advisory: **the local toolchain was structurally incapable of
detecting it.**

## Completion status

completed (pending the branch push, CI run and merge to `main`)

## Residual risk

- **Case-only renames are a trap on this repository's development platforms.** Five such renames
  were silently dropped by git and only Linux CI caught them. Any future case-only rename must be
  performed as a two-step `git mv` and confirmed by comparing the git index against the real
  on-disk names.
- **Behaviour change in the boundary gate.** `check-boundaries.mjs --strict` now fails when it
  cannot resolve the repository root, instead of passing quietly. That is the point of the fix, but
  any invocation whose cwd is neither the repository root nor a workspace containing it will now
  fail. CI is unaffected (cwd is the repository root).
- **Auth rule breadth.** The auth boundary rule still permits importing non-`api` system modules
  (e.g. `system/audit/retentionSetting`). Tightening it to `api`-only would create 7 new findings
  and is outside the 12-item scope.
- **Local gate coverage.** This host cannot spawn child processes from Node (`spawnSync` fails with
  `EBUSY`), so `check:structure`, `check:harness-encoding` and the `tests/scripts/*.test.mjs` suites
  cannot run locally. `check:structure` was verified with the identical script reading an injected
  `git ls-files` list; the test suites run in CI via `npm run test:scripts`.
- **Dated records left as-is.** Two point-in-time documents still reference pre-move frontend paths
  by design; they are historical records, not live references.
- **Pre-existing dead regex.** `frontend/vite.config.ts` has a code-splitting group matching two
  module paths that no longer exist. Left untouched to avoid changing bundle output in a structural
  change.
