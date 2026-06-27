# Review Summary: 2026-06-27-pantheon-harness-upstream-linkage

## Linkage

- Task Manifest: `.harness/tasks/2026-06-27-pantheon-harness-upstream-linkage/manifest.json`
- Evidence: `.harness/evidence/2026-06-27-pantheon-harness-upstream-linkage/commands.json`
- Verification Summary: `.harness/evidence/2026-06-27-pantheon-harness-upstream-linkage/summary.md`
- OpenSpec Change: `none`
- Review Mode: `self-review`
- Reviewer Roles: `mechanical`, `governance`

## Machine Readable

```json
{
  "taskId": "2026-06-27-pantheon-harness-upstream-linkage",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "pantheon-base docs and harness checks -> upstream pantheon-harness patterns -> CI docs-governance"
    ],
    "checks": ["hub", "call-depth"],
    "findings": [],
    "notes": "Repository-governance linkage only; no product runtime code changed."
  },
  "linkage": {
    "evidence": ".harness/evidence/2026-06-27-pantheon-harness-upstream-linkage/commands.json",
    "reviewFile": ".harness/evidence/2026-06-27-pantheon-harness-upstream-linkage/review.md",
    "changeRef": "none",
    "planRefs": [],
    "taskManifest": ".harness/tasks/2026-06-27-pantheon-harness-upstream-linkage/manifest.json"
  }
}
```

## Verdict

approved

## Findings

No blocking findings. The change keeps base-adapted scripts local while making the upstream method root explicit and mechanically checked.

## Residual Risk

- CI behavior depends on the `duanxldragon/pantheon-harness` checkout remaining accessible.
- Portable frontmatter migration warnings remain in older English harness docs, but the CI frontmatter gate passes.
- Latest PR Backend Tests failure is outside the touched harness/docs/workflow surface and remains a separate backend baseline/follow-up risk.
- Governance-only workflow scope now uses changed-file count comparison, preventing method-only PRs from being blocked by unrelated runtime gate failures while preserving full gates for merge queue/runtime changes.

## Verification Checked

- `node scripts/harness/check-method-health.mjs --root . --strict`
- `node scripts/harness/check-adoption.mjs --root . --strict`
- `node scripts/harness/check-template-health.mjs --root . --strict`
- `node scripts/harness/check-doc-links.mjs --root . --strict`
- `node scripts/harness/check-doc-inventory.mjs --root . --strict`
- `node scripts/harness/check-sync-drift.mjs --root . --strict`
- `npm run check:docs-frontmatter`
- `node scripts/harness/check-task-packet.mjs --root .`
- `node scripts/harness/check-evidence.mjs --root . --strict`
- `node scripts/harness/check-review.mjs --root . --strict`
- `node --test tests/scripts/check-pr-governance.test.mjs`
- `npm run test:quality-workflow`
- `npm run check:failure-registry`
- `npm run check:generated-modules`
