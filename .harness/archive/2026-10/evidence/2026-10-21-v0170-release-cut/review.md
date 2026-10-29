# Review — v0.17.0 release cut

## Boundary

The release records work already merged to `main`. No product source file is edited by this task:
`backend/**` and `frontend/**` are untouched, and no existing gate, workflow or release artifact is
modified.

## What was reviewed

- **Version level.** Minor, per `docs/VERSION_MANAGEMENT_GUIDE.md` §2.3 and the plan already recorded
  in `.harness/STATUS.md` (the tenant remediation ships with v0.17.0). The change set contains
  behaviour changes and additive migrations, not only fixes.
- **Release scope.** 13 commits, all enumerated in the summary and in the release notes. Nothing
  merged after v0.16.1 is left unaccounted for.
- **Consumer contract.** `sharedPaths` is hardcoded in the manifest builder and resolves to the same
  52 entries; all six assembly anchors were checked against the release tree by exact string match
  and each appears exactly once.
- **Migration safety.** `000025`–`000028` are additive, each with a down migration, and none touches
  a consumer-owned table.
- **Release notes honesty.** The notes state the two operating limits explicitly: shadowing tenant
  role keys are not renamed automatically, and the browser-level tenant smoke assertion is confirmed
  by CI rather than by a local run.

## Risks

- The release publishes files that the consumer will compile, so the consumer rebuild is the
  authoritative consumption test; it follows as a separate consumer change.
- The repository cannot publish from CI, so the release depends on a maintainer credential. That is
  a recorded authorisation gap, not a code defect.

## Verdict

Accept for publication subject to the release commit's required checks and the asset read-back
recorded in `commands.json`.


## Machine Readable

```json
{
  "taskId": "2026-10-21-v0170-release-cut",
  "verdict": "approved",
  "verdictRationale": "Accept for publication subject to the release commit required checks and the asset read-back recorded in commands.json.",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-21-v0170-release-cut/manifest.json",
    "evidence": ".harness/evidence/2026-10-21-v0170-release-cut/commands.json",
    "reviewFile": ".harness/evidence/2026-10-21-v0170-release-cut/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-21-v0170-release-cut.task.md"
    ]
  }
}
```

> This block was backfilled on 2026-10-26 during the governance-schema repair round. It restates the verdict already written above in machine-readable form and links the artifacts that existed for this task; no conclusion, finding or verification claim was added, removed or reworded. The prose remains authoritative.
