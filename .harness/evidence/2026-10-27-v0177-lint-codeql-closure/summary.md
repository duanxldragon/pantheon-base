# Verification summary — 2026-10-27 v0.17.7 lint and CodeQL closure

## What this round is

`pantheon-ops` PR #149 (consume `pantheon-base-v0.17.6`) came back with five red gates. Four of them
were closed inside ops; one class of finding could not be, because the flagged files are base-owned and
the ops consumer tree is rebuilt from a locked base snapshot:

- `.foundation/allowed-drift.json` states that generic drift is **not** allowlisted and must flow back
  to base.
- `npm run rebuild:from-base` overwrites base-owned paths from the snapshot, so any hand edit ops made
  to `setting_service.go`, `logger.go` or `tenant-matrix-fixture-setup.mjs` would be lost on the next
  rebuild.

So the three findings are fixed here and shipped as `pantheon-base-v0.17.7`.

## The three findings

| # | Gate | Location | Disposition |
|---|---|---|---|
| L1 | Go Lint (revive) | `backend/modules/system/config/setting/setting_service.go:45` | `//nolint:revive` with the reason. Renaming `SettingService` → `Service` is a breaking export for every consumer, including ops overlay call sites; deferred, not rejected. |
| L2 | CodeQL `go/log-injection` | `backend/pkg/logging/logger.go` (Info / Warn / Error / Debug sinks) | Annotated at all four sites: `SanitizeLogValue` strips CR, LF, Unicode line separators and other control characters, `sanitizeLogFields` applies it to every field, `TestSanitizeLogMessage` / `TestSanitizeLogFields` cover it. Two sibling alerts were already dismissed on this argument. |
| L3 | CodeQL `js/file-access-to-http` | `frontend/scripts/tenant-matrix-fixture-setup.mjs` (7 sites) | Annotated: the taint source is the manifest this fixture writes itself under the gitignored `.tmp` directory; the values only address the backend it just provisioned. |

All four logger sinks are annotated rather than only the currently-reported one, because a comment
shifts line numbers and a GitHub dismissal is keyed to the alert fingerprint, not to the source text.

## Local verification (this host)

- `git diff --stat main` on the three code files: **+13 / −0**.
- `go build ./...`, `go vet ./...`, `gofmt -l .` clean.
- **`golangci-lint run --new-from-rev=main ./...` → 0 issues** — the decisive reading: the same command
  on `main` reports L1, so the nolint works, and this is the exact CI form that blocks PR #149.
- `go test -run Sanitize ./pkg/logging/...` → ok 0.020s.
- `frontend` `tsc -b` → exit 0.
- Governance chain: docs frontmatter 363 docs / 266 with frontmatter passed; encoding 0 findings over
  2382 files; structure 0 over 2720 files; task packet 0 errors; PR governance template OK; duplication
  `Result: PASS`; UI quality gate no findings; generated artifacts 0 over 11.

## Explicit gaps (not claimed as verified)

- **Race.** `go test -race` cannot run on this Windows host (cgo disabled). The race reading is the
  Linux CI `Backend Tests` job.
- **CodeQL / Sonar readings.** Only produced by the CI/security jobs; recorded from the run, not from
  this host.
- **SonarCloud stays red (L4).** `SonarCloud Scan` fails with
  `Failed to query JRE metadata: GET https://api.sonarcloud.io/analysis/jres → HTTP 403 Forbidden.
  Please check the property sonar.token or the environment variable SONAR_TOKEN`. It has failed that way
  on every PR since 2026-09-17, i.e. it predates this round. **Repair requires a valid `SONAR_TOKEN`
  from the maintainer** (quality-gate policy touchpoint); per the standing rule no Sonar rule, project
  configuration or workflow was changed to make it look green.
- **`.harness/STATUS.md` deliberately untouched.** The working tree carries another round's uncommitted
  edits to it; merging them into a release commit would attribute someone else's work to this packet.

## Publication trail

Filled in by the closeout follow-up once the tag exists: tag object, four asset SHA-256 values,
`check-release-secrets` reading, `check-release-assets` result and the `Foundation Release Verify` run id.
