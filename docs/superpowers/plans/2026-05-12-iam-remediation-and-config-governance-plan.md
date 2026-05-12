# IAM Remediation And Config Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `system/iam` 权限工作台推进到可执行整改闭环，并把 `system/config` 高敏页面统一到同一套页面准入和导航壳规则。

**Architecture:** 主层是 `system/iam`，依赖层是 `system/config`，本轮只做逻辑跨层调整，不新增治理中心，不改主路由层级。`system/iam` 采用“轻量后端聚合 + 前端任务台重排”，`system/config` 采用“准入配置 + 页面壳收紧 + smoke 合同同步”三段式收口。

**Tech Stack:** Go + GORM, React 18 + TypeScript + Arco Design, Playwright smoke, Pantheon page shell/admission checks

---

## File Map

### `system/iam`

- Modify: `backend/modules/system/iam/permission/permission_workbench.go`
- Modify: `backend/modules/system/iam/permission/permission_service.go`
- Modify: `backend/modules/system/iam/permission/permission_handler.go`
- Modify: `backend/modules/system/iam/permission/permission_service_test.go`
- Modify: `frontend/src/modules/system/permission/api.ts`
- Modify: `frontend/src/modules/system/permission/PermissionList.tsx`
- Modify: `frontend/src/modules/system/permission/PermissionWorkbenchTab.tsx`
- Modify: `frontend/src/i18n/resources/zh-CN.ts`
- Modify: `frontend/src/i18n/resources/en-US.ts`
- Modify: `frontend/tests/smoke/system/governance/permission-workbench-remediation.spec.ts`
- Modify: `frontend/tests/smoke/system/governance/permission-workbench-remediation-real.spec.ts`
- Modify: `docs/contracts/SYSTEM_IAM_CONTRACT.md`

### `system/config`

- Modify: `frontend/config/system-page-admission.json`
- Modify: `frontend/scripts/check-system-page-admission.mjs`
- Modify: `frontend/src/modules/system/dynamicmodule/ModuleManager.tsx`
- Modify: `frontend/src/modules/generator/pages/ModuleWizard.tsx`
- Modify: `frontend/src/modules/generator/pages/ModuleWizard.css`
- Modify: `frontend/src/modules/system/i18n/I18nList.tsx`
- Modify: `frontend/src/modules/system/setting/SettingOverviewPage.tsx`
- Modify: `frontend/src/modules/system/setting/SettingGroupPage.tsx`
- Modify: `frontend/src/i18n/resources/zh-CN.ts`
- Modify: `frontend/src/i18n/resources/en-US.ts`
- Modify: `frontend/tests/smoke/platform/shell-visual-contract.spec.ts`
- Modify: `frontend/tests/smoke/system/system-pages.spec.ts`
- Modify: `frontend/tests/smoke/system/governance/module-governance.spec.ts`
- Modify: `docs/contracts/SYSTEM_CONFIG_CONTRACT.md`
- Modify: `docs/designs/FRONTEND_UI_SPEC.md`

## Task 1: `system/iam` workbench contract and backend aggregation

**Files:**
- Modify: `docs/contracts/SYSTEM_IAM_CONTRACT.md`
- Modify: `backend/modules/system/iam/permission/permission_workbench.go`
- Modify: `backend/modules/system/iam/permission/permission_service.go`
- Modify: `backend/modules/system/iam/permission/permission_handler.go`
- Test: `backend/modules/system/iam/permission/permission_service_test.go`

- [ ] **Step 1: Write the failing backend tests for remediation-oriented workbench summary**

Add new assertions in `backend/modules/system/iam/permission/permission_service_test.go` that lock the new summary vocabulary and per-role governance state:

