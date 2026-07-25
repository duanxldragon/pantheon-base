# Summary — 2026-07-25-sonar-scope-and-s8545

## What changed

1. **`.sonarcloud.properties` (new)** — scopes SonarCloud automatic analysis to
   shipped product code. Excluded, with per-group rationale in the file:
   - `scripts/**`, `frontend/scripts/**` — repo tooling (261 OPEN issues), not
     shipped product code; guarded by its own `tests/scripts/*` suites and CI.
   - `database/**`, `**/*.sql` — DDL/seed/migration files (47 OPEN issues);
     plsql application-code rules (S1192 etc.) only produce noise on seed data.
   - `frontend/src/i18n/resources/**` — translation maps whose 47 findings are
     all `typescript:S2068` hardcoded-credential false positives on translation
     strings for password UI labels. Autoscan supports no rule-level ignore, so
     the resource files are excluded wholesale.
2. **`ci.yml` / `quality.yml`** — the two `githubactions:S8545` findings
   (`go install golangci-lint@v2.6.2` is not a lock-file-enforcing install) are
   fixed by switching to `golangci/golangci-lint-action` pinned to the v9.3.0
   commit `ba0d7d2ec06a0ea1cb5fa41b2e4a3ab91d21278a`, keeping golangci-lint at
   v2.6.2. Gate semantics unchanged: ci.yml stays report-only; quality.yml
   keeps `--new-from-rev` PR enforcement via a args-compute step.

## Rejected alternative (recorded)

`go get -tool golangci-lint@v2.6.2` (Go 1.26 tool directive) was tried first
and reverted: MVS downgraded the product dependency `minio-go v7.2.1 → v7.1.0`;
restoring minio drifted golangci-lint to 2.12.2. A freeze-period product
dependency change for a lint install path is not acceptable, so the SHA-pinned
action (prebuilt, checksum-verified binary, zero go.mod impact) was chosen.

## Coverage = 0 root cause (maintainer question)

SonarCloud shows no coverage because the project uses **automatic analysis**,
which reads sources from the repo, runs no tests, and imports no coverage
reports (`api/measures/component` returns only `ncloc`; no `coverage` metric
exists). CI already produces both reports (`backend/coverage.out`, Go 12.3%
vs threshold 11; `frontend/coverage/lcov.info`, lines 93.5% on the covered
core scope) — nothing uploads them to SonarCloud.

Fix = switch to CI-based analysis with `sonar.go.coverage.reportPaths` +
`sonar.javascript.lcov.reportPaths`. **Deferred post-freeze deliberately**:
the project is on the built-in "Sonar way" quality gate whose
`new_coverage >= 80%` condition starts evaluating the moment coverage data
exists, and the upcoming mechanical remediation batches over ~12%-covered Go
code would turn the quality gate red and block the Release Gate.

## Expected effect

- OPEN backlog: 812 → ~457 after the next main-branch analysis (to be
  verified via `api/issues/search ... statuses=OPEN` post-merge; if autoscan
  ignores the properties file, fall back to the same exclusions via project
  Administration → Analysis Scope in the SonarCloud UI).
- Remaining ~457 are product/test/container code, scheduled as code-fix
  batches (small buckets → go:S1192 constants → frontend style rules → S3776
  cognitive-complexity refactors).
