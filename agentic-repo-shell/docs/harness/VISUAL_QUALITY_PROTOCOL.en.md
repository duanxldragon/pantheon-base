# Visual Quality Protocol

Chinese version: [VISUAL_QUALITY_PROTOCOL.md](./VISUAL_QUALITY_PROTOCOL.md)

Type: Contract
Layer: method
Status: Active

This document defines the visual quality gate for UI work. It is part of the tool-agnostic Harness protocol and is not tied to any specific product, component library, or backoffice style.

## 1. Scope

Any task that affects the following must run the visual quality gate:

- page layout
- frontend components
- dashboard, admin, workbench, mobile, or embedded UI surfaces
- tables, forms, charts
- navigation, modals, drawers, toolbars
- interaction states such as loading, empty, error, permission denied, disabled, and success
- responsive or mobile viewports
- visual design system, color, typography, spacing, icons, and motion

## 2. Default Gate

Preferred visual quality skill:

```text
impeccable
```

If the current tool does not support Codex skills, it must still execute under the same protocol:

1. read this document and the current repository design-system docs
2. use `.agents/prompts/implementation.md`, `.agents/prompts/review.md`, `.agents/prompts/qa.md`, or equivalent prompts
3. write visual evidence into `.harness/evidence/<task-id>/`, or use the same structure in PR or CI artifacts

## 3. Relationship To Other Design Tools

- `impeccable` or an equivalent process is the visual quality gate.
- Design systems, Figma, Storybook, screenshot diffing, Playwright, browser testing, and manual screenshots may be used as input or evidence.
- Specific brand style, component lists, token names, and banned styles belong in the downstream repository design system or overlay.
- The portable method core does not store product-specific visual rules.

## 4. UI Task Manifest Requirements

UI tasks must declare the following in `verificationPlan.visualEvidence` within the task manifest:

- UI surface type
- target visual feel or design-system reference
- desktop, mobile, or relevant viewport verification plan
- loading, empty, error, permission, disabled, and other relevant state checks
- route verification plan when the task has a stable entry route

If the repository still keeps a task packet, it may mirror the same human-readable notes, but automation is expected to read the task manifest and must not infer visual-validation semantics from task-packet prose.

## 5. Review Gate

UI review must check:

- whether a visual quality gate was used, or whether the reason for not running one was recorded
- whether rendered evidence was retained, or an explicit visual gap exists
- whether overflow, overlap, misalignment, weak contrast, or missing states exist
- whether the result follows the current project UI style without introducing an unjustified second visual language
- whether interactive elements have `:focus-visible` or an equivalent visible focus treatment
- whether `prefers-reduced-motion: reduce` is respected
- whether hover, loading, and focus states avoid layout shifts
- whether color, typography, gradients, shadows, and radius values converge on the project design tokens or defined visual system
- whether similar pages reuse the project standard structure instead of mixing multiple hero, overview, metric, toolbar, dialog, or table-card visual modes
- whether modals, drawers, toasts, tooltips, and similar overlays use the project standard entry points

P0/P1 visual issues cannot be approved.

## 5.1 Mechanical Contract

If the project defines a visual contract script, it should be included in the verification plan and recorded in evidence.

Generic mechanical checks should cover:

- header, tab, breadcrumb, and nav text is not clipped
- standard filter, list, batch-action, table, and form areas keep consistent spacing, radius, and control height
- unapproved raw colors, shadows, font sizes, or font weights do not leak into product UI
- similar pages do not contain competing visual modes
- critical page states are covered by screenshots or smoke/assertion evidence

Project overlays may provide stricter rules, but they must not weaken rendered evidence, state coverage, focus, motion, and layout-stability baselines.

## 6. Evidence

Recommended evidence structure:

```text
.harness/evidence/<task-id>/
  summary.md
  commands.json
  screenshots/
  visual-review.md
```

If screenshots cannot be produced, the task must record:

- the reason screenshots were not produced
- the risk
- the follow-up verification path

"It should probably look fine" is not an acceptable visual verification conclusion.

For tasks that declare `verificationPlan.visualEvidence`, the machine-checkable closure lives in `browserEvidence` within `commands.json`:

- `viewport`
- `checkedStates`
- `url` for route coverage

Screenshots and explicit visual-gap notes remain useful supporting evidence, but they do not replace `browserEvidence` coverage for the manifest plan.

## 6.1 Blocking Rule

If a UI task manifest declares a visual verification plan and strict mode is enabled in CI, missing `browserEvidence` coverage for the declared viewport/state/route plan is a blocking harness failure. Missing screenshots and missing explicit visual-gap records remain warnings when no other visual signal exists.
