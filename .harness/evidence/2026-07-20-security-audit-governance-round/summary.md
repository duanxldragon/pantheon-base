# 2026-07-20 security-audit-governance-round — Evidence Summary

Maintainer review round on the security-audit surface (login-log / session /
operation-log / security-event) plus governance-bar consistency. Implemented
directly by Claude under a maintainer one-time exemption (recorded in the task
manifest `humanGates`).

## What changed

### PR-A — Governance-bar consistency

- `DeptList.tsx`: governance metrics dropped the third description line
  (details already live in the governance drawer); click-to-filter kept and
  made visible via the new `.governance-summary-bar__metric--action` hover /
  focus affordance in `list-page.css`.
- Whole-filtered-set aggregates replace page-local counts:
  - backend: `LoginLogPageResp.successCount/failedCount`,
    `OperationLogPageResp.successCount/failedCount`,
    `SecurityEventPageResp.pendingCount/acknowledgedCount/highSeverityCount`
    (same semantics as the session list's `activeCount/revokedCount`).
  - frontend: the three list pages consume the response aggregates instead of
    `data.filter(...)` over the current page.
- `system-page-admission.json`: added `/system/security-event`
  (audit-console, governance drawer allowed); the page's drawer title was
  aligned to `auth.securityEvent.hero.summaryTitle` to match the button.

### PR-B — Manual cleanup entries restored (maintainer decision 2026-07-20)

- Restored `GovernanceCleanupBar` (deleted in 3ca5b658) plus its barrel
  exports and the `--governance` CSS block (select width now uses
  `--shell-governance-select-width` instead of the old hardcoded 128px).
- All four audit pages regained the guarded cleanup entry
  (retention-days + time-range modes, `system:*:clear` permission,
  SecureAction on the backend routes). `tests/smoke/system/governance/
  cleanup-range-ui.spec.ts` is the behavior contract and was never removed
  from the governance suite — this change un-breaks it.
- `ensureAutomaticLoginLogRetention` now throttles to one DELETE per
  15 minutes (was: a full-table DELETE on every record/list/export); the
  dead `Runtime.lastCleanupAt` field that was meant for this is removed.
- `FRONTEND_PAGE_TEMPLATES.md` §3.3.1 rewritten: auto retention stays
  primary, manual cleanup is the guarded secondary path (reverses the
  2026-07-19 "no manual button" rule; decision recorded inline).

### PR-C — Security-event batch acknowledge + auto retention

- Backend: `POST /system/security-event/batch-acknowledge` (SecureAction);
  service skips already-acknowledged events so notes are never overwritten.
- Backend: `ensureAutomaticSecurityEventRetention` (15-min throttle) deletes
  acknowledged events older than `audit.security_event_retention_days`
  (seeded, default 180). Pending events are never auto-swept.
- Seeds: `audit.security_event_retention_days` + previously-missing
  `audit.security_event_retention_options`, registered in
  `isAuditRetentionOptionsSetting`.
- Frontend: row selection (pending rows only) + batch-acknowledge modal
  reusing the single-acknowledge note dialog; i18n across
  zh-CN / en-US main resources, fr/ja/ko overrides, and the five
  runtime-fixes files.

## Verification

| Gate | Result |
| --- | --- |
| `go build ./...` (backend) | pass |
| `go test ./modules/auth/... ./modules/system/audit/... ./modules/system/config/...` | all ok |
| `npx tsc --noEmit` | 0 errors (re-run after PR-C edits) |
| `check:system-page-admission` | passed for 16 entries |
| `check:ui-contract` | 0 findings / 228 files |
| `check:shell-visual-contract` | passed |
| `check:search-toolbar-contract` | 0 findings / 86 files |
| `check:i18n-hardcode` | passed (194 files) |
| `check:menu-contract` | passed (16 menus, 20 routes, 89 perms) |
| `check:system-datetime-presentation` | passed (33 files) |
| `npm run build` | built in 642ms |
| `eslint` (changed modules) | 0 findings |
| `check:important-budget` / `check:contrast` | 0 / AA pass |
| cleanup-range-ui.spec.ts (behavior contract) | **6/6 pass** after the popup-clipping fix below |
| governance smoke suite | 16 pass / 1 fail — the failure is `module-governance.spec.ts:420` (lowcode generator business-toggle form), untouched by this round; pre-existing/environmental |
| `test:visual` | 3/3 pass (no baseline drift) |
| visual evidence | 8 screenshots in this directory (4 audit pages, cleanup dialog retention+range, security-event drawer, dept metric hover) |

## Product bug found & fixed during verification

The restored cleanup dialog's "按时间范围" calendar was **completely
unusable**: Arco mounts the picker popup inside the modal by default, where
`.app-dialog { overflow: hidden }` clips it (the popup opens above the dialog
box), so every click landed on the modal wrapper (z-index 2500). Diagnosed via
DOM stacking dump; fixed in `GovernanceCleanupBar` by mounting the popup on
`document.body` with z-index 2600 (`triggerProps.getPopupContainer/style`).
This bug predates the 2026-07-19 retirement — the range mode had never worked
inside the dialog.

Also synced in `cleanup-range-ui.spec.ts`: the login-log time-range test still
asserted the retired page-local DOM (`.auth-login-log-page__time-range-*`,
grid layout); rewritten against the shared `TimeRangeFilter` contract
(`.time-range-filter__*`, flex layout with geometric column-alignment
assertions), which was broken since 8ce624d8.

## Out of scope / follow-ups

- Security-event type expansion (permission/role-change events).
- SearchToolbar `advancedFilters` popover: evaluated and kept as designed
  (high-frequency filters inline, low-frequency in the popover); not an
  inconsistency, no rollout and no removal.
