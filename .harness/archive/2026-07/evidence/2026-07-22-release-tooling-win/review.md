# Review Artifact — foundation-release bundle tar fix (Windows)

- **Scope**: `scripts/foundation-release/build-release-bundle.mjs`, `.gitignore`.
- **Change type**: tooling portability fix.
- **Logic change**: only the `tar` subprocess path arguments are converted to POSIX; archive content unchanged.
- **Contracts / permissions / DB / i18n / menu**: unchanged.
- **Reviewer notes**: Minimal, well-scoped fix. Benefits all future Windows releases.
- **Follow-up**: N/A.

## Machine Readable

```json
{
  "taskId": "2026-07-22-release-tooling-win",
  "verdict": "approved",
  "findings": [],
  "linkage": {
    "taskManifest": ".harness/tasks/2026-07-22-release-tooling-win/manifest.json",
    "evidence": ".harness/evidence/2026-07-22-release-tooling-win/commands.json",
    "reviewFile": ".harness/evidence/2026-07-22-release-tooling-win/review.md",
    "changeRef": "none",
    "planRefs": []
  }
}
```
