# Review — upgrade-runbook (G03)

## Cross-check against evidence

- Every command in the rewritten section maps to a shipped artifact:
  - `tenant-migration-execute.sh` verified to run `go run ./cmd/tenantmigration up`
    (steps [4/6]) and to keep compat mode after execution.
  - `tenant-migration-verify.sh` / `tenant-health-check.sh` unchanged, still referenced.
  - `COMPAT_TO_MULTI_UPGRADE.md` Steps 1–2 cover default tenant + user migration
    with inline SQL — the release notes now defer there instead of inventing scripts.
- SQL now lives in ```sql blocks; commands in ```bash blocks — no mixed languages.

## Runtime evidence

- Disposable MySQL rehearsal completed on 	enant_rehearsal_pre: migration state
  12/false was backed up, 	enantmigration up reached 21/false, and
  mysql --binary-mode=1 restored the backup to 12/false with 1 user and 33
  tables. Production migration remains out of scope.

## Remaining release gaps

- Hosted CI/Sonar and authenticated browser evidence belong to the release
  qualification task and are not waived by this runbook rehearsal.

## Machine Readable
```json
{
  "taskId": "2026-10-07-upgrade-runbook",
  "verdict": "approved",
  "reviewer": {
    "independence": "self-review",
    "note": "No independent reviewer artifact was available in this workstation session; residual runtime and hosted gaps remain explicit.",
    "role": "platform-coordinator"
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-07-upgrade-runbook/manifest.json",
    "evidence": ".harness/evidence/2026-10-07-upgrade-runbook/commands.json",
    "reviewFile": ".harness/evidence/2026-10-07-upgrade-runbook/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-07-release-readiness-remediation.task.md",
      "docs/reviews/ENTERPRISE_RELEASE_READINESS_REVIEW_2026-10-07.md"
    ]
  }
}
```
