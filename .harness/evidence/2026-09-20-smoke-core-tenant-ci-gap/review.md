# Review — 2026-09-20-smoke-core-tenant-ci-gap

## Reviewer disposition

The packet was approved for execution as a plan (2026-09-20). This is the
**closeout review** of the diagnosis and implemented disposition. The root cause
is confirmed, the compat/core and multi/tenant environments are now separated,
and no production tenant evidence is claimed from this workstation.

## Checks

| Question | Answer |
|---|---|
| Is the red baseline reconfirmed at execution time, not carried over from the planning pass? | Yes — 31 failure / 3 success / 5 cancelled across the 39 most recent `main` runs, re-measured at job level because the workflow level is green by construction |
| Was the H1/H2 question actually settled, or only argued? | Settled. The assertion detail blocks give `Received: undefined` (security-event) and `Received: 0` (operation-log). Neither is tenant 202's id, which is what a real leak would have to show |
| Is the verdict anchored in product code rather than in the test's own wording? | Yes — `pkg/tenant/tenant.go` compat fallback to `PlatformGlobalTenantID`, `login_runtime.go:367` "Compat ignores any requested tenant: no claim is ever stamped", and `pkg/upload/service.go:488` deriving `t%d/` from the resolved context. The specs' "leaked" phrasing is the test's interpretation; the code explains the values |
| Is the refutation of H2 robust, or does it rest on absence of evidence? | Robust. It rests on positive evidence of a different mechanism (the compat-fallback shape), on four passing tenant tests inside the same specs in the same run, and on the compat behaviour already being pinned by green PR-path backend tests. The executor also honoured the packet's instruction not to settle for "environment flake" |
| Is the precondition list complete, or is the obvious one enough? | Complete and sourced: P1 flag, P2 tenant rows, P3 memberships, P4 dict fixtures, P5 upload namespace. Each names its authoritative producer, and P5 is included precisely because it fails silently |
| Is the disposition actionable, including the non-obvious traps? | Yes — Core Smoke has an explicit compat allowlist; Tenant Smoke runs `tenantmatrixdb up` with validated `PANTHEON_MATRIX_MODE=multi`, then provisions fixtures. The `PANTHEON_MATRIX_DSN` requirement and cleanup ownership are explicit |
| Are the non-tenant failures kept out of the tenant fix? | Yes — `platform-shell-critical:60` and `system-dept-operations:151` are marked deterministic and tenant-blind, and `auth-tenant-picker:145` is reclassified as flaky in a mocked spec that needs no live tenant preconditions |
| Did anything change that the packet forbade? | No tenant spec or product isolation code changed. Workflow scope, package scripts, the matrix tool's explicit mode guard, documentation, and evidence were updated as the authorized disposition |
| Is the still-unrun local replay presented honestly? | Yes — it is `not-run` with the reason (no MySQL on 3306), explicitly not counted as a pass, and the verdict is justified without it rather than papered over |

## Findings

- **No blocking finding.** H1 confirmed, H2 refuted, and the selected disposition is implemented without changing tenant product behavior.
- **Runtime evidence boundary.** Hosted CI must supply the first multi-mode run; local MySQL is unavailable here and the gap is recorded rather than inferred as green.
- **Two signal-quality defects surfaced alongside the main finding**, both worth a
  follow-up rather than a drive-by fix: `business-generated-basic.spec.ts` is a
  README-listed core member whose 3 tests self-skip (the job's entire "3 skipped"),
  and `tests/smoke-core/README.md` advertises 8 files while the glob runs 12
  specs. The allowlist and README update close that drift; future special-precondition
  specs must use an explicit job.
- **Correction to the earlier closeout record:** the red-baseline figure in the
  2026-09-20 closeout (`29 failure / 3 success / 5 cancelled` over 32 completed
  runs) was measured over a narrower window. The conclusion is unchanged; the
  wider window is 31 red of 34 completed runs.
- **Residual risk accepted and stated:** H1's confirmation is a signature match
  against the disputed environment rather than a fresh multi-mode replay. That is
  the correct primary evidence for the question asked, but it is recorded as a gap
  so the remaining replay is not silently dropped.

## Verdict

Approve the closeout. The evidence supports the root cause and the implemented
FR-011 disposition. Both smoke jobs remain advisory; promotion to blocking and
production-scale tenant performance evidence remain explicit follow-up gates.

## Machine Readable

```json
{
  "taskId": "2026-09-20-smoke-core-tenant-ci-gap",
  "verdict": "approved with documented P2 follow-up",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-09-20-smoke-core-tenant-ci-gap/manifest.json",
    "evidence": ".harness/evidence/2026-09-20-smoke-core-tenant-ci-gap/commands.json",
    "reviewFile": ".harness/evidence/2026-09-20-smoke-core-tenant-ci-gap/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/failure-registry.md",
      ".harness/evidence/2026-09-20-merged-packet-closeout/summary.md"
    ]
  }
}
```
