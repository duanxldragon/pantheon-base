# Summary: UI cross-review fix round

## Outcome

The accepted `pantheon-ui-cross-review` P1/P2 findings are closed in `pantheon-base`. No `pantheon-ops` file was edited, no commit was created, and `pantheon-base-v1-freeze` was not started.

## Delivered

- Fixed actual fixed-column coverage, not just declared widths: menu sort/visibility and user roles remain visible beside the fixed action column at 1440px.
- User roles and role-member nicknames now use single-line ellipsis behavior with accessible Arco tooltips; nicknames no longer break inside words.
- Session management resolves the current session through the existing `/auth/sessions` API and shows exactly one current-session tag. Device, recent activity, status, and actions are simultaneously readable at 1440px.
- All four governance cleanup flows use an action-specific destructive confirmation label.
- Permission/security copy is user-facing and unambiguous; all five locale files and the backend builtin snapshot remain in parity.
- DESIGN section 7.8 now matches implemented spacing/radius tokens; dead brand/shadow tokens are removed; prior S4666 truth-block/checker changes are preserved.

## Verification

- Contracts: UI, shell visual, SearchToolbar, i18n hardcode, and generated scope all passed.
- Locale audit: five locales, 2732 keys each, missing/extra/empty all zero.
- Type/unit/build: TypeScript passed; 13 files/132 unit tests passed; complete prebuild and Vite production build passed.
- Runtime: one authenticated Playwright flow passed at 390x844 and 1440x900, produced seven screenshots, recorded computed styles/visibility, and observed zero console/page errors.
- Key probes: no mobile horizontal overflow; menu sort width 120px and center exposed; user role center exposed; member nickname one line; exactly one current-session tag; device/activity/status visible; cleanup action text is `清理`.

## Visual Review

The final screenshots were inspected using the `impeccable` checklist. Fixed columns do not cover data, desktop tables remain scannable, the mobile header is two rows without page overflow, long text truncates intentionally, and primary/destructive/disabled actions remain distinct.

## Known Gap

The fix round did not re-capture loading, error, forbidden, or filtered-empty states because those state components were unchanged. The parent review contains empty-state evidence; final maintainer visual/functional acceptance remains the human gate.
