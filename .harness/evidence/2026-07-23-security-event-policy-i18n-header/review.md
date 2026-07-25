# Review — 2026-07-23-security-event-policy-i18n-header

Reviewer: Claude Code. Implementation performed directly per maintainer
instruction (2026-07-23, "你直接完成，不用等codex") — recorded here because it
deviates from the default Codex-implements split in CLAUDE.md.

## Scope check

- Diff: `permission_workbench.go` (+2 switch cases), `permission_service_test.go`
  (+1 test), `I18nList.tsx` (−1 JSX block), plus `.harness/` artifacts. Matches
  the manifest. ✅

## Findings reviewed

1. **Policy paths match the registered routes** — verified against
   `backend/modules/auth/module.go`: `/security-event/:id/acknowledge`,
   `/security-event/batch-acknowledge`, `/security-event/cleanup`, all POST
   under the `/api/v1/system` protected group. ✅
2. **`:id` pattern enforcement** — Casbin matcher uses `keyMatch2`, which
   matches `/:id/` segments; consistent with how the workbench stores
   parameterized paths. ✅
3. **Remediation flow** — `RemediateRoleAPIPolicies` creates rules from
   `MissingAPIPolicies`, which is derived from the same switch; adding cases
   is sufficient, no other wiring needed. ✅
4. **No security widening** — mappings only make explicitly granted
   permissions functional; SecureAction second-factor middleware on all three
   routes is unchanged. ✅
5. **I18nList removal** — only usage of `system-list__table-head` markup in
   the codebase; CSS contract blocks remain in CSS (contract checks still
   pass); pagination keeps the total visible; `i18n.viewTitle` still used by
   the detail modal so no locale-key debt. ✅

## Residual risk

- Same mapping gap exists for login-log/session action permissions
  (deferred, documented).
- Roles granted clear/acknowledge before this fix need a workbench
  remediation run to backfill policies.
