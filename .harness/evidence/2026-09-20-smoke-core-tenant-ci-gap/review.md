# Review — 2026-09-20-smoke-core-tenant-ci-gap

## Reviewer disposition

This is a **plan review, not an execution review**: nothing has been run yet, and
every command in `commands.json` is deliberately marked `not-run`. What is being
reviewed is whether the packet states the problem, the evidence and the decision
points well enough that the next executor does not have to re-derive them.

## Checks

| Question | Answer |
|---|---|
| Is the red baseline established, and attributed to the right cause? | Yes — 29 of the last 32 completed `main` runs are red, greens only on 2026-09-10, earliest red 2026-09-05; explicitly recorded as pre-existing rather than damage from #327–#330 |
| Is the job's invisibility explained? | Yes — `continue-on-error: true` keeps the workflow conclusion green, the job is push-to-`main`/`release/**` only, and it is not in `ci-summary` needs |
| Are the preconditions the specs need actually absent from the job? | Yes — verified against `smoke-core.yml`: default compat backend, no tenant flag, no `tenantmatrixdb up`, no matrix fixture provisioning |
| Do the specs fail loudly instead of skipping? | Yes — the phase 2 spec header demands multi mode plus tenants 101/202, and the specs carry no skip/precondition guard, so an unmet precondition fails |
| Is the hypothesis ranking honest about the possibility of a real defect? | Yes — H2 (genuine tenant isolation regression → P1, leaves this task) is stated as a real possibility that the compat-mode reproduction is designed to falsify, not as a dismissed option |
| Is a signal-scope drift also captured? | Yes — `tests/smoke-core/README.md` still lists 8 specs while `test:smoke:core` globs 14, which is how specs requiring a different environment ended up in this job |
| Are the non-tenant failures kept separate? | Yes — `platform-shell-critical` and `system-dept-operations` are named as a second cluster to triage independently, not folded into a tenant fix |
| Are the options costed, and is the decision placed with the maintainer? | Yes — four dispositions with their trade-offs in `task.md`, and the packet's human gate names the decision explicitly so no workflow/spec change happens before it |
| Does anything change code before the diagnosis? | No — `doNotTouch` covers `smoke-core.yml`, the three tenant specs and the FR-011 row; the only artifacts added are the packet and this evidence |
| Is the evidence honest about not having results? | Yes — `knownGaps` says the commands are a plan of record, and the environment section records why local reproduction is currently blocked (no MySQL on 3306) |

## Findings

- **No blocking finding against the plan.** The packet is decision-ready: the
  static mechanism is confirmed, the ranked hypotheses each have a falsification
  step, and the options carry their costs.
- **P2, and the reason this task exists:** FR-011 is `open` with no owner unless
  this packet is executed. Until then the advisory `Core Smoke` signal stays red
  and unactionable, and the tenant specs keep having local-only green evidence.
- **Note for the executor:** if the compat-mode reproduction does *not* match the
  CI failure signature, do not settle for "environment flake" — escalate to H2 and
  treat it as a tenant isolation regression pending evidence to the contrary.

## Verdict

Approve the packet for execution. Approval covers the diagnosis and the evidence
it will produce; any change to `smoke-core.yml` or the specs still requires the
maintainer decision named in the packet's human gate.

## Machine Readable

```json
{
  "taskId": "2026-09-20-smoke-core-tenant-ci-gap",
  "verdict": "approved",
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
