# Summary - 2026-07-30-local-consolidation

## Consolidation boundary

This task closes PR #220 by retaining all already-validated commits on local
`main` and fixing only the seven working-tree issues reported by GitHub checks
or review feedback. It does not change a public API, schema, permission policy,
menu contract, or UI behavior.

The recovered scaffold worktree conflicted with newer `main` hardening. Its
conflicting `types.go` and `workspace.go` changes were deliberately resolved
to `main`, preserving restrictive generated-file permissions and guarded file
reads. Non-conflicting recovery work did not add a net working-tree change.

## Code closure

- Token middleware now uses `authtoken.BlacklistUserKey` rather than a duplicate key format.
- Seed cleanup gives GORM a pointer slice for `Pluck`, preventing its reflection panic.
- Post import records canonical i18n keys only for known domain errors; unexpected department-query errors are returned as top-level failures instead of being exposed in row errors.
- User-profile error propagation uses deterministic GORM callback injection instead of DDL mutation.
- The remaining lint findings are addressed by an exported-method comment, restrictive test directories, and shared test constants.

## Local verification

- `gofmt` and `git diff --check` passed.
- `go test ./...` passed for all backend packages.
- Frontend lint, unit tests (15 files / 138 tests), all build preflight
  contracts, TypeScript compilation, and Vite production build passed.
- Docs, encoding, structure, task-template, PR-template, strict harness,
  generated-module, and duplication checks passed. Method health reported only
  the pre-existing missing OpenSpec skeleton warning.
- Local `go test -race ./...` cannot run: the environment has no supported native cgo compiler. The only discovered compiler is Cygwin GCC, which Go rejects for Windows cgo. This is a host limitation, not a test result.

## Hosted verification and cleanup condition

The updated PR must pass GitHub Docs Governance, Backend Tests (Linux race plus
MySQL/Redis), Go Lint, Frontend Contract, Smoke Sanity, security checks, and
SonarCloud before merge. Only after merge will redundant remote/local branches,
worktrees, stashes, and temporary diagnostic reports be removed.

## Sync and UI

No Pantheon Ops synchronization is required: behavior and public contracts are
unchanged. No UI implementation changes occur in this closure; UI evidence is
therefore not applicable to the seven backend corrections. Existing frontend
history on PR #220 is validated by its normal CI frontend contract and smoke
gates.
