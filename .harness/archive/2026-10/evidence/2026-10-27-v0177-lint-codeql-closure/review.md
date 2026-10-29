# Review — 2026-10-27 v0.17.7 lint and CodeQL closure

Reviewed against `main` at `96ef1d66` (the `v0.17.6` publication-facts closeout, PR #429), with
`pantheon-base-v0.17.6` (tag object `2bc79966`, target `c9bc6c0f`) as the previous release.

## Scope audit

`git diff --stat main` for the code portion reports three files, +13 lines, 0 deletions. Nothing else
in the release changes behaviour: the rest of the diff is version material (`VERSION`, `CHANGELOG.md`,
`README.md`, `README.en.md`, `RELEASE_NOTES_v0.17.7.md`) and this packet's artifacts.

The audit question for a suppression round is not "does it compile" but "does it hide a real problem".
Each of the three dispositions was checked against that:

| Disposition | Does it hide a defect? |
|---|---|
| `//nolint:revive` on `SettingService` | No. revive's stutter rule is a naming-style opinion; the alternative is a breaking export rename with zero safety effect. The reason is written next to the suppression, so a reader learns that the rename was weighed and deferred. |
| `// codeql go/log-injection` × 4 on `logger.go` | No, and independently tested. `SanitizeLogValue` removes CR/LF, Unicode line separators and other control characters before a value reaches a sink, `sanitizeLogFields` applies it field-by-field, and `TestSanitizeLogMessage` / `TestSanitizeLogFields` pass (`ok … 0.020s`). The maintainer had already dismissed two alerts of the same rule on exactly this argument; annotating all four sinks moves that conclusion from GitHub state into the source, where a line shift cannot silently undo it. |
| `// codeql js/file-access-to-http` × 7 on the tenant-matrix fixture | No. The flagged taint source is the manifest the fixture writes into the gitignored `.tmp` directory and reads back, and every read value is used to call the backend instance that same fixture provisioned. It is a development harness, not a request path: no untrusted input reaches it, and no production code imports it. |

No suppression was added to a file that ops owns; the ops-owned `go/path-injection` finding on
`business/filedist/storage_service.go` was closed with a real fix (filename reduced to its last path
element, `..` segments rejected before `filepath.Clean` can resolve them, plus two regression tests that
were shown to fail when the guard is removed) rather than by annotation.

## Claim audit

| Release-note / packet claim | Evidence |
|---|---|
| The release is comment-only | `git diff --stat main` → +13 / −0 on the three code files |
| The revive suppression works | `golangci-lint run --new-issues-only --new-from-rev=main ./...` → **0 issues**, where the same command on `main` reports `setting_service.go:45:6: … stutters (revive)` |
| The sanitizer actually guards the log path | `go test -run Sanitize ./pkg/logging/...` → ok 0.020s; `TestSanitizeLogMessage`, `TestSanitizeLogFields` |
| No schema/route/permission/menu/i18n change | `backend/pkg/database/migrations` untouched (chain still ends at `000030`); no handler, seed, contract or locale file appears in the diff |
| Governance chain stays green with the new packet | frontmatter / encoding / structure / task-packet / pr-governance / duplication / ui-quality-gate / generated all exit 0 |
| Frontend still type-checks | `tsc -b` exit 0 |

## Findings

No blocking finding. Residuals:

- **F1 (P2, open, maintainer gate).** `SonarCloud Scan` is red on every PR run with a 403 on
  `GET https://api.sonarcloud.io/analysis/jres` — an invalid or missing `SONAR_TOKEN`, not a code
  defect. It predates this round (every run since 2026-09-17). Repair is a credential/gate-policy
  decision; nothing here changes Sonar rules, project configuration or the workflow to disguise it.
- **F2 (P3, environment).** `go test -race` is unavailable on this host (cgo disabled); the race reading
  comes from the Linux CI job. Recorded rather than assumed.
- **F3 (P3, deferred by decision).** `SettingService` keeps the stutter. If the rename is ever taken, it
  must land as a breaking minor with a consumer migration note, and this suppression should be deleted
  in the same commit rather than left behind.
- **F4 (P3, observation).** `.foundation/allowed-drift.json` did its job: the only way to close these
  findings was base-first. A round that had hand-edited them in ops would have been silently reverted by
  the next `rebuild:from-base`.

## Verdict

Approved. The change is the minimum that satisfies base-first for three findings that belong to base,
each suppression states the guard it relies on, one of them is backed by a passing sanitizer test, the
key gate reading (lint 0 issues in the CI form) was produced on the real tool, and the environment gaps
are recorded instead of papered over.

## Machine Readable

```json
{
  "taskId": "2026-10-27-v0177-lint-codeql-closure",
  "verdict": "approved",
  "structuralReview": {
    "affectedSubgraph": [
      "platform/logging",
      "system/config/setting",
      "frontend/scripts/tenant-matrix-fixture"
    ],
    "checks": ["cycle", "hub", "sensitive-flow"],
    "findings": [],
    "notes": "No module edge is added or removed: the diff inserts comment lines only, so cycles and hubs are unchanged by construction. sensitive-flow was still examined because the round touches the log sink that carries security-relevant fields and the SSRF-adjacent smoke fixture: the log path is protected by SanitizeLogValue/sanitizeLogFields with passing tests, and the fixture reaches only a loopback backend it provisions itself, so no new trust boundary is crossed. The setting rename was deliberately not taken, keeping the export surface stable for consumers."
  },
  "linkage": {
    "taskManifest": ".harness/tasks/2026-10-27-v0177-lint-codeql-closure/manifest.json",
    "evidence": ".harness/evidence/2026-10-27-v0177-lint-codeql-closure/commands.json",
    "reviewFile": ".harness/evidence/2026-10-27-v0177-lint-codeql-closure/review.md",
    "changeRef": "none",
    "planRefs": [
      "docs/VERSION_MANAGEMENT_GUIDE.md",
      "docs/harness/tasks/2026-10-27-v0176-release-closeout.task.md",
      ".harness/evidence/2026-10-24-single-tenant-scope-closeout/summary.md"
    ]
  }
}
```
