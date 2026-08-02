# UI cross-review fix changes

Task: `ui-fix-20260727`

## Scope

- Base only: no `pantheon-ops` file was edited and no base-sync was attempted.
- This closes the accepted `pantheon-ui-cross-review` findings only; `pantheon-base-v1-freeze` remains untouched.
- The 390px shell header required no additional production diff in this continuation because the current implementation already met the target; it was retained and re-verified with rendered evidence.

## Changes

- `frontend/src/modules/system/menu/MenuList.tsx`: widened the sort column and fixed sort/visibility beside the action column so the latter cannot cover the sort header or values at 1440px.
- `frontend/src/modules/system/user/UserList.tsx` and `user.css`: render role names with Arco CSS ellipsis + tooltip, constrain them to one line, and fix the role column beside actions to prevent overlay clipping.
- `frontend/src/modules/system/role/RoleMemberDrawer.tsx` and `frontend/src/index.css`: apply single-line ellipsis/tooltip behavior with normal word breaking to member nicknames.
- `frontend/src/modules/auth/session/components/SessionList.tsx`: resolve the exact current session through the existing `/auth/sessions` API, show only one current-session tag, keep device info as a core column, and demote redundant nickname data at 1440px so device/activity/status/actions remain readable.
- `frontend/src/components/governance/GovernanceCleanupBar.tsx`, `LoginLogList.tsx`, `SessionList.tsx`, `OperationLogList.tsx`, and `SecurityEventList.tsx`: support and use action-specific cleanup confirmation labels.
- `frontend/src/modules/auth/security/components/SecurityCenter.tsx`: clarify the fourth KPI as successful sign-ins among the latest 10 records.
- `frontend/src/i18n/resources/{zh-CN,en-US,fr-FR,ja-JP,ko-KR}.ts` and `backend/modules/system/i18n/builtin_locale_resources.json`: synchronize current-session, cleanup, permission hero, and security KPI copy across all five locales and the backend builtin snapshot.
- `DESIGN.md` and `DESIGN.en.md`: re-anchor section 7.8 to the implemented radius and spacing tokens.
- `frontend/src/index.css`: preserve the prior S4666 truth-block consolidation and remove unused `--brand-gradient` / `--shell-brand-shadow` tokens.
- `frontend/scripts/check-shell-visual-contract.mjs`: preserve the prior checker re-anchor to the consolidated CSS truth blocks.

## Evidence

- Canonical evidence: `.harness/evidence/ui-fix-20260727/`
- Source cross-review: `.harness/evidence/ui-cross-review-20260726/report.md`
- Original fix-round capture chain: `.harness/evidence/ui-cross-review-20260726/fix-round/`
