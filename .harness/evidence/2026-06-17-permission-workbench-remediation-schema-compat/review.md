# Review Summary: 2026-06-17-permission-workbench-remediation-schema-compat

## Machine Readable

```json
{
  "taskId": "2026-06-17-permission-workbench-remediation-schema-compat",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "server startup -> bootstrapExistingCurrentSchema -> permission_workbench_remediation_event -> permission workbench governance summary"
    ],
    "checks": [
      "call-depth",
      "hub"
    ],
    "findings": [],
    "notes": "The review stays scoped to migration bootstrap alignment and permission-workbench remediation tracking. No new cross-layer drift or hub growth was introduced beyond the intended system/iam -> pkg boundary."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-06-17-permission-workbench-remediation-schema-compat/manifest.json",
    "evidence": ".harness/evidence/2026-06-17-permission-workbench-remediation-schema-compat/commands.json",
    "reviewFile": ".harness/evidence/2026-06-17-permission-workbench-remediation-schema-compat/review.md",
    "changeRef": "none",
    "planRefs": []
  }
}
```

## Linkage

- Task Manifest: `.harness/tasks/2026-06-17-permission-workbench-remediation-schema-compat/manifest.json`
- Evidence: `.harness/evidence/2026-06-17-permission-workbench-remediation-schema-compat/commands.json`
- OpenSpec Change: `none`
- Review Mode: `independent-review`
- Reviewer Roles: `architecture`, `mechanical`

## Verdict

approved

## Findings

No P0/P1/P2 findings found.

## Residual Risk

- local startup logs and focused smoke prove the persisted workstation database path, but CI still does not replay the same pre-current bootstrap state
- compat backfill intentionally preserves old columns and infers only minimal new-field semantics for historical rows

## Verification Checked

- `go test ./backend/pkg/database -count=1`
- `go test ./backend/modules/system/iam/permission -count=1`
- `cd frontend && node scripts/run-smoke-suite.mjs --host 127.0.0.1 --port 5173 --cleanup-fixtures all --config playwright.config.ts -- tests/smoke/system/governance/permission-workbench-remediation-real.spec.ts`
- `node scripts/frontmatter-check.mjs`
- `node scripts/check-task-packet-template.mjs`
