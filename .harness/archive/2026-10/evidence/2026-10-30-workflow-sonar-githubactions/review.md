# Review — `2026-10-30-workflow-sonar-githubactions`

Reviewed branch `fix/workflow-sonar-githubactions-smells` against `main` @ `03e13d48`
(the merge commit whose `Release Gate` is red). The questions are whether the six
findings were repaired in the files that carry them, whether any gate decision changed
on the way, and whether the two guard tests were weakened to accommodate the edit.

## Reviewer posture, item by item

| Posture item | Reading |
| --- | --- |
| Diff contains only 4 workflows, 2 guard tests, failure-registry, packet files | `git diff --numstat`: `ci.yml` +7/−6, `quality.yml` +17/−15, `release-gate.yml` +4/−4, `security.yml` +2/−2, `quality-workflow.test.mjs` +6/−1, `release-gate-workflow.test.mjs` +3/−2, `failure-registry.md` +2/−0. No backend, `frontend/**`, `config/**`, `sonar-project.properties`, `VERSION`, `CHANGELOG.md` or release-notes file. |
| Every gate decision unchanged | All four edits are (a) a step `env` addition, (b) `"success"` → `"$GATE_OK"` inside the same comparisons, (c) `>&2` on one message that already preceded `exit 1`, (d) wording of informational lines. No `needs`, `if:`, `continue-on-error`, `exit` condition, required-check set or Sonar query was touched; the guard tests that pin those conditions still pass (quality 5/5, release-gate 7/7, security 1/1, bench 2/2, pr-automation 4/4). |
| All six findings repaired in the file, nothing suppressed | S1192 ×3: hoisted to `GATE_OK: success` per step (8 + 7 + 5 comparisons). S7677 ×3: two informational lines reworded away from severity words (`release-gate.yml:136/143`), one reworded (`security.yml:301`), plus the genuinely-error line at `security.yml:242` and `ci.yml`'s error exit redirected to stderr. No `NOSONAR`, `//nolint`, False-Positive marking, baseline move or query change; the Sonar token was used only for read-only GETs as a shell variable. |
| Guard tests re-pointed, not relaxed | `quality-workflow.test.mjs` now matches `/GO_LINT_RESULT.*!=.*\$GATE_OK/` **and** adds `/GATE_OK:\s*success/`; `release-gate-workflow.test.mjs`'s per-variable loop matches the `"$GATE_OK"` form, keeps `assert.doesNotMatch` that `GO_LINT` must stay advisory, and asserts the constant declaration. Renaming or re-valuing the constant turns both red, so the assertion is equal-strength by construction. |
| Behaviour preserved, measured not asserted | `bash -n` on both modified run blocks; a standalone simulation with `GATE_OK=success` returns pass for five `success` values and blocks with exit 1 when one variable is `failure`. `npm run test:scripts` 181/181. |
| Nothing outside the finding was churned | `release-gate.yml:281-284` (4) and `security.yml:108-110` (3) keep the literal: the smallest repetition Sonar actually reported is 5, so they are below the rule's threshold, and hoisting them would widen a release-blocking diff without closing a finding. Recorded in `commands.json` knownGaps rather than quietly left out. |
| The red is not misattributed | The merged PR #471 diff is 10 files with zero workflow files (`git diff 1eabf455..main --stat`), and `git diff 1eabf455..main -- .github/workflows` is empty — the review claim that `Release Gate` failed for pre-existing debt holds against the tree, not only against the packet text. |

## Findings

- P2: the class has no local sensor. Workflow YAML style/debt is only observed by Sonar at
  the release checkpoint, so it can always reappear as a `main` red attributed to whichever
  merge happened to trigger the analysis. FR-023 records this as `no-repeat-observed`;
  adding a checker is a separate decision.
- P2: end-state proof is deferred. `main`'s `Release Gate` reading of
  `Unprocessed SonarCloud issues: 6 → 0` can only come from the post-merge push analysis,
  and this packet must not be called closed before that number is read back.
- P3: four sub-threshold `"success"` repetitions remain in `release-gate.yml` and
  `security.yml`. Growing either step past the threshold creates a new finding at the next
  analysis, with no local warning beforehand.
- P3: the re-detection mechanism itself is unexplained by the Sonar API (empty changelogs,
  old creation dates, previous query returned 0). The repair does not depend on it, and no
  Sonar-side setting was altered to change the number in either direction.

