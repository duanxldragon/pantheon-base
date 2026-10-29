# Review — S2 shared-handler-helpers

Reviewer posture (from the packet): confirm no call site changed; confirm each
helper's defaults and response shape match the inline blocks it will replace;
confirm module-specific values arrive as parameters; confirm tests cover zero,
negative, oversized and unknown inputs.

## Posture findings

| Posture item | Verdict | Basis |
|--------------|---------|-------|
| No call site changed | PASS | `git status`: five new files only; `backend/modules/**` untouched (doNotTouch intact) |
| Defaults / response shape match the inline blocks | PASS | Captured live 400 body (`400-response-capture.md`): `{"code":400,"data":null,"message":"param.invalid"}` = what `ParseUintParam` writes; pagination defaults 1/10 verified across role/post/user/audit/session/login normalizers; sort = TrimSpace + lookup + fallback, direction left local |
| Module-specific values arrive as parameters | PASS | Pagination cap and sort whitelist map are parameters; no whitelist, cap or i18n key baked in |
| Tests cover zero / negative / oversized / unknown inputs | PASS | ParseUintParam: zero-passes, negative, float, overflow, garbage, missing; NormalizePagination: zero, negative, oversized-capped, cap-below-default; NormalizeSort: unknown symbol, blank, nil map; NotFoundIfMissing: wrapped, other-error identity, nil |

## Honest deviations (recorded, none forced)

1. **Placement split**: `NotFoundIfMissing` lives in `backend/pkg/database`,
   not pkg/common — the packet's own implementation note prescribes exactly
   this when pkg/common must stay gorm-free (it is). `expectedFiles.create`
   named only the two pkg/common files; the two database files are the
   anticipated additional creates.
2. **`qualityProfile` flip**: packet said none; corrected to `auth-security`
   in the manifest before CI (same correction pattern as W5/W8/S4-alias —
   CI rejects none for non-trivial changes).
3. **Offset return**: `NormalizePagination` adds an `offset` result the inline
   normalizers don't compute; it is derived data (`(page-1)*pageSize`) and
   call sites may ignore it. Documented in knownGaps.
4. **Zero passes ParseUintParam**: deliberate — rejecting zero would change
   behaviour for the majority of migration sites; the tenant `id == 0` check
   stays local.

## What this wave refuses to do

- No migration of any call site — that is the four following S2 waves.
- No unification of page-size caps, sort whitelists, or sort-direction
  semantics; no new i18n key; no envelope/status change.
- No merge of the `pkg/common` / `pkg/common/http` message-key duplicates
  (RC-019) — later wave with its own call-site audit.
- No test deleted or weakened; nothing existing modified.

## Verdict

Add-only wave, reviewable on its own, bisectable: any later regression
attributes to the migration that consumes a helper, not to the helper.
Ready to merge.

## Machine Readable

```json
{
  "taskId": "2026-10-27-s2-shared-handler-helpers",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-s2-shared-handler-helpers/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-s2-shared-handler-helpers/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-s2-shared-handler-helpers/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md",
      "docs/reviews/REDUNDANT_CODE_CANDIDATES.md",
      "docs/reviews/CODE_SIMPLIFICATION_PLAN.md"
    ]
  }
}
```
