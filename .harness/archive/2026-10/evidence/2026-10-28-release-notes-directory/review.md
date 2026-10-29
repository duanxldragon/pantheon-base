# Review — `2026-10-28-release-notes-directory`

Reviewed the working tree on branch `docs/release-notes-directory`
(base `a053805b`). Measured diff: 27 paths — 14 renames
(`RELEASE_NOTES_v*.md` → `docs/release-notes/`), two new index files, six
modified docs plus the v0.14.0 link prefix, and four historical evidence files
whose `planRefs` were repointed. Every path is inside the packet's
`expectedFiles`; `doNotTouch` (`backend/**`, `frontend/**`, workflows, release
scripts, `CHANGELOG.md`, `VERSION`, archived evidence) is untouched.

## Reviewer posture, item by item

| Posture item | Reading |
|---|---|
| All 14 files are renames and the root is clean | `git status` shows fourteen `R` entries and `ls RELEASE_NOTES_*.md` at the root returns "No such file or directory". No body changed except v0.14.0's link prefix. |
| Indexes cover every file and are reachable | Both `docs/release-notes/README.md` and `README.en.md` list v0.13.1 through v0.17.8 (14 rows), mark v0.17.8 as latest, and are linked from the upgrade/operations group of `docs/README.md` / `docs/README.en.md`; the root READMEs link straight to the latest note. |
| Every link resolves, none targets the old root | `check-doc-links --strict` reports 0 findings across `docs/`, `.agents/`, `scripts/harness/` and `config/`. The only remaining textual mentions of `RELEASE_NOTES_*` are narrative records (historical packets, evidence, CHANGELOG, failure registry) and the two indexes themselves. |
| Layout rule declared, no code/workflow change | `REPOSITORY_LAYOUT.md` §1 comment and §2.1 rule 9 (plus the English twin) state the placement and append-only rule. No `.go`, `.tsx`, workflow, script or migration appears in the diff. |
| Historical material not retro-edited | No archived file is in the diff. Four historical evidence files are: their `linkage.planRefs` entries pointed at the old root note path, and the strict `check-evidence` / `check-review` runs resolve those refs as repo paths, so the two `commands.json` and two `review.md` sites now name `docs/release-notes/...`. Only the path changed — verdicts, command readouts, plan lists and knownGaps are byte-identical. |

## Findings

- **P3, index maintenance**: the table is hand-written, so the next release cut
  must add one row plus flip the "latest" line. Recorded rather than automated;
  a generator would be new tooling for a once-per-release edit.
- **P3, archive link**: `.harness/archive/2026-10/RELEASE_STATUS_v0.14.0.md`
  still points at a path that never resolved from its own directory. Left as a
  historical snapshot; not introduced by this change.
- **P3, one exception to "no historical edits"**: `check-evidence --strict`
  (2 errors) and `check-review --strict` (3 errors) failed after the move
  because four historical `planRefs` still named the root path. The fix was a
  path-only repoint; the alternative — teaching the checkers to fall back — was
  rejected as new tooling for a one-time relocation.

## Machine Readable

```json
{
  "taskId": "2026-10-28-release-notes-directory",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "docs/release-notes/README.md",
      "docs/release-notes/README.en.md",
      "docs/README.md",
      "docs/README.en.md",
      "docs/designs/REPOSITORY_LAYOUT.md",
      "docs/designs/REPOSITORY_LAYOUT.en.md",
      "README.md",
      "README.en.md"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [
      "P3 index maintenance: the release table is hand-maintained; the next cut adds one row and moves the latest pointer.",
      "P3 archive link: the 2026-10 archived status snapshot keeps a pre-existing stale relative link; archived snapshots are not retro-edited.",
      "P3 historical planRefs: four evidence planRefs had to be repointed to docs/release-notes/ for the strict checkers; path-only, no verdict or readout changed."
    ],
    "notes": "Documentation relocation only: fourteen git renames, two new bilingual indexes, six link/spec updates, one release-note link-prefix fix and four path-only evidence planRefs. No runtime edge exists — backend, frontend, workflows, release scripts, CHANGELOG and VERSION are byte-identical. The destination avoids .gitignore's unanchored releases/ rule, and the release tooling receives notes as literal text, so publication is unaffected. Verification is measurement-based: doc links 0, inventory 0, frontmatter passed (386 docs), encoding 0/2507, structure 0/2855, task-packet PASS, generated 0/11, UI gate 0, evidence 0 errors/81 files, review 0 errors/81 files, plus a git-status rename proof and the root ls miss."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-28-release-notes-directory/manifest.json",
    "evidence": ".harness/evidence/2026-10-28-release-notes-directory/commands.json",
    "reviewFile": ".harness/evidence/2026-10-28-release-notes-directory/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/designs/REPOSITORY_LAYOUT.md",
      "docs/README.md"
    ]
  }
}
```
