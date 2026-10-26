# Review — 2026-10-26 governance evidence schema backfill

**Verdict**: Approved with documented P2 follow-up.
**Scope of the claim**: this round repaired 31 pre-existing strict-checker errors across historical governance artifacts and proved the repair did not change any historical verification conclusion. It did not re-verify any historical round.

## Verdict

`check-evidence.mjs --root . --strict` and `check-review.mjs --root . --strict` both exited 1 on entry to this round, and every one of the 31 errors belonged to an earlier round — none was caused by current work. Both now exit 0 with 0 errors — 54 evidence files and 54 review files including this round's own artifacts (the 53-file measurement was taken before they existed) — and 18 of the 19 governance steps `.github/workflows/quality.yml` runs were re-executed here at exit 0; the one exception is `check:pr-governance`, which needs a PR event payload and does not exist outside a hosted run.

The repair qualifies as structural-only because three mechanical checks say so, not because the prose claims it:

- `git diff --numstat` shows the 22 backfilled `review.md` files as `22  0` — insertions only, no line of historical prose deleted or rewritten.
- `git diff -- .harness/evidence | grep '"status"'` is empty: no `commands[].status` line in any historical `commands.json` moved.
- Each backfilled string (a `knownGaps` entry, a `verdictRationale`, a `runtimeGap`) is a restatement of text already in that round's own `review.md` / `summary.md` / `commands.json`, and where a type had to collapse — an array of notes becoming a boolean — the original array is preserved under a `*Notes` key rather than dropped.

That is the whole of what this round may claim. Anything stronger would be over-reading.

## What was actually wrong, and why nobody noticed

Two distinct failure shapes, both schema-level:

1. **`commands.json` (7 files).** `linkage` was absent entirely in five, `knownGaps` absent in four, and in two (`2026-10-22-delivery-audit-remediation`, `2026-10-22-v0171-release-closeout`) `runtimeSensitive` held an array of explanatory strings where the checker requires a boolean and `runtimeGap` held an array where it requires a non-empty string. The prose in those arrays was real gap reporting; the type was wrong.
2. **`review.md` (24 files).** 22 had no `## Machine Readable` JSON block at all. One (`2026-09-25-task-archiving-and-v0130-prep`) pointed `planRefs` at `.harness/ACTIVE_TASKS_REVIEW_2026-09-25.md` — a file that round itself archived and that was deleted at the v0.15.0 closeout, so the reference was accurate when written and dead ever since. One (`2026-10-20-tenant-delivery-hardening`) used `structuralReview.checks` values `tenant-isolation` and `reserved-namespace`, outside the `cycle|hub|call-depth|sensitive-flow` enum.

The root cause is not carelessness in those rounds. `check-evidence` and `check-review` have **no npm script and appear in no workflow**; `.github/workflows/quality.yml` runs 19 `npm run check:*` steps and neither of these is among them. So every field the two checkers later came to require retroactively invalidated artifacts that were green when written, with no signal at the time of the change. FR-016 records exactly that, with a recommended harness change of `gate` and a promotion decision of `registry-only` — because promoting it is a gate-policy call, and gate policy is the maintainer's touchpoint, not an agent's.

## Review points a reviewer should challenge

- **Did the backfill invent verdicts?** `blocked` is used once, for `2026-10-07-release-closeout`, whose own text states the closeout is not done until the candidate SHA is pushed, hosted checks and Sonar are green and the PRs are merged. 12 rounds map to `approved`, 9 to `approved with documented P2 follow-up` — the latter used wherever the source text itself carried an explicit residual-risk or not-run section. A reviewer who thinks a specific round's restatement misreads it should name that task id; this round deliberately does not re-judge.
- **Is `2026-10-21-acceptance-remediation` approved?** It is `approved with documented P2 follow-up`, and its own text includes a retraction (the reviewer first wrote "61 packages ok", then withdrew it when the tool output did not support it). The backfill preserved that honesty rather than laundering it into a clean `approved`.
- **`check-method-health` prints a reason line yet exits 0.** Confirmed: `check-method-health --root . --strict` exits 0 while printing "OpenSpec skeleton directory is missing". Read the exit code, not the banner.
- **Is G-05 stated correctly?** It took a second run to say it honestly. From the pantheon-base directory `check-inheritance-contract --strict` reports 7 findings, 3 of them as "required inheritance contract file is missing" — which reads like a checkout artifact. Re-run from the workspace root (`D:/workspace/go/pantheon-platform`) it reports 8, and the same three become real content drift: `docs/WORKSPACE_INHERITANCE.md` lacks 3 inheritance markers, `pantheon-ops/docs/PROJECT_INHERITANCE.md` lacks 3 markers plus the pinned-Base-version rule, and `.github/pull_request_template.md` genuinely does not exist at that root. The workspace-root reading is the correct one; the repo-directory reading understates the cause, and the evidence records both.
- **Why not also fix the three other red checkers?** Two of them (`check-runtime-evidence`, `check-inheritance-contract`) appear in no workflow and no npm script, and the third (`check-boundaries`) runs in CI only through `.github/workflows/ci.yml:391` **with a baseline** — the CI form of that command exits 0 because the single finding is baselined until 2026-12-31. All three name files this round did not touch, so their state is reported (G-03/G-04/G-05), not absorbed. The boundary finding in particular (`platform/widgets.tsx` importing `../system/iam/menu/api`) is a layer-design change; slipping it into a governance-schema packet is exactly how unrelated risk enters a small diff, and its ratchet date is already on the books.
- **Is the chain green because it was verified or because it was silenced?** Verified. No checker was edited, no rule relaxed, no file removed from a scan set, and no `--strict` was dropped. The only edits were to artifacts the checkers read.

