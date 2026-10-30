# Review — `2026-10-29-simplification-program-closeout`

Documentation-only package. The reviewer's job here is not to re-argue the waves —
thirteen wave reviews already did that — but to check that every number this package
now publishes traces to something the repository measured, and that no claim was
smoothed to make the programme look better than it is.

## Reviewer posture, item by item

| Posture item | Reading |
| --- | --- |
| Nothing in the diff is source code | `git status` for the package lists only `docs/` and `.harness/` paths. No `backend/`, no `frontend/`, no workflow, no dependency file. The gate readings below were run to substantiate the claims about code, not to change it. |
| Each per-wave figure comes from that wave | Every row of §11.2 and of the programme `summary.md` cites the wave's own recorded `git diff --stat`. Squash stats were checked and rejected: `321a6384` is an empty commit and `b0a1952a` carries 30 files / −1,934 deletions because the squash of #439 also contains #438's work plus both waves' evidence. Quoting those would have been traceable to a commit hash but not to a wave. |
| The line-count window is not sold as the gain | `96ef1d66` → HEAD is −847 backend non-test and −341 frontend src, but the same window carries net-additive tenant waves (W6/W7/W9), the release-notes move and the TenantList S3776 fix. §11.4 says this explicitly and refuses to compare the window with the plan's −1,500 to −2,100 band. The honest statement is that S2 bought infrastructure before it paid anything back. |
| The plan's original text is preserved | §0–§F3 were not rewritten. The optimistic S2 estimate (−1,200 to −1,700) is left exactly as written; the delta is stated in §11 instead. Editing the estimate would have destroyed the only record of how far off the original judgement was. |
| The structural targets were measured, not asserted | The four §0.4 greps were re-run at HEAD: 2 / 4 / 0 / 0. Two beat the plan target and the residue is named per site (i18n `id.invalid`, `setting_audit`, tenant member). The page-size clamp count (11 → 1) and the normalizer count (13 → 1 + adapters) came from the pagination wave's own table and were not re-derived here — stated as such. |
| The "47 ok" is not a quiet test-count bump | 46 → 47 packages is one addition, `modules/system/iam`, whose root package gained the two-tenant isolation smoke. `comm` over the package lists shows zero removals, so no test package was dropped anywhere in the programme. |
| Coverage numbers separate done from deferred | 33 of 45 RC ids have a disposition; the 12 without one are listed by id and all sit in the plan's own "not in this round" table. RC-038 is flagged as belonging to both sets (kept by the S4 decision, listed as deferred). Nothing is rounded into the "done" bucket. |
| The programme is not marked complete | The manifest keeps `status: in-progress`. The one open checklist item (`pantheon-ops` build against a foundation release) is recorded as `not-run` with the reason, not as passed. A closeout that closed the programme would have been a claim this repository cannot support: no release covering the waves exists. |
| The new rule does not create busywork | §5.3 asks for three things at programme closeout (status line, measured rollup, per-item verdicts). Each of them is a document that a reader needed anyway; none requires a new checker or a new artifact type. FR-020 is registered as `guide`, not `gate`, because the miss was a missing step in an existing workflow, not a missing signal — `check:task-packet` had been reporting the absent review file all along. |

## Findings

- **P2, the drift was visible to a checker and read as noise**: `check:task-packet`
  warned `Linked review file does not exist: .harness/evidence/2026-10-27-codebase-simplification-program/review.md`
  on every run from the day the programme packet was created. The warning was
  literally correct and was treated as one of the known warnings. The lesson written
  into §5.3 is that a programme packet with no evidence directory is not a pending
  artifact — it means the programme has no rollup yet.
- **P2, the plan's estimate remains unmet and stays unmet in this document**: the
  measured programme swing is far smaller than −1,500 to −2,100 lines, driven by S2
  spending +507 net on shared helpers and +262 net on the pagination wave (tests
  included). Stated in §11.1 and §11.4 rather than buried.
- **P3, thirteen not twelve**: four places in the packet, manifest and plan said
  twelve waves. The count is thirteen because S4 has both the governance decision
  and the re-export alias removal. Corrected, but worth recording because the "12"
  figure had already propagated into the programme goal text.
- **P3, the residual warnings are real**: 13 warnings remain after this package and
  none of them is this programme's. They are: a `RELEASE_NOTES_v0.14.0.md` anchor
  that moved into the release-notes directory, a `permission_workbench.go:624-654`
  line-range anchor, a packet with no `## Linkage` key list, and packets missing
  `OpenSpec Change` / `Superpowers Plan`. Each needs its own owner; none is caused by
  archiving or by this closeout.

## Machine Readable

```json
{
  "taskId": "2026-10-29-simplification-program-closeout",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": [
      "docs/reviews/CODE_SIMPLIFICATION_PLAN.md",
      "docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md",
      ".harness/tasks/2026-10-27-codebase-simplification-program/manifest.json",
      ".harness/evidence/2026-10-27-codebase-simplification-program",
      "docs/harness/failure-registry.md",
      "docs/harness/AI_QUALITY_GOVERNANCE.md",
      ".harness/STATUS.md"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [
      "P2 checker warning read as noise: check:task-packet had been reporting the programme's missing review file since the packet was created; the warning was correct and was filed as a known warning instead of as 'this programme has no rollup yet'. Section 5.3 now makes the rollup a required closeout step.",
      "P2 unmet line estimate stays visible: the programme's measured swing is smaller than the plan's -1,500 to -2,100 band because S2 added +507 net lines of helpers and +262 net in the pagination wave; the estimate was left unchanged and the delta recorded.",
      "P3 wave count was wrong in four places: packet, manifest goal, manifest evidence line and plan scope said twelve waves; there are thirteen because S4 has two. Corrected at closeout.",
      "P3 thirteen residual task-packet warnings after this package are unrelated to it: a moved release-notes anchor, a line-range anchor, one packet without a Linkage key list, and packets missing OpenSpec Change / Superpowers Plan."
    ],
    "notes": "Documentation-only closeout of the thirteen-wave simplification programme. Corrected the plan status (line 6 and the closing disclaimer), added section 11 with the measured thirteen-wave table, structural metrics re-measured at HEAD (ParseUint inline 35->2, pagination normalizers 13->1 plus adapters, tenantOwnerID 11->0, errParamInvalid 11->0), the line-count window with its mixed-window caveat, RC coverage 33 of 45 with the 12 deferred ids listed, and the open items. Created the programme evidence directory the manifest had always pointed at, ticked ten of eleven checklist items and left the pantheon-ops build open as not-run. Registered FR-020 and added section 5.3 to AI_QUALITY_GOVERNANCE. Readings: backend build/vet clean, go test 47 ok / 0 FAIL / 6 without tests, no test package removed (46 -> 47 with modules/system/iam the only addition), task-packet warnings 15 mid-round -> 13, all other governance checkers at zero findings, check-evidence and check-review strict exit 0."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-29-simplification-program-closeout/manifest.json",
    "evidence": ".harness/evidence/2026-10-29-simplification-program-closeout/commands.json",
    "reviewFile": ".harness/evidence/2026-10-29-simplification-program-closeout/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/reviews/CODE_SIMPLIFICATION_PLAN.md",
      "docs/reviews/REDUNDANT_CODE_CANDIDATES.md",
      "docs/harness/AI_QUALITY_GOVERNANCE.md"
    ]
  }
}
```
