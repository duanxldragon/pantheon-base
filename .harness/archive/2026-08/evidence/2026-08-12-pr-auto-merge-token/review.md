# Review Artifact

## Scope

- Layer: `ci-workflow`.
- Runtime-sensitive: yes, because merge automation changes repository state.
- Product UI impact: none.

## Review Focus

- The write-scoped job passes `github.token` only to the merge step.
- A failed `gh pr merge --auto` command exits non-zero.
- The regression test rejects the previous fail-open workflow shape.

## Residual Gate

- Hosted GitHub Actions must prove the workflow can enable auto-merge on this PR.

## Machine Readable

```json
{
  "taskId": "2026-08-12-pr-auto-merge-token",
  "verdict": "blocked",
  "verdictRationale": "The artifact records review focus points but no approval verdict; its only Residual Gate states that 'Hosted GitHub Actions must prove the workflow can enable auto-merge on this PR', so the round stays blocked on that hosted proof.",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-08-12-pr-auto-merge-token/manifest.json",
    "evidence": ".harness/evidence/2026-08-12-pr-auto-merge-token/commands.json",
    "reviewFile": ".harness/evidence/2026-08-12-pr-auto-merge-token/review.md",
    "changeRef": "none",
    "planRefs": [
      ".harness/tasks/2026-08-12-pr-auto-merge-token/manifest.json"
    ]
  }
}
```

> This block was backfilled on 2026-11-04 during the archive-coverage repair. It restates the verdict already written above in machine-readable form and links the artifacts that existed for this task; no conclusion, finding or verification claim was added, removed or reworded. The prose remains authoritative.