```go
func TestPermissionService_GetWorkbenchIncludesRemediationGovernanceSummary(t *testing.T) {
	db := setupPermissionTestDB(t)
	service := NewPermissionService(db)
	if err := service.Migrate(); err != nil {
		t.Fatalf("migrate permission service: %v", err)
	}

	// pending_role still has api gap
	// remediated_role has remediation event and no current gap
	// clean_role has no gap and no remediation event

	workbench, err := service.GetWorkbench(nil)
	if err != nil {
		t.Fatalf("get workbench: %v", err)
	}

	if workbench.Overview.PendingRemediationRoleCount != 1 {
		t.Fatalf("expected 1 pending remediation role, got %d", workbench.Overview.PendingRemediationRoleCount)
	}
	if workbench.Overview.RemediatedRoleCount != 1 {
		t.Fatalf("expected 1 remediated role, got %d", workbench.Overview.RemediatedRoleCount)
	}
	if workbench.Overview.RecentRemediationCount != 2 {
		t.Fatalf("expected 2 recent remediation events, got %d", workbench.Overview.RecentRemediationCount)
	}
}
```

Also extend the existing role assertions so a row exposes:

```go
if gapRole.GovernanceStatus != "pending" {
	t.Fatalf("expected pending governance status, got %s", gapRole.GovernanceStatus)
}
if readyRole.GovernanceStatus != "remediated" {
	t.Fatalf("expected remediated governance status, got %s", readyRole.GovernanceStatus)
}
if cleanRole.GovernanceStatus != "clean" {
	t.Fatalf("expected clean governance status, got %s", cleanRole.GovernanceStatus)
}
```

- [ ] **Step 2: Run the targeted backend tests to confirm the new contract is missing**

Run:

```bash
go test ./backend/modules/system/iam/permission -run "TestPermissionService_GetWorkbench|TestPermissionService_RemediateWorkbenchPolicies" -count=1
```

Expected: FAIL with unknown fields such as `PendingRemediationRoleCount`, `RemediatedRoleCount`, `RecentRemediationCount`, or `GovernanceStatus`.

- [ ] **Step 3: Implement the minimal backend aggregation and document the contract**

Update `backend/modules/system/iam/permission/permission_workbench.go` and any shared response structs in `permission_service.go` so the workbench response carries remediation-oriented fields without introducing a new task table:

```go
type PermissionWorkbenchOverviewResp struct {
	RoleCount                     int64 `json:"roleCount"`
	EnabledRoleCount              int64 `json:"enabledRoleCount"`
	UnknownPermissionAssignmentCount int64 `json:"unknownPermissionAssignmentCount"`
	PageGapRoleCount              int64 `json:"pageGapRoleCount"`
	APIGapRoleCount               int64 `json:"apiGapRoleCount"`
	PendingRemediationRoleCount   int64 `json:"pendingRemediationRoleCount"`
	RemediatedRoleCount           int64 `json:"remediatedRoleCount"`
	RecentRemediationCount        int64 `json:"recentRemediationCount"`
}

type PermissionWorkbenchRoleResp struct {
	RoleKey              string `json:"roleKey"`
	HasPageGap           bool   `json:"hasPageGap"`
	HasAPIGap            bool   `json:"hasApiGap"`
	UnknownPermissionCount int  `json:"unknownPermissionCount"`
	GovernanceStatus     string `json:"governanceStatus"`
	LastRemediationAt    string `json:"lastRemediationAt,omitempty"`
	LastRemediationAction string `json:"lastRemediationAction,omitempty"`
}
```

Implement a helper that aggregates the latest remediation events once per workbench request, then applies the approved status order:

```go
func resolveGovernanceStatus(role PermissionWorkbenchRoleResp, latest *PermissionWorkbenchRemediation) string {
	if role.HasPageGap || role.HasAPIGap || role.UnknownPermissionCount > 0 {
		return "pending"
	}
	if latest != nil {
		return "remediated"
	}
	return "clean"
}
```

Update `docs/contracts/SYSTEM_IAM_CONTRACT.md` so `/system/permission/workbench` explicitly documents:

```md
- `pendingRemediationRoleCount`: current roles with page gap, api gap, or unknown permission
- `remediatedRoleCount`: roles with no current gap and at least one remediation event
- `recentRemediationCount`: count of latest remediation events used by workbench summary
- `governanceStatus`: `pending | remediated | clean`
```

- [ ] **Step 4: Re-run the backend tests until they pass**

Run:

```bash
go test ./backend/modules/system/iam/permission -run "TestPermissionService_GetWorkbench|TestPermissionService_RemediateWorkbenchPolicies" -count=1
```

