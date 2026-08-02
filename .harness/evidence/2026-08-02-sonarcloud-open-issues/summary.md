# Summary - 2026-08-02-sonarcloud-open-issues

Status: ready for PR and hosted SonarCloud verification.

Baseline: SonarCloud quality gate `OK`, 77 unresolved code smells.

The remediation is behavior-preserving and split into four disjoint write
scopes. Backend and frontend local gates are green. Pure helper extraction,
readonly prop typing, and comment cleanup do not change rendered UI structure;
UI contract and production build checks are green.

Verification:

- `go test -count=1 ./...` passed.
- `go vet ./...` passed.
- `gofmt` and `git diff --check` passed.
- `npm run lint` and `npm run type-check` passed.
- `npm run test:unit` passed: 15 files / 138 tests.
- `npm run build` passed with elevated permission for `node_modules/.tmp`.
- `npm run test:generator:smoke` passed with elevated permission.
- Frontend menu, i18n, shell/UI, search-toolbar, page-admission, smoke-web,
  and smoke-coverage contracts passed.
- Harness template/docs/inventory/sync/adoption checks passed.
- Duplication check passed at 1.85% against a 3.00% threshold.

Known gaps:

- Local `go test -race ./...` is unavailable because Windows has
  `CGO_ENABLED=0`; hosted Linux Backend Tests is required.
- `gocognit -over 15 .` reports the pre-existing
  `pkg/database/casbin_watcher.go:run` at 16; it is not in the 77-item Sonar
  inventory and was intentionally left out of scope.
- Visual evidence is a no-visual-change rationale; the code only moves
  existing JSX into helpers/components and tightens readonly props.
- The strict visual checker still reports one pre-existing unreadable
  2026-07-29 task manifest outside this task.
- Hosted SonarCloud issue count and PR checks remain pending until push.
