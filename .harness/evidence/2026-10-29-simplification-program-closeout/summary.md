# Summary — `2026-10-29-simplification-program-closeout`

## What changed

- `docs/reviews/CODE_SIMPLIFICATION_PLAN.md` no longer calls itself unexecuted.
  Line 6 now states the programme is executed and points at §11; the closing
  disclaimer at the end of the plan body was replaced by a note that the plan text
  is kept as written and that §11 carries the facts. §11 is new: the thirteen-wave
  measured table, the structural metrics re-measured at HEAD, the line-count window
  with its caveat, RC coverage, gate readings and the still-open items.
- `.harness/evidence/2026-10-27-codebase-simplification-program/` now exists with
  `commands.json`, `summary.md` and `review.md`. The programme manifest had pointed
  `linkage.summaryFile` / `linkage.reviewFile` at that directory since the programme
  was created; `check:task-packet` had been warning about the missing review file
  every run.
- The programme packet's Completion Checklist is filled in: ten items ticked, the
  `pantheon-ops` build left open with its reason. Both the packet and the manifest
  said "twelve waves"; there are thirteen (S4 has two), corrected in four places.
- `docs/harness/failure-registry.md` gains FR-020 (method-health /
  method-health-gap, promoted as a guide change) and a matching review note.
- `docs/harness/AI_QUALITY_GOVERNANCE.md` gains §5.3 (multi-wave programmes close out
  as documents, not by implication from their waves) and a v1.2 row in §0.
- `.harness/STATUS.md` records the closeout readings.

## Readings at closeout (2026-10-29, `main` @ `3b73c7a4`)

| Reading | Value |
|---|---|
| Wave manifests reporting `completed` | 13 / 13 |
| Backend `go build` / `go vet` | clean |
| Backend `go test -count=1 ./...` | 47 ok / 0 FAIL / 6 packages without tests / 0 SKIP |
| Packages with test files vs baseline | 47 vs 46, one addition (`modules/system/iam`), no removals |
| `ParseUint(c.Param("id")` inline | 2 (was 35; plan target ≤2) |
| Pagination normalizers | 1 + field adapters (was 13) |
| Page-size clamp lines | 1 (was 11) |
| Inline `Offset((page-1)*pageSize)` | 4 (was 14) |
| `tenantOwnerID` definitions | 0 (was 11) |
| `var errParamInvalid` declarations | 0 (was 11) |
| Backend non-test LOC | 52,332 (baseline 53,179) |
| Frontend src LOC | 67,828 (baseline 68,169) |
| RC ids with a recorded disposition | 33 of 45 |
| `check:task-packet` warnings | 15 mid-round → 13 after this package's evidence exists (0 errors) |

The line-count window is deliberately **not** presented as the programme's gain: it
also contains net-additive tenant work (W6/W7/W9), the release-notes move and the
S3776 fix. The traceable numbers are the per-wave stats in the programme evidence.

## Why the closeout package exists at all

Because the plan and the repository disagreed for two days. The waves each closed
their own packet properly and no packet owned the programme document, so the only
programme-level text a reader could find said nothing had been done. FR-020 records
the failure mode and §5.3 makes the closeout a required step rather than a courtesy.

## Known gaps

- `pantheon-ops` build against a foundation release covering the 13 waves: `not-run`,
  maintainer release decision. This is the one open item on the programme checklist.
- Freeze-vs-continue after S2/S3: maintainer strategy call.
- RC-036/037/038 final disposition: S4 recorded keep / keep-and-check; a reversal
  needs its own wave.
- Twelve RC ids (018, 021, 032–035, 039–042, 044, 045) remain in the plan's explicit
  "not in this round" table; they are enumerated, not counted as covered.