Expected: PASS and existing remediation-event tests remain green.

- [ ] **Step 5: Commit the backend contract change**

```bash
git add docs/contracts/SYSTEM_IAM_CONTRACT.md backend/modules/system/iam/permission/permission_workbench.go backend/modules/system/iam/permission/permission_service.go backend/modules/system/iam/permission/permission_handler.go backend/modules/system/iam/permission/permission_service_test.go
git commit -m "feat: add remediation governance summary to permission workbench"
```

## Task 2: `system/iam` permission workbench UI shift to remediation taskbench

**Files:**
- Modify: `frontend/src/modules/system/permission/api.ts`
- Modify: `frontend/src/modules/system/permission/PermissionList.tsx`
- Modify: `frontend/src/modules/system/permission/PermissionWorkbenchTab.tsx`
- Modify: `frontend/src/i18n/resources/zh-CN.ts`
- Modify: `frontend/src/i18n/resources/en-US.ts`
- Test: `frontend/tests/smoke/system/governance/permission-workbench-remediation.spec.ts`
- Test: `frontend/tests/smoke/system/governance/permission-workbench-remediation-real.spec.ts`

- [ ] **Step 1: Write the failing frontend smoke assertions for the new workbench posture**

Update `frontend/tests/smoke/system/governance/permission-workbench-remediation.spec.ts` so the mocked page must default to remediation-first behavior:

```ts
await page.goto('/system/permission', { waitUntil: 'networkidle' });

await expect(page.getByText('待整改角色', { exact: true })).toBeVisible();
await expect(page.getByRole('cell', { name: '待整改' })).toBeVisible();
await expect(page.getByRole('dialog').getByText('最近整改时间线', { exact: true })).toBeVisible();
```

Add a real-smoke assertion in `permission-workbench-remediation-real.spec.ts` that the workbench no longer starts from `complete` coverage:

```ts
await expect(page.getByText('整改任务台', { exact: false })).toBeVisible();
await expect(page.getByText('待整改', { exact: true }).first()).toBeVisible();
```

- [ ] **Step 2: Run the targeted smoke test to capture the current failure**

Run:

```bash
cd frontend
cmd /c npx playwright test tests/smoke/system/governance/permission-workbench-remediation.spec.ts --config=playwright.config.ts --workers=1
```

Expected: FAIL because the page still renders old overview cards, old coverage-first table, and old detail ordering.

- [ ] **Step 3: Implement the frontend workbench state, ordering, and labels**

Extend the API contract in `frontend/src/modules/system/permission/api.ts`:

```ts
export interface PermissionWorkbenchOverview {
  pendingRemediationRoleCount: number;
  remediatedRoleCount: number;
  recentRemediationCount: number;
}

export interface PermissionWorkbenchRole {
  governanceStatus: 'pending' | 'remediated' | 'clean';
  lastRemediationAt?: string;
  lastRemediationAction?: string;
}
```

In `PermissionList.tsx`, add a local remediation-first view state instead of overloading the existing backend coverage filter:

```ts
const [workbenchView, setWorkbenchView] = useState<'pending' | 'all'>('pending');
```

In `PermissionWorkbenchTab.tsx`, replace the old summary cards and role table display with remediation vocabulary:

```ts
const overviewCards = [
  { title: t('system.permission.workbench.pendingRoles'), value: overview?.pendingRemediationRoleCount ?? 0 },
  { title: t('system.permission.workbench.remediatedRoles'), value: overview?.remediatedRoleCount ?? 0 },
  { title: t('system.permission.workbench.unknownAssignments'), value: overview?.unknownPermissionAssignmentCount ?? 0 },
  { title: t('system.permission.workbench.recentRemediations'), value: overview?.recentRemediationCount ?? 0 },
];

const displayedRoles = (workbench?.roles ?? []).filter((row) =>
  workbenchView === 'pending' ? row.governanceStatus === 'pending' : true,
);

function renderGovernanceStatus(row: PermissionWorkbenchRole) {
  if (row.governanceStatus === 'pending') return <Tag color="red">{t('system.permission.workbench.status.pending')}</Tag>;
  if (row.governanceStatus === 'remediated') return <Tag color="green">{t('system.permission.workbench.status.remediated')}</Tag>;
  return <Tag>{t('system.permission.workbench.status.clean')}</Tag>;
}
```