## Points a reviewer should challenge about this round itself

- The five `commands.json` files that only gained fields still show a deletion line in `--numstat` (one re-keyed line each), so "pure append" is true of the 22 review files, not of the evidence files. The stronger and still-sufficient claim is the empty `grep '"status"'` result.
- `frontend/.tmp/gov-fix-*.mjs` are gitignored, so the backfill is not reproducible from a clean checkout. That is acceptable for a one-off schema repair, but it means the diff is the reviewable artifact, not the script.
- `linkage` blocks were derived by rule from each directory's own basename. A wrong-but-consistent rule would produce 31 consistent wrong answers; spot-check one round end to end rather than trusting the count.

## Explicitly not run

- Backend `go test`, frontend Playwright smoke, SonarCloud, and the hosted `Foundation Release Verify` — all CI verdicts, none reachable or relevant to artifact-schema repair here.
- `npm run check:pr-governance` — it reads a GitHub PR event payload that only exists in a hosted run, so it is 1 of the 19 `quality.yml` governance steps and is the only one not re-executed here.
- Any historical round's own verification commands. Green governance artifacts are not evidence that the 2026-10-13 isolation run still passes.

## Residual risk accepted

The chain is green only when someone runs it by hand. Until the maintainer wires `check:evidence` and `check:review` into `quality.yml`, the next schema addition rots the current artifacts exactly as it rotted these. Two of the three newly-named checkers (`check-runtime-evidence`, `check-inheritance-contract`) are invisible for the same reason — no workflow and no npm script invokes them — while the third (`check-boundaries`) is visible in CI only because it runs with a baseline that carries its one finding until 2026-12-31, so a bare `--strict` run reads redder than the gate actually is.

## Machine Readable

```json
{"taskId":"2026-10-26-governance-evidence-schema-backfill","verdict":"approved with documented P2 follow-up","verdictRationale":"Approved for the structural claim, which is measured: 31 pre-existing strict errors across 7 commands.json and 24 review.md files are now 0 errors / exit 0 on both checkers (54 evidence files, 54 review files), 18 of the 19 npm run check:* governance steps in .github/workflows/quality.yml were re-run here at exit 0 with only check:pr-governance unreachable off-host, and the repair is provably conclusion-preserving because the 22 appended review.md files show zero deletions, no commands[].status line appears in any evidence diff, and every backfilled string restates text already present in the same round's artifacts. Follow-up is P2 and explicit rather than silent: FR-016 stays open because adding check:evidence and check:review to quality.yml is a gate-policy decision reserved to the maintainer, and three further strict checkers outside that job (check-runtime-evidence 0 errors / 11 warnings and check-inheritance-contract 7 findings, neither invoked by any workflow or npm script; check-boundaries 1 finding on a bare --root . --strict run although its CI form passes with config/boundary-baseline.json) are reported as findings G-03/G-04/G-05 rather than absorbed into this packet.","linkage":{"taskManifest":".harness/tasks/2026-10-26-governance-evidence-schema-backfill/manifest.json","evidence":".harness/evidence/2026-10-26-governance-evidence-schema-backfill/commands.json","reviewFile":".harness/evidence/2026-10-26-governance-evidence-schema-backfill/review.md","changeRef":"none","planRefs":["docs/harness/tasks/2026-10-26-governance-evidence-schema-backfill.task.md"]}}
```

> Backfill note: this block is written natively by the round that produced the artifacts, not appended after the fact. The same schema rules it satisfies were what made 31 historical artifacts fail.
