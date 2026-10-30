# Review — `2026-10-30-menu-contract-inline-const`

Reviewed branch `fix/menu-contract-inline-const` against `main` @ `1eabf455`. The questions are
whether the sensor repair is the right landing side, whether the two narrowing rules are honest,
and whether anything was silenced to get green.

## Reviewer posture, item by item

| Posture item | Reading |
| --- | --- |
| The defect is measured, not inferred | For a seed whose `Path` references an inline package constant, the HEAD sensor fails with `后端缺少菜单 seed: /system/login-log` — it blames the backend for a seed that exists and is correct — while the repaired sensor passes the same tree with `19 菜单 / 23 路由 / 102 权限 / 23 组件键`. Both readings are in `commands.json` (entries 5-7). |
| The fail-loud half actually fires | With the reference pointed at an identifier declared nowhere, the repaired sensor's first finding is `后端 seed 引用了无法解析的常量: Path: probeUndeclaredConst (…login_menu.go)`, followed by the downstream consequence (entry 8). Before the change both cases produced an empty string and no finding. |
| The fix is minimal | `git diff --numstat` is +94/-22 in the sensor, +1 in `package.json` (a test alias), +2/-1 in the failure registry. No seed, menu manifest, route, permission key, i18n resource, backend file or workflow is touched — the objects the gate verifies are untouched, only the verifier changed. |
| The gate did not go green by narrowing | The retained-tree run reports the same counts as before the change (19 / 23 / 102 / 23), and the unit suite asserts that `var x = "…"` and `k := "…"` are *not* collected, so widening the constant table did not swallow runtime assignments. |
| The two narrowing rules come from a failure | The first iteration reported 4 findings from Go code shaped like a seed block (`Key: item`, `Key: strings`, `Key: localeKey`, `Module: canonical`, all from `system/i18n/i18n_seed.go`). Bare-identifier detection and retained-block scoping are the response to that noise, and the noisy reading is recorded in evidence instead of iterated away silently. |
| Retained-only scoping does not hide the defect itself | For menu seeds a fully-dropped block still produces `后端缺少菜单 seed`, so the finding is redundant, not load-bearing. For the i18n seeds the registration is deliberately hoisted above the `&& key` test, because an unresolved reference empties `key` — gating the report on the emptied value would let the defect decide whether it is reported. |
| The landing side is base | The consumer carries a byte-identical copy of the sensor and `.foundation/allowed-drift.json` refuses generic drift, so a consumer-side patch would be overwritten by the next `rebuild:from-base`. `ops` recorded this as residual risk ⑥ with disposition 「回 base 修（任务 #38）」; this package is that fix. |
| Tests are wired without a workflow edit | The file sits in the `tests/scripts/*.test.mjs` glob that `ci.yml` already runs via `npm run test:scripts` (181/181 locally), and `test:menu-contract` is added only as a convenience alias. The sensor itself runs in `quality.yml` as before. |
| Nothing was silenced | No `NOSONAR`, `//nolint`, `eslint-disable`, exclusion, threshold change or gate-rule edit appears in the diff; the registry change adds a row, it does not downgrade one. |
| The release boundary is stated, not crossed | `VERSION`, `CHANGELOG.md` and `docs/release-notes/**` are absent from the diff, and the manifest records that consumer absorption needs a patch release whose timing is a maintainer decision, because a tag and its assets cannot be recalled. |
| The dirty tree is respected | The six pre-existing uncommitted i18n files are neither staged nor verified; `check:harness-adoption`'s only remaining findings name them. |

## Findings

- **P2, the sensor is still a source-regex parser, not a Go AST consumer.** `iota`, `fmt.Sprintf`
  and cross-package qualified constants stay unresolvable. What changed is the failure mode: a named
  finding instead of an empty value. A real fix would consume the Go syntax tree, which is a wider
  design decision than this packet and is left explicit in `knownGaps`.
- **P3, the repair is inert for the consumer until a foundation release carries it.** The ops copy
  keeps the pre-fix behaviour until then; no consumer file was touched, per Base-first.
- **P3, retained-block scoping leaves one blind spot by construction.** A menu seed whose `Path`,
  `PagePerm` and `Perms` are *all* unresolved is dropped before it can be reported; the packet
  accepts this because the downstream `后端缺少菜单 seed` still fires. It is a diagnosis-order
  weakness, not a missed defect.
