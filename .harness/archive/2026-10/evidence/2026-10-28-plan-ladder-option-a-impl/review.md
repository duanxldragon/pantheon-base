# Review — `2026-10-28-plan-ladder-option-a-impl`（W7 选项 A 实现跟进）

Reviewed against the working tree on branch `feat/plan-ladder-option-a-impl`
(base `18563a7e`). Measured diff: **7 files, +20 / −6** — five locale resources
(one value line each), the contract (§2.4 paragraph + §9 V1.9 row), and
STATUS.md (W7 landing record). Every path is inside the packet's
`expectedFiles.modify`/`create`; `doNotTouch` (`backend/**`,
`frontend/src/core/entitlements/**`, `frontend/src/modules/**` logic, the signed
decision document, the design vision doc, workflows, `pantheon-ops/**`) is
untouched. The review question is the packet's `reviewerPosture`, answered with
the artefact that settles each item.

## Reviewer posture, item by item

| Posture item | Reading |
|---|---|
| All five locales carry the same lowcode clause; quota/capability split survives | The five diffs are one clause each: zh「lowcode 门控面不可见」/ en「the lowcode gated surfaces stay hidden」/ ja「lowcode の制御対象画面は非表示になります」/ ko「lowcode 게이트 대상 화면은 숨겨집니다」/ fr「les surfaces lowcode contrôlées restent masquées」. The pre-existing quota sentence (配额上限仍按该套餐定义生效 / quota ceilings still come from this plan definition) is untouched in all five; `audit:i18n-locales` reports 3019 keys per locale with 0 missing/extra/empty. |
| Contract paragraph states the three-part boundary and cites the decision | The new §2.4 paragraph separates: quotas still apply from the table row, capabilities resolve to `free` via fail-closed `normalizeTenantPlan`, gating is UX-only with authorization unchanged (§2.3/§3 permission chain) — then points at the decision document for the option A/B/C rationale. The decision's "new failure mode" (operators mistaking quota rollback) is prevented by exactly this split. |
| No invariant, error code, In/Out edge or write-side behaviour changed | V1.9 is recorded as 澄清（Clarification）in §9; the paragraph adds no invariant and touches no error code. The only behavioural surface is one warning sentence shown to operators when they type a custom code — the trigger condition (`planOutsideLadder`, `TenantList.tsx:273`) and everything it guards are unchanged. |
| `normalizeTenantPlan` and gating consumers untouched; matrix still normalized | `git diff` over the tree touches only locale values, the contract, and STATUS.md; `plans.ts`, `usePlanEntitlements.ts`, `TenantPlanMatrix.tsx`, `AppLayout.tsx` are byte-identical. The matrix receives `normalizeTenantPlan(planCodeDraft)` at `TenantList.tsx:272→890`, so a custom code highlights the free column — decision item ③ confirmed, zero logic change. |
| Decision document and design document unedited | Neither path appears in the diff. The decision doc's two premise corrections (stale §1 copy claim; non-existent 设计文档 §2.4) are recorded in commands.json → knownGaps instead of rewriting a signed document. |

## Premise-delta audit

Both deltas are path/premise corrections of the packet's own source document,
not scope changes: the normative boundary text lands in the contract §2.4 that
the decision itself names as its anchor (判据), and the copy delta is a
refinement (naming the lowcode surfaces) on top of a warning that already
separated quota from capability since #427. Neither weakens the decision; both
are recorded where the next wave will find them (knownGaps, not silent).

## Findings

- **P3, copy granularity**: the warning names "lowcode gated surfaces" without
  enumerating them; the enumerated set (generator, module wizard, dashboard
  widget) lives in the gating consumers and will evolve. If operators ever
  report the warning as too abstract, the fix is a decision-doc amendment, not
  this packet's scope.
- **P3, no new test**: no test pins the old copy, and none was added for one
  sentence; the standing sensor is `audit:i18n-locales` parity plus the matrix's
  structural normalization at the call site. Recorded rather than silently
  accepted.

## Machine Readable

```json
{
  "taskId": "2026-10-28-plan-ladder-option-a-impl",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "frontend/src/i18n/resources/zh-CN.ts",
      "frontend/src/i18n/resources/en-US.ts",
      "frontend/src/i18n/resources/ja-JP.ts",
      "frontend/src/i18n/resources/ko-KR.ts",
      "frontend/src/i18n/resources/fr-FR.ts",
      "docs/contracts/TENANT_CONTRACT_V1.md"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [
      "P3 copy granularity: the warning names 'lowcode gated surfaces' without enumerating generator/wizard/widget; enumeration would rot as gating consumers evolve, so the decision's unenumerated wording was kept.",
      "P3 no new test: nothing pinned the old copy and no snapshot was added for one sentence; audit:i18n-locales parity and the structurally normalized matrix call site are the standing sensors."
    ],
    "notes": "The change is five one-line locale values, one contract clarification paragraph, and one STATUS record. No edge enters any runtime graph: the entitlements pipeline, the plan store and every gating consumer are byte-identical, and the only user-visible delta is one extra clause in a warning that already existed. The contract paragraph is additive Clarification (V1.9) — no invariant, error code, In/Out edge or write-side behaviour moved — and the signed decision document stays frozen with its premise corrections recorded in knownGaps instead. Verification is measurement-based: five-locale parity (0 missing/extra/empty), tsc/lint/vitest/build green, doc checkers 0 findings including the new contract-to-decision link, and a grep proving no test pins the old copy."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-28-plan-ladder-option-a-impl/manifest.json",
    "evidence": ".harness/evidence/2026-10-28-plan-ladder-option-a-impl/commands.json",
    "reviewFile": ".harness/evidence/2026-10-28-plan-ladder-option-a-impl/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-tenant-completeness-remediation.task.md",
      "docs/reviews/TENANT_PLAN_LADDER_DECISION_2026-10-28.md"
    ]
  }
}
```
