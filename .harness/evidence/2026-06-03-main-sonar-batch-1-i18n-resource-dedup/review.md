# Review: 2026-06-03-main-sonar-batch-1-i18n-resource-dedup

## Machine Readable

```json
{
  "taskId": "2026-06-03-main-sonar-batch-1-i18n-resource-dedup",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": [
      "locale resources -> locale-utils loader -> i18n audit scripts"
    ],
    "checks": [
      "call-depth",
      "cycle",
      "hub"
    ],
    "findings": [],
    "notes": "scaffolded from task packet Structural Scope; replace after graph review"
  },
  "linkage": {
    "evidence": ".harness/evidence/2026-06-03-main-sonar-batch-1-i18n-resource-dedup/commands.json",
    "reviewFile": ".harness/evidence/2026-06-03-main-sonar-batch-1-i18n-resource-dedup/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/superpowers/plans/2026-06-03-main-sonar-priority-batches.md"
    ],
    "taskManifest": ".harness/tasks/2026-06-03-main-sonar-batch-1-i18n-resource-dedup/manifest.json"
  }
}
```

## Findings

1. `frontend/src/i18n/resources/en-US.ts`, `fr-FR.ts`, `ja-JP.ts`, `ko-KR.ts`
   Four non-base locale files no longer mirror full object-literal key maps. They now rebuild complete resources from the `zh-CN` key order via `locale-utils.js`, which removes `8824` repeated literal key declarations without changing the runtime shape returned to `i18next`.

2. `frontend/scripts/check-i18n-generated-scope.mjs`
   The generated-scope checker previously assumed imported resource helpers did not exist. This batch exported the loader, taught it to resolve `.ts` and `.js` imports, and added a regression test so future resource helpers do not silently break the governance scripts.

3. `frontend/scripts/audit-i18n-locales.mjs`, `frontend/scripts/check-menu-contract.mjs`, `frontend/scripts/export-i18n-builtin-snapshot.mjs`
   These loaders now share the same cross-extension import assumption. That keeps repo-local audits aligned with the runtime module graph instead of requiring locale files to stay as giant self-contained objects forever.

4. `docs/designs/I18N_MODULE_DESIGN.md`
   The ownership model is now explicit: `zh-CN.ts` is the only complete builtin key source, non-base locale resources carry derived value arrays, `overrides/*.ts` stays manual, and `generated/*.ts` stays schema-generated.

## Assumptions

- this batch is structural debt removal only; it does not claim translated content quality improved for `ja-JP` / `ko-KR` / `fr-FR`
- local runtime governance evidence depends on a reachable backend at `PANTHEON_API_BASE_URL` and is currently blocked by the default `127.0.0.1:8080` endpoint being offline

## Status

- Locale structure refactor: complete
- Repo-local script compatibility: complete
- Frontend verification: complete
- Parent baseline verification: complete
- Runtime audit evidence: blocked by missing local backend listener
