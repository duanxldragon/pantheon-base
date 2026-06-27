# Review Summary: 2026-06-27-repository-layout-tidy

## Linkage

- Task Manifest: `.harness/tasks/2026-06-27-repository-layout-tidy/manifest.json`
- Evidence: `.harness/evidence/2026-06-27-repository-layout-tidy/commands.json`
- Verification Summary: `.harness/evidence/2026-06-27-repository-layout-tidy/summary.md`
- OpenSpec Change: `none`
- Review Mode: `self-review`
- Reviewer Roles: `mechanical`, `governance`

## Machine Readable

```json
{
  "taskId": "2026-06-27-repository-layout-tidy",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "repo root docs -> docs/designs index -> harness adoption evidence"
    ],
    "checks": ["hub", "call-depth"],
    "findings": [],
    "notes": "Repository-layout documentation only; no product runtime code moved."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-06-27-repository-layout-tidy/manifest.json",
    "evidence": ".harness/evidence/2026-06-27-repository-layout-tidy/commands.json",
    "reviewFile": ".harness/evidence/2026-06-27-repository-layout-tidy/review.md",
    "changeRef": "none",
    "planRefs": []
  }
}
```

## Verdict

approved

## Findings

No blocking findings. The change clarifies root ownership and file placement rules while preserving stable automation paths.

## Residual Risk

- Local ignored artifacts remain on disk; this pass intentionally avoids deleting user-local runtime data.
- A future physical consolidation of `config/`, `database/`, `releases/`, or `schema/generated/` must update scripts, CI, docs, and tests together.

## Verification Checked

- `npm run check:docs-frontmatter`
- `npm run check:harness-docs`
- `npm run check:harness-inventory`
- `npm run check:harness-method`
- `npm run check:harness-sync`
- `npm run check:harness-adoption`
- `node scripts/harness/check-task-packet.mjs --root . docs/harness/tasks/2026-06-27-repository-layout-tidy.task.md`
- `node scripts/harness/check-evidence.mjs --root . --strict .harness/evidence/2026-06-27-repository-layout-tidy/commands.json`
- `node scripts/harness/check-review.mjs --root . --strict .harness/evidence/2026-06-27-repository-layout-tidy/review.md`
- `git diff --check`
