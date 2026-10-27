# Review — 2026-10-27 租户完整性整改程序 Phase 0（基线复现）

Reviewed against the working tree. `git diff main...HEAD` for `backend/`, `frontend/src/`, `config/`,
`pkg/database/migrations/` and seed is empty: the only new files in this round are
`.harness/evidence/2026-10-27-tenant-completeness-remediation/{baseline.md,commands.json,summary.md,review.md}`.
Nothing in this wave can change runtime behaviour, so the review question is narrower than usual —
**is the baseline number the next 22 waves will be measured against actually the number a reviewer
would reproduce?**

## Scope audit

- No source, migration, fixture, lockfile, workflow or contract file was edited. The wave is evidence-only.
- The 14 commands match `docs/harness/tasks/2026-10-27-tenant-completeness-remediation.task.md`
  (`Verification Plan`) one-for-one, plus the mandatory fixture teardown that the runner does not perform
  itself.
- `smoke-tenant-baseline.md` (the 12:40 run) was left as written. It is history, and it describes a
  binary built on 2026-10-25; overwriting it would have destroyed that fact rather than corrected it.
  The HEAD-based numbers live in `baseline.md` and `summary.md`.

## Claim audit

| Claim | Evidence |
|---|---|
| The tenant package really has 119 passing cases, not 34 | `go test -count=1 -v ./modules/system/iam/tenant/...` with `PANTHEON_TEST_DSN_REQUIRED=true` reports 119 PASS / 0 SKIP / 0 FAIL in 61.5s. The required flag is what makes this a coverage claim: `pkg/testmysql/resolveDSN` turns a missing DSN into `Fatalf` instead of `Skipf` only when it is set. |
| The whole backend is green under the same discipline | `go test -count=1 ./...` → 46 packages `ok`, 0 `FAIL`, exit 0, plus 6 packages with `[no test files]`. `-count=1` rules out a cached `ok`. |
| Frontend gates are green and were green for the right reason | `tsc -b`, `npm run lint` (`--max-warnings 0`), `npm run build` (14 prebuild contract checks), `npx vitest run` (34 files / 230 tests), `check:menu-contract` (19/23/102/23), `check:i18n-hardcode` (238 files), `check:system-page-admission` (16). The first attempt at these four was **all red** with `'node' 不是内部或外部命令`; root cause was `D:\nodejs` sitting at PATH position 39 while npm delegates lifecycle scripts to `cmd.exe`. Putting it first made them pass — so the red was an environment artefact, not a code finding, and this is recorded instead of hidden. |
| Tenant smoke describes the current tree | `backend/.tmp/pantheon-server-ops.exe` was dated 2026-10-25T23:36, two days behind `2091a2d8`. It was rebuilt from HEAD with the maintainer's own `run-server-ops.sh` against the same retained database and environment, health-checked (`database/migrations/redis` all `ok`), then smoke re-run: 10 passed (matrix group) + 5 passed (viewpoint group) = **15 passed / 0 failed**. |
| No fixture leaked | `tenant-matrix-fixture-setup.mjs down` and `cleanup-smoke-fixtures.mjs` both exit 0 with counts `i18n:6`, `depts/dicts/permissions:0`. The runner only invokes `up`, so this teardown is part of the command set, not an optional follow-up. |

## Findings

- **P2, process (already known, reconfirmed here):** the "tests are all green" sentence in the
  completeness review was originally produced without a DSN and meant 34 executed cases with 85 silent
  skips. Every future evidence file in this program must therefore state the DSN-required run, not just
  `ok`. Recorded in `docs/reviews/TENANT_FUNCTIONAL_COMPLETENESS_REVIEW_2026-10-27.md` §5; no code change.
- **P3, local environment residue:** two orphan `pantheon_base_test*` clone databases from an interrupted
  run. `buildTestDBName` appends `UnixNano` and a random suffix so no later run can collide with them, and
  the retained fixture database `pantheon_base_plan_matrix_20261025` is untouched (verified by `SHOW
  DATABASES LIKE 'pantheon%'`). `DROP DATABASE` is destructive, was not performed, and needs the
  maintainer's word.
- **Credential handling — disclosed:** during environment discovery one root MySQL DSN, including its
  password, reached a tool transcript because my masking `sed` pattern did not match that DSN shape. It
  was never written to a tracked file, log or evidence artifact, and the value is not reproduced anywhere
  in this directory. The correct handling — source `.env.test` into the process environment only, use
  `MYSQL_PWD` rather than a command-line password — is what every later command in `commands.json` uses.
  Whether the local development password should be rotated is the maintainer's call, not mine.
- **Not claimed:** `npm run test:smoke:l0` / `l1`, the module-level smoke tiers and the `pantheon-ops`
  compatibility build were not run in this phase and are marked as gaps rather than as passes.

## Verdict

Approved. The baseline the program declares reproduces exactly on HEAD, with the DSN-required discipline
that makes the backend numbers mean coverage, and no source file was touched. Wave W2 may start once this
evidence lands and the packets PR (#431) is merged.

## Machine Readable

```json
{
  "taskId": "2026-10-27-tenant-completeness-remediation",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      ".harness/evidence/2026-10-27-tenant-completeness-remediation"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [
      "P2 process: a DSN-less go test run reports ok while silently skipping the DB cases, which is how the original all-green tenant claim was produced; every evidence file in this program must record the PANTHEON_TEST_DSN_REQUIRED=true run.",
      "P3 environment: two orphan pantheon_base_test* clone databases remain locally from an interrupted run; not dropped because that is destructive and awaits the maintainer."
    ],
    "notes": "No code path changes, so there is no new edge, no new hub and no cycle: the diff is four files inside one evidence directory. The sensitive-flow question this round is credential handling rather than authorisation — the local DSN leaked once into a tool transcript during environment probing and is absent from every tracked artifact; the tenant authorisation surface itself is untouched and is exactly what W2 to W4 will change. What this file certifies is a measurement discipline: 46 packages ok and 119 tenant cases are only meaningful together with -count=1 and PANTHEON_TEST_DSN_REQUIRED=true, and the smoke numbers only describe HEAD after the two-day-old server binary was rebuilt."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-tenant-completeness-remediation/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-tenant-completeness-remediation/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-tenant-completeness-remediation/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/tasks/2026-10-27-tenant-completeness-remediation.task.md",
      "docs/reviews/TENANT_FUNCTIONAL_COMPLETENESS_REVIEW_2026-10-27.md",
      "docs/contracts/TENANT_CONTRACT_V1.md"
    ]
  }
}
```
