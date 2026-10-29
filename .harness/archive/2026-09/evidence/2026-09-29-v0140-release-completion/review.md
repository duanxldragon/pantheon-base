# v0.14.0 Release Completion - Review

## Review Metadata

- Reviewer: Buffy (Codebuff agent)
- Review Date: 2026-09-29
- Task ID: 2026-09-29-v0140-release-completion
- Review Type: release-completion governance and dependency review

## Scope Review

### Dependency Fix (backend/go.mod)

PASS - The added require entries (`stretchr/testify v1.11.1`, `gorm.io/driver/sqlite v1.6.0` plus transitive indirects) are exactly what `modules/system/iam/tenant/tenant_service_test.go` imports. `go mod tidy` produced no further go.sum churn, so the commit is minimal and complete.

### Manifest Status Sync

PASS - The base-side copy of the ops SSRF integration manifest said `in-progress` while the ops repository recorded the task as `done` on the same date with acceptance criteria checked. Syncing the status is metadata hygiene, not a behavior change.

### Release Identity

PASS with rationale - The remote has no `pantheon-base-v0.14.0` tag (or Release), so unifying on v0.14.0 keeps the README's existing release reference truthful and avoids a confusing local-only v0.14.1. Housekeeping-only changes (deps fix, manifest sync) do not warrant a separate patch version; their notes are folded into the v0.14.0 GitHub Release body.

### Boundary Compliance

PASS - No product runtime code touched; `backend/pkg/**` and `backend/modules/**` are unchanged. Frontend untouched. pantheon-ops untouched (its own task tracking is already closed there).

## Risks

- Low: dependency additions affect test-only imports; vet and test compilation verified locally.
- Hosted gates (Quality/Security/Unit/CI Summary) are the enforced merge gate and remain pending until the PR opens.

## Verdict

Approved for PR submission with the governance-compliant body; publication of the tag and GitHub Release is gated on the hosted required checks.

## 2026-09-30 Reassessment

### Findings

- **Blocker:** The original `completed` task status was inconsistent with its own status note, which said merge and tag publication were pending. The task and manifest have been reopened as `in-progress`.
- **Blocker:** Tenant P1 service scoping remains unimplemented. Current user, role, department, and post models/services do not consume `tenant_id`/tenant context despite migration 000020 adding tenant columns. Resource ownership must be frozen before changing these paths.
- **Blocker:** PR #358 remains blocked. Its PR-event checks passed at the current hosted head, but its push-event Code Quality Gates run failed Docs Governance due to canonical `pantheon-harness` sync drift; tenant smoke failed before test execution because of the invalid setup-node pin.
- **Blocker:** No tenant browser E2E or full smoke evidence is available for this candidate, and the Windows workstation cannot run the SQLite service tests with its current Cygwin cgo toolchain.
- **Blocker:** Release tag/release `v0.14.2` is not published; local user deletions and non-main branches remain untouched.

### Review Boundary

This reassessment is a delivery-state review only. It does not approve tenant runtime code or the resource-scope matrix, and it is not a release approval. The corrected workflow pin has local workflow-test evidence, but its commit is not pushed and hosted reruns are pending.

### Verdict

**Not ready for merge or release.** Resume after the resource-scope matrix is frozen, tenant P1 runtime work is independently reviewed, required tenant browser E2E/full smoke passes, the canonical Harness drift is resolved through its governed path, and GitHub required checks plus release approval are green.

## Machine Readable

```json
{
	"taskId": "2026-09-29-v0140-release-completion",
	"verdict": "blocked",
	"findings": [
		"Tenant ownership matrix is not frozen for role, menu, permission, org, and configuration resources.",
		"Tenant backend P1 model/service scoping and tenant browser E2E/full smoke are incomplete.",
		"PR #358 is blocked; its push-event Docs Governance failed and the local repair commit could not be pushed.",
		"The selected v0.14.2 release has no hosted tag or GitHub Release."
	],
	"residualRisks": [
		"Tenant service tests could not run on this Windows workstation because native cgo is unavailable with the configured Cygwin compiler.",
		"The touched workflow has existing zizmor cache-poisoning findings that require a separate governed review.",
		"Eight user-requested local deletions remain unstaged and were not changed."
	],
	"structuralReview": {
		"affectedSubgraph": [
			"tenant contract and resource scope matrix",
			"system IAM/org/config tenant models and services",
			"tenant browser smoke workflow and fixtures",
			"release task, evidence, PR, and tag"
		],
		"checks": ["sensitive-flow"],
		"findings": [
			"The current migration adds tenant_id to legacy system tables whose Go models/services do not consistently consume the field or tenant context."
		],
		"notes": "No runtime code was changed in this assessment. User identity is global with memberships by maintainer decision; remaining per-resource classification must be frozen before implementation."
	},
	"linkage": {
		"taskManifest": ".harness/tasks/2026-09-29-v0140-release-completion/manifest.json",
		"evidence": ".harness/evidence/2026-09-29-v0140-release-completion/commands.json",
		"reviewFile": ".harness/evidence/2026-09-29-v0140-release-completion/review.md",
		"changeRef": "none",
		"planRefs": ["docs/harness/tasks/2026-09-29-v0140-release-completion.task.md"]
	}
}
```
