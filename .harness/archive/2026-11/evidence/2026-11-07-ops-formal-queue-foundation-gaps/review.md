# Findings-first review

## Current editor repair and scope extension — 2026-11-09

This section supersedes older editor-loop/ReactNode repair and review-pending assertions below. Independent current-editor reviews found1 HIGH/2 MEDIUM material defects; they were not closed by the earlier passing17 units. Generator repaired the three owned files, preserving prior edits. Seven red regressions include fresh object/array parent state, actual React element rule values and rail accessible names/metric nodes. Final24 units, full lint/type-check/build and2 existing rendered specs pass;8 light/dark desktop/mobile screenshots and exact hashes are in resume-editor-receipt.json. First green attempt's test-wrapper assertion failure is preserved.

Fresh exact-three-file independent review: CODE APPROVE /0 material findings and ARCH CLEAR in resume-editor-final-independent-{code,arch}.md. The reviewers evaluated supplied source and did not rerun tests. Imported validator internals, shared CSS, other Base domains, full release readiness and Ops P0 are excluded. Root inspected the final contact sheet: dark native step backgrounds are repaired in Base; desktop condition fixture has substantial blank height and mobile rail shows only its initial visible steps. Full state/zoom/read-screen-reader matrices remain open.

The maintainer explicitly selected “扩展 Base 业务租户合同，同批实现并验收租户隔离” for O4. This authorizes a contract change; it does not claim tenant isolation has been implemented. Plan must satisfy Base §2.6 prerequisites, scoped datasource/history/view ownership, actual generator/bootstrap predicates and simultaneous formal consumer transition. Existing helpers/unadopted business modules retain legacy behavior during deprecation. The official Ops lock remains v0.18.6. O4 contract/source/migration/runtime, other shared repairs' final review and formal release/consumer acceptance remain open.

Gate Outcomes: independent review caught three material defects missed by prior tests | red regressions now cover fresh parent state and actual React elements | runtime render confirms Base dark button repair | no full P0 or release approval.

## Current final synthesis

Final independent source review did not return a verdict: one 900s broad timeout and two 420s scoped timeouts. Earlier O1/O3 independent findings were triaged, with request-context, hostile-update and explicit-ID large-scope fixes verified; none imply final approval. Required local source/race/vet/frontend and scoped runtime checks pass. Shared registry/UI/Dashboard/link/archive changes remain Base-owned, un-released and unconsumed. No formal queue, release or production completion is asserted.

Shared ownership is Base-first. Registry and optional UI contracts have scoped tests and rendered evidence. Final release approval remains blocked on official release/consumer synchronization, full visual matrix and independent review. Existing history is not rewritten, excluded archives are not fabricated and no consumer gate is waived.

## Current bounded review restoration

Local Claude source reviews now return scoped APPROVE for the registry, Dashboard, frozen-plan projection/UI and the three corrected findings. The single-query secret completeness, start-success/callback separation and budget-preserving retry corrections have explicit follow-up approvals. Triage and exact prompt/output hashes are retained in Ops adapters/frozen-plan-review-{triage.md,provenance.json}; local ask artifacts include original task, exact prompt and raw output. Final synthesis remains blocked on unconsumed Base release, omitted review scopes and formal functional/visual/external gates.

Latest complete Ops CGO race/vet/build and 20/20 local runtime pass; Base retry unit 8/8, frontend build and browser 2/2 pass. The corrected desktop/mobile light/dark sheets were inspected. No release, production or complete-project approval is inferred.

## Latest rollback and governance evidence

One current combined local runtime run passes21/21. Frozen rollback transaction/wrappers have an independent APPROVE limited to the supplied source; secrets, helper internals, middleware and later tiny deltas are covered by separate local tests or remain omitted review scope. Editable ConditionBuilder source review remains unavailable; prior adapter failures/timeouts are retained. Base packet format is repaired and passes with zero errors/warnings. No complete-source, formal-release, external, production or final human approval is inferred.

