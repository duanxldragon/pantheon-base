# Summary — 2026-10-07-release-readiness-remediation (local remediation)

Implements findings F01–F06 (code) and the local-runnable parts of G01/G03, as
planned in the 2026-10-07 enterprise release readiness review. Final acceptance
remains pending candidate-SHA and runtime evidence.

## Code remediation (child evidence in own dirs)

| Task | Findings | Fix |
| --- | --- | --- |
| iam-data-scope | F01, F06 | Missing policy rows and query failures now fail closed; migration explicitly backfills legacy all-scope roles; empty custom scope remains restrictive; role-key edits migrate the existing custom policy; policy reads are uncached so restrictions are visible across instances |
| audit-request-body | F05 | Multipart auditing only observes an already-parsed form, with bounded metadata; non-JSON and malformed JSON bodies persist only a marker; audit copy defaults to 16KiB with full-body restore for handlers |
| auth-session-scope | F02, F03 | Self-service revoke verifies ownership + current-session rule; admin session list/count/revoke/batch-revoke tenant-scoped, compat = platform exception; artifacts only invalidated for actually-revoked rows |
| login-log-identity | F04 | Own login logs use exact authenticated identity; admin LIKE filter preserved |
| governance-gate-repair | G01 | SHELL_VERSION.json restored (required landing artifact deleted in #358); frontmatter mirror verified identical to upstream |
| upgrade-runbook | G03 | v0.14.0 upgrade steps rewritten to real migration path (tenant-migration-execute.sh + COMPAT_TO_MULTI_UPGRADE.md); SQL in sql blocks |

Both `/tenants/:id/members` and the additive `/tenants/:id/members/page` alias now return the bounded `{items,total,page,pageSize}` envelope; no frontend consumer of the removed bare-array shape exists.

## Local verification (dirty working tree, not a candidate SHA)

- `go build ./...`, `go vet ./...`, and `git diff --check` pass.
- Full `go test ./...` passes with MinGW `CGO_ENABLED=1`, including tenant
  SQLite handler contract tests. Focused `go test -race` passes for middleware,
  role, and tenant. MySQL-backed cases still skip without `PANTHEON_TEST_DSN`.
- Frontend: build (including type-check and contract checks), lint, and unit
  tests (163/163) pass on the current worktree.
- `npm audit --registry=https://registry.npmjs.org`: 0 high/critical, 6
  moderate in development coverage tooling. `--omit=dev`: 0 vulnerabilities.
- Governance: check:task-packet (0 errors; 28 historical warnings),
  check:harness-sync, check:harness-docs, and check:harness-adoption pass.

## Explicit remaining gaps (Wave 1 / Wave 2, maintainer environment)

- Hosted Docs Governance / Quality Gates / Release Gate reruns on a pushed
  candidate SHA (blocked by G02 open-PR closeout — PR #359–#362 decision).
- One-shot migration drill for G03.
- Sonar 26 MAJOR findings triage with disposition evidence.
- Hosted candidate-SHA CI/Release Gate and Sonar analysis ID.
- Go 1.26.9 govulncheck and tenant SQLite/race execution require hosted toolchains; local MySQL EXPLAIN/P95/connection and migration rollback evidence are recorded. Larger enterprise-volume dashboard load remains unknown.
- The additive tenant pagination API is documented and tested. Ops has no direct
  matching endpoint reference in its owned source, but foundation rebuild and
  consumer smoke remain pending on the eventual candidate SHA.
- Six moderate development-only npm advisories remain; the available npm fixes
  downgrade coverage tooling across a major version and were not applied blindly.
- P1 followups: performance-followup and ui-maintainability-followup are locally closed; their remaining environment evidence is linked from qualification.

Local code gates are green, but release qualification is not complete. Release
judgment stays with the maintainer; no solo-override used.
