# Review — `2026-10-27-codebase-simplification-program`

Programme-level review written at closeout (2026-10-29). It does not re-review the 13
waves — each has its own review under `.harness/archive/2026-10/evidence/2026-10-27-s*/review.md` —
it reviews the programme's own claim: that all 13 waves landed, that the measured
numbers add up, and that nothing the plan forbade was changed.

The question that had to be answered was not "did the waves merge" (the manifest
census answers that) but "does the programme's rollup tell the truth in the places
where the plan and the repository used to disagree".

## Reviewer posture, item by item

| Posture item | Reading |
| --- | --- |
| Every wave reached `completed`, none abandoned | 13 of 13 manifests read `completed`; the census command is in `commands.json`. No wave was closed as abandoned, so the plan's "cannot prove equivalence → abandoned" escape hatch was never needed. |
| The figures come from the waves, not from squashes | Each row of the summary table cites the wave's own recorded `git diff --stat`. `git show --shortstat` was checked first and rejected: `b0a1952a` carries 30 files and −1,934 deletions because the squash of #439 also contains #438's work and both waves' evidence, while `321a6384` is an empty commit. Using squash stats would have produced a table nobody could trace. |
| The LOC window is not sold as the gain | 53,179 → 52,332 and 68,169 → 67,828 are real readings, but the same window contains net-additive tenant work (W6/W7/W9), the release-notes move and the TenantList S3776 fix. The summary states it is a lower bound and explicitly refuses to compare it with the plan's −1,500 to −2,100 estimate. |
| Structural targets were re-measured, not asserted | The four greps from plan §0.4 were re-run at HEAD: `ParseUint(c.Param("id")` 2, `Offset((page` 4, `func.*tenantOwnerID` 0, `var errParamInvalid` 0. Two of them beat the plan target, and the residue is documented per site rather than rounded away. |
| The forbidden changes stayed forbidden | No wave touched migrations, router registration, locales, permission codes, menus or seeds; the only `modules/**` edits are handler and service bodies, plus call-site renames in `i18n_handler.go`, `i18n_export.go`, `menu_handler.go`, `menu_service.go`, `role_menu.go` and `setting_seed.go` (`s.tenantCtx` → `s.TenantCtx`, `s.scoped(` → `s.Scoped(`). |
| No test was deleted to make a refactor pass | Package-with-test-files count went 46 → 47 with zero removals (`comm` diff in `commands.json`); the one addition is `modules/system/iam`, added by the two-tenant isolation smoke. |
| The programme is not closed while an item is open | The manifest stays `in-progress`. The `pantheon-ops` build is recorded as `not-run` with the reason, not as passed and not silently dropped. |

## Findings

- **P2, the rollup was missing for two days while the plan said "unexecuted"**:
  between the last wave merge on 2026-10-28 and this closeout, the only public
  description of the programme was the plan document, which claimed nothing had been
  done. Anyone reading it (including a downstream maintainer or a later agent) would
  have re-planned finished work. Registered as FR-020 with the matching rule in
  `AI_QUALITY_GOVERNANCE.md` §5.3.
- **P2, the plan's line estimate was optimistic and should stay visible**: S2 spent
  +507 net on shared helpers and +262 net on the pagination wave (tests included)
  before call-site deletions paid any of it back. The plan predicted −1,200 to −1,700
  for S2; the measured swing is far smaller. The estimate is left in §F2.6 unchanged
  and the delta is stated in §11, rather than editing the estimate to look right.
- **P3, twelve RC ids remain unactioned by design**: they are all in the plan's
  "not in this round" table, so this is declared debt. Listing them by id is what
  keeps "32 of 45 done" from reading as "45 of 45 done".
- **P3, three convergence exceptions are permanent until another wave**: `setting_audit`
  pagination, the tenant member pagination (W9) and the two i18n ID-parse sites. Each
  has a stated reason in its wave evidence; none is silent drift.

## Machine Readable

```json
{
  "taskId": "2026-10-27-codebase-simplification-program",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": [
      "backend/pkg/common/handler.go",
      "backend/pkg/database/notfound.go",
      "backend/pkg/impexp",
      "backend/pkg/tenant",
      "backend/modules/system/iam/role",
      "backend/modules/auth/oidc/handler.go",
      "docs/reviews/CODE_SIMPLIFICATION_PLAN.md",
      ".harness/evidence/2026-10-27-codebase-simplification-program"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [
      "P2 stale plan status: CODE_SIMPLIFICATION_PLAN.md:6 and :302 described the programme as unexecuted for two days after the thirteenth wave merged; corrected at closeout and registered as FR-020.",
      "P2 optimistic line estimate: S2 added 507 net lines of shared helpers and 262 net in the pagination wave before call-site deletions, so the plan's -1,200 to -1,700 band is not met; the estimate is left intact and the delta recorded in section 11.",
      "P3 twelve RC ids (018, 021, 032-035, 039-042, 044, 045) remain unactioned by design and are enumerated rather than counted as covered.",
      "P3 three permanent convergence exceptions until a later wave: setting_audit pagination, tenant member pagination (W9), and the two i18n path-ID parse sites."
    ],
    "notes": "Programme rollup for 13 merged waves. Measured per wave from each wave's own git diff --stat: S1 dead-code -1,923 lines, S2 shared helpers +641/-134 add-only, S2 import/export +578/-404, S3 tenant scope +278/-373 production, S4 alias removal re_export.go 112->52. Structural targets: inline ParseUint 35->2, pagination normalizers 13->1 plus adapters, tenantOwnerID 11->0, errParamInvalid 11->0. LOC window 96ef1d66 -> HEAD: backend non-test -847, frontend src -341, explicitly a lower bound because the window carries net-additive tenant work. Backend 47 ok / 0 FAIL / 6 without tests, no test package removed. RC coverage 33 of 45 with the remaining 12 listed. The programme manifest stays in-progress solely for the maintainer-gated pantheon-ops build."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-codebase-simplification-program/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-codebase-simplification-program/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-codebase-simplification-program/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/reviews/CODE_SIMPLIFICATION_PLAN.md",
      "docs/reviews/REDUNDANT_CODE_CANDIDATES.md",
      "docs/reviews/CODEBASE_SIMPLIFICATION_AUDIT.md"
    ]
  }
}
```