Reorder the detail drawer to exactly match the approved sequence:

```tsx
<Card title={t('system.permission.workbench.currentStatusSection')} />
<Card title={t('system.permission.workbench.currentGapSection')} />
<Card title={t('system.permission.workbench.remediationActionSection')} />
<Card title={t('system.permission.workbench.remediationTimelineSection')} />
<Card title={t('system.permission.workbench.rawCoverageSection')} />
```

When rendering events, translate raw event rows into readable timeline text:

```ts
const timelineRows = remediationEvents.map((event) => ({
  id: event.id,
  actionLabel: event.action === 'remediated'
    ? t('system.permission.workbench.timeline.remediated')
    : t('system.permission.workbench.timeline.noop'),
  stateLabel: `${event.beforeState} -> ${event.afterState}`,
  createdCount: event.createdCount,
  skippedCount: event.skippedCount,
  createdAt: event.createdAt,
}));
```

Add the matching i18n keys in `frontend/src/i18n/resources/zh-CN.ts` and `frontend/src/i18n/resources/en-US.ts`.

- [ ] **Step 4: Re-run UI verification for workbench and compile checks**

Run:

```bash
cd frontend
cmd /c npm run type-check
cmd /c npx playwright test tests/smoke/system/governance/permission-workbench-remediation.spec.ts --config=playwright.config.ts --workers=1
```

Expected: PASS, with the detail drawer showing governance status, gap summary, remediation action, timeline, and raw coverage in that order.

- [ ] **Step 5: Commit the permission workbench remediation UI**

```bash
git add frontend/src/modules/system/permission/api.ts frontend/src/modules/system/permission/PermissionList.tsx frontend/src/modules/system/permission/PermissionWorkbenchTab.tsx frontend/src/i18n/resources/zh-CN.ts frontend/src/i18n/resources/en-US.ts frontend/tests/smoke/system/governance/permission-workbench-remediation.spec.ts frontend/tests/smoke/system/governance/permission-workbench-remediation-real.spec.ts
git commit -m "feat: refocus permission workbench on remediation tasks"
```

## Task 3: `system/config` page admission rules and docs alignment

**Files:**
- Modify: `frontend/config/system-page-admission.json`
- Modify: `frontend/scripts/check-system-page-admission.mjs`
- Modify: `docs/contracts/SYSTEM_CONFIG_CONTRACT.md`
- Modify: `docs/designs/FRONTEND_UI_SPEC.md`
- Test: `frontend/tests/smoke/platform/shell-visual-contract.spec.ts`
- Test: `frontend/tests/smoke/system/system-pages.spec.ts`

- [ ] **Step 1: Write the failing rule and smoke assertions for the missing config-page contract**

Add or tighten admission entries so `/system/generator` joins the regulated set and `/system/modules` stops being hero-style:

```json
{
  "path": "/system/generator",
  "title": "模块生成器",
  "sourceFile": "src/modules/generator/pages/ModuleWizard.tsx",
  "narrative": "module-onboarding",
  "governanceDrawer": "forbidden",
  "hero": "forbidden"
}
```

Update `frontend/tests/smoke/platform/shell-visual-contract.spec.ts` and `frontend/tests/smoke/system/system-pages.spec.ts` with assertions such as:

```ts
await expect(page.getByRole('heading', { name: '模块注册表' })).toBeVisible();
await expect(page.locator('.system-page-hero__eyebrow')).toHaveCount(0);
await expect(page.getByRole('button', { name: '新模块接入', exact: false })).toBeVisible();
```

- [ ] **Step 2: Run the admission checker and shell smoke before implementation**

Run:

```bash
cd frontend
cmd /c npm run check:system-page-admission
cmd /c npx playwright test tests/smoke/platform/shell-visual-contract.spec.ts tests/smoke/system/system-pages.spec.ts --config=playwright.config.ts --workers=1
```

Expected: FAIL because `/system/generator` is not yet in the admission config and `/system/modules` still contains intro hero markup.

