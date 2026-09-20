# Summary — 2026-09-20-merged-packet-closeout

Consolidated closeout record for the writeback pass that made three merged task
packets (and their evidence) describe `main` instead of the branch they were
built on. Per-task closeout sections live in each task's own evidence directory;
this file records the pass itself, the shared facts, and what it did **not** fix.

## 1. Writeback applied

| Task | PR | Merge commit | Status before → after | Closeout record |
|---|---|---|---|---|
| `2026-09-20-ci-bench-perf-smoke` | #327 | `0b17c5d9` | `in-progress` → `completed` | `.harness/evidence/2026-09-20-ci-bench-perf-smoke/summary.md` |
| `2026-09-20-tenant-hostile-matrix-phase2` | #329 | `3f35a066` | `in-review` → `completed` | `.harness/evidence/2026-09-20-tenant-hostile-matrix-phase2/summary.md` |
| `2026-09-20-bench-perf-smoke-summary-path` | #330 | `b3350be3` | `in-review` → `completed` | `.harness/evidence/2026-09-20-bench-perf-smoke-summary-path/summary.md` |

Each packet now carries the section 7 minimum deliverables — PR URL, merge
commit, merged-at, branch closure, GitHub signal classification, evidence and
review pointers, known gaps and ratchet decision — in both `manifest.json`
(`status`, `statusNote`) and a `## Closeout（合入后回写，2026-09-20）` section in
`task.md`. The three evidence summaries gained an appended
`## Closeout (post-merge, 2026-09-20)` section; their historical `review.md` and
`commands.json` were left exactly as written.

## 2. Signal state the closeout records

| Signal | Class | Value |
|---|---|---|
| #327 PR rollup | required + advisory | 27 success / 2 skipped / 1 failure (the failure is the advisory job #327 itself added) |
| #329 PR rollup | required + advisory | 32 success / 2 skipped / 2 failures (both advisory Bench Perf Smoke runs) |
| #330 PR rollup | required + advisory | 32 success / 6 skipped / 0 failures |
| main tip `b3350be3` — CI, Security Gates, Code Quality Gates, Lint Workflows | required | success |
| main tip `b3350be3` — Bench Perf Smoke | advisory | **success** (run 35492933695 / job 106030897699) — closes the bench chain gap |
| main tip `b3350be3` — Core Smoke | advisory | **failure** (see §3) |

Branch closure: `chore/ci-bench-perf-smoke`,
`feat/tenant-hostile-matrix-phase2` and `fix/bench-perf-smoke-summary-path` are
all gone from `origin`.

## 3. Finding raised during the writeback — FR-011

Walking main's run list to classify the signals surfaced a second instance of the
class FR-010 recorded: the advisory, push-only `Core Smoke` job
(`.github/workflows/smoke-core.yml`) has been red on **29 of the last 32
completed `main` runs**, the only three green runs being on 2026-09-10; it was
already red on 2026-09-05, i.e. long before any of #327–#330.

Why it stayed invisible:

- `continue-on-error: true` makes the **workflow conclusion green**, so the
  failure exists only in the run's job list.
- It triggers on `push` to `main`/`release/**` only — PRs never run it.
- Nothing in `ci-summary` needs it, so no gate weight is attached.

At the tip the failing set (28 passed / 8 failed / 3 skipped) includes the
`tests/smoke-core/` tenant specs — the phase 1 and phase 2 hostile matrix specs,
`tenant-protected-resources`, with `security-event` / `operation-log` "leaked
across tenants" assertions. Those specs have no multi-mode backend plus fixture
provisioning in that job, which is also why the 9/9 recorded in the #329 evidence
is local-only.

Recorded as **FR-011** (runtime-quality / ci-signal-noise / `registry-only` /
status `open`). The disposition is a maintainer decision and deliberately out of
scope here: either give the job what the tenant specs need, or move them out of
its scope. Root-causing the failures was opened as a separate follow-up task,
`.harness/tasks/2026-09-20-smoke-core-tenant-ci-gap/`, which carries the ranked
hypotheses (environment/precondition mismatch vs. a real isolation regression),
the static evidence and the verification plan.

## 4. Verification

All gates in `commands.json`, run directly with `node` (local npm is intercepted
by a WSL shim): failure-registry `--strict` PASS, evidence `--strict` PASS for the
new artifact, review `--strict` PASS for the new artifact, structure-contract 0
findings / 1903 files, encoding 0 findings / 1703 files, method-health no
findings, doc-links 0 findings, duplication PASS, adoption 0 findings.

One defect was caught and fixed in flight: the first three `statusNote` edits
dropped the trailing comma, leaving all three manifests unparsable
(`Extra data: line 8 column 3`). They were repaired and re-validated with
`json.load` before the gates were run.

## 5. What this pass deliberately did not do

- **Not fixed:** the advisory `Core Smoke` failures (FR-011 stays `open`);
  diagnosis handed to `.harness/tasks/2026-09-20-smoke-core-tenant-ci-gap/`.
- **Not changed:** any gate weight, workflow, test, product code, or the
  historical `review.md` / `commands.json` of the closed-out tasks.
- **Not written back:** the packets of same-day merges from other workstreams —
  #325 (`2026-09-20-module-governance-flaky-timeout`), #326 (docs-only, no packet
  needed), #328 (`2026-09-20-permission-workbench-route-binding`, packet still
  reads `in-progress` although its PR merged). Named here so the remaining drift
  is visible rather than implied.
- **Observed, not fixed:** `check-review.mjs --strict` is not wired into CI and
  several historical evidence dirs lack the Machine Readable block.

## 6. Ratchet decision

`registry-only`. The reusable control here is the registry row plus the recorded
closeout checklist; no sensor or gate was added, because "packet still says
in-review" is not by itself a defect — the mechanical upgrade (compare packet
status against PR state) needs a better signal source than currently exists and
would risk false positives on open PRs.
