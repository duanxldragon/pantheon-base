# Review — 2026-09-22-naming-boundary-canonical-standard

## Reviewer disposition

Reviewed as a platform/governance documentation change (docs-governance profile,
low risk). The change publishes rules; it does not alter code, gates, or runtime
behavior. Verdict: **approved, with explicitly deferred Wave 1 gaps**.

## Checks

| Question | Answer |
| --- | --- |
| Is there now exactly one authoritative standard? | Yes — `docs/designs/REPOSITORY_LAYOUT.md` is extended in place; no second competing document was created. Existing references (`check-structure-contract.mjs` contract-source comment, `docs/designs/README.md`, `docs/README.md`) stay valid. |
| Does the CN/EN pair stay in sync? | Yes — `REPOSITORY_LAYOUT.en.md` mirrors the same sections and links back. |
| Are the whitelists the real gate sets? | Yes — §2.2 mirrors `check-structure-contract.mjs` (`BACKEND_TOP_DIRS`, `FRONTEND_SRC_DIRS`, module domains, file patterns); §10.1 points each rule at its enforcer + command + workflow. |
| Are exceptions treated as exceptions, not a whitelist expansion? | Yes — §9 registers each with owner, rationale, review condition, and states explicitly that pushing a violation into the table is "hiding the problem". |
| Is any unimplemented rule presented as enforced? | No — the generated marker, `check:generated`, and unblocked `platform -> system` / `auth -> iam` are labeled **gap/current gap** with the owning Wave 1 task named. |
| Does it contradict DESIGN.md or the contracts? | No — the layer model references DESIGN.md's layering; the document taxonomy references `DOCUMENT_GOVERNANCE_CONTRACT.md`; frontmatter fields respect `DOCUMENT_FRONTMATTER_SCHEMA.md`. Doc-links and frontmatter checks are green. |
| Verification adequate for the risk? | Yes — structure gate, task-packet template, both frontmatter checks, link check, and the structure-contract unit tests all pass. |

## Residual risks

- The standard now describes target states that are only enforced in later waves.
  This is intentional and tracked, but a reader could mistake §7/§8 for fully live
  gates; the "current gap" wording in §7.2 / §8.3 / §10.1 is the mitigation and is a
  review checkpoint for the Wave 1 tasks.
- `scripts/check-arch-boundaries.mjs` still overlaps `scripts/harness/check-boundaries.mjs`;
  the standard declares the harness script normative until they converge, but the
  legacy script is left in place (removing it is not in this task's scope).

## Machine Readable

```json
{
  "taskId": "2026-09-22-naming-boundary-canonical-standard",
  "verdict": "approved with documented P2 follow-up",
  "findings": [],
  "residualRisks": [
    "Target-state rules in §7/§8 are enforced only by later Wave 1 tasks",
    "scripts/check-arch-boundaries.mjs still overlaps check-boundaries.mjs"
  ],
  "linkage": {
    "taskManifest": ".harness/tasks/2026-09-22-naming-boundary-canonical-standard/manifest.json",
    "evidence": ".harness/evidence/2026-09-22-naming-boundary-canonical-standard/commands.json",
    "reviewFile": ".harness/evidence/2026-09-22-naming-boundary-canonical-standard/review.md",
    "changeRef": "none",
    "planRefs": [".harness/NAMING_AND_BOUNDARIES_REMEDIATION_PLAN_2026-09-22.md"]
  }
}
```
