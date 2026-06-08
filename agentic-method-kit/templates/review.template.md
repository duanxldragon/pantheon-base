# Review Summary: <task-id>

## Machine Readable

```json
{
  "taskId": "<task-id>",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "entry -> core path -> exit/side effect"
    ],
    "checks": [
      "cycle",
      "hub",
      "call-depth",
      "sensitive-flow"
    ],
    "findings": [],
    "notes": "none"
  },
  "linkage": {
    "taskPacket": "docs/harness/tasks/<task-id>.task.md",
    "evidence": ".harness/evidence/<task-id>/commands.json",
    "reviewFile": ".harness/evidence/<task-id>/review.md",
    "changeRef": "openspec/changes/<name>/",
    "planRefs": [
      "docs/superpowers/plans/<file>.md"
    ]
  }
}
```

## Linkage

- Task Packet: `docs/harness/tasks/<task-id>.task.md`
- Evidence: `.harness/evidence/<task-id>/commands.json`
- OpenSpec Change: `openspec/changes/<name>/` | none

## Verdict

approved | changes requested | blocked | approved with documented P2 follow-up

## Findings

No P0/P1/P2 findings found.

## Structural Notes

- Affected subgraph: `entry -> core path -> exit/side effect`
- Checks: `cycle`, `hub`, `call-depth`, `sensitive-flow`
- Findings: none

## Residual Risk

- none

## Verification Checked

- `command`
