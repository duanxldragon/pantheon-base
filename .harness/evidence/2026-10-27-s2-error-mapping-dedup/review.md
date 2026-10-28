# Review — S2-error-mapping-dedup

Reviewer posture: equivalence-focused. Every changed call site was checked for observable drift (error code, HTTP status, i18n key, envelope shape); module-specific branches were checked for why-comments; context keys were compared against the middleware that writes them, not assumed.

## Posture

| Packet reviewer item | Result |
|---|---|
| No observable error code, status or i18n key changed | PASS — all 20 before-declarations carried the identical value pair (capture-before/declarations.txt); TranslateNotFound passes caller-supplied constructors through, so every site keeps its own class (404/400/500 tables in response-diff.md §2); context helper adapters preserve reachable-input semantics (middleware key audit in response-diff.md §3) |
| Surviving module-specific branches carry a why comment | PASS — roleErrorResponse (F14 404 branch), menuErrorCode/menuErrorMessage/isMenuValidationError (validation whitelist) already document why they exist; packet's own fallback prescribes keeping them |
| Context keys were compared, not assumed | PASS — token_middleware.go:194/196/204 sets `userId` (uint64), `roleKeys` ([]string), `roleKey` (string); menu's string branch differed only by not trimming (unreachable for seeded keys); user's ok-flag semantics preserved via `!= 0` (real ids nonzero); 3 existing pure tests pass unchanged |
| common package has one implementation of each helper | PARTIAL — GetUserID single (http copy deleted, 0 callers); GetRoleKeys single; ResolveErrorMessageKey/IsI18nMessageKey/ErrMessage remain duplicated with pkg/common/http because re_export.go re-exports the http envelope → import cycle (verified by build failure); collapse condition documented in code NOTE + evidence; recorded as known gap, not silently dropped |

## Program-rule checks

- One pattern per commit: commit 1 values, commit 2 not-found translation, commit 3 context helpers — bisectable.
- No routes, permission codes, menus, i18n keys, error codes, schema or migration touched: diff is services/handlers/pkg only; `doNotTouch` (oidc, migrations, router, frontend) untouched.
- No test deleted or weakened: role_handler_notfound_test.go retargeted `errRequestFailed` → `common.MessageRequestFailed` (same asserted value); http response tests retargeted to the surviving implementation only where the private under test still exists — all 4 original assertions carried over 1:1; TranslateNotFound tests extend NotFoundIfMissing's four cases with the same assertions.
- Helper did not absorb module-specific values: TranslateNotFound takes the replacement as a parameter (no sentinel choice inside the helper); Message constants are the two values every module already shared.
- Measured diff stat recorded (31 files, +208/−290) instead of audit estimate.

## Human gates

None for this packet. Three non-equivalent-shaped site families were kept local per the packet's own rule and reported in the known gaps (http i18n privates, role/menu wrappers, the non-translation not-found sites).

## Verdict

Approved. Three commits, each independently revertable; behavior preserved by construction (caller-supplied replacement + identical constants + middleware-key audit) and by tests (full DB-backed suite green at every commit checkpoint and on the final tree).

## Machine Readable

```json
{
  "taskId": "2026-10-27-s2-error-mapping-dedup",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-s2-error-mapping-dedup/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-s2-error-mapping-dedup/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-s2-error-mapping-dedup/review.md",
    "changeRef": "backend/pkg/database/notfound.go",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-codebase-simplification-program.task.md",
      "docs/reviews/CODE_SIMPLIFICATION_PLAN.md"
    ]
  },
  "qualityProfile": "auth-security",
  "checks": {
    "equivalence": "pass",
    "whyComments": "pass",
    "contextKeysCompared": "pass",
    "singleImplementation": "partial",
    "noForbiddenTouch": "pass",
    "testsNotWeakened": "pass"
  },
  "knownGaps": [
    "pkg/common/http i18n-key privates stay (re_export import cycle); collapse condition documented",
    "role/menu mapping wrappers kept with existing why-comments per packet fallback",
    "non-translation gorm.ErrRecordNotFound sites intentionally kept (37 errors.Is-shaped remain of 55 on base; control-flow / domain sentinel / handler mapping)"
  ],
  "commits": ["43856299", "bdbe5c73", "77cea558"]
}
```
