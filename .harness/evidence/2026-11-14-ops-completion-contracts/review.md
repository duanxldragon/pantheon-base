# 2026-11-14-ops-completion-contracts — review

Author: coordinator verification record (this is NOT the separate independent
review; that gate is still open and must be routed before official release).

## Design assessment

The change satisfies the task contract:

- Optional capability, no reactor change to session authorization. Logout and cold
  restart do not revoke a durable job; no stored token is introduced.
- `AuthorizeJob` re-reads owner status/enabled/tenant-0, bindings, and a fresh
  nonnil `DataScope` from the authoritative IAM reads at execution time. Invalid
  mode, disabled/deleted/tenant-local owner, revoked role/key/policy, unavailable
  stores, cancellation and nil data scope all deny opaquely (`ErrDenied`).
- Only compat mode and resource tenant 0 are supported; positive numeric resource
  owner/target IDs only. Unregistered or ambiguous actions are rejected.
- Business code depends on a public read port only; it does not import system
  repositories. Businesses still revalidate current source/targets against
  `DataScope` before I/O.

## Files reviewed

- `backend/pkg/contracts/businessauth/job_authorization.go`
- `backend/modules/auth/login/business_job_authorization.go`
- `backend/pkg/contracts/business_tenant_groups.go` (optional startup accessor)
- regression tests in both packages

## Gate status

- [x] Failed-before witness recorded
- [x] Green real-MySQL regression evidence
- [x] Vet clean, changed-package tests pass
- [ ] Separate independent review (open — routed by coordinator before release)
- [ ] Official publication and downstream Ops consumption (open — human/maintainer gate)

## Machine Readable

```json
{
  "taskId": "2026-11-14-ops-completion-contracts",
  "reviewer": "coordinator verification record (NOT the independent review; that gate stays open)",
  "verdict": "changes requested",
  "decision": "changes requested",
  "scope": "auth-owned durable job authorization port: public read contract, live owner/role/policy/data-scope re-read, opaque denial",
  "taskManifest": ".harness/tasks/2026-11-14-ops-completion-contracts/manifest.json",
  "evidenceDir": ".harness/evidence/2026-11-14-ops-completion-contracts",
  "summaryFile": ".harness/evidence/2026-11-14-ops-completion-contracts/summary.md",
  "reviewFile": ".harness/evidence/2026-11-14-ops-completion-contracts/review.md",
  "changeRef": "none",
  "findings": [
    {
      "id": "OCC-A1",
      "severity": "P1",
      "status": "accepted-gap",
      "summary": "independent review not yet routed; this file is coordinator evidence only",
      "verification": "n/a"
    },
    {
      "id": "OCC-A2",
      "severity": "P2",
      "status": "accepted-gap",
      "summary": "official publication and downstream Ops consumption not performed",
      "verification": "n/a"
    }
  ],
  "linkage": {
    "taskManifest": ".harness/tasks/2026-11-14-ops-completion-contracts/manifest.json",
    "taskPacket": "docs/harness/tasks/2026-11-14-ops-completion-contracts.task.md",
    "evidence": ".harness/evidence/2026-11-14-ops-completion-contracts/commands.json",
    "reviewFile": ".harness/evidence/2026-11-14-ops-completion-contracts/review.md",
    "changeRef": "none",
    "planRefs": []
  },
  "humanGate": "independent review routing, foundation release and downstream consumption"
}
```
