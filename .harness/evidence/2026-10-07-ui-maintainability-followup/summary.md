# Summary — ui-maintainability-followup (local portion)

## Changes

1. **Avatar manually typed URL persists** — `frontend/src/modules/system/user/UserFormModal.tsx`
   - The avatar `FormItem` wraps a `Space` (not the `Input`), so Arco never bound
     the form field: manual typing only updated the preview state and was lost
     on save. The `Input` is now controlled by `avatarPreview` and every edit is
     mirrored into the form store (`form.setFieldValue('avatar', …)`), so typed
     URLs persist exactly like uploaded ones. Upload flow unchanged.
2. **Profile load failure recovery state** — `frontend/src/modules/system/profile/ProfileCenter.tsx`
   - New `loadError` state: on fetch failure the page renders a persistent
     `PageError` panel with a Retry action (instead of only a transient toast).
     The form (and therefore Save) is not rendered until a successful load.
     Retry re-runs `loadProfile`; success clears the error state.
   - Same avatar form-binding fix as (1) applied to the profile avatar input.
3. **Tabs keyboard/ARIA model** — `frontend/src/core/layout/LayoutOpenedTabs.tsx`
   - Chosen model documented in code: manual-activation tabs — every tab is a
     tab stop; Enter/Space activate; Arrow keys move focus (Left/Right in
     horizontal mode, Up/Down in vertical mode, wrapping); Home/End jump to
     first/last. Focus movement implemented via a `tabRefs` map.
   - `role="tablist"/"tab"`, `aria-selected`, `aria-label` retained; the close
     button remains its own keyboard-accessible control.
4. **Single canonical rule for filter + page-guard docs**
   - `docs/designs/PERMISSION_MODEL.md` §8: replaced the stale "只有 token 守卫，
     还缺统一页面级权限守卫" claim with the current canonical rule
     (`pagePermission` route field enforced by `RoutePermissionGuard.tsx` with
     unified 403, per `FRONTEND.md`); example updated from `requiredPerm` to
     `pagePermission`; old wording kept as an explicit historical note.
   - `docs/frontend/UI_PATTERN_LIBRARY.md`: §1 now points to
     `BACKOFFICE_STYLE_CONSTRAINTS.md` §3.5 as the only authoritative filter
     contract (`FilterPanel` + `--shell-filter-*` tokens); the `SearchToolbar`
     example is marked historical/legacy (not for new system-domain pages);
     §12.1 best-practice list updated to `PageContainer/PageHeader/FilterPanel/AppTable`.

## Tests added

- `frontend/tests/unit/core/layout/LayoutOpenedTabs.test.tsx` (4): Enter/Space
  activation, Arrow movement + wrap, Up/Down + Home/End in vertical mode,
  tablist semantics.
- `frontend/tests/unit/modules/system/profile/ProfileCenter.test.tsx` (2):
  fetch failure renders persistent `.page-result` with retry and no save
  action; successful retry recovers into the editable form.

## Verification

See `commands.json` — type-check / lint / test:unit 163/163 / build /
check:ui-quality-gate (strict, 0 findings) all green.

## Browser Evidence

- Authenticated platform full smoke completed with 77 passing tests across 1440x900, 1024x768, and 390x844 viewports.
- Per-route screenshots and the console/state matrix are indexed by frontend/test-results/full-page-audit/findings.json; every audited route has an empty consoleErrors array and no broken state.
- Representative screenshots: frontend/test-results/full-page-audit/00-login.png, dashboard.png, and profile.png.
- Form-save and profile error-retry behavior are covered by the focused unit tests and the authenticated full smoke run.

## Explicit gaps

- Hosted CI/Sonar evidence is still a candidate-SHA gate and is not produced by this local browser run.
- The audit artifact retains representative mobile coverage and the full smoke state matrix, but not a separate mobile PNG for every route.
