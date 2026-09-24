# Review — 2026-09-20-merged-packet-closeout

## Reviewer disposition

Reviewed as a governance/evidence writeback with **no runtime, product, or gate
surface**: the diff is task packets, evidence summaries and one failure-registry
row. Self-reviewed against the delivery workflow's section 7 minimum deliverables
(the checklist this task exists to satisfy) and against the ratchet policy.

## Checks

| Question | Answer |
|---|---|
| Does every closed-out packet now carry the section 7 minimum deliverables? | Yes — PR URL, merge commit, merged-at, branch closure, signal classification, evidence and review pointers, known gaps and ratchet decision are in each `task.md` closeout table |
| Are the merge facts verified rather than remembered? | Yes — every fact comes from `gh pr view` / `gh api .../commits/<sha>/check-runs` / `git ls-remote` in this task's `commands.json`, including the branch deletions |
| Is the signal classification accurate, including the uncomfortable parts? | Yes — the packets record that the advisory `Bench Perf Smoke` job was red on #327 and #329 (and why), that it is green on #330 and on main tip, and that advisory `Core Smoke` is red on main tip |
| Was a pre-existing red baseline mistaken for a regression from these merges? | Checked explicitly: `Core Smoke` is red on 29 of the last 32 completed `main` runs, with the only green runs on 2026-09-10 — i.e. long before #327–#330. The closeout states it as pre-existing, not caused here |
| Is the new registry row honest about what was and was not done? | Yes — `FR-011` records `registry-only` / `registry-only` with status `open`: nothing was fixed, no sensor or gate was added, and the disposition is named as a maintainer decision |
| Does the writeback leave historical records intact? | Yes — the three tasks' `review.md` and `commands.json` are untouched; only `summary.md` gains an appended closeout section, so the branch-time record is preserved |
| Any chance the writeback overstates closure? | No — both packets that had a "CI-level evidence" gap now say which part the merge closed (bench chain) and which part remains open (tenant specs still have no CI green signal) |
| Is the scope boundary stated rather than silently applied? | Yes — the other same-day merged packets (#325, #326, #328) are named in the manifest's Out list as belonging to other workstreams, so the gap is visible instead of implied |
| Ratchet policy satisfied for the discovered repeated failure? | Level 0–1 satisfied: the pattern is recorded in the registry with evidence and pointers, per `FAILURE_RATCHET_POLICY` section 3; escalating it to a sensor/gate is deliberately deferred with the reason written down |
| Gates re-run after the writeback? | Yes — task-packet / evidence / review / failure-registry / structure / frontmatter / encoding / method-health / duplication, all recorded in `commands.json` |

## Findings

- **No blocking finding.** The writeback is mechanical and everything it claims is
  traceable to a command in `commands.json`.
- **P2 follow-up (registered, not fixed):** advisory `Core Smoke` has been red
  since at least 2026-09-05 while its workflow conclusion stays green
  (`continue-on-error: true`), and it is push-to-`main` only, so no PR-path gate
  ever runs the `tests/smoke-core/` tenant specs. Root cause of those failures
  (missing multi-mode backend + fixtures vs. a real isolation regression) was not
  diagnosed here and needs its own task. `FR-011` is the tracking entry.

## Verdict

Approve for PR. No production surface, no gate weight changed; the value is that
the packets stop describing a branch and start describing `main`.

## Machine Readable

```json
{
  "taskId": "2026-09-20-merged-packet-closeout",
  "verdict": "approved",
  "linkage": {
    "taskManifest": ".harness/tasks/2026-09-20-merged-packet-closeout/manifest.json",
    "evidence": ".harness/evidence/2026-09-20-merged-packet-closeout/commands.json",
    "reviewFile": ".harness/evidence/2026-09-20-merged-packet-closeout/review.md",
    "changeRef": "none",
    "planRefs": [
      ".harness/tasks/2026-09-20-ci-bench-perf-smoke/task.md",
      ".harness/tasks/2026-09-20-bench-perf-smoke-summary-path/task.md",
      ".harness/tasks/2026-09-20-tenant-hostile-matrix-phase2/task.md"
    ]
  }
}
```
