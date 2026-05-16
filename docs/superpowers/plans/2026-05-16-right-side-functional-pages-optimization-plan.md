# Right Side Functional Pages Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten the right-side functional page system from “stable and consistent” to “contract-clean, task-complete, and interaction-standardized” without rebuilding the layout skeleton.

**Architecture:** Treat the existing page shell as the correct base. Execute in four phases: fix the shared visual contract drift first, deepen task-path validation for lighter-covered pages second, standardize high-frequency row actions third, and add guardrails for state-heavy pages last. Keep scope front-end and smoke-test focused unless a specific API gap is proven.

**Tech Stack:** React, TypeScript, Arco Design, shared Pantheon page patterns, CSS tokens in `frontend/src/index.css`, Playwright smoke/visual contract suites.

---

### Task 1: Close the shared filter-control visual contract drift

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/components/patterns/FilterPanel.tsx`
- Modify: `frontend/src/modules/system/user/UserList.tsx`
- Modify: `frontend/src/modules/system/dict/DictTypeTab.tsx`
- Modify: `frontend/src/modules/system/dict/DictItemTab.tsx`
- Verify: `frontend/tests/smoke/platform/shell-visual-contract.spec.ts`

- [x] Confirm why `--shell-filter-control-min-height` is `34px` in the desktop contract path but still yields a measured `32px` first control in `/system/user` and `/system/dict`.
- [x] Normalize the control height rule in the shared layer first, preferring `index.css` token usage and `FilterPanel` wrapper constraints over page-local overrides.
- [x] Remove or rewrite any page-local class that compresses the first filter control below the shared minimum height.
- [x] Recheck the user-management and dictionary tabs after the shared fix so the repair is not page-accidental.
- [x] Run `cmd /c npm run test:smoke:shell-visual-contract` in `frontend/`.
- [x] Expected result: the two current failures disappear and the shell visual contract suite returns fully green.

### Task 2: Add task-depth smoke coverage for the lighter-covered pages

**Files:**
- Modify: `frontend/tests/smoke/system/system-pages.spec.ts`
- Create: `frontend/tests/smoke/system/system-workspace-task-depth.ts`
- Reference: `frontend/src/modules/dashboard/Dashboard.tsx`
- Reference: `frontend/src/modules/auth/SecurityCenter.tsx`
- Reference: `frontend/src/modules/system/profile/ProfileCenter.tsx`
- Reference: `frontend/src/modules/system/user/UserDetail.tsx`

- [x] Split “page is reachable and visible” checks from “user can finish the core task” checks so the new coverage stays readable.
- [x] Add dashboard assertions for narrow-state reflow, empty-state visibility, and core widget readiness instead of only title/body presence.
- [x] Add security-center assertions that exercise the split layout, at least one policy/security section, one session block, and one login-log block.
- [x] Add profile-center assertions that cover initial profile load, editable form visibility, submit path, and updated value echo when the page already has a safe test seam.
- [x] Add user-detail assertions that cover detail fetch, non-empty content rendering, and navigation/back-context expectations.
- [x] Run `cmd /c npm run test:smoke:system:pages` in `frontend/`.
- [x] Expected result: the right-side platform/personal pages move from shallow reachability coverage to explicit task-path coverage with no new flaky waits.

### Task 3: Standardize high-frequency row action composition on governance pages

**Files:**
- Create: `frontend/src/components/patterns/SystemRowActions.tsx`
- Modify: `frontend/src/components/index.ts`
- Modify: `frontend/src/modules/system/user/UserList.tsx`
- Modify: `frontend/src/modules/system/role/RoleList.tsx`
- Modify: `frontend/src/modules/system/dept/DeptList.tsx`
- Modify: `frontend/src/modules/system/post/PostList.tsx`
- Optional Follow-up: `frontend/src/modules/system/menu/MenuList.tsx`
- Optional Follow-up: `frontend/src/modules/system/permission/PermissionList.tsx`

- [x] Extract a shared row-action presenter that can express primary action, secondary actions, danger action, disabled state, and optional overflow action without forcing every page to hand-roll `Space + Popconfirm + Button`.
- [x] Keep phase one narrow: migrate the four highest-frequency governance pages first (`user`, `role`, `dept`, `post`).
- [x] Lock a consistent action order. Baseline recommendation: `详情 / 编辑 / 状态切换 / 更多 / 删除`, with danger actions visually and positionally stable.
- [x] Make sure permission-driven disable/hide behavior still stays owned by each page; the shared component should standardize rendering, not business rules.
- [x] Add or update smoke assertions only where action text/order/overflow changes alter user-visible contracts.
- [x] Run `cmd /c npm run test:smoke:system` in `frontend/`.
- [x] Expected result: the highest-frequency governance lists use one row-action grammar, reducing future divergence in copy, danger placement, and loading/disabled behavior.

### Task 4: Add guardrails for the state-heavy workspaces

**Files:**
- Modify: `frontend/tests/smoke/system/system-pages.spec.ts`
- Modify: `frontend/tests/smoke/platform/backoffice-ui-visual.spec.ts`
- Reference: `frontend/src/modules/system/dict/DictPage.tsx`
- Reference: `frontend/src/modules/system/i18n/I18nList.tsx`
- Reference: `frontend/src/modules/system/setting/SettingGroupPage.tsx`
- Reference: `frontend/src/modules/generator/pages/ModuleWizard.tsx`

- [x] Define one “main task must stay obvious” assertion for each state-heavy page instead of expanding screenshots blindly.
- [x] For dictionary management, assert that type and item tabs preserve a stable main work area and do not duplicate top-level governance noise.
- [x] For i18n management, assert that import/export/batch regions remain subordinate to the translation table task area.
- [x] For system settings, assert that group navigation and config content stay primary while audit/auxiliary information remains secondary.
- [x] For module generator, add at least one narrow-screen or long-flow smoke check to catch overflow and step-density regressions early.
- [x] Run `cmd /c npm run test:smoke:backoffice-ui` in `frontend/`.
- [x] Expected result: the highest-complexity pages gain explicit anti-regression guardrails around information hierarchy and workflow readability.

### Task 5: Final verification and doc sync

**Files:**
- Modify: `docs/assessments/RIGHT_SIDE_FUNCTIONAL_PAGES_EVALUATION_20260516.md`
- Optional Modify: related design/contract docs only if user-facing behavior changes

- [x] Re-run the minimum verification set:
  - `cmd /c npm run type-check`
  - `cmd /c npm run test:smoke:shell-visual-contract`
  - `cmd /c npm run test:smoke:system:pages`
  - `cmd /c npm run test:smoke:backoffice-ui`
- [x] Update the assessment report so it records which findings were closed, which were deferred, and which remain intentional.
- [x] Keep the doc update limited to actual shipped changes; do not mix in unrelated cleanup.
- [x] Expected result: the optimization work closes the known P1 issue, reduces the P2 blind spots, and leaves a clear residual-risk statement.
