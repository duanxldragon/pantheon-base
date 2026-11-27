# Independent review

The independent code and contract reviewers approved the authorization behavior.
They checked both mode and tenant pairing, owner membership, tenant-local role
and policy lookup, and current DataScope. The code review passed `gofmt`,
`gopls check` and `git diff --check` for the implementation.

The code reviewer found a missing task link target. The task packet is included
in this change. The contract reviewer suggested clarifying where DataScope comes
from. The comment now identifies the resource tenant's granting roles. The
reviewer independently confirmed the RED and GREEN receipts against their
local event files.

Ops T14 owns the dispatch and worker checks, including registering file distribution
permissions before the scheduler can scan due work and revalidating current source
and targets before provider I/O.

## Machine Readable

```json
{
  "taskId": "2026-11-27-tenant-business-job-authorization",
  "reviewer": "Independent code reviewer and independent contract reviewer",
  "verdict": "approved",
  "decision": "approved",
  "scope": "Auth reader, current tenant state, role and policy lookup, contract and targeted runtime evidence",
  "taskManifest": ".harness/tasks/2026-11-27-tenant-business-job-authorization/manifest.json",
  "evidenceDir": ".harness/evidence/2026-11-27-tenant-business-job-authorization/",
  "summaryFile": ".harness/evidence/2026-11-27-tenant-business-job-authorization/summary.md",
  "reviewFile": ".harness/evidence/2026-11-27-tenant-business-job-authorization/review.md",
  "changeRef": "none",
  "planRefs": [],
  "findings": [
    {"id": "R1", "severity": "P2", "status": "fixed", "summary": "Link to the task packet in the same change."},
    {"id": "R2", "severity": "P2", "status": "fixed", "summary": "Clarify that DataScope comes from granting roles in the resource tenant."}
  ],
  "linkage": {
    "taskManifest": ".harness/tasks/2026-11-27-tenant-business-job-authorization/manifest.json",
    "evidence": ".harness/evidence/2026-11-27-tenant-business-job-authorization/commands.json",
    "evidenceDir": ".harness/evidence/2026-11-27-tenant-business-job-authorization/",
    "summaryFile": ".harness/evidence/2026-11-27-tenant-business-job-authorization/summary.md",
    "reviewFile": ".harness/evidence/2026-11-27-tenant-business-job-authorization/review.md",
    "changeRef": "none",
    "planRefs": []
  }
}
```