## Condition editor current review

Independent supplied-source review returned two P2 defects (validation prop lifecycle and ReactNode coercion). Both are fixed with failure-before/passage-after unit regression and current16/16 operational unit plus2/2 browser evidence. The revised source follow-up timed out120s, so overall verdict stays blocked and the earlier output is not represented as clean APPROVE. Original review provenance is in Ops adapters/condition-final-editor-_; revised prompt/output/status are local condition-lifecycle-review-_ artifacts. Original full desktop captures and explicit top crops are retained.

## Machine Readable

```json
{
  "taskId": "2026-11-07-ops-formal-queue-foundation-gaps",
  "verdict": "blocked",
  "reviewer": "Codex findings-first synthesis; scoped Claude approvals recorded; remaining whole-scope review open",
  "findings": [
    {
      "id": "RELEASE",
      "severity": "P0",
      "title": "Shared source changes not released or consumed",
      "state": "open"
    },
    {
      "id": "DASHBOARD",
      "severity": "P1",
      "title": "Operational adapter implemented; full consumer acceptance pending",
      "state": "open"
    },
    {
      "id": "LEGACY-PACKAGING",
      "severity": "P1",
      "title": "Projection implemented; eight current consumer entries await official release",
      "state": "open"
    },
    {
      "id": "FINAL-REVIEW",
      "severity": "P1",
      "title": "Scoped independent approvals exist; whole-scope and final functional/visual acceptance remain open",
      "state": "open"
    }
  ],
  "residualRisk": [
    "No production operation is authorized.",
    "Verified local source does not satisfy formal release/consumer or production acceptance."
  ],
  "linkage": {
    "taskManifest": ".harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/manifest.json",
    "evidence": ".harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/commands.json",
    "reviewFile": ".harness/evidence/2026-11-07-ops-formal-queue-foundation-gaps/review.md",
    "changeRef": "none",
    "planRefs": [
      ".harness/tasks/2026-11-07-ops-formal-queue-foundation-gaps/plan.md"
    ]
  }
}
```

## Equivalent field options final correction

Additional adversarial regression reproduces repeated parent updates when fields and callback are inline props. Validation arrays are now memoized by semantic invalid-ID content, so equivalent fields preserve the emitted reference. The regression first failed1/7; current operational units pass17/17, full lint/prebuild/type-check/build and current browser2/2 pass. condition-stable-runtime-execution.json binds unchanged final ConditionBuilder source SHA and records termination of only its launched Vite child7856. Current mobile dark capture was inspected; preceding desktop/light/dark detail captures remain applicable to unchanged visual layout.

The prior independent follow-up timeout preceded this final small stability delta; it provides no approval of that delta. Whole-source/release/consumer/final-acceptance gates remain open.

## Whole-scope independent review batch 2026-11-12 (PR #504)

Maintainer-selected local reviewer panel executed the two outstanding whole-scope lanes against `git diff main...HEAD` at commit `06925edf` (121 source files, +8426/-256, `.harness/evidence` and `.harness/tasks` excluded). Reports: `verification/independent-wholescope-20261112/code-review.md` (CODE: APPROVE WITH FINDINGS, six P2) and `verification/independent-wholescope-20261112/arch-review.md` (ARCH: APPROVE WITH FINDINGS, one P1 A-1 plus five P2, overall CLEAR). Both lanes confirmed the permission-cache revocation repair, the permissionroutes registry fail-closed semantics, tenant lifecycle lock behavior, authtoken activity atomicity, and the zero-business-import boundary in `system/*`.

Material open items from this batch: A-1 (permissionroutes lacks Seal/ValidateRoutes symmetry) is scheduled for closure in the pre-release batch; C1-C6 and A-2-A-5 are follow-up tracked items and none blocks the local merge gate. The panel replaces the previously unavailable external whole-scope lanes; scoped external Claude approvals from earlier batches remain valid and are not retracted. No production action, official release or Ops consumption is asserted by this section; those gates are driven separately.
