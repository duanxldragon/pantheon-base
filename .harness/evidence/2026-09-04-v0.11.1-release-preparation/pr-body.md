## Owning Layer

Platform/system smoke verification and test governance.

## Change Boundary

Stabilize Core Smoke selectors and setup/cleanup helpers. No production runtime code or API contracts changed.

## Affected Subgraph

`frontend/tests/smoke-core/*` and shared smoke fixture helpers. Authentication remains through existing `tests/smoke/helpers/auth.ts` contracts.

## Verification

- `cd frontend && npm run type-check`
- `cd frontend && npm run lint`
- `cd backend && go test ./...`
- `git diff --check`

## Evidence Summary

The previous release candidate Core Smoke run passed authentication tests but failed on responsive sidebar assertions, hidden submenu selectors, form field selectors, and browser download-event assumptions. This change uses semantic state assertions, explicit submenu expansion, visible form-item labels, deterministic readiness waits, and export response validation.

## Known Gaps

The local environment lacks MySQL/Redis, so full Core Smoke requires hosted CI validation. Sonar and all required checks must pass on the follow-up PR before merge.
