# Review Artifact

## Review Scope

Reviewed the Core Smoke follow-up against the current IAM frontend and backend contracts.

## Findings

- RESOLVED: menu smoke used obsolete `menuName`, `menuType`, and `visible` fields; payloads now match `MenuCreateReq`.
- RESOLVED: user smoke used obsolete `realName`; create and edit flows now use `nickname` and include `roleIds`.
- RESOLVED: menu cleanup inspected a nonexistent `menuName` response property; it now matches `titleKey`.

## Verdict

Local static gates are clear. Runtime approval remains intentionally deferred to hosted Core Smoke and required GitHub checks. No `solo-override` bypass is permitted.

## Machine Readable

```json
{
  "taskId": "2026-09-07-core-smoke-followup",
  "verdict": "blocked",
  "verdictRationale": "Verdict defers approval: 'Local static gates are clear. Runtime approval remains intentionally deferred to hosted Core Smoke and required GitHub checks.'",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-09-07-core-smoke-followup/manifest.json",
    "evidence": ".harness/evidence/2026-09-07-core-smoke-followup/commands.json",
    "reviewFile": ".harness/evidence/2026-09-07-core-smoke-followup/review.md",
    "changeRef": "none",
    "planRefs": [
      ".harness/tasks/2026-09-07-core-smoke-followup/manifest.json"
    ]
  }
}
```

> This block was backfilled on 2026-11-04 during the archive-coverage repair. It restates the verdict already written above in machine-readable form and links the artifacts that existed for this task; no conclusion, finding or verification claim was added, removed or reworded. The prose remains authoritative.
