# Review — 2026-07-25-sonar-scope-and-s8545

## Reviewer stance

Config-only change; no product source touched. Review focused on three risks:

1. **Does the scope exclusion hide real product signal?** No. Every excluded
   group carries an individual rationale: tooling scripts are not shipped
   product code and have their own test suites; SQL files are DDL/seeds where
   plsql application rules are category errors; the i18n resource exclusion
   removes exactly 47 findings, all of which are `typescript:S2068` false
   positives on translation strings (verified from the exported issue list —
   no other rule fires in those files). Product code, tests, Dockerfile and
   workflows remain fully analyzed. No Sonar-side bulk transition is used,
   which keeps the freeze policy's ban on bulk acceptance intact.
2. **Does the lint-step swap change gate behavior?** No. ci.yml lint remains
   `continue-on-error` + report-only; quality.yml keeps the exact
   `--new-from-rev=<base>` PR semantics via a scope-compute step feeding the
   action's `args`. golangci-lint stays v2.6.2; the action is pinned to the
   v9.3.0 release commit SHA, consistent with the repo's pinning convention.
3. **Supply-chain posture.** `golangci/golangci-lint-action` is SHA-pinned and
   downloads a checksum-verified release binary — strictly better than
   compiling via `go install pkg@version` on every run, and it is the fix
   S8545 asks for. The rejected `go tool` route is documented in the summary
   with the concrete MVS damage it caused (minio-go downgrade).

## Residual risk

- Autoscan honoring of `.sonarcloud.properties` has community-reported flakes;
  the task is not closed until the post-merge OPEN count is re-queried. UI
  Analysis Scope settings are the documented fallback.
- Coverage remains absent from SonarCloud until the post-freeze CI-based
  analysis decision; tracked in summary.md with the quality-gate interaction
  that motivates the deferral.

## Machine Readable

```json
{
  "taskId": "2026-07-25-sonar-scope-and-s8545",
  "verdict": "approved with documented P2 follow-up",
  "findings": [],
  "residualRisks": ["SonarCloud autoscan behavior and coverage import remained documented follow-ups"],
  "linkage": {
    "taskManifest": ".harness/tasks/2026-07-25-sonar-scope-and-s8545/manifest.json",
    "evidence": ".harness/evidence/2026-07-25-sonar-scope-and-s8545/commands.json",
    "reviewFile": ".harness/evidence/2026-07-25-sonar-scope-and-s8545/review.md",
    "changeRef": "none",
    "planRefs": []
  }
}
```
