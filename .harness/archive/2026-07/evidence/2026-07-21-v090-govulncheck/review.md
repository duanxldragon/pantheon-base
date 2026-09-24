# Review Artifact — govulncheck working-directory fix (#190)

- **Scope**: `.github/workflows/security.yml` only.
- **Change type**: CI configuration fix (working-directory + output path).
- **Logic change**: none in application code.
- **Contracts / permissions / DB / i18n / menu**: unchanged.
- **Reviewer notes**: This restores the govulncheck Security Gate to a working state
  so future vulnerability scans actually run. Trivial, low-risk, safe to merge.
- **Follow-up**: N/A.

## Machine Readable

```json
{
  "taskId": "2026-07-21-v090-govulncheck",
  "verdict": "approved",
  "findings": [],
  "linkage": {
    "taskManifest": ".harness/tasks/2026-07-21-v090-govulncheck/manifest.json",
    "evidence": ".harness/evidence/2026-07-21-v090-govulncheck/commands.json",
    "reviewFile": ".harness/evidence/2026-07-21-v090-govulncheck/review.md",
    "changeRef": "none",
    "planRefs": []
  }
}
```