- [ ] **Step 3: Implement the shared admission contract and document the rule**

Update `frontend/config/system-page-admission.json` so the five approved pages share the same shell expectations:

```json
[
  {
    "path": "/system/setting",
    "narrative": "config-overview",
    "governanceDrawer": "forbidden",
    "hero": "allowed"
  },
  {
    "path": "/system/setting/:groupKey",
    "narrative": "config-group",
    "governanceDrawer": "forbidden",
    "hero": "forbidden"
  },
  {
    "path": "/system/i18n",
    "narrative": "governance-workbench",
    "governanceDrawer": "allowed",
    "hero": "forbidden"
  },
  {
    "path": "/system/modules",
    "narrative": "module-governance",
    "governanceDrawer": "forbidden",
    "hero": "forbidden"
  },
  {
    "path": "/system/generator",
    "narrative": "module-onboarding",
    "governanceDrawer": "forbidden",
    "hero": "forbidden"
  }
]
```

If `check-system-page-admission.mjs` needs a new narrative branch, add the explicit rule instead of allowing free-form page structure:

```js
if (entry.narrative === 'module-onboarding') {
  assertNoHero(entry);
  assertPageHeader(entry);
  assertPrimaryActionNearHeader(entry);
}
```

Update `docs/contracts/SYSTEM_CONFIG_CONTRACT.md` and `docs/designs/FRONTEND_UI_SPEC.md` to codify:

```md
- first screen: exactly one governance summary container
- no redundant right-side location menu when breadcrumb or page tabs already locate the user
- high-risk actions live in page header, table head, or governance drawer only
- no explanation-card wall on `/system/modules`, `/system/generator`, `/system/i18n`, `/system/setting*`
```

- [ ] **Step 4: Re-run the rule checker and shell smoke**

Run:

```bash
cd frontend
cmd /c npm run check:system-page-admission
cmd /c npx playwright test tests/smoke/platform/shell-visual-contract.spec.ts tests/smoke/system/system-pages.spec.ts --config=playwright.config.ts --workers=1
```

Expected: PASS, proving the written rules and the smoke contract agree.

- [ ] **Step 5: Commit the admission contract layer**

```bash
git add frontend/config/system-page-admission.json frontend/scripts/check-system-page-admission.mjs docs/contracts/SYSTEM_CONFIG_CONTRACT.md docs/designs/FRONTEND_UI_SPEC.md frontend/tests/smoke/platform/shell-visual-contract.spec.ts frontend/tests/smoke/system/system-pages.spec.ts
git commit -m "chore: codify config page admission rules"
```

## Task 4: `system/config` shell tightening for modules, generator, i18n, and settings

**Files:**
- Modify: `frontend/src/modules/system/dynamicmodule/ModuleManager.tsx`
- Modify: `frontend/src/modules/generator/pages/ModuleWizard.tsx`
- Modify: `frontend/src/modules/generator/pages/ModuleWizard.css`
- Modify: `frontend/src/modules/system/i18n/I18nList.tsx`
- Modify: `frontend/src/modules/system/setting/SettingOverviewPage.tsx`
- Modify: `frontend/src/modules/system/setting/SettingGroupPage.tsx`
- Modify: `frontend/src/i18n/resources/zh-CN.ts`
- Modify: `frontend/src/i18n/resources/en-US.ts`
- Test: `frontend/tests/smoke/system/governance/module-governance.spec.ts`
- Test: `frontend/tests/smoke/platform/shell-visual-contract.spec.ts`
- Test: `frontend/tests/smoke/system/system-pages.spec.ts`

- [ ] **Step 1: Write the failing UI assertions for compressed first-screen layout**

Update the targeted smoke files so they assert the new structure instead of the old mixed overview layout:

```ts
await page.goto('/system/modules', { waitUntil: 'networkidle' });
await expect(page.locator('.module-manager-page__intro')).toHaveCount(0);
await expect(page.locator('.module-manager-page__stats')).toHaveCount(0);
await expect(page.getByRole('button', { name: '注册新模块', exact: false })).toBeVisible();
```

Add generator and i18n checks:

