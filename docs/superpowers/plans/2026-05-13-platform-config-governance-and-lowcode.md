# Platform Config Governance And Lowcode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore lightweight governance context on user/config pages and promote low-code tooling to a first-class navigation domain.

**Architecture:** Keep the change front-end only in phase one. Reuse existing governance patterns (`GovernanceSummaryBar`, `GovernanceRail`, `ListHeaderActions`) and update module menu metadata instead of rewriting routes. Adjust smoke tests to assert shell context via breadcrumb/tab contracts instead of page header titles.

**Tech Stack:** React, TypeScript, Arco Design, existing Pantheon shell/menu registry, Playwright smoke tests.

---

### Task 1: Write docs and stabilize shell assertions

**Files:**
- Modify: `frontend/tests/smoke/helpers/auth.ts` if helper sharing is needed
- Create: `frontend/tests/smoke/helpers/shell.ts`
- Modify: `frontend/tests/smoke/platform/shell-visual-contract.spec.ts`
- Modify: `frontend/tests/smoke/system/governance/module-governance.spec.ts`
- Modify: `frontend/tests/smoke/system/governance/module-governance-real.spec.ts`

- [ ] Add a shared helper that validates breadcrumb and active tab shell context without relying on page header titles.
- [ ] Update smoke tests that currently anchor on `PageHeader` headings for module pages.
- [ ] Add/adjust one shell contract assertion proving `.page-header__meta` disappears while `.page-header__extra` remains.

### Task 2: Restore lightweight governance for user management

**Files:**
- Modify: `frontend/src/modules/system/user/UserList.tsx`
- Modify: `frontend/src/i18n/resources/zh-CN.ts`
- Modify: `frontend/src/i18n/resources/en-US.ts`

- [ ] Reuse existing dead `system.user.hero.*` copy where possible.
- [ ] Add a light `GovernanceSummaryBar` above the filter panel.
- [ ] Compute user governance metrics from existing loaded data/role options/org options only.
- [ ] Keep the page in list-first mode; no hero wall, no extra stats card.

### Task 3: Remove duplicate stats from dictionary management

**Files:**
- Modify: `frontend/src/modules/system/dict/DictPage.tsx`
- Modify: `frontend/src/i18n/resources/zh-CN.ts`
- Modify: `frontend/src/i18n/resources/en-US.ts`

- [ ] Remove the top-level `GovernanceSummaryBar`.
- [ ] Keep the governance drawer and move its entry into header actions or a small utility action.
- [ ] Preserve `DictTypeTab` / `DictItemTab` summary behavior inside the main task area.

### Task 4: Normalize system setting page shells

**Files:**
- Modify: `frontend/src/modules/system/setting/SettingOverviewPage.tsx`
- Modify: `frontend/src/modules/system/setting/SettingGroupPage.tsx`
- Modify: `frontend/src/modules/system/list-page.css`
- Modify: `frontend/src/i18n/resources/zh-CN.ts`
- Modify: `frontend/src/i18n/resources/en-US.ts`

- [ ] Replace the overview hero/KPI shell with a standard panel-style summary.
- [ ] Keep group navigation and risk counts, but make them read like a configuration workspace, not a dashboard.
- [ ] Keep group routes unchanged, but align spacing and panel rhythm with other system pages.

### Task 5: Promote low-code tooling to a first-class navigation domain

**Files:**
- Modify: `frontend/src/modules/system/dynamicmodule/index.ts`
- Modify: `frontend/src/modules/generator/index.ts`
- Modify: `frontend/src/i18n/resources/zh-CN.ts`
- Modify: `frontend/src/i18n/resources/en-US.ts`
- Modify: related docs/contracts if menu ownership text changes

- [ ] Move module metadata ownership from `system.config` to a new top-level low-code menu domain.
- [ ] Keep route paths stable in phase one.
- [ ] Update menu text to reflect the new first-level grouping.

### Task 6: Verification

**Files:**
- Modify: any failing smoke specs touched above

- [ ] Run `cmd /c npm run type-check` in `frontend/`.
- [ ] Run targeted shell/governance smokes that cover user/config/module pages.
- [ ] If menu grouping changes affect shell assertions, refresh those expectations only where required.
