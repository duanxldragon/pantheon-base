# Summary - 2026-08-02-sonarcloud-open-issues

Status: local remediation for the final 15 PR findings is green; hosted SonarCloud and Smoke Sanity reruns are pending for a0c01eae.

Baseline: SonarCloud quality gate `OK`, 77 unresolved code smells.

The remediation is behavior-preserving and split into four disjoint write
scopes. Backend and frontend local gates are green. Pure helper extraction,
readonly prop typing, and comment cleanup do not change rendered UI structure;
UI contract and production build checks are green.

Verification:

- `go test -count=1 ./...` passed.
- `TestPurgeModuleAllowsBusinessStaticModuleWithoutTable` passed after correcting
  its lifecycle-marked-at assertion for prefixed `system.config` keys.
- `TestPurgeManagedModuleAdvancesI18nLifecycle` passed after correcting its
  archived-row lifecycle-marked-at assertion.
- `go vet ./...` passed.
- `gofmt` and `git diff --check` passed.
- `npm run lint` and `npm run type-check` passed.
- `npm run test:unit` passed: 15 files / 138 tests.
- `npm run build` passed with elevated permission for `node_modules/.tmp`.
- `npm run test:generator:smoke` passed with elevated permission.
- Focused Chromium smoke passed for `/system/user` and the user-menu lock-screen
  workflow after the custom Dropdown trigger implemented Arco's trigger
  contract and forwarded its injected props.
- A second focused Chromium run passed for `/system/permission` and the
  user-menu lock-screen workflow after the final Sonar remediation.
- SonarCloud API reported 15 open findings on the prior remote PR head
  `234f3ac8`; commit `a0c01eae` fixes all 15 locally.
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
- Runtime interaction evidence covers the 1280x720 system user page and
  user-menu lock-screen workflow. The correction does not change layout or
  styling; no standalone screenshot artifact was retained.
- The strict visual checker still reports one pre-existing unreadable
  2026-07-29 task manifest outside this task.
- Hosted SonarCloud must confirm zero PR issues, and hosted Smoke Sanity plus
  final Quality Gates remain pending for `a0c01eae`.
