# Summary — 2026-07-26-sonar-frontend-style

Frontend style-rule batch against the frozen 182-finding list
(prd_frontend.txt, exported from SonarCloud 2026-07-25). 56 files under
frontend/src changed; no suppressions.

## What was fixed

- **typescript:S3358 (46)** — nested ternaries extracted to consts above the
  JSX return, if/else assignments, or small helpers in the same file.
- **S77xx modernization (S7778 20, S7770 19, S7781 9, S7771 6, S7763 4,
  S7746 4, S7755 3, S7780 3, S7762 3, S7741 2, …)** — applied exactly per
  rule message (replaceAll, flat, at(-1), String.raw, Object.hasOwn, spread,
  TypeError for type checks, etc.).
- **css:S4666 (4 of 6)** — duplicate selectors merged only where
  cascade-neutral (body font-family single occurrence, .page-split-layout,
  .app-dialog .arco-modal-content, and adjacent same-selector merges).
- **S6819 (5), S6653 (5), S6594 (5), S4624 (4), S6754 (4), S3863 (4),
  S8786 (3), S2933 (3)** and remaining singles — per message.

## Deliberately retained (2 css:S4666)

The first `.filter-panel` block (border 92% / background 82% / box-shadow
none) and the first `.app-table .arco-table-container` block (radius-md) are
**shell-visual-contract anchor blocks**: `check-shell-visual-contract.mjs`
requires those exact declarations in the first exact-selector block, while
the later same-selector twins are the load-bearing cascade layers that
produce the actual computed styles. Merging forward deletes the anchors
(gate fails — observed live on the first build attempt); merging backward
changes computed styles. Restored to main's structure; needs a maintainer
decision (re-anchor the checker or accept the duplicates) — not code-fixable.

## Verification (all green, run in the worktree)

- `tsc --noEmit` — clean
- `eslint src --max-warnings 0` — clean
- `vitest run --coverage` — 13 files, 132/132 pass (lines 92.6%)
- `npm run build` — full prebuild contract chain green: menu-contract,
  i18n-hardcode (194 files), i18n-generated-scope, system-datetime (33
  files), shell-visual-contract, ui-contract (228 files), search-toolbar
  (86 files), important-budget (0/0), page-admission (16), smoke-web-base
  (94), smoke-coverage-contract (28 specs); vite build succeeds.
- Authoritative per-rule closure count = post-merge SonarCloud OPEN re-query
  (recorded in the PR after the next main analysis).
