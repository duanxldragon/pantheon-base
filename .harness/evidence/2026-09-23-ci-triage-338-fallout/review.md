# Review — 2026-09-23-ci-triage-338-fallout

## Reviewer disposition

Reviewed as a CI-workflow / maintainability change (quality profile `ci-workflow`, owner layer
`platform`). Verdict: **approved with a documented upstream follow-up** — the repairs fix the
repository state and prove behavior preservation, and the two unaddressed items (full-smoke
flakiness, `.golangci.yml` v2 key drift) are named with evidence rather than silently accepted.

## Checks

| Question | Answer |
| --- | --- |
| Is the path-case fix a real fix rather than a relaxed gate? | Yes — the tracked file is renamed to match the import (`R100` in git); no checker was loosened. The checker and docs that referenced the old name were updated instead. |
| Could adding `check-import-path-case.mjs` produce false positives? | Verified against the whole tree: 247 source files pass. It blanks comments and template literals first, because the lowcode generators ship sample `import ... from './api'` lines inside backtick templates; without that masking it reported 73 false positives. It also indexes non-source assets (`.txt` templates, `.json`) as resolution targets. |
| Do the lint repairs change behavior? | No — deleted symbols have zero references (`grep` verified), comment-only changes alter no code, the single-use-variable change is assertion-equivalent, and the remaining edits replace literals with identical constants. No `nolint` suppression was added. |
| Is the SonarCloud refactor provably behavior-preserving? | Yes — the LIKE/NOT LIKE clauses build from the same literal values, and `TestAdminSessionDeviceFilterRendersDetectDevicePredicates` asserts the rendered predicate text and bound args for all five device values. The device-filter SQL had no test before this change, so the pin is also new coverage. |
| Does the new test require external services? | It opens the standard `testmysql` fixture and only uses a `DryRun` session, so it renders SQL without executing against the server. |
| Is the PR body / evidence traceable? | Yes — the packet carries the full command log including the failing-job excerpts, the negative test for the new guard, and the post-repair CI tables. |
| Is the ratchet decision justified? | Yes — `sensor-added`: this failure class (a rename applied to the import but not to the file) is now caught by an automated checker wired into an existing gate, not by a note in a guide. |

## Residual risks

1. **Full Smoke Suite flakiness on main** (60s predicate timeout in
   `business/generated/module-governance-real.spec.ts`). Same-SHA pass/fail on `2b1cba31` proves it
   is not deterministic. Not fixed here; needs a follow-up that either raises the predicate timeout
   or stabilises generation latency.
2. **`.golangci.yml` v2 key drift** keeps test-file lint exclusions silently inert. Fixing it would
   change effective lint scope (issues that are currently suppressed would start or stop firing), so
   it stays a deliberate, already-documented follow-up rather than a drive-by edit in a CI repair.
3. **Hosted-only confirmation.** SonarCloud only re-scores on the hosted run: #339's analysis and
   the post-merge main Release Gate are the only places the "0 unresolved issues" claim can be
   confirmed. Everything verifiable locally was verified locally.

## Machine Readable

```json
{
  "taskId": "2026-09-23-ci-triage-338-fallout",
  "verdict": "approved with documented P2 follow-up",
  "structuralReview": {
    "affectedSubgraph": [
      "frontend prebuild gate chain and platform module stylesheet",
      "backend auth session admin list filters",
      "backend system iam credential port and config setting tests"
    ],
    "checks": ["cycle", "hub", "call-depth", "sensitive-flow"],
    "findings": [],
    "notes": "No new cycle or hub: the new frontend checker is a standalone script wired into prebuild, and the backend edits are literal-for-constant substitutions inside existing packages. No unvalidated input reaches a sensitive action; the session filter clauses and bound arguments are byte-identical to the pre-refactor literals, pinned by a new rendered-SQL test."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-09-23-ci-triage-338-fallout/manifest.json",
    "evidence": ".harness/evidence/2026-09-23-ci-triage-338-fallout/commands.json",
    "reviewFile": ".harness/evidence/2026-09-23-ci-triage-338-fallout/review.md",
    "changeRef": "none",
    "planRefs": [
      ".harness/ENTERPRISE_REMEDIATION_PLAN_2026-09-22.md"
    ]
  }
}
```
