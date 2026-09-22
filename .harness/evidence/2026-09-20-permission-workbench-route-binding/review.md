# Review — 2026-09-20-permission-workbench-route-binding

## Reviewer disposition

Reviewed as a system/iam (permission-policy profile) change — high-risk scope.
The behavioral surface is intentionally narrow: the binding table is consumed by
the workbench remediation flow only; policy CRUD, the Casbin middleware, and the
remediate action are untouched.

## Checks

| Question | Answer |
|---|---|
| Does it close audit finding D? | Yes — stale entry fixed and the whole table is now under a mechanical drift guard; the "derive from route registry" direction is honored in its minimal viable form with the derivation itself recorded as future work |
| Does the drift guard add real protection? | Yes — a stale entry fails CI; the sentinel test prevents the probe from decaying into a false pass |
| Could the guard false-positive on wildcards? | No — gin routes report `:param` paths matching the binding table notation; verified by the passing guard |
| Is the permission surface widened? | No — remediation still creates the same kind of policies; one entry now points at the route that actually exists |
| Fixtures updated coherently? | Yes — two integration fixtures + two pure-test assertions aligned; full package green DB-backed |
| Adjacent regression? | iam menu/role/user, audit, contracts, middleware all green (-short, DB-backed) |
| Security review notes? | No new trust boundary; no credentials; read-only accessor prevents external mutation of the workbench view |

## Residual risks

- The probe engine is a mirror, not the live engine; full drift-proofing requires
  runtime route-table derivation (task.md records this as the follow-up direction
  and the guard becomes its acceptance check).
- Historical dead policies (if any were created from the stale entry in real
  environments) are not auto-cleaned; path-existence cleanup is a ratchet candidate
  for the next remediation round.

## Closeout

PR #328 merged the reviewed change to `main` as `8c8ff37f`. No blocking finding
remains for this task; the two residual technical-debt items stay recorded as
future work.

## Machine Readable

```json
{
  "taskId": "2026-09-20-permission-workbench-route-binding",
  "verdict": "approved with documented P2 follow-up",
  "findings": [],
  "residualRisks": ["Full route-table derivation and historical dead-policy cleanup remain ratchets"],
  "linkage": {
    "taskManifest": ".harness/tasks/2026-09-20-permission-workbench-route-binding/manifest.json",
    "evidence": ".harness/evidence/2026-09-20-permission-workbench-route-binding/commands.json",
    "reviewFile": ".harness/evidence/2026-09-20-permission-workbench-route-binding/review.md",
    "changeRef": "none",
    "planRefs": []
  }
}
```
