# Review — W6 `2026-10-27-tenant-console-ui-automation`（租户控制台 UI 自动化）

Reviewed against the working tree on branch `feat/tenant-console-ui-w6`
(base `a4291a81`). Measured diff: **5 files modified, +27 / −20, plus one new
spec file**; every modified path is inside the packet's `expectedFiles.modify`
with two deliberate omissions documented below. `doNotTouch` (`backend/**`
production code, `frontend/src/index.ts`, release workflows, `pantheon-ops/**`)
is untouched — the single `backend/` hunk is one line inside a doc comment.
The review question is the packet's `reviewerPosture`, so each item is answered
with the artefact that settles it.

## Reviewer posture, item by item

| Posture item | Reading |
|---|---|
| Each test asserts an outcome, not just that a page rendered | Test 1 asserts the summary-card labels and table; test 2 asserts the row contains the created name and 启用中； test 3 asserts the renamed value and the switched plan label in the row; test 4 asserts 删除 is **disabled** on 已停用， then the row **leaves the list** (`toHaveCount(0)`) after the archived delete; test 5 asserts the last-owner refusal toast (最后一名)， the member count going 2→1→2 through remove and selector re-add, and the viewpoint banner appearing and disappearing; test 6 asserts the overview metrics, the four builtin plan codes, the assigned plan row carrying the custom code, the in-use retire refusal (仍有租户使用该套餐)， and the successful retire after unassignment. |
| Data is created and torn down per run | Every code is timestamp-suffixed (`console-<run>`, `console-m-<run>`, `plan_console_<run>`); cleanup is archive-then-delete per the W1 contract (§2.1: delete refuses non-archived tenants) in each test's tail plus an afterAll that sweeps any `console-` tenant and retires any active `plan_console_*` plan a failed run left behind. The matrix pair the isolation specs share is never touched. |
| The picker test fails if the chosen tenant yields an empty console | The picker coverage lives in `tenant-hostile-browser-matrix.spec.ts` (W4's rewrite): it asserts the cross-grant refusal carries `tenant.member.user_not_in_tenant`, that login returns `tenantSelectionRequired` falsy, and that `/auth/tenants/current` resolves the owning tenant — an empty/unusable tenant context fails the mode/tenantId assertions, not just the shell visibility. Before this wave that final assertion called `/auth/current`, a route that has never existed, so the test failed at exactly that assertion on every run (report-only CI never gated it); the repaired endpoint makes the strengthened assertions live, which is what proves they bite. |
| The CI change only adds the spec to the existing job | No workflow file is touched. `smoke-core.yml:230` runs `npm run test:smoke:tenant`, whose definition in `frontend/package.json` gained the console spec. The job remains report-only — the packet's stated default for the human gate, taken under the maintainer's standing delegation of 2026-10-28 — so the gate state is unchanged. |
| No production file changed to satisfy a locator | `git diff` over the tree: `tenant-console.spec.ts` (new), the two spec repairs, `tenant-fixture.ts` (archive-first teardown, test-only), `frontend/package.json` (one line), and `login_tenant_switch.go` (one comment line, verified token-identical apart from the path string). No file under `frontend/src/` changed. |

## Deliberate omissions from `expectedFiles.modify`

- `.github/workflows/smoke-core.yml` — the job already delegates to the npm
  script; `frontend/package.json` is the single wiring point.
- `auth-tenant-picker.spec.ts` — the finding's "picker spec" is the
  hostile-browser-matrix spec (named in the finding itself); auth-tenant-picker
  already asserts error messages, cookie clearing and URL at its mock level and
  needed nothing.

Both omissions are recorded in commands.json → knownGaps rather than silently
narrowing scope.

## Premise deltas the review confirms are sound

- **Secure-action modal** — the W1 delete test handles the real
  SecondaryVerifyModal flow (403 → fill → retry) instead of bypassing it; this
  is a coverage *gain* the packet did not anticipate.
- **Member scenario is remove-then-re-add** — forced by
  `ensureTenantMembership` auto-provisioning and W4's
  `tenant.member.user_not_in_tenant` narrowing; the spec seeds the tenant-owned
  user via API with the `X-Tenant-Id` header, which mirrors what the console's
  own user-creation path does.
- **Plan assertions by code, builtin codes individually** — forced by
  accumulate-only plan storage and `planLabel`'s raw-code fallback for
  non-builtin codes; asserting a fixed total count would make the spec flaky by
  design.

## Findings

- **P3, residue in the maintainer's ops database** — early W6 runs reused the
  dev stack before the isolated stack existed and left test-named rows
  (`console-*` tenants, `plan_console_*` plans). No credentials to clean from
  the agent side; grep keys and full disclosure in commands.json knownGaps.
  The maintainer should delete them at leisure.
- **P3, matrix-pair accumulation** — each `--setup` run provisions a new pair
  into the test DB; the manifest tracks only the latest. CI's down step owns
  cleanup; local developers can accumulate pairs. A future hardening could
  make the setup script sweep pairs older than the manifest, but that is not
  this wave's scope.
- **P3, leg-1 log not persisted** — the full two-leg suite run is green
  (16/16, 5/5) but recorded from the terminal; the persisted logs are the
  console (6/6) and viewpoint (5/5) runs. A re-run was skipped to avoid
  provisioning another matrix pair.
- **P3, screenshots vs runner cleanup** — the runner's post-run
  generated-module cleanup removes untracked files including
  `test-results/`; the evidence capture used a temporary no-op cleanup script
  (created and deleted for the run) so the log and the screenshots come from
  the same run. Worth a `--skip-generated-cleanup` flag upstream if smoke
  evidence keeps being captured this way.

## Machine Readable

```json
{
  "taskId": "2026-10-27-tenant-console-ui-automation",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "frontend/tests/smoke-core/tenant-console.spec.ts",
      "frontend/tests/smoke-core/tenant-hostile-browser-matrix.spec.ts",
      "frontend/tests/smoke-core/tenant-viewpoint-switcher.spec.ts",
      "frontend/tests/smoke-core/tenant-fixture.ts",
      "frontend/package.json"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [
      "P3 residue: test-named rows (console-* tenants, plan_console_* plans) remain in the maintainer's ops database from pre-isolation-stack runs; no cleaning credentials available, grep keys disclosed in commands.json knownGaps.",
      "P3 accumulation: each matrix-fixture run provisions a new pair into the test DB and only the latest is tracked in the manifest; CI's down step owns cleanup.",
      "P3 evidence shape: the persisted logs cover console (6/6) and viewpoint (5/5) runs; the full two-leg suite result (16/16, 5/5) is session-recorded because a re-run would provision another matrix pair.",
      "P3 tooling: the runner's post-run generated-module cleanup removes untracked files including test-results/, so evidence capture needs a temporary no-op cleanup script; a --skip-generated-cleanup flag would remove the awkwardness."
    ],
    "notes": "The change is additive test code plus two repairs to previously-red report-only specs and a one-line comment fix; no production behaviour surface moves, so the sensitive-flow question is about the tests, not the product: the W1 delete test drives the real SecondaryVerifyModal path rather than stubbing the operation token, the W2 dialog test re-adds through the selector under the tenant viewpoint, and the plan test retires only its own timestamp-suffixed plan. Data isolation from the shared matrix pair is structural (disposable timestamp-suffixed tenants, archive-then-delete per the W1 contract, afterAll sweeps for both tenants and plans). The previously-red specs are repaired without weakening assertions: the hostile spec's endpoint fix makes W4's strengthened picker assertions runnable, and the viewpoint fix supplies the role binding the W4 login gate legitimately requires."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-tenant-console-ui-automation/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-tenant-console-ui-automation/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-tenant-console-ui-automation/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-tenant-completeness-remediation.task.md",
      "docs/reviews/TENANT_FUNCTIONAL_COMPLETENESS_REVIEW_2026-10-27.md"
    ]
  }
}
```
