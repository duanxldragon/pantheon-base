# Review - 2026-08-02-sonarcloud-open-issues

Status: independent review complete; metadata findings resolved.

## Findings First

- No P0/P1 findings identified in self-review.
- Backend changes are helper extraction and parameter-shape cleanup; transaction,
  authorization, audit, and generated-module boundaries remain in their
  original call paths.
- Frontend changes extract existing JSX and pure helpers; production build,
  type-check, lint, unit tests, and UI contract checks pass.

## Independent Review

- The configured local Claude advisor CLI is unavailable because the `claude`
  binary is not installed.
- A native `code-reviewer` completed after PR creation with an `APPROVE`
  recommendation and no P0/P1 correctness, security, or behavior-regression
  findings across the auth, IAM, org, config, lowcode, and React changes.
- Hosted Linux race tests and SonarCloud passed. The first hosted Smoke Sanity
  run exposed an Arco Dropdown trigger that relied on React 19 `findDOMNode`;
  code commit `cac8b8b2` now implements Arco's `getRootDOMNode` contract,
  forwards injected trigger props, retains the existing hover configuration,
  and adds click support. Focused Chromium smoke passed on the click path;
  hover was preserved by configuration but was not exercised by that smoke.
- A follow-up independent review requested changes for behavior preservation,
  accessibility, and evidence consistency. The trigger now exposes
  `aria-haspopup`, `aria-expanded`, and an i18n-backed accessible name; the
  evidence is bound to code commit `cac8b8b2`.
- SonarCloud's remote analysis of the prior PR head reported 15 remaining
  TypeScript findings. Commit `a0c01eae` applies the behavior-preserving
  readonly, expression, and permission-workbench complexity corrections.
- A final native `code-reviewer` confirmed all 15 findings are correctly
  addressed and that `renderDetailModal` complexity is reduced from 21 to
  approximately 9 without changing rendered output. Its evidence-contract
  findings were resolved by restoring OpenSpec `changeRef: "none"`, recording
  `codeRef: "a0c01eae"`, using an accepted verdict, and normalizing command
  working directories.

## Residual Risks

- The full hosted Smoke Sanity suite passed on PR #222.
- The focused smoke covers click-driven opening, not delayed hover opening or
  click-to-close after a hover-open transition; this remains a documented P2
  interaction-coverage gap rather than a release blocker.

## Machine Readable

```json
{
  "taskId": "2026-08-02-sonarcloud-open-issues",
  "verdict": "approved with documented P2 follow-up",
  "findings": [],
  "linkage": {
    "changeRef": "none",
    "codeRef": "a0c01eae",
    "planRefs": ["docs/harness/tasks/2026-08-02-sonarcloud-open-issues.task.md"],
    "taskManifest": ".harness/tasks/2026-08-02-sonarcloud-open-issues/manifest.json",
    "evidence": ".harness/evidence/2026-08-02-sonarcloud-open-issues/commands.json",
    "reviewFile": ".harness/evidence/2026-08-02-sonarcloud-open-issues/review.md"
  }
}
```
