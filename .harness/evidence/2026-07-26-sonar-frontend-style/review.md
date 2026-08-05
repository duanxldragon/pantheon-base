# Review — 2026-07-26-sonar-frontend-style

## Reviewer stance (coordinating session, independent of the implementing agents)

1. **The one live gate failure was caught and root-caused, not patched over.**
   The first `npm run build` failed shell-visual-contract with four findings.
   Root cause: `check-shell-visual-contract.mjs` anchors on the FIRST
   exact-selector `.filter-panel` and `.app-table .arco-table-container`
   blocks and requires specific declarations there, while the later
   same-selector twins produce the actual computed styles. The S4666 dedup
   had (cascade-correctly) removed the anchor blocks as shadowed
   declarations. Resolution: restore main's exact structure for both
   selectors — zero visual delta, gate green, two S4666 findings recorded as
   maintainer-decision residual. This is contract-over-smell, consistent
   with the freeze policy.
2. **Textual-parser safety**: i18n keys, route paths, permission strings and
   registry keys were verified unmoved — menu-contract, i18n-hardcode,
   i18n-generated-scope, ui-contract and search-toolbar checkers all pass,
   and those checkers are exactly the parsers that would break.
3. **Behavior surface**: no exports renamed, no displayed text changed, no
   component restructuring. S7786 TypeError swap verified to apply only to
   the type-check branch (useSettingCatalog.ts:140), not the value-format
   branch.
4. **Coverage of the frozen list** is enforced by outcome, not by trust:
   the authoritative closure count is the post-merge SonarCloud OPEN
   re-query; expected residual = 24 typescript:S3776 (final batch) + 2
   anchored css:S4666.

## Residual risk

- Smoke Sanity on the PR exercises the touched list pages end-to-end before
  merge.
- The two retained S4666 anchors are documented in the manifest, summary,
  and PR body as a maintainer decision item (re-anchor the checker vs accept
  the duplicates).

## Machine Readable

```json
{
  "taskId": "2026-07-26-sonar-frontend-style",
  "verdict": "approved with documented P2 follow-up",
  "findings": [],
  "residualRisks": ["Two retained S4666 anchors and hosted Smoke Sanity were documented follow-ups"],
  "linkage": {
    "taskManifest": ".harness/tasks/2026-07-26-sonar-frontend-style/manifest.json",
    "evidence": ".harness/evidence/2026-07-26-sonar-frontend-style/commands.json",
    "reviewFile": ".harness/evidence/2026-07-26-sonar-frontend-style/review.md",
    "changeRef": "none",
    "planRefs": []
  }
}
```
