# Summary — `2026-10-29-harness-task-archive`

## What changed

- `.harness/tasks/` and `.harness/evidence/` now hold only open work. 87 `completed`
  task directories and 89 evidence directories moved to
  `.harness/archive/<YYYY-MM>/` with `git mv`; 176 moves, 0 collisions.
- Three governance scripts learned to resolve the canonical address against the
  archive, so the move does not require rewriting documents.
- `.harness/ARCHIVE.md` statistics were recomputed from the directory tree, and a
  new FR-019 records the failure class.

## Archive result

| Month | Tasks before | Tasks after | Evidence before | Evidence after |
|---|---:|---:|---:|---:|
| 2026-07 | 26 | 26 | 31 | 31 |
| 2026-08 | 23 | 23 | 23 | 23 |
| 2026-09 | 67 | 72 | 66 | 70 |
| 2026-10 | 0 | 82 | 0 | 85 |
| **Total** | **116** | **203** | **120** | **209** |

Live trees afterwards: `.harness/tasks` holds one manifest
(`2026-10-27-codebase-simplification-program`, `in-progress`); `.harness/evidence`
holds one directory (the 2026-09-10 residue described below) and two unattached
PR-body files.

## Why the scripts had to change

| Reading | Before the round | After the moves | After the resolver |
|---|---:|---:|---:|
| `check:task-packet` warnings | 42 | 86 | 14 |
| `check:harness-docs` findings | 0 | 3 | 0 |

The middle column is the whole finding: the round broke exactly the class of
reference it was depending on. The left column is contaminated by the same bug —
28 of those 42 warnings were the 2026-09-25 round's archived tasks, whose review
files nothing could resolve. The right column removes those 28 plus the 44 the
round created, leaving 14 warnings that are real.

`scripts/task-manifest.mjs` already had the pattern for manifests
(`findArchivedTaskManifestPath`, used by `readTaskManifest`). The new
`findArchivedReferencePath` generalises it over one table of archivable trees
(`tasks/`, `evidence/`), and `resolveArchiveAwarePath` wraps it with the
live-path-first rule. `check-task-packet.mjs` uses it for `Review File` and
`Contract Anchors`; `check-doc-links.mjs` uses it for link targets that resolve
inside the repository.

## Deliberately not done

- Packet documents stay in `docs/harness/tasks/`. Earlier rounds did the same, and
  the structural checker needs them there to keep validating historical packets.
- Nothing was deleted or overwritten. Two pngs that PR #427 rewrote at an old
  evidence path after that task was archived differ from the archived copies, and
  two unattached PR bodies belong to no task; all three were left in place and
  written down instead.
- `check-evidence` / `check-review` still treat an empty scan set as an error. That
  is gate policy, so this packet supplies one live evidence directory rather than
  relaxing the guard.

## Verification

`npm run test:scripts` 171/171; the three touched test files 19/19; structure,
encoding, frontmatter, docs inventory, adoption, visual evidence, UI quality,
duplication, failure registry, boundaries, runtime evidence, evidence and review
checkers all at zero findings.
