# Verification Summary: 2026-07-08-base-upload-default-types-release-sync

## Scope

Validate a base shared-upload change, cut a new foundation release, and confirm `pantheon-ops` consumes it through the existing foundation-release pipeline.

## Results

- Base backend tests passed: `go test ./backend/pkg/upload ./backend/modules/system/config/setting`.
- `pantheon-base` cut `base-v0.8.11` from base commit `a201a13f05615903f2d57df4809e2a923a87c668`.
- The release metadata was committed as `709c7889f36293294483e04d1ed4c938d78ed6ca` and tagged `base-v0.8.11`.
- `pantheon-ops` consumed the new release through `npm run upgrade:foundation:local-apply -- --release-version base-v0.8.11`.
- `npm run check:inheritance`, `npm run check:base-sync`, and `npm run check:base-sync:workspace` all passed in `pantheon-ops`.

## Runtime Evidence

- `upload.allowed_types` defaults now include `webp` and `gif` in both shared runtime config and seed data.
- Legacy `upload.allowed_types` values migrate to the new default whitelist.
- The consumer lock now points to `base-v0.8.11` and the shared backend/frontend remain aligned with that release.

## Known Gaps

- `pantheon-ops` still contains the pre-existing user-owned smoke edit in `frontend/tests/smoke/system/system-pages.spec.ts`; it was preserved and not overwritten.
- No remote GitHub release publish was attempted in this session; the release was cut and consumed locally.
- No separate browser evidence was needed because this task only exercised shared backend/config and foundation-release plumbing.
