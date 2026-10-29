# Review — `2026-10-29-harness-task-archive`

Reviewed the working tree on branch `chore/harness-task-archive`
(based on `origin/main` @ `9c97a01c`). Measured diff: 562 renames, 7 modified
files, 3 new paths. Every rename is a `git mv`, so no file content changed and
history follows each task into the archive.

The question this review had to answer was not "did the moves succeed" — the
counts in `commands.json` answer that — but "did the round make the repository
tell the truth more or less often". It answers in both directions, so both
directions are recorded.

## Reviewer posture, item by item

| Posture item | Reading |
| --- | --- |
| Per-month counts recomputed from the tree | `git ls-tree -d --name-only HEAD:.harness/archive/<month>/{tasks,evidence}` before, `ls` after: 2026-07 26/31 unchanged, 2026-08 23/23 unchanged, 2026-09 67→72 tasks and 66→70 evidence, 2026-10 0→82 tasks and 0→85 evidence. Totals 116→203 tasks and 120→209 evidence. `.harness/ARCHIVE.md` carries exactly these numbers, and its old table was itself stale by one task in 2026-09. |
| Every move is a `git mv` | The script shells out to `git mv` and aborts on failure; `git status` reports 562 `R` entries and no `D`+`A` pairs, so nothing was copied or recreated. |
| The resolver tries the live path first | `resolveArchiveAwarePath` calls `resolveRepoPath` + `fs.existsSync` before consulting the archive, so a live artifact always wins over an archived copy of the same task. `readTaskManifest` already had the same precedence and its existing test still passes. |
| A reference missing from both trees still warns | Both new test files assert the negative case: `check-task-packet` on a review file removed from both trees prints `Linked review file does not exist`, and `check-doc-links` on a target present nowhere exits 1 with `missing internal link target`. The guard was not weakened to make the round green. |
| Nothing deleted or overwritten | The three deliberate residues are byte-identical to HEAD (untouched paths), and the png comparison was made before deciding not to overwrite: 62609/39527 bytes live against 60379/39304 archived. |
| The non-vacuity guards are unchanged | `check-evidence.mjs` and `check-review.mjs` were not edited. They failed with "No evidence command files found" / "No review artifacts found" while the trees were empty, and pass now only because this packet supplies a live evidence directory. |

## Findings

- **P2, the round disproved its own assumption mid-flight**: the pre-round baseline
  of 42 warnings read like a stable number, but 28 of them were the 2026-09-25
  round's unresolvable references. Anyone treating 42 as "the known warnings"
  would have accepted 86 as "+44 new", when the true count was 14. Recorded as
  FR-019 with the three readings (42 / 86 / 14), because the number that matters
  is the delta against a clean baseline, not against a contaminated one.
- **P2, the next all-archive round will hit the empty-set guard.** This packet is
  green partly because it leaves one live evidence directory behind. Archiving
  that one later will make `check-evidence --strict` and `check-review --strict`
  exit 1 with "no artifacts found" — a true statement about the scan set and a
  false one about the repository. Relaxing it is gate policy, so it is recorded
  here and in `knownGaps` rather than patched.
- **P3, packet documents lag the manifests.** `docs/harness/tasks/*.task.md` stays
  live for 88 packets whose manifests are now archived. That is intentional and
  matches the 2026-09-25 round, but it means "archived task" is defined by the
  manifest, not by the presence of a document. `.harness/ARCHIVE.md` says so.
- **P3, two residues need a maintainer decision.** The 2026-09-10 pngs and the two
  unattached PR bodies cannot be resolved by an agent without either rewriting
  historical evidence or losing data.

## Machine Readable

```json
{
  "taskId": "2026-10-29-harness-task-archive",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "scripts/task-manifest.mjs",
      "scripts/harness/check-task-packet.mjs",
      "scripts/harness/check-doc-links.mjs",
      "tests/scripts/task-manifest-archive.test.mjs",
      "tests/scripts/harness-check-task-packet-context.test.mjs",
      "tests/scripts/harness-check-doc-links-archive.test.mjs",
      ".harness/ARCHIVE.md",
      "docs/harness/failure-registry.md"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [
      "P2 contaminated baseline: 28 of the 42 pre-round check:task-packet warnings were the 2026-09-25 round's unresolvable references, so the round's real delta was measured against 14, not 42; FR-019 records 42 / 86 / 14.",
      "P2 empty-set guard: check-evidence and check-review exit 1 when the live scan set is empty, which the next all-archive round will trigger; left as gate policy and recorded as a known gap.",
      "P3 document/manifest split: 88 packet documents stay in docs/harness/tasks while their manifests are archived, matching the 2026-09-25 round; archived status is defined by the manifest.",
      "P3 residues needing maintainer disposition: two diverged pngs at a re-used evidence path and two unattached PR bodies, all left untouched."
    ],
    "notes": "Archived 87 completed task directories and 89 evidence directories with git mv (176 moves, 0 collisions), leaving only the in-progress codebase-simplification programme live. The move initially took check:task-packet from 42 to 86 warnings and turned check:harness-docs red on three docs/reviews links, so findArchivedReferencePath and resolveArchiveAwarePath were added to scripts/task-manifest.mjs, reused by check-task-packet for Review File and Contract Anchors and by check-doc-links for in-repo link targets. Final readings: 14 task-packet warnings (all real), 0 doc-link findings, 171/171 scripts tests, and structure/encoding/frontmatter/inventory/adoption/visual/UI/duplication/failure-registry/boundaries/runtime/evidence/review checkers at zero findings. Ratchet: FR-019 (method-health / static-sensor-gap) promoted as a sensor."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-29-harness-task-archive/manifest.json",
    "evidence": ".harness/evidence/2026-10-29-harness-task-archive/commands.json",
    "reviewFile": ".harness/evidence/2026-10-29-harness-task-archive/review.md",
    "changeRef": "none",
    "planRefs": [
      ".harness/ARCHIVE.md",
      "docs/harness/AI_QUALITY_GOVERNANCE.md"
    ]
  }
}
```
