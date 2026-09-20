# Summary — 2026-09-20-smoke-core-tenant-ci-gap

Planning record opened as the `FR-011` follow-up to
`.harness/evidence/2026-09-20-merged-packet-closeout/summary.md`. Nothing has been
executed yet; this file states what is already established, what is still
hypothesis, and what the diagnosis must settle.

## What is established

1. **The advisory Core Smoke job is a long-standing red baseline.** 29 failure /
   3 success / 5 cancelled across the last 37 `main` runs, the only greens on
   2026-09-10; red already on 2026-09-05, i.e. before #327–#330. It is invisible
   at the workflow level because `smoke-core.yml` sets `continue-on-error: true`,
   and it is push-to-`main`/`release/**` only, so no PR ever runs it.
2. **At the tip (`b3350be3`, job 106030885786) it is 28 passed / 8 failed /
   3 skipped**, and the failing set contains the `tests/smoke-core/` tenant specs
   with assertions like `security-event row 1 leaked across tenants (expected 101)`
   and `operation-log list leaked a foreign row to tenant 101`.
3. **The job provides none of the tenant preconditions.** `smoke-core.yml` starts
   `go run ./cmd/server` (default compat mode) and runs
   `npm run test:smoke:core`; there is no tenant-mode flag, no `tenantmatrixdb up`,
   no matrix fixture provisioning.
4. **The specs require those preconditions and have no skip guard.** The phase 2
   spec header states *"The flag must be multi and tenants 101/202 must exist
   (tenantmatrixdb up)"*; grepping the tenant specs finds no skip/precondition
   logic, so an unmet precondition produces a failure rather than a skip.
5. **The suite definition has drifted from its README.**
   `frontend/tests/smoke-core/README.md` still lists 8 files and mentions no tenant
   spec, while `test:smoke:core` runs the `tests/smoke-core/*.spec.ts` glob over a
   directory that now holds 14 specs.
6. **A second, non-tenant cluster exists at the same tip**:
   `platform-shell-critical.spec.ts` (sidebar `expandedWidth > collapsedWidth`)
   and `system-dept-operations.spec.ts` (root-department row, 15s poll timeout).
   Both are in the README's core list and both predate the tenant specs.

## What is still hypothesis

- **H1 (ranked first): scope mismatch.** The tenant specs landed inside a glob
  whose job never provisions multi mode, tenants 101/202 or the matrix fixtures,
  so "leaked across tenants" describes a missing-precondition environment rather
  than a product defect. Predicts: green locally in multi mode (already the case),
  same failure signature locally in compat mode.
- **H2: a genuine tenant isolation regression** that CI has been pointing at for
  two weeks behind `continue-on-error`. Predicts: compat mode does **not**
  reproduce the assertions, or reproduces them against a correctly provisioned
  stack. If true this becomes P1 and leaves this task immediately.
- **H3: the two non-tenant failures are an independent defect or flake** and
  should not be mixed into a tenant-focused fix.

## What the diagnosis must decide (maintainer gate)

| Option | Cost / risk |
|---|---|
| Provision tenant mode + tenants + fixtures inside the job | Makes the signal trustworthy; job gets slower and the fixture idempotency/cleanup ownership must be decided |
| Add precondition skip guards to the specs | Keeps them runnable, but a permanent skip reads as false green unless skips are counted |
| Move the tenant specs out of the `tests/smoke-core/` glob | Restores a truthful core signal, but tenant coverage then has no CI path unless a new job carries it |
| Keep the status quo | Leaves a two-week-long red signal hidden behind `continue-on-error` |

## Immediate next steps

1. Reconfirm the red baseline and build the per-spec failure inventory.
2. Reproduce the tenant failure locally in compat mode (needs MySQL on 3306 or a
   CI loop) and compare signatures against the job log.
3. Triage the two non-tenant failures separately.
4. Bring the disposition decision to the maintainer before touching
   `smoke-core.yml` or any spec; only then flip `FR-011` from `open` to the chosen
   control.
