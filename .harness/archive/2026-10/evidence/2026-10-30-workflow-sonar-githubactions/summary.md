# Verification evidence — `2026-10-30-workflow-sonar-githubactions`

- Task: `docs/harness/tasks/2026-10-30-workflow-sonar-githubactions.task.md`
- Manifest: `.harness/tasks/2026-10-30-workflow-sonar-githubactions/manifest.json`
- Commands: `.harness/evidence/2026-10-30-workflow-sonar-githubactions/commands.json`
- Date: 2026-10-30

## What was red, and why it was not the merged change's fault

`Release Gate` on `main` at `03e13d48` (run 41033269295) failed in one job:
`SonarCloud Gate` reported the candidate quality gate as **OK** but
`Unprocessed SonarCloud issues: 6` → `Release blocked`. The other four gate jobs
(Candidate Checks, CodeQL Alerts, Dependabot Alerts, Open PRs) succeeded.

All six are `CODE_SMELL`, `issueStatus OPEN`, and all live in `.github/workflows`:

| Rule | File:line | Report |
|---|---|---|
| `githubactions:S1192` | `quality.yml:285` | literal `success` 8 times |
| `githubactions:S1192` | `quality.yml:983` | literal `success` 7 times |
| `githubactions:S1192` | `ci.yml:483` | literal `success` 5 times |
| `githubactions:S7677` | `release-gate.yml:136` | severity word printed to stdout |
| `githubactions:S7677` | `release-gate.yml:143` | severity word printed to stdout |
| `githubactions:S7677` | `security.yml:301` | severity word printed to stdout |

The same query against the **previous** main analysis (run 40818421372,
2026-10-29T04:50:09Z) returned `Unprocessed SonarCloud issues: 0`, the six issues
carry July-to-October creation dates, and their changelog is empty. So this is
pre-existing debt **re-detected** by today's analysis, not debt introduced by
PR #471 — and `quality.yml` is confirmed in the analysed scope
(`language=yaml`, `ncloc=828`), which is what makes repairing the file the only
converging path.

## How each finding was closed

- **S1192 (three steps).** The literal `"success"` was hoisted into a step-level
  `env: GATE_OK: success` and every comparison in that step now reads
  `!= "$GATE_OK"` — 8 in `quality.yml`'s harness-governance step, 7 in its
  `quality-gates` summary step, 5 in `ci.yml`'s `ci-summary` step. It is a step
  env, not a workflow-level env, because the rule counts per step and a top-level
  name would leak into unrelated jobs.
- **S7677 (three flagged lines, five repaired).** `release-gate.yml:136/143` and
  `security.yml:301` are informational count/pass lines: the words
  `error/critical` were the trigger, not the destination, so they were reworded
  to "blocking" and stay on stdout. `security.yml:242` is the opposite case — it
  precedes `exit 1`, so it is a real error message and now goes to stderr.
  `ci.yml`'s `Critical check did not complete successfully` was both: reworded to
  `Blocking check did not complete successfully` **and** redirected to stderr.
  `release-gate.yml:163/169` repeat the same pattern as the two flagged lines;
  they were repaired together so the next re-analysis cannot add reds one file at
  a time. No `::error::` line was changed — that form is already correct and was
  never flagged.

## What did not change

Gate **semantics** are untouched: no needs edge, `if:` condition, `exit`
condition, `continue-on-error`, required-check set, threshold, or Sonar query
moved. The two workflow guard tests that asserted the old literal form were
re-pointed to the new form **and** given an extra assertion that
`GATE_OK: success` is declared, so renaming or re-valuing the constant now fails
the guard exactly as before — equal strength, not a relaxed test. `bash -n`
passes on both modified run blocks, and a standalone simulation with
`GATE_OK=success` reproduced the original decision: five `success` values pass, a
single `failure` blocks with exit 1.

No `NOSONAR`, no `//nolint`, no False-Positive marking, no new-code baseline move,
no scan-scope or query change. The token was used only as a shell variable for
read-only API calls.

## Gaps

- Why Sonar re-detected them is not exposed by the API. Nothing was changed
  Sonar-side to force the number either way.
- Sub-threshold `success` literals remain (`release-gate.yml:281-284` = 4,
  `security.yml:108-110` = 3, plus single-occurrence steps). The smallest
  repetition Sonar actually reported was 5, so they are legal today; the trade-off
  is recorded in `commands.json` knownGaps.
- No local YAML-style sensor exists, which is why this class can only surface at
  the release checkpoint. FR-023 records the gap as `no-repeat-observed` instead
  of shipping a new checker inside a debt-closure package.
- `pantheon-ops`' own workflow copies are untouched — workflows are per-repository
  CI assets, not a foundation contract surface, so no release or consumer sync is
  implied.

## Post-merge (read-back that closes the package)

- PR #473 squash-merged into `main` as `c1f0b1dd26f3d2051db7e43e428d928786fab45a`
  at 2026-10-30T15:03:21Z, with auto-merge left enabled rather than disabled.
- The post-merge push analysis took the reading this package needs: on
  `c1f0b1dd`, `Release Gate` run `41077154410` completed `success` and its
  `SonarCloud Gate` job logged `SonarCloud quality gate for c1f0b1dd…: OK` plus
  `Unprocessed SonarCloud issues: 0`.
- Independent re-read outside the workflow: `api/issues/search` on `branch=main`
  returns total 0, and `api/measures/component` reports bugs 0, vulnerabilities 0,
  code smells 0, security hotspots 0 over 163,314 ncloc. The number went 6 → 0
  because the six findings were repaired at file level, not because a filter was
  narrowed.
- CI, Code Quality Gates, Security Gates, Lint Workflows, Core Smoke Tests and
  Full Smoke Suite are all `success` on the same commit, so the base repository
  now has no red pipeline on `main`.
- Remaining gap is unchanged by the merge: no local YAML-style sensor exists, so
  the next literal or error-message regression will again surface at the release
  checkpoint. FR-023 keeps `no-repeat-observed` until a second occurrence justifies
  a checker.