- **P3, `pantheon-ops`' `const ( … )` workaround is not normalized here.** It stays legal (both
  shapes are collected) and rolling it back is the consumer repository's own review.

## Post-merge record

- PR #471 opened from `fix/menu-contract-inline-const` (commit `e253757d`) through
  `node scripts/create-pr.mjs`, so `check-pr-governance` validated the exact body before GitHub saw it.
- `Pull Request Automation` enabled squash auto-merge seconds after the PR opened; it was disabled through
  GraphQL so the merge stays an explicit decision taken after the check read-back, not an automatic one.
- Check read-back on the final commit: 37 checks — 36 success, 2 skipped (`Draft PR Handler`,
  `PR Smoke Core (Optional)` without the `smoke-required` label). `Unit Tests`, `Fast Checks`,
  `Quality Gates`, `Docs Governance`, `CodeQL Security`, `SonarCloud Code Analysis`, `Coverage Gate`
  and `Duplication Gate` are all green; nothing was exempted, relabelled or re-thresholded.
- Merged as squash commit `03e13d4825525a468a4f93de3b7df3e7d654d482` (2026-10-30T09:25:01Z); the branch is
  gone both remotely and locally. Push-triggered runs on `main`: CI, Security Gates, Lint Workflows,
  Core Smoke Tests, Code Quality Gates and Full Smoke Suite all success.
- `Release Gate` on `03e13d48` is red for 6 unresolved SonarCloud `githubactions:` findings that live in
  `.github/workflows/{ci,quality,release-gate,security}.yml` — outside this package's diff, and reported as 0
  by the identical query on the previous main analysis (2026-10-29T04:50Z). It is repaired in its own Base
  package; this package did not silence, mark-false-positive or baseline-move it.

## Machine Readable

```json
{
  "taskId": "2026-10-30-menu-contract-inline-const",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "frontend/scripts/check-menu-contract.mjs",
      "tests/scripts/check-menu-contract.test.mjs",
      "package.json",
      "docs/harness/failure-registry.md",
      "docs/harness/tasks/2026-10-30-menu-contract-inline-const.task.md",
      ".harness/tasks/2026-10-30-menu-contract-inline-const/manifest.json",
      ".harness/evidence/2026-10-30-menu-contract-inline-const/"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [
      "P2: the sensor remains a regex-over-source parser, so iota, fmt.Sprintf and cross-package qualified constants stay unresolvable — they now fail loudly instead of silently.",
      "P3: consumer absorption waits on a patch release; VERSION, CHANGELOG.md and docs/release-notes/** are deliberately not in this diff because publication is irreversible.",
      "P3: a menu seed whose Path, PagePerm and Perms are all unresolved is dropped before it can be reported, and the downstream 后端缺少菜单 seed finding still fires.",
      "P3: the ops const-block workaround is left in place and is the consumer repository's own decision to normalize."
    ],
    "notes": "Base-first sensor repair: the menu-contract gate built its Go package constant table from const ( … ) block entries only, so an inline const name = \"value\" never entered the table and extractField returned an empty string for any seed field referencing it — identical to an absent field — which dropped the whole seed from the checked set. The repair collects both declaration shapes, treats only a bare identifier as a constant reference, and turns an unresolvable reference on a retained seed block into a named finding emitted before its downstream consequences. Verified by a 10-case unit test inside the existing test:scripts glob, by the unchanged retained-tree gate reading (19 menus / 23 routes / 102 permissions / 23 component keys), and by a measured HEAD-vs-repaired pair of readings on the same seed plus an undeclared-identifier negative control whose temporary fixture was restored. No seed, menu, route, permission, i18n, backend, workflow, VERSION or gate-rule file is touched; no suppression, exclusion or threshold change was used."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-30-menu-contract-inline-const/manifest.json",
    "evidence": ".harness/evidence/2026-10-30-menu-contract-inline-const/commands.json",
    "reviewFile": ".harness/evidence/2026-10-30-menu-contract-inline-const/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/harness/failure-registry.md",
      "docs/designs/REPOSITORY_LAYOUT.md",
      "docs/harness/VERIFICATION_EVIDENCE_SPEC.md"
    ]
  }
}
```
