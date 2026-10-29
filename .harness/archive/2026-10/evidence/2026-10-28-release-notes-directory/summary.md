# Summary — 2026-10-28-release-notes-directory

## What changed

The fourteen release-note files that had accumulated at the repository root
(`RELEASE_NOTES_v0.13.1.md` … `RELEASE_NOTES_v0.17.8.md`) now live in
`docs/release-notes/`. `git mv` preserved every file's history; only
`RELEASE_NOTES_v0.14.0.md` had a body edit (its five documentation links moved
from `./docs/...` to `../...` for the new depth).

Two new indexes make the directory the entry point:

- `docs/release-notes/README.md` (Chinese) and `README.en.md` (English): a
  newest-first table with version, release date and link. Both point at
  v0.17.8 as the latest.
- `docs/README.md` / `docs/README.en.md` gained a "release notes index" line
  under the upgrade/operations group.

Links repointed:

| File | Before | After |
| --- | --- | --- |
| `README.md`, `README.en.md` | `./RELEASE_NOTES_v0.17.8.md` | `./docs/release-notes/RELEASE_NOTES_v0.17.8.md` |
| `docs/reviews/ENTERPRISE_RELEASE_READINESS_REVIEW_2026-10-07.md` (×3) | `../../RELEASE_NOTES_v0.14.0.md#L..` | `../release-notes/RELEASE_NOTES_v0.14.0.md#L..` |
| `docs/release-notes/RELEASE_NOTES_v0.14.0.md` (×5) | `./docs/api/...` etc. | `../api/...` etc. |

`docs/designs/REPOSITORY_LAYOUT.md` and its English twin now state the rule:
release notes belong under `docs/release-notes/`, indexed by that directory's
`README.md`, appended rather than rewritten.

## Why `docs/release-notes/` and not `docs/releases/`

`.gitignore` carries an unanchored `releases/` rule for the generated
foundation-release bundles. An unanchored pattern matches a `releases/`
directory at any depth, so `docs/releases/` would have needed ignore-rule
surgery. `docs/release-notes/` sidesteps that entirely.

## Why the release flow is unaffected

`scripts/foundation-release/cut-foundation-release.mjs` takes `--release-notes`
as literal text (the closeout packets pass `"$(cat RELEASE_NOTES_v0.17.x.md)"`).
It never resolves the repository path, so relocation cannot change release
metadata or published bodies.

## Deliberately untouched

- Narrative filename mentions in historical packets, `.harness/evidence/**`
  prose, `CHANGELOG.md` and `docs/harness/failure-registry.md` — these are
  records, not links. The one exception is four `linkage.planRefs` entries in
  two `commands.json` and two `review.md` files: the strict evidence/review
  checkers resolve those as repo paths, so they were repointed to
  `docs/release-notes/...` without touching any verdict or readout.
- `.harness/archive/2026-10/RELEASE_STATUS_v0.14.0.md` — its relative link was
  already stale before the move (it resolved under `.harness/archive/`, not the
  root), and archived snapshots are not retro-edited.
- `CHANGELOG.md`, `VERSION`, workflows, release scripts, backend and frontend.

## Verification

All documentation gates are green: links 0, inventory 0, frontmatter passed
(386 docs / 270 with frontmatter), encoding 0 of 2507 files, structure 0 of
2855 tracked files, task-packet PASS, generated 0 of 11, UI quality gate 0,
`check-evidence --strict` 0 errors of 81 files, `check-review --strict`
0 errors of 81 files. The details are in `commands.json`; the review is in
`review.md`.