## Post-merge record

- The deferred P2 end-state proof is now taken and recorded: PR #473 merged as `c1f0b1dd`
  (2026-10-30T15:03:21Z), and the post-merge `main` Release Gate run `41077154410`
  completed `success` with `Unprocessed SonarCloud issues: 0` and
  `SonarCloud quality gate for c1f0b1dd…: OK` in the `SonarCloud Gate` job log.
- Cross-checked outside the workflow: `api/issues/search` on `branch=main` returns 0 and
  `api/measures/component` reports 0 bugs / 0 vulnerabilities / 0 code smells / 0 hotspots
  over 163,314 ncloc, so the zero is a full-repo reading rather than a narrowed query.
- Every other `main` workflow on the same commit is `success` (CI, Code Quality Gates,
  Security Gates, Lint Workflows, Core Smoke Tests, Full Smoke Suite), which is the
  condition this package was opened for.
- Reviewer check after merge: the diff that produced the reading touched only the four
  workflows, the two guard tests, `docs/harness/failure-registry.md` and this package's own
  documents. No `needs`, `if`, threshold, permission or Sonar query line moved, and no
  suppression marker (`NOSONAR`, `nolint`, false-positive transition, baseline change) was
  used at any point.
- The two sub-threshold literal clusters (`release-gate.yml:281-284`,
  `security.yml:108-110`) intentionally keep the literal and stay open as P3.
- Sonar registers only `main` as a branch for this project, so a pre-merge fix branch cannot
  be probed with `branch=<name>`: an unknown branch returns 0 and would read as success. The
  PR-context query (`pullRequest=473`, total 0) is the meaningful pre-merge probe.

## Machine Readable

```json
{
  "taskId": "2026-10-30-workflow-sonar-githubactions",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      ".github/workflows/quality.yml",
      ".github/workflows/ci.yml",
      ".github/workflows/release-gate.yml",
      ".github/workflows/security.yml",
      "tests/scripts/quality-workflow.test.mjs",
      "tests/scripts/release-gate-workflow.test.mjs",
      "docs/harness/failure-registry.md",
      "docs/harness/tasks/2026-10-30-workflow-sonar-githubactions.task.md",
      ".harness/tasks/2026-10-30-workflow-sonar-githubactions/manifest.json",
      ".harness/evidence/2026-10-30-workflow-sonar-githubactions/"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [
      "P2: no local sensor reads workflow YAML, so this debt class can only surface as a main Release Gate red on whichever merge triggers the next Sonar analysis.",
      "P2: the end-state reading (main Release Gate Unprocessed SonarCloud issues 6 -> 0) requires the post-merge push analysis and must be recorded before this package is called closed.",
      "P3: release-gate.yml:281-284 (4 occurrences) and security.yml:108-110 (3 occurrences) stay below the observed repetition threshold of 5 and keep the literal; adding a gate to either step creates a new finding at the next analysis.",
      "P3: why Sonar re-detected six findings with empty changelogs and July-to-October creation dates is not exposed by the API; nothing was changed Sonar-side to influence the number."
    ],
    "notes": "Release Gate red on main at 03e13d48 traced to six githubactions code smells inside .github/workflows, not to the merged change: the same query returned 0 on the previous main analysis and the merged diff contains zero workflow files. The repair is in the files that carry the findings — the repeated success literal is hoisted to a step-level GATE_OK constant in the three steps Sonar named, informational count and pass lines are reworded away from severity words, and two genuine error exits now write to stderr. Gate semantics, needs, if conditions, thresholds and the Sonar query are untouched, and the two workflow guard tests were re-pointed to the new form while gaining an assertion that the constant itself is declared, so the replacement is equal-strength rather than relaxed. Verified by five workflow guard suites (5/1/7/2/4 pass), npm run test:scripts 181/181, bash -n on the modified run blocks, and a behaviour simulation of the hoisted comparison. No NOSONAR, nolint, false-positive marking, baseline move or query change was used."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-30-workflow-sonar-githubactions/manifest.json",
    "evidence": ".harness/evidence/2026-10-30-workflow-sonar-githubactions/commands.json",
    "reviewFile": ".harness/evidence/2026-10-30-workflow-sonar-githubactions/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/failure-registry.md",
      "docs/harness/AI_QUALITY_GOVERNANCE.md",
      "docs/harness/VERIFICATION_EVIDENCE_SPEC.md"
    ]
  }
}
```
