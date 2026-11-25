# Review Summary: 2026-11-24-business-route-static-guard

## Machine Readable

```json
{
  "taskId": "2026-11-24-business-route-static-guard",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": [
      "business middleware c.FullPath() -> businessauth.Action.RouteTemplate -> ReadBusinessPolicy dedicated enforcer -> businessRouteCovers -> role binding grant/deny"
    ],
    "checks": [
      "cycle",
      "hub",
      "call-depth",
      "sensitive-flow"
    ],
    "findings": [],
    "notes": "No new package cycle: permissionroutes stays dependency-free; database imports it, and neither IAM package gains a reverse edge. Enforcement remains a single Enforce call per binding. Coverage and sync call the same predicate without widening their roles."
  },
  "linkage": {
    "taskPacket": "docs/harness/tasks/2026-11-24-business-route-static-guard.task.md",
    "taskManifest": ".harness/tasks/2026-11-24-business-route-static-guard/manifest.json",
    "evidence": ".harness/evidence/2026-11-24-business-route-static-guard/commands.json",
    "reviewFile": ".harness/evidence/2026-11-24-business-route-static-guard/review.md",
    "changeRef": "none",
    "planRefs": [
      ".harness/tasks/2026-11-24-business-route-static-guard/plan.md"
    ]
  }
}
```

## Findings

- P2: independent review gap. Codex is unavailable in this session and the change touches
  authorization semantics; the primary agent self-reviewed under the single-executor allowance.
  Residual risk is bounded by the detail/export denial tests, wildcard regression and the unchanged
  system enforcer.

## Structural Review

- Cycle: none introduced; `permissionroutes` remains a leaf package.
- Hub: no handler or service becomes a new hub; `Covers` is a pure function.
- Call depth: unchanged in the request path; the dedicated model adds no hop.
- Sensitive flow: the raw request path no longer decides business grants; only the Gin-matched
  route template does, and the template/policy comparison is structural.

## Acceptance Conditions

- CI backend suites must pass with the required MySQL service.
- A foundation release containing this guard is required before Ops registers detail routes.
