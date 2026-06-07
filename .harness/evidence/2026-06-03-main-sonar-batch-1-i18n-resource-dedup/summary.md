# Verification Summary: 2026-06-03-main-sonar-batch-1-i18n-resource-dedup

## Scope

- Primary layer: `system/config`
- Changed files:
  - `frontend/src/i18n/resources/en-US.ts`
  - `frontend/src/i18n/resources/fr-FR.ts`
  - `frontend/src/i18n/resources/ja-JP.ts`
  - `frontend/src/i18n/resources/ko-KR.ts`
  - `frontend/src/i18n/resources/locale-utils.js`
  - `frontend/src/i18n/resources/locale-utils.d.ts`
  - `frontend/scripts/audit-i18n-locales.mjs`
  - `frontend/scripts/check-i18n-generated-scope.mjs`
  - `frontend/scripts/check-menu-contract.mjs`
  - `frontend/scripts/export-i18n-builtin-snapshot.mjs`
  - `tests/scripts/check-i18n-generated-scope.test.mjs`
  - `docs/designs/I18N_MODULE_DESIGN.md`
  - `docs/designs/I18N_MODULE_DESIGN.en.md`
  - `.harness/evidence/2026-06-03-main-sonar-batch-1-i18n-resource-dedup/commands.json`
  - `.harness/evidence/2026-06-03-main-sonar-batch-1-i18n-resource-dedup/review.md`

## Commands

| Command | CWD | Result | Notes |
|---|---|---|---|
| `node --test tests/scripts/check-i18n-generated-scope.test.mjs` | `pantheon-base` | passed | new test covers imported derived-locale modules plus `locale-utils` reconstruction |
| `node frontend/scripts/check-i18n-generated-scope.mjs` | `pantheon-base` | passed | generated-scope checker now resolves `.ts` and `.js` imported resource helpers |
| `node frontend/scripts/audit-i18n-locales.mjs` | `pantheon-base` | passed | all 5 locales still expose `2491` keys with `missing=0` and `empty=0` |
| `cd frontend && npm run lint` | `pantheon-base/frontend` | passed | no new lint errors; existing `react-hooks/exhaustive-deps` warnings remain outside this batch |
| `cd frontend && npm run build` | `pantheon-base/frontend` | passed | prebuild gates and production build both passed after switching helper typing to `locale-utils.js` + `locale-utils.d.ts` |
| `node scripts/run-sonar-remediation.mjs --task 2026-06-03-main-sonar-remediation --group baseline --execute` | `pantheon-base` | passed | parent baseline runner stayed green after the locale-resource refactor |
| `node frontend/scripts/report-system-i18n-audit.mjs --json` | `pantheon-base` | failed | runtime audit is blocked locally because no backend is listening on `127.0.0.1:8080` |

## Structural Dedup Summary

- Non-base locale files literal key declarations dropped from `8824` to `0`.
- Non-base locale files total bytes dropped from `696567` to `465804` (`-230763` bytes).
- Non-base locale files total line count dropped from `10183` to `10002`.
- Ownership now splits cleanly into:
  - `zh-CN.ts` as the only complete builtin key source
  - derived locale value arrays for `en-US` / `fr-FR` / `ja-JP` / `ko-KR`
  - `overrides/*.ts` for manual patches
  - `generated/*.ts` for schema-generated keys only

## Browser Evidence

- none

## Known Gaps

- `frontend/scripts/report-system-i18n-audit.mjs` still needs a live backend session to produce runtime governance evidence; this workstation returned `ECONNREFUSED 127.0.0.1:8080`
- local Sonar was not re-run for this batch because `pantheon-sonarcloud.env` and SonarScanner are still absent on this workstation
- locale audit still reports `sameAsEn=101` for `ja-JP` / `ko-KR` / `fr-FR`; that is a pre-existing translation-content gap, not a structural duplication regression

## Completion Status

verified / runtime-gap
