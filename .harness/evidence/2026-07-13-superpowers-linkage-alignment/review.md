# Review: superpowers legacy linkage alignment in pantheon-base

## Machine Readable

```json
{
  "taskId": "2026-07-13-superpowers-linkage-alignment",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": ["task linkage metadata -> task-packet checker"],
    "checks": [],
    "findings": [],
    "notes": "The checker prefers current linkage while retaining historical compatibility."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-07-13-superpowers-linkage-alignment/manifest.json",
    "evidence": ".harness/evidence/2026-07-13-superpowers-linkage-alignment/commands.json",
    "reviewFile": ".harness/evidence/2026-07-13-superpowers-linkage-alignment/review.md",
    "changeRef": "none",
    "planRefs": []
  }
}
```

## Task ID

`2026-07-13-superpowers-linkage-alignment`

## Verdict

approved

## Checks

- 3 active July task packets normalized to `Plan References: none`.
- `scripts/harness/check-task-packet.mjs` now prefers `Plan References` while still accepting legacy `Superpowers Plan`.
- Legacy linkage registry created for remaining 19 docs.

## Findings

- none

## Notes

Historical plan paths in `docs/superpowers/` are preserved; this packet only normalizes metadata wording.
