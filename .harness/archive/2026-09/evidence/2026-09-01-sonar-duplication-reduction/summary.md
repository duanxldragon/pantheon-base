# Verification Summary: 2026-09-01 Sonar duplication reduction

- SonarCloud baseline: `4.10%`, `5,936` duplicated lines / `128,506` NCLOC for `duanxldragon_pantheon-base` (public measures, 2026-09-01).
- Local duplication gate after behavior-preserving refactors: `1.61%`, `1,894 / 117,669` normalized lines; threshold `<= 3.00%` passes.
- Main reductions: lowcode field-template factory, shared frontend list actions/governance presentation, and backend test/service helpers.
- `go test ./...` passed.
- Frontend `npm run lint`, `npm run type-check`, `npm run build`, generator quality tests, UI/search/menu/i18n/system-page/smoke-coverage contracts passed.
- `git diff --check` passed.
- UI evidence: build and contract checks passed; no CSS or interaction semantics changed. Browser screenshots/runtime data states were not run because the local backend route was unavailable; this remains an explicit visual/runtime gap.
- Hosted SonarCloud re-analysis is required to confirm the cloud metric is below `3.00%` after the changes are pushed.
