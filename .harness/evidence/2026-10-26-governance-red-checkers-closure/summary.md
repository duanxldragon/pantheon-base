# Summary — 2026-10-26 governance red checkers closure

## What changed

The previous round (`2026-10-26-governance-evidence-schema-backfill`) zeroed 31 historical strict errors and, while doing so,
measured three governance checkers that were red on their own and owned by no task. This round closes those three readings.
No checker was edited, no baseline entry was renewed, and no historical judgement was re-made.

| Finding | Checker | Before | After |
|---|---|---|---|
| G-04 (P2) | `check-boundaries --root . --strict` | exit 1, 1 finding: `frontend/src/modules/platform/widgets.tsx:1` type-only import of `MenuNode` from `../system/iam/menu/api` | exit 0, 0 findings / 0 stale; `config/boundary-baseline.json` now has `entries: []`; CI form (`--baseline`) still exit 0 |
| G-03 (P3) | `check-runtime-evidence --root . --strict` | exit 1, 0 errors / 11 warnings | exit 0, 0 errors / 0 warnings (55 files, i.e. every evidence set including this round's) |
| G-05 (P3) | `check-inheritance-contract --root ..` (workspace root) | 8 findings | 0 findings, exit 0 |

Repairs, by shape:

| Shape | Files | Repair |
|---|---:|---|
| Cross-layer type reach | 3 source files | `MenuNode` interface moved verbatim to `frontend/src/api/menu.ts` (the public-contract location named by `REPOSITORY_LAYOUT.md` §8.1); `system/iam/menu/api.ts` re-exports it so its 7 consumers are untouched; `widgets.tsx` now imports from `../../api/menu` |
| Executed ratchet | 1 config + 1 doc | Baseline entry deleted (not renewed) and `REPOSITORY_LAYOUT.md` §8.3 rewritten to state the baseline is empty |
| Missing `runtimeGap` string | 11 `commands.json` | One line inserted per file, 0 deletions; each string restates metrics/logs already written in that same round's `summary.md` / `commands.json` |
| Absent inheritance markers | 2 root/ops docs + 2 PR templates | `docs/WORKSPACE_INHERITANCE.md` §1/§5 reworded to the literal required English markers; new `pantheon-ops/docs/PROJECT_INHERITANCE.md` §7 anchor block with the pinned Base version read from `foundation-release.lock.json`; workspace-root `.github/pull_request_template.md` created; ops `PULL_REQUEST_TEMPLATE.md` markers block extended |
| Guide + registry | 4 docs | `scripts/harness/README.md` / `README.zh.md` annotated (warnings fail `--strict`; bare vs CI boundary form; `--root .` mis-scope for the inheritance gate); FR-016 "Missed By" corrected to the measured 17 steps; FR-017 added |

## Root cause

The three reds were not three defects in the product; they were three checkers that nothing invokes.
`check-runtime-evidence` and `check-inheritance-contract` are referenced by no workflow and no npm script, and
`check-boundaries` only ever runs with `--baseline config/boundary-baseline.json`, which is deliberately more forgiving than
`--strict` alone. A gate that is never observed can decay silently, which is the same failure class FR-016 records for
`check-evidence` / `check-review`. FR-017 registers it with `Recommended Harness Change: guide`,
`Promotion Decision: guide-updated`, status `open` — the CI promotion itself is a gate-policy decision and is left to the maintainer.

## Verification

- `check-boundaries --root . --strict` → 0 finding / 0 stale / exit 0. CI form `--strict --repo pantheon-base --baseline config/boundary-baseline.json` → exit 0, baselined 1 → 0.
- `check-runtime-evidence --root . --strict` → 0 error / 0 warning / exit 0 (55 files, including this round's own evidence set).
- `check-inheritance-contract --root .. --strict` → 0 finding / exit 0.
- Full strict matrix (24 checkers): all exit 0 — for the first time the governance chain reads green in both the bare-`--strict` and the CI forms simultaneously.
- Behavioural safety of the type move: `tsc -b` exit 0, `eslint src --max-warnings 0` exit 0, widgets + `useLayoutMenu` vitest 6/6 passed, `check-menu-contract` (19 menus / 23 routes / 102 permissions / 23 component keys) and `check-import-path-case` (274 files) exit 0.
- Backend untouched by design: `go build ./...`, `go vet ./...`, `gofmt -l .` (from `backend/`) all clean.
- Ops side after the PR-template edits: base and ops `check-adoption --strict` exit 0.
- Integrity proofs: `git diff --numstat` shows each of the 11 `commands.json` files at 1 insertion / 0 deletions; `git diff -- .harness/evidence | grep -E '^[+-]' | grep '"status"'` is empty; no file under `scripts/harness/` or `.github/workflows/` is modified.

## Gaps and limits

1. Runtime evidence was closed at the contract level, not by re-running anything. The 11 added `runtimeGap` strings point at
   data recorded in those rounds' own files; they do not re-verify it, and none of those rounds was re-executed.
2. The workspace-root `.github/pull_request_template.md` satisfies `check-inheritance-contract` at a path GitHub cannot load —
   `D:/workspace/go/pantheon-platform` is not a git repository, so the container has no PRs and root docs are unversioned.
   The operative templates are the two repo-level ones; both were updated with real markers, and the file created at the root carries
   a header stating this explicitly. The alternative — retargeting the checker at the repo templates — is a rule change and is the
   maintainer's call.
3. `MenuNode` now has two import paths: `frontend/src/api/menu.ts` (canonical) and the `system/iam/menu/api.ts` re-export still used
   by 4 consumers. Removing the re-export is a wider rename than this round's scope; it is recorded as a known gap.
4. `PROJECT_INHERITANCE.md` §7 pins `pantheon-base-v0.16.1` (`c83f8e4…`) as prose next to `foundation-release.lock.json`, which is the
   source of truth. That is a second copy of one fact and will drift on the next foundation bump — registered as F-13.
5. Observing these checkers in CI is still absent (FR-017 open). The green state holds only while someone runs the matrix.
6. `gofmt -l .` run from the repository root lists vendored files under `dist/foundation-releases/**`; pre-existing, not a regression,
   registered as F-14.

## Human gate pending

Promote `check:evidence`, `check:review`, `check-runtime-evidence`, `check-inheritance-contract` and the bare-`--strict`
`check-boundaries` into `.github/workflows/quality.yml` (with npm scripts), or retarget `check-inheritance-contract` at the two
repo-level PR templates instead of the workspace root? Both are gate-policy decisions (touchpoint 2). This round closed the red
readings and wrote the guidance; it deliberately changed no workflow and no checker.

## Next

No commit, push or PR was made; none was requested. The deliverable is the three closed readings, the boundary ratchet executed,
the 11 backfilled `runtimeGap` lines, the inheritance markers, FR-017, the README annotations, and this packet with its manifest
and evidence set.