```ts
await page.goto('/system/generator', { waitUntil: 'networkidle' });
await expect(page.getByRole('heading', { name: '模块生成器' })).toBeVisible();
await expect(page.locator('.page-panel').first()).toContainText('步骤');

await page.goto('/system/i18n', { waitUntil: 'networkidle' });
await expect(page.locator('.page-panel').first()).not.toContainText('说明');
await expect(page.getByRole('button', { name: '治理摘要', exact: true })).toBeVisible();
```

- [ ] **Step 2: Run the targeted governance and page smoke before editing**

Run:

```bash
cd frontend
cmd /c npx playwright test tests/smoke/system/governance/module-governance.spec.ts tests/smoke/platform/shell-visual-contract.spec.ts tests/smoke/system/system-pages.spec.ts --config=playwright.config.ts --workers=1
```

Expected: FAIL because the current pages still expose hero intro blocks, scattered alerts, or over-expanded first-screen content.

- [ ] **Step 3: Implement the page-shell tightening without adding new routes**

In `frontend/src/modules/system/dynamicmodule/ModuleManager.tsx`, replace the intro hero and stats wall with one compact governance summary plus the registry table:

```tsx
<PageHeader
  title={t('generator.moduleManager.title')}
  extra={headerActions}
/>
<Card className="page-panel system-list__table-card">
  <Space direction="vertical" size={12}>
    <Alert type="warning" content={pendingHint} />
    <Descriptions
      column={4}
      data={[
        { label: t('generator.moduleManager.stats.total'), value: stats.total },
        { label: t('generator.moduleManager.stats.active'), value: stats.active },
        { label: t('generator.moduleManager.stats.pending'), value: stats.pending },
        { label: t('generator.moduleManager.stats.failed'), value: stats.failed },
      ]}
    />
    <AppTable ... />
  </Space>
</Card>
```

In `frontend/src/modules/generator/pages/ModuleWizard.tsx`, keep the wizard body but move cross-page orientation into the header only:

```tsx
<PageHeader
  title={t('generator.wizard.title')}
  extra={
    canOpenModuleManager ? (
      <Button size="small" onClick={() => navigate('/system/modules')}>
        {t('generator.wizard.openRegistry')}
      </Button>
    ) : null
  }
/>
```

Do not add a new explanation block above the steps. If needed, use a compact `Alert` inside the active step card only.

In `frontend/src/modules/system/i18n/I18nList.tsx`, keep `GovernanceSummaryBar` and the existing drawer, but make the main area first screen only:

```tsx
<PageHeader title={t('system.menu.i18n')} extra={headerActions} />
<GovernanceSummaryBar items={governanceSummaryItems.slice(0, 4)} />
<FilterPanel>...</FilterPanel>
<Card className="page-panel system-list__table-card">...</Card>
```

Keep lifecycle audit, stale placeholders, and rename analysis in drawer/modals rather than second full-width panels in the page body.

In `SettingOverviewPage.tsx` and `SettingGroupPage.tsx`, only make consistency edits that align them with the new rule:

```tsx
<PageHeader title={t('system.menu.setting')} />
// overview remains entry page

<PageHeader
  title={t(activeGroupMeta.titleKey)}
  subtitle={t(activeGroupMeta.descriptionKey, '')}
  extra={<Button onClick={() => navigate('/system/setting')}>{t('common.back')}</Button>}
/>
// group page remains single-group editor
```

Add any new text keys in `frontend/src/i18n/resources/zh-CN.ts` and `frontend/src/i18n/resources/en-US.ts`.

- [ ] **Step 4: Re-run compile and smoke verification for the config pages**

Run:

```bash
cd frontend
cmd /c npm run type-check
cmd /c npm run check:system-page-admission
cmd /c npx playwright test tests/smoke/system/governance/module-governance.spec.ts tests/smoke/platform/shell-visual-contract.spec.ts tests/smoke/system/system-pages.spec.ts --config=playwright.config.ts --workers=1
```

Expected: PASS, with `/system/modules` showing one compact governance container, `/system/generator` using header-driven navigation only, and `/system/i18n` no longer acting as a mixed overview + deep editor wall.

- [ ] **Step 5: Commit the config-page shell cleanup**

