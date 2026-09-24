# Verification Summary

## Scope

The follow-up changes only Core Smoke fixtures and selectors. Production backend and frontend runtime files are unchanged.

## Local Evidence

- `cd frontend && npm run type-check` passed.
- `cd frontend && npm run lint` passed.
- `git diff --check` passed.

## Runtime Evidence

Hosted GitHub Core Smoke, SonarCloud, Quality Gates, Security Gates, and Release Gate Summary remain required before merge and publication. Local Core Smoke is unavailable because MySQL and Redis are not running in this environment.

## Contract Alignment

- Menu smoke now sends `titleKey`, `type`, `isVisible`, and complete menu metadata matching `MenuCreateReq`.
- User smoke now sends `nickname` and `roleIds` matching `UserCreateReq`.
- Menu fixture cleanup reads `titleKey` from the tree response.
