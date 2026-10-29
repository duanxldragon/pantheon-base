# Review — `2026-10-29-v0181-restore-request-guard`

Reviewed the branch `fix/restore-forbidden-request-guard` against `main` @ `b4bb2392`. The question is
whether the restore is the right landing side and whether the package is honest about what it did and
did not verify.

## Reviewer posture, item by item

| Posture item | Reading |
| --- | --- |
| The defect is real, not inferred | The consumer staging tree against v0.18.0 fails `npm run build` with `TS2614` at `DeployTaskDetail.tsx(29,10)`; restoring the export in that tree builds clean (`✓ built in 751ms`). |
| The fix is minimal | `git diff frontend/src/api/request.ts` shows two added lines and no deletions. `isForbiddenRequestError` was the only member of the four-predicate family missing, and a workspace import scan shows it is the only `api/request` symbol `pantheon-ops` imports that base did not export. |
| The landing side is base | The consumer tree is rebuilt from a locked base snapshot and `.foundation/allowed-drift.json` refuses generic drift, so a consumer-side patch would be overwritten by the next `rebuild:from-base`. |
| The version level matches the guide | `docs/VERSION_MANAGEMENT_GUIDE.md` §2.3 lists bug fixes as patch. The diff changes no API, schema, route, permission, menu, i18n or backend file, so 0.18.1 on `release/0.18` is the honest level. |
| The governance record matches the miss | FR-021 states the search covered this repository only, and §5.4 requires a workspace-wide consumer reference search plus a consumer build as the release acceptance reading. Neither changes a gate. |
| Verification claims are traceable | The base readings (lint, type-check, build) were run at this diff; the failure and success readings come from the consumer staging tree and are recorded with their commands in `commands.json`. |
| Publication is not claimed before it happens | The manifest stays `in-progress`, the packet's last three boxes stay unchecked, and the release/consumer steps are listed as post-merge. |
| Nothing weakened to make this green | No checker, workflow or gate file is edited; no exclusion or `NOSONAR` is added. |

## Findings

- **P3, publication depends on a human-held credential.** The tag and the GitHub release are created
  by the maintainer's `gh` session because `default_workflow_permissions` is read; the tag and
  release are immutable once created.
- **P3, the consumer build is the acceptance reading, not this diff.** The restore is proven by the
  consumer compiling against the release, which happens after publication; until then the package
  records "restore makes the staging tree build" rather than "v0.18.1 verified".
- **P3, the network is flaky on this workstation.** `github.com:443` times out intermittently while
  `api.github.com` answers; git operations are retried rather than reworked.
- **P3, `pantheon-ops` is not committed here.** Its lock bump and builds are run and recorded, but the
  consumer repository's diff is left for that repository's own review.

## Machine Readable

```json
{
  "taskId": "2026-10-29-v0181-restore-request-guard",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "frontend/src/api/request.ts",
      "VERSION",
      "CHANGELOG.md",
      "docs/release-notes/RELEASE_NOTES_v0.18.1.md",
      "docs/release-notes/README.md",
      "docs/release-notes/README.en.md",
      ".harness/STATUS.md",
      "docs/harness/failure-registry.md",
      "docs/harness/AI_QUALITY_GOVERNANCE.md",
      "docs/harness/tasks/2026-10-29-v0181-restore-request-guard.task.md",
      ".harness/tasks/2026-10-29-v0181-restore-request-guard/manifest.json",
      ".harness/evidence/2026-10-29-v0181-restore-request-guard/"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [
      "P3 publication credential: the tag and GitHub release are created by the maintainer gh session because default_workflow_permissions is read.",
      "P3 acceptance reading: the restore is proven when pantheon-ops builds against v0.18.1 after publication, not by the base build alone.",
      "P3 network: github.com:443 times out intermittently on this workstation while api.github.com answers; git operations were retried.",
      "P3 consumer commit: pantheon-ops lock advancement and rebuild are run and recorded but left for that repository's review."
    ],
    "notes": "Patch package: restore the isForbiddenRequestError export removed by S1 wave #439, bump VERSION to 0.18.1, add a CHANGELOG entry, docs/release-notes/RELEASE_NOTES_v0.18.1.md with both indexes moved, STATUS sections, FR-021 plus section 5.4, and the task packet, manifest and evidence. No backend, migration, workflow or gate file is touched. The defect was found by rebuilding pantheon-ops against v0.18.0: TS2614 at DeployTaskDetail.tsx:29, cleared by the two-line restore."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-29-v0181-restore-request-guard/manifest.json",
    "evidence": ".harness/evidence/2026-10-29-v0181-restore-request-guard/commands.json",
    "reviewFile": ".harness/evidence/2026-10-29-v0181-restore-request-guard/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/VERSION_MANAGEMENT_GUIDE.md",
      "docs/designs/FOUNDATION_RELEASE_MODEL.md",
      "docs/harness/AI_QUALITY_GOVERNANCE.md"
    ]
  }
}
```