```bash
git add frontend/src/modules/system/dynamicmodule/ModuleManager.tsx frontend/src/modules/generator/pages/ModuleWizard.tsx frontend/src/modules/generator/pages/ModuleWizard.css frontend/src/modules/system/i18n/I18nList.tsx frontend/src/modules/system/setting/SettingOverviewPage.tsx frontend/src/modules/system/setting/SettingGroupPage.tsx frontend/src/i18n/resources/zh-CN.ts frontend/src/i18n/resources/en-US.ts frontend/tests/smoke/system/governance/module-governance.spec.ts frontend/tests/smoke/platform/shell-visual-contract.spec.ts frontend/tests/smoke/system/system-pages.spec.ts
git commit -m "feat: tighten system config governance page shells"
```

## Task 5: Final verification and release-ready evidence

**Files:**
- Modify: none if green
- Test: `backend/modules/system/iam/permission/permission_service_test.go`
- Test: `frontend/tests/smoke/system/governance/permission-workbench-remediation.spec.ts`
- Test: `frontend/tests/smoke/system/governance/module-governance.spec.ts`
- Test: `frontend/tests/smoke/platform/shell-visual-contract.spec.ts`
- Test: `frontend/tests/smoke/system/system-pages.spec.ts`

- [ ] **Step 1: Run the backend verification set**

Run:

```bash
go test ./backend/modules/system/iam/permission -count=1
```

Expected: PASS.

- [ ] **Step 2: Run the frontend compile and contract checks**

Run:

```bash
cd frontend
cmd /c npm run type-check
cmd /c npm run check:system-page-admission
cmd /c npm run check:shell-visual-contract
```

Expected: PASS.

- [ ] **Step 3: Run the targeted smoke suite**

Run:

```bash
cd frontend
cmd /c npx playwright test tests/smoke/system/governance/permission-workbench-remediation.spec.ts tests/smoke/system/governance/permission-workbench-remediation-real.spec.ts tests/smoke/system/governance/module-governance.spec.ts tests/smoke/platform/shell-visual-contract.spec.ts tests/smoke/system/system-pages.spec.ts --config=playwright.config.ts --workers=1
```

Expected: PASS.

- [ ] **Step 4: Capture the final diff and status**

Run:

```bash
git status --short
git log --oneline -n 5
```

Expected: only the intended files are changed or committed, with no unrelated drift introduced.

- [ ] **Step 5: Create the final integration commit only if Tasks 1-4 left intentional unstaged files**

```bash
git add docs/contracts/SYSTEM_IAM_CONTRACT.md docs/contracts/SYSTEM_CONFIG_CONTRACT.md docs/designs/FRONTEND_UI_SPEC.md backend/modules/system/iam/permission/permission_workbench.go backend/modules/system/iam/permission/permission_service.go backend/modules/system/iam/permission/permission_handler.go backend/modules/system/iam/permission/permission_service_test.go frontend/config/system-page-admission.json frontend/scripts/check-system-page-admission.mjs frontend/src/modules/system/permission/api.ts frontend/src/modules/system/permission/PermissionList.tsx frontend/src/modules/system/permission/PermissionWorkbenchTab.tsx frontend/src/modules/system/dynamicmodule/ModuleManager.tsx frontend/src/modules/generator/pages/ModuleWizard.tsx frontend/src/modules/generator/pages/ModuleWizard.css frontend/src/modules/system/i18n/I18nList.tsx frontend/src/modules/system/setting/SettingOverviewPage.tsx frontend/src/modules/system/setting/SettingGroupPage.tsx frontend/src/i18n/resources/zh-CN.ts frontend/src/i18n/resources/en-US.ts frontend/tests/smoke/system/governance/permission-workbench-remediation.spec.ts frontend/tests/smoke/system/governance/permission-workbench-remediation-real.spec.ts frontend/tests/smoke/system/governance/module-governance.spec.ts frontend/tests/smoke/platform/shell-visual-contract.spec.ts frontend/tests/smoke/system/system-pages.spec.ts
git commit -m "feat: complete iam remediation and config governance cleanup"
```

Skip this step if Tasks 1-4 already landed as the final desired commit set.
