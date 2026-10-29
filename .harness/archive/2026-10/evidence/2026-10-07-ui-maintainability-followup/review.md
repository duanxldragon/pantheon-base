# Review — ui-maintainability-followup (local portion)

## Criteria check

1. **Manually entered avatar URL persists after save/reload; upload flow remains valid** —
   code fix applied in both `UserFormModal.tsx` and `ProfileCenter.tsx`; the
   form store now receives every manual edit, and the upload path (which
   already called `setFieldValue('avatar', …)`) is unchanged. Static checks +
   build PASS. Save/reload persistence itself is runtime behavior → verified
   by unit-level form-store mirroring + maintainer browser smoke (gap).
2. **Profile fetch failure shows a persistent recovery state; save unavailable until valid data loads** —
   PASS locally: new unit test asserts `.page-result` persists and no save
   button is rendered on failure, and that retry recovers into the editable
   form.
3. **Tabs satisfy their chosen keyboard/ARIA model** — PASS locally: the model
   (manual activation, all-tab tab stops, arrow/Home/End focus movement,
   Enter/Space activation) is documented in code and pinned by 4 unit tests.
   Desktop/phone render evidence (screenshots) is a maintainer gap.
4. **Filter and page-guard documentation points to one current canonical rule** —
   PASS: `PERMISSION_MODEL.md` §8 now states the `pagePermission` +
   `RoutePermissionGuard` rule as the only authoritative one (matching
   `FRONTEND.md` L116 and the actual implementation); `UI_PATTERN_LIBRARY.md`
   defers filters to `BACKOFFICE_STYLE_CONSTRAINTS.md` §3.5 and marks the
   legacy `SearchToolbar` pattern as historical.

## Reviewer notes

- The avatar fix deliberately keeps the single-`FormItem` layout (comment in
  code explains why Arco cannot auto-bind through the `Space` child); no
  visual/structure change, so screenshot regression risk is minimal.
- `UI_PATTERN_LIBRARY.md` legacy labels follow the existing convention used in
  `BACKOFFICE_STYLE_CONSTRAINTS.md` §"历史兼容" (historical patterns may exist,
  must not be used in new system-domain pages).
- No new dependencies; no design-system changes.

## Status

Local code/doc/test portion and authenticated browser qualification are complete. The task remains in-progress only for the shared candidate-SHA hosted gate and final release closeout; no UI-specific runtime gap remains for the local stack.

## Machine Readable
```json
{
  "taskId": "2026-10-07-ui-maintainability-followup",
  "verdict": "approved with documented P2 follow-up",
  "reviewer": {
    "independence": "self-review",
    "note": "No independent reviewer artifact was available in this workstation session; residual runtime and hosted gaps remain explicit.",
    "role": "platform-coordinator"
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-07-ui-maintainability-followup/manifest.json",
    "evidence": ".harness/evidence/2026-10-07-ui-maintainability-followup/commands.json",
    "reviewFile": ".harness/evidence/2026-10-07-ui-maintainability-followup/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-07-release-readiness-remediation.task.md",
      "docs/reviews/ENTERPRISE_RELEASE_READINESS_REVIEW_2026-10-07.md"
    ]
  }
}
```
