# Review: 2026-08-11-base-security-dependencies

## Findings

- `js-yaml@3.15.0` was a high-severity transitive dependency of `nyc`; pinning `3.15.1` removes GHSA-5p4m-2wfm-xmqj.
- `nanoid@3.3.16` was a high-severity transitive dependency of Vite/PostCSS; pinning `3.3.17` removes its infinite-loop advisory.

## Residual Risk

- No high or critical npm audit findings remain. The release must be cut from the merged `main` commit and consumed by Ops.

## Machine Readable

```json
{
  "taskId": "2026-08-11-base-security-dependencies",
  "verdict": "blocked",
  "verdictRationale": "The findings are closed locally, but the review's own Residual Risk states the release must still be cut from merged main and consumed by Ops, so the round is blocked on that downstream release step rather than approved.",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-08-11-base-security-dependencies/manifest.json",
    "evidence": ".harness/evidence/2026-08-11-base-security-dependencies/commands.json",
    "reviewFile": ".harness/evidence/2026-08-11-base-security-dependencies/review.md",
    "changeRef": "none",
    "planRefs": [
      ".harness/tasks/2026-08-11-base-security-dependencies/manifest.json"
    ]
  }
}
```

> This block was backfilled on 2026-11-04 during the archive-coverage repair. It restates the verdict already written above in machine-readable form and links the artifacts that existed for this task; no conclusion, finding or verification claim was added, removed or reworded. The prose remains authoritative.
