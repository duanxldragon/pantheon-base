import fs from 'node:fs/promises';
import syncFs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import {
  adminCredentials,
  apiBaseUrl,
  authHeaders,
  installClientSession,
  installOperationToken,
  loginByApi,
  requestHeaders,
  signInAsAdmin,
  signInWithUi,
  verifiedHeaders,
} from '../helpers/auth';
import { registerSystemWorkspaceTaskDepthSmokeTests } from './system-workspace-task-depth';
const pageErrorTitles = ['加载失败', '网络异常', '请求超时'];
const pageEmptyTexts = ['暂无数据', '当前筛选范围内没有可展示的数据', '当前筛选下暂无岗位', '暂无系统设置', '请选择左侧字典类型后维护字典项', '暂无字典类型', '暂无字典项', '暂无登录日志', '暂无会话数据'];
type SettingItem = { settingKey: string; settingValue: string };
type UserPlatformPreferences = {
  theme?: string;
  language?: string;
  layoutMode?: string;
  densityMode?: string;
};
type ManageMenuNode = {
  id: number;
  parentId: number;
  titleKey: string;
  path: string;
  type: string;
  children?: ManageMenuNode[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const admissionConfig = JSON.parse(
  syncFs.readFileSync(path.resolve(__dirname, '../../../config/system-page-admission.json'), 'utf8'),
) as Array<{
  path: string;
  hero: 'allowed' | 'forbidden';
  governanceDrawer: 'allowed' | 'forbidden';
}>;

const compactMainAreaPages = admissionConfig
  .filter((item) => item.hero === 'forbidden' && item.governanceDrawer === 'allowed')
  .map((item) => item.path)
  .filter((item) => !item.includes(':'));

const pageIdentitySelectors = [
  '.governance-summary-bar',
  '.system-list__table-card',
  '.permission-workbench__tabs',
  '.dict-workbench',
  '.setting-group-page',
  '.module-manager-page',
  '.generator-wizard-card',
  '.dashboard-hero-card',
  '.auth-security-page',
];

const systemPages = [
  { path: '/system/user', title: '用户管理' },
  { path: '/system/role', title: '角色管理' },
  { path: '/system/menu', title: '菜单管理' },
  { path: '/system/dept', title: '部门管理' },
  { path: '/system/post', title: '岗位管理' },
  { path: '/system/permission', title: '权限管理' },
  { path: '/system/dict', title: '字典管理' },
  { path: '/system/setting', title: '系统设置' },
  { path: '/system/i18n', title: '国际化管理' },
  { path: '/system/generator', title: /模块生成(?:器|向导)/ },
  { path: '/system/login-log', title: '登录日志' },
  { path: '/system/session', title: '会话管理' },
  { path: '/system/operation-log', title: '操作日志' },
  { path: '/system/modules', title: '模块注册表' },
] as const;

const workspacePages = [
  {
    path: '/dashboard',
    title: '工作台',
    assertReady: async (page: Page) => {
      await expect(page.locator('.dashboard-hero-card')).toBeVisible();
      await expect(page.locator('.dashboard-stat-card').first()).toBeVisible();
    },
  },
  {
    path: '/auth/security',
    title: '安全中心',
    assertReady: async (page: Page) => {
      await expect(page.locator('.page-split-layout--with-rail')).toBeVisible();
      await expect(page.locator('.page-main-column .arco-card').filter({ hasText: /在线会话|Active Sessions/ }).first()).toBeVisible();
      await expect(page.locator('.page-main-column .arco-card').filter({ hasText: /最近登录|Recent Logins/ }).first()).toBeVisible();
    },
  },
  {
    path: '/system/profile',
    title: '个人中心',
    assertReady: async (page: Page) => {
      await expect(page.locator('.arco-form')).toBeVisible();
      await expect(page.locator('.submit-bar')).toBeVisible();
    },
  },
  {
    path: '/system/user/1',
    assertReady: async (page: Page) => {
      await expect(page.getByRole('button', { name: /返回|Back/ })).toBeVisible();
      await expect(page.getByText('基础信息', { exact: true })).toBeVisible();
      await expect(page.getByText('账号摘要', { exact: true })).toBeVisible();
    },
  },
] as const;

async function updateSettingGroup(page: Page, accessToken: string, groupKey: string, items: SettingItem[]) {
  return page.request.put(`${apiBaseUrl}/system/setting/group/${groupKey}`, {
    headers: await verifiedHeaders(page, accessToken),
    data: { items },
  });
}

async function waitForRefreshBootstrap(page: Page) {
  await page.waitForResponse(
    (response) =>
      response.url().includes('/system/refresh/state') &&
      response.request().method() === 'GET' &&
      response.ok(),
    { timeout: 15000 },
  );
}

async function closeExtraBrowserContext(context: BrowserContext) {
  try {
    await context.close();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('apiRequestContext._wrapApiCall: ENOENT') &&
      error.message.includes('.playwright-artifacts-0')
    ) {
      return;
    }
    throw error;
  }
}

async function deleteUserByUsername(page: Page, accessToken: string, username: string) {
  const response = await page.request.get(`${apiBaseUrl}/system/user/list`, {
    headers: authHeaders(accessToken),
    params: { username, page: 1, pageSize: 20 },
  });
  if (!response.ok()) {
    return;
  }
  const payload = await response.json();
  const items = Array.isArray(payload.data?.items) ? payload.data.items : [];
  for (const item of items) {
    if (item.username === username) {
      await page.request.delete(`${apiBaseUrl}/system/user/${item.id}`, {
        headers: await verifiedHeaders(page, accessToken),
      }).catch(() => undefined);
    }
  }
}

async function deleteRoleByKey(page: Page, accessToken: string, roleKey: string) {
  const response = await page.request.get(`${apiBaseUrl}/system/role/list`, {
    headers: authHeaders(accessToken),
    params: { roleKey, page: 1, pageSize: 20 },
  });
  if (!response.ok()) {
    return;
  }
  const payload = await response.json();
  const items = Array.isArray(payload.data?.items) ? payload.data.items : [];
  for (const item of items) {
    if (item.roleKey === roleKey && item.roleKey !== 'admin') {
      await page.request.delete(`${apiBaseUrl}/system/role/${item.id}`, {
        headers: await verifiedHeaders(page, accessToken),
      }).catch(() => undefined);
    }
  }
}

async function fetchManageMenuTree(page: Page, accessToken: string): Promise<ManageMenuNode[]> {
  const response = await page.request.get(`${apiBaseUrl}/system/menu/tree`, {
    headers: authHeaders(accessToken),
    params: { scope: 'manage' },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.code).toBe(200);
  return Array.isArray(payload.data) ? (payload.data as ManageMenuNode[]) : [];
}

function flattenManageMenus(nodes: ManageMenuNode[]): ManageMenuNode[] {
  return nodes.flatMap((node) => [node, ...flattenManageMenus(node.children || [])]);
}

async function deleteMenuById(page: Page, accessToken: string, menuId: number | null) {
  if (!menuId) {
    return;
  }
  await page.request.delete(`${apiBaseUrl}/system/menu/${menuId}`, {
    headers: await verifiedHeaders(page, accessToken),
  });
}

async function getRoleByKey(page: Page, accessToken: string, roleKey: string) {
  const response = await page.request.get(`${apiBaseUrl}/system/role/list`, {
    headers: authHeaders(accessToken),
    params: { roleKey, page: 1, pageSize: 20 },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  const items = Array.isArray(payload.data?.items) ? payload.data.items : [];
  return items.find((item: { roleKey: string }) => item.roleKey === roleKey) as { id: number; roleKey: string } | undefined;
}

async function createApiPermission(page: Page, accessToken: string, roleKey: string, path: string, method: string) {
  const response = await page.request.post(`${apiBaseUrl}/system/permission`, {
    headers: await verifiedHeaders(page, accessToken),
    data: { roleKey, path, method },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.code).toBe(200);
}

async function getCurrentUserPreferences(page: Page, accessToken: string): Promise<UserPlatformPreferences> {
  const response = await page.request.get(`${apiBaseUrl}/auth/me`, {
    headers: authHeaders(accessToken),
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.code).toBe(200);
  return (payload.data?.preferences || {}) as UserPlatformPreferences;
}

async function updateCurrentUserPreferences(page: Page, accessToken: string, preferences: UserPlatformPreferences) {
  const response = await page.request.put(`${apiBaseUrl}/auth/me/preferences`, {
    headers: await requestHeaders(page, accessToken),
    data: preferences,
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.code).toBe(200);
}

async function expectNoPageError(page: Page) {
  for (const title of pageErrorTitles) {
    const matches = page.getByText(title, { exact: false });
    const count = await matches.count();
    for (let i = 0; i < count; i += 1) {
      await expect(matches.nth(i)).not.toBeVisible();
    }
  }
}

async function expectPageBodyReady(page: Page) {
  const table = page.locator('.arco-table');
  const empty = page.locator('.arco-empty');
  const settingGroupNav = page.locator('.setting-page__group-nav-grid');
  const settingConfigCard = page.locator('.setting-page__config-card');
  const generatorSteps = page.locator('.generator-wizard__steps');

  const hasTable = (await table.count()) > 0;
  const hasEmpty = (await empty.count()) > 0;
  const hasSettingGroupNav = (await settingGroupNav.count()) > 0;
  const hasSettingConfigCard = (await settingConfigCard.count()) > 0;
  const hasGeneratorSteps = (await generatorSteps.count()) > 0;

  expect(
    hasTable || hasEmpty || hasSettingGroupNav || hasSettingConfigCard || hasGeneratorSteps,
  ).toBeTruthy();

  if (hasEmpty) {
    const emptyText = await empty.first().innerText();
    expect(pageEmptyTexts.some((text) => emptyText.includes(text))).toBeTruthy();
  }
}

async function expectVisiblePageTitle(page: Page, title: string | RegExp) {
  const visibleMatches = page.getByText(title, { exact: false }).filter({ visible: true });
  await expect(visibleMatches.first()).toBeVisible();
}

function shellBrandTextLocator(page: Page) {
  return page.locator('.app-shell__brand-title, .app-shell__header-brand-text').first();
}

async function expectPageIdentityReady(page: Page, title: string | RegExp) {
  await expectVisiblePageTitle(page, title);
  await expect(page.locator(pageIdentitySelectors.join(', ')).first()).toBeVisible();
}

function formItem(page: Page, label: string) {
  return page.locator('.arco-form-item').filter({ has: page.getByText(label, { exact: true }) }).first();
}

test.beforeEach(async ({ page }) => {
  await signInAsAdmin(page);
});

registerSystemWorkspaceTaskDepthSmokeTests({
  expectVisiblePageTitle,
  expectPageIdentityReady,
  formItem,
});

for (const pageMeta of systemPages) {
  test(`system smoke: ${pageMeta.path}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().includes('Failed to load resource: the server responded with a status of 404')) {
        consoleErrors.push(message.text());
      }
    });

    await page.goto(pageMeta.path, { waitUntil: 'networkidle' });
    const expectedUrlPattern =
      pageMeta.path === '/system/setting'
        ? /\/system\/setting(?:\/[a-z-]+)?$/
        : new RegExp(`${pageMeta.path.replace(/\//g, '\\/')}$`);
    await expect(page).toHaveURL(expectedUrlPattern);
    await expectVisiblePageTitle(page, pageMeta.title);
    await expectNoPageError(page);
    await expectPageBodyReady(page);
    expect(consoleErrors).toEqual([]);
  });
}

for (const pageMeta of workspacePages) {
  test(`workspace smoke: ${pageMeta.path} is reachable`, async ({ page }) => {
    await page.goto(pageMeta.path, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(new RegExp(`${pageMeta.path.replace(/\//g, '\\/')}$`));
    if ('title' in pageMeta && pageMeta.title) {
      await expectVisiblePageTitle(page, pageMeta.title);
    }
    await expectNoPageError(page);
    await pageMeta.assertReady(page);
  });
}

test('user page keeps list workflow primary without governance drawer entry', async ({ page }) => {
  await page.goto('/system/user', { waitUntil: 'networkidle' });

  await expectVisiblePageTitle(page, '用户管理');
  await expect(page.locator('.system-user-list__hero')).toHaveCount(0);
  await expect(page.locator('.governance-summary-bar')).toBeVisible();
  await expect(page.getByRole('button', { name: '治理摘要' })).toHaveCount(1);
  await expect(page.locator('.governance-insight-drawer')).toHaveCount(0);
  await expect(page.locator('.system-list__table-card')).toBeVisible();
  await expect(page.locator('.table-batch-action-bar__prefix-actions')).toBeVisible();
  await expect(page.locator('.table-batch-action-bar__prefix-actions').getByText('新增')).toBeVisible();
  await expect(page.locator('.table-batch-action-bar__prefix-actions').getByText('导入')).toBeVisible();
  await expect(page.locator('.table-batch-action-bar__prefix-actions').getByText('导出')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '状态' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '部门' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '岗位' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '角色' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '邮箱' })).toBeVisible();

  const firstRowActions = page.locator('.system-user-list__row-actions').first();
  await expect(firstRowActions.getByRole('button', { name: '详情' })).toBeVisible();
  await expect(firstRowActions.getByRole('button', { name: '编辑' })).toBeVisible();
  await expect(firstRowActions.getByRole('button', { name: '重置密码' })).toBeVisible();
  await expect(firstRowActions.getByRole('button', { name: /启用|禁用/ })).toBeVisible();
  await expect(firstRowActions.getByRole('button', { name: '删除' })).toHaveCount(0);
  await expect(firstRowActions.getByLabel('操作')).toHaveCount(0);
});

test('setting page shows audit table only in audit group and removes governance drawer entry', async ({
  page,
}) => {
  await page.goto('/system/setting', { waitUntil: 'networkidle' });

  await expectVisiblePageTitle(page, '系统设置');
  await expect(page.getByRole('button', { name: '治理摘要' })).toHaveCount(0);
  await expect(page.locator('.setting-page__audit-card')).toHaveCount(0);
  await expect(page.locator('.setting-group-page')).toBeVisible();
  await expect(page.locator('.setting-page__group-nav-grid')).toBeVisible();

  await page.getByRole('button', { name: /日志治理/ }).click();
  await expect(page).toHaveURL(/\/system\/setting\/audit$/);
  await expect(page.locator('.setting-page__audit-card')).toBeVisible();

  await page.getByRole('button', { name: /基础信息/ }).click();
  await expect(page).toHaveURL(/\/system\/setting\/basic$/);
  await expect(page.locator('.setting-page__audit-card')).toHaveCount(0);
});

test('setting route lands in the single workspace with group navigation', async ({
  page,
}) => {
  await page.goto('/system/setting', { waitUntil: 'networkidle' });

  await expectVisiblePageTitle(page, '系统设置');
  await expect(page.locator('.setting-group-page')).toBeVisible();
  await expect(page.locator('.setting-page__group-nav-grid')).toBeVisible();
  await expect(page).toHaveURL(/\/system\/setting\/basic$/);
  await expect(page.getByRole('tab', { name: '基础信息' })).toBeVisible();
  await expect(page.getByRole('button', { name: /基础信息/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /日志治理/ })).toBeVisible();
});

test('setting group route isolates one group context per route', async ({ page }) => {
  await page.goto('/system/setting/security', { waitUntil: 'networkidle' });

  await expectVisiblePageTitle(page, '系统设置');
  await expect(page.locator('.setting-group-page')).toBeVisible();
  await expect(page.locator('.setting-page__group-nav-grid')).toBeVisible();
  await expect(page.getByRole('tab', { name: '安全策略' })).toBeVisible();
  await expect(page.locator('.setting-page__audit-card')).toHaveCount(0);
  await expect(page.locator('.form-section__title').getByText('安全策略', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: /日志治理/ }).click();
  await expect(page).toHaveURL(/\/system\/setting\/audit$/);
  await expect(page.locator('.setting-page__audit-card')).toBeVisible();
});

test('governance and audit pages remove hero-heavy main-area blocks', async ({ page }) => {
  test.setTimeout(60000);
  for (const path of compactMainAreaPages) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.system-page-hero')).toHaveCount(0);
    await expect(page.locator('.system-list__hero')).toHaveCount(0);
    await expect(
      page
        .locator('.system-list__table-card, .permission-workbench__tabs, .org-structure, .dict-workbench')
        .first(),
    ).toBeVisible();
  }
});

test('menu smoke: create dialog uses tree parent selector', async ({ page }) => {
  await signInAsAdmin(page);
  await page.goto('/system/menu', { waitUntil: 'networkidle' });

  await page.getByRole('button', { name: '新增', exact: true }).click();
  const dialog = page.getByRole('dialog').filter({ has: page.getByText('新增菜单', { exact: true }) });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.arco-tree-select').first()).toBeVisible();
});

test('menu smoke: create child action preselects clicked parent', async ({ page }) => {
  const accessToken = await signInAsAdmin(page);
  const menus = flattenManageMenus(await fetchManageMenuTree(page, accessToken));
  const parentMenu =
    menus.find((item) => item.path === '/system/access') ??
    menus.find((item) => item.path && item.type !== 'F');
  expect(parentMenu).toBeTruthy();

  let createdMenuId: number | null = null;
  try {
    await page.goto('/system/menu', { waitUntil: 'networkidle' });

    const parentRow = page.locator('.arco-table-tr').filter({ hasText: parentMenu?.path || '' }).first();
    await expect(parentRow).toBeVisible();
    await parentRow.getByRole('button', { name: '新增子菜单', exact: true }).click();

    const dialog = page.getByRole('dialog').filter({ has: page.getByText('新增菜单', { exact: true }) });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.arco-tree-select').first()).toContainText('/system/access');

    const uniqueSuffix = Date.now();
    await dialog.getByPlaceholder('例如：system.menu.example').fill(`system.menu.child.${uniqueSuffix}`);
    await dialog.getByPlaceholder('例如：/system/example').fill(`/system/menu-child-${uniqueSuffix}`);
    await dialog
      .getByPlaceholder('例如：business/cmdb/CMDBTypeList')
      .fill('system/menu/MenuList');
    await dialog.getByPlaceholder('例如：system-example').fill(`system-menu-child-${uniqueSuffix}`);
    await dialog
      .getByPlaceholder('例如：system.iam / system.auth / platform / business.order')
      .fill('system.iam');
    await dialog
      .getByPlaceholder('例如：system:example:list')
      .nth(0)
      .fill(`system:menu:child:${uniqueSuffix}`);

    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/system/menu') &&
        response.request().method() === 'POST',
    );
    await dialog.locator('.submit-bar').getByRole('button', { name: '新增', exact: true }).click();
    const createResponse = await createResponsePromise;
    expect(createResponse.ok()).toBeTruthy();
    const requestBody = createResponse.request().postDataJSON() as { parentId: number };
    expect(requestBody.parentId).toBe(parentMenu?.id);
    const payload = await createResponse.json();
    expect(payload.code).toBe(200);
    createdMenuId = Number(payload.data?.id || 0) || null;
  } finally {
    await deleteMenuById(page, accessToken, createdMenuId);
  }
});

test('config high-sensitivity pages keep one summary container and no hero wall', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/system/modules', { waitUntil: 'networkidle' });
  await expectVisiblePageTitle(page, '模块注册表');
  await expect(page.locator('.system-page-hero')).toHaveCount(0);
  await expect(page.locator('.system-list__hero')).toHaveCount(0);
  await expect(page.locator('.module-manager-page__intro')).toHaveCount(0);
  await expect(page.locator('.module-manager-page__stats')).toHaveCount(0);
  await expect(page.locator('.module-manager-page__header-actions .arco-btn-primary')).toBeVisible();

  await page.goto('/system/generator', { waitUntil: 'networkidle' });
  await expectVisiblePageTitle(page, /模块生成(?:器|向导)/);
  await expect(page.locator('.system-page-hero')).toHaveCount(0);
  await expect(page.locator('.system-list__hero')).toHaveCount(0);
  await expect(page.locator('.system-list__work-actions .arco-btn')).toBeVisible();
  await expect(page.locator('.generator-wizard__steps')).toBeVisible();

  await page.goto('/system/i18n', { waitUntil: 'networkidle' });
  await expectVisiblePageTitle(page, '国际化管理');
  await expect(page.locator('.governance-summary-bar')).toBeVisible();
  await expect(page.locator('.system-page-hero')).toHaveCount(0);
  await expect(page.locator('.system-list__hero')).toHaveCount(0);
  await expect(page.locator('.system-list__table-card')).toBeVisible();
});

test('dict workspace keeps the governance summary outside one tabbed task surface', async ({
  page,
}) => {
  await page.goto('/system/dict', { waitUntil: 'networkidle' });

  await expectVisiblePageTitle(page, '字典管理');
  const governanceBar = page.locator('.dict-page__governance-bar');
  const workbench = page.locator('.dict-page__table-card');

  await expect(governanceBar).toHaveCount(1);
  await expect(governanceBar).toBeVisible();
  await expect(workbench).toBeVisible();
  await expect(workbench.locator('.governance-summary-bar, .dict-page__governance-bar')).toHaveCount(0);
  await expect(workbench.getByRole('tab')).toHaveCount(2);
  await expect(workbench.locator('[role="tab"][aria-selected="true"]')).toHaveCount(1);
  await expect(workbench.locator('.dict-page__actions').first()).toBeVisible();

  const initialHierarchy = await page.evaluate(() => {
    const summary = document.querySelector<HTMLElement>('.dict-page__governance-bar');
    const taskSurface = document.querySelector<HTMLElement>('.dict-page__table-card');
    return summary && taskSurface
      ? {
          summaryHeight: summary.getBoundingClientRect().height,
          summaryTop: summary.getBoundingClientRect().top,
          surfaceHeight: taskSurface.getBoundingClientRect().height,
          surfaceTop: taskSurface.getBoundingClientRect().top,
        }
      : null;
  });
  expect(initialHierarchy).not.toBeNull();
  expect(initialHierarchy!.summaryTop).toBeLessThan(initialHierarchy!.surfaceTop);
  expect(initialHierarchy!.surfaceHeight).toBeGreaterThan(initialHierarchy!.summaryHeight);

  const itemTab = workbench.getByRole('tab').nth(1);
  await itemTab.click();
  await expect(itemTab).toHaveAttribute('aria-selected', 'true');
  await expect(workbench.locator('.governance-summary-bar, .dict-page__governance-bar')).toHaveCount(0);
  await expect(workbench.locator('.dict-page__actions').first()).toBeVisible();
});

test('i18n workspace keeps translation work primary and utility actions subordinate', async ({
  page,
}) => {
  await page.goto('/system/i18n', { waitUntil: 'networkidle' });

  await expectVisiblePageTitle(page, '国际化管理');
  const summaryBar = page.locator('.governance-summary-bar');
  const tableCard = page.locator('.i18n-list-page__table-card');
  const batchBar = tableCard.locator('.table-batch-action-bar');
  const tableBody = tableCard.locator('.system-list__table, .arco-empty').first();

  await expect(summaryBar).toBeVisible();
  await expect(tableCard).toBeVisible();
  await expect(batchBar).toBeVisible();
  await expect(tableBody).toBeVisible();
  await expect(tableCard.getByRole('button', { name: '导出' })).toBeVisible();
  await expect(tableCard.getByRole('button', { name: '导入' })).toBeVisible();

  const tableHierarchy = await page.evaluate(() => {
    const card = document.querySelector<HTMLElement>('.i18n-list-page__table-card');
    const actionBar = document.querySelector<HTMLElement>(
      '.i18n-list-page__table-card .table-batch-action-bar',
    );
    const table = document.querySelector<HTMLElement>(
      '.i18n-list-page__table-card .system-list__table, .i18n-list-page__table-card .arco-empty',
    );
    return card && actionBar && table
      ? {
          actionBottom: actionBar.getBoundingClientRect().bottom,
          actionHeight: actionBar.getBoundingClientRect().height,
          cardTop: card.getBoundingClientRect().top,
          cardHeight: card.getBoundingClientRect().height,
          controlRegionHeight: table.getBoundingClientRect().top - card.getBoundingClientRect().top,
          tableHeight: table.getBoundingClientRect().height,
          tableTop: table.getBoundingClientRect().top,
        }
      : null;
  });
  expect(tableHierarchy).not.toBeNull();
  expect(tableHierarchy!.actionHeight).toBeGreaterThan(0);
  expect(tableHierarchy!.cardTop).toBeLessThan(tableHierarchy!.tableTop);
  expect(tableHierarchy!.cardHeight).toBeGreaterThan(tableHierarchy!.actionHeight);
  expect(tableHierarchy!.tableHeight).toBeGreaterThan(tableHierarchy!.controlRegionHeight);
  expect(tableHierarchy!.tableTop).toBeGreaterThanOrEqual(tableHierarchy!.actionBottom - 1);
});

test('setting workspace keeps group navigation and config primary while audit stays secondary', async ({
  page,
}) => {
  await page.goto('/system/setting/audit', { waitUntil: 'networkidle' });

  await expectVisiblePageTitle(page, '系统设置');
  const groupNav = page.locator('.setting-page__group-nav-grid');
  const configCard = page.locator('.setting-page__config-card');
  const auditCard = page.locator('.setting-page__audit-card');

  await expect(groupNav).toBeVisible();
  await expect(configCard).toBeVisible();
  await expect(auditCard).toBeVisible();
  await expect(configCard.locator('.submit-bar')).toBeVisible();

  const panelHierarchy = await page.evaluate(() => {
    const nav = document.querySelector<HTMLElement>('.setting-page__group-nav-grid');
    const config = document.querySelector<HTMLElement>('.setting-page__config-card');
    const audit = document.querySelector<HTMLElement>('.setting-page__audit-card');
    return nav && config && audit
      ? {
          navBottom: nav.getBoundingClientRect().bottom,
          navTop: nav.getBoundingClientRect().top,
          configTop: config.getBoundingClientRect().top,
          configBottom: config.getBoundingClientRect().bottom,
          auditTop: audit.getBoundingClientRect().top,
        }
      : null;
  });
  expect(panelHierarchy).not.toBeNull();
  expect(panelHierarchy!.navTop).toBeLessThan(panelHierarchy!.configTop);
  expect(panelHierarchy!.navBottom).toBeLessThanOrEqual(panelHierarchy!.configTop + 1);
  expect(panelHierarchy!.configTop).toBeLessThan(panelHierarchy!.auditTop);
  expect(panelHierarchy!.configBottom).toBeLessThanOrEqual(panelHierarchy!.auditTop + 1);
});

test('setting smoke: site name updates public brand display', async ({ page }) => {
  const accessToken = await signInAsAdmin(page);
  const groupResponse = await page.request.get(`${apiBaseUrl}/system/setting/group/basic`, {
    headers: authHeaders(accessToken),
  });
  expect(groupResponse.ok()).toBeTruthy();
  const groupPayload = await groupResponse.json();
  expect(groupPayload.code).toBe(200);
  const originalItems = groupPayload.data.items as SettingItem[];
  const nextSiteName = `Pantheon QA ${Date.now()}`;
  const nextItems = originalItems.map((item) => ({
    settingKey: item.settingKey,
    settingValue: item.settingKey === 'site.name' ? nextSiteName : item.settingValue,
  }));

  try {
    const updateResponse = await updateSettingGroup(page, accessToken, 'basic', nextItems);
    expect(updateResponse.ok()).toBeTruthy();
    const updatePayload = await updateResponse.json();
    expect(updatePayload.code).toBe(200);

    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await expect(shellBrandTextLocator(page)).toHaveText(nextSiteName);
    await expect(page).toHaveTitle(nextSiteName);
  } finally {
    await updateSettingGroup(page, accessToken, 'basic', originalItems);
  }
});

test('i18n smoke: detail edit create and delete dialogs work', async ({ page }) => {
  const accessToken = await signInAsAdmin(page);
  const seedKey = `i18n.smoke.${Date.now()}`;
  const createResponse = await page.request.post(`${apiBaseUrl}/system/i18n`, {
    headers: await verifiedHeaders(page, accessToken),
    data: {
      module: 'system.config',
      group: 'messages',
      key: seedKey,
      locale: 'zh-CN',
      value: '初始值',
      remark: 'smoke',
    },
  });
  expect(createResponse.ok()).toBeTruthy();
  const createPayload = await createResponse.json();
  expect(createPayload.code).toBe(200);

  await page.goto('/system/i18n', { waitUntil: 'networkidle' });
  await formItem(page, '翻译键').locator('input').first().fill(seedKey);
  await page.getByRole('button', { name: '搜索' }).click();

  const targetRow = page.getByRole('row', { name: new RegExp(seedKey) }).first();
  await expect(targetRow).toBeVisible();

  await targetRow.getByRole('button', { name: '详情' }).click();
  const detailDialog = page.getByRole('dialog').filter({ has: page.getByText('翻译详情', { exact: true }) });
  await expect(detailDialog).toBeVisible();
  await expect(detailDialog.getByText(seedKey)).toBeVisible();
  await detailDialog.getByRole('button', { name: '关闭' }).click();

  await targetRow.getByRole('button', { name: '编辑' }).click();
  const editDialog = page.getByRole('dialog').filter({ has: page.getByText('编辑翻译', { exact: true }) });
  await expect(editDialog).toBeVisible();
  const editTextarea = editDialog.locator('textarea').first();
  await editTextarea.fill('更新值');
  await editDialog.getByRole('button', { name: '确定' }).click();
  await expect(editDialog).toHaveCount(0);

  await expect.poll(async () => {
    const listResp = await page.request.get(`${apiBaseUrl}/system/i18n/list`, {
      headers: authHeaders(accessToken),
      params: { key: seedKey, page: '1', pageSize: '10' },
    });
    const listPayload = await listResp.json();
    return listPayload.data.items[0]?.value;
  }).toBe('更新值');

  await page.getByRole('button', { name: '新增' }).click();
  const createDialog = page.getByRole('dialog').filter({ has: page.getByText('新增翻译', { exact: true }) });
  await expect(createDialog).toBeVisible();
  const createKey = `${seedKey}.created`;
  await createDialog.locator('input').nth(0).fill('system.config');
  await createDialog.locator('input').nth(1).fill('messages');
  await createDialog.locator('input').nth(2).fill(createKey);
  await createDialog.getByRole('combobox').first().click();
  await createDialog.getByRole('option', { name: 'en-US' }).click();
  await createDialog.locator('textarea').first().fill('Created Value');
  await createDialog.getByRole('button', { name: '确定' }).click();
  await expect(createDialog).toHaveCount(0);

  await page.locator('.filter-panel').getByRole('button', { name: '重置' }).click();
  await formItem(page, '翻译键').locator('input').first().fill(createKey);
  await page.getByRole('button', { name: '搜索' }).click();
  await expect(page.getByRole('row', { name: new RegExp(createKey) }).first()).toBeVisible();

  const createdListResp = await page.request.get(`${apiBaseUrl}/system/i18n/list`, {
    headers: authHeaders(accessToken),
    params: { key: createKey, page: '1', pageSize: '10' },
  });
  const createdListPayload = await createdListResp.json();
  const createdRowId = createdListPayload.data.items[0]?.id as number | undefined;

  await page.locator('.filter-panel').getByRole('button', { name: '重置' }).click();
  await formItem(page, '翻译键').locator('input').first().fill(seedKey);
  await page.getByRole('button', { name: '搜索' }).click();
  const deleteRow = page.getByRole('row', { name: new RegExp(seedKey) }).first();
  await deleteRow.getByRole('button', { name: '删除' }).click();
  const deleteConfirmPopup = page
    .locator('.arco-popconfirm:visible, .arco-trigger-popup:visible, .arco-popover:visible, [role="tooltip"]:visible, [role="dialog"]:visible')
    .filter({ has: page.getByRole('button', { name: '确定', exact: true }) })
    .last();
  await expect(deleteConfirmPopup).toBeVisible();
  await deleteConfirmPopup.getByRole('button', { name: '确定', exact: true }).click();

  await expect.poll(async () => {
    const listResp = await page.request.get(`${apiBaseUrl}/system/i18n/list`, {
      headers: authHeaders(accessToken),
      params: { key: seedKey, page: '1', pageSize: '10' },
    });
    const listPayload = await listResp.json();
    return listPayload.data.items.length;
  }).toBe(1);

  if (createdRowId) {
    await page.request.delete(`${apiBaseUrl}/system/i18n/${createdRowId}`, {
      headers: await verifiedHeaders(page, accessToken),
    }).catch(() => undefined);
  }
});

test('i18n smoke: import csv creates updates and downloads error file', async ({ page }, testInfo) => {
  const accessToken = await signInAsAdmin(page);
  const seedBase = `i18n.import.${Date.now()}`;
  const updateKey = `${seedBase}.update`;
  const createKey = `${seedBase}.create`;

  const seedResponse = await page.request.post(`${apiBaseUrl}/system/i18n`, {
    headers: await verifiedHeaders(page, accessToken),
    data: {
      module: 'system.config',
      group: 'messages',
      key: updateKey,
      locale: 'zh-CN',
      value: '导入前旧值',
      remark: 'seed',
    },
  });
  expect(seedResponse.ok()).toBeTruthy();
  const seedPayload = await seedResponse.json();
  expect(seedPayload.code).toBe(200);

  const successCsv = [
    'module,group,key,locale,value,remark',
    `system.config,messages,${updateKey},zh-CN,导入后新值,updated by smoke`,
    `system.config,messages,${createKey},zh-CN,批量新增值,created by smoke`,
  ].join('\n');

  await page.goto('/system/i18n', { waitUntil: 'networkidle' });
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'system-i18n-import.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(`\uFEFF${successCsv}`, 'utf8'),
  });

  const successSummary = page.getByText('创建 1 条，更新 1 条，失败 0 条', { exact: true });
  await expect(successSummary).toBeVisible();
  await page.getByRole('button', { name: '确定' }).last().click();

  await expect.poll(async () => {
    const listResp = await page.request.get(`${apiBaseUrl}/system/i18n/list`, {
      headers: authHeaders(accessToken),
      params: { key: updateKey, page: '1', pageSize: '10' },
    });
    const listPayload = await listResp.json();
    return listPayload.data.items[0]?.value;
  }).toBe('导入后新值');

  await expect.poll(async () => {
    const listResp = await page.request.get(`${apiBaseUrl}/system/i18n/list`, {
      headers: authHeaders(accessToken),
      params: { key: createKey, page: '1', pageSize: '10' },
    });
    const listPayload = await listResp.json();
    return listPayload.data.items[0]?.value;
  }).toBe('批量新增值');

  const invalidKey = `${seedBase}.invalid`;
  const invalidCsv = [
    'module,group,key,locale,value,remark',
    `system.config,messages,${invalidKey},zh-CN,,missing value`,
    `system.config,messages,${invalidKey},zh-CN,重复值,duplicate row`,
  ].join('\n');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'system-i18n-import-invalid.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(`\uFEFF${invalidCsv}`, 'utf8'),
  });

  const errorDownload = await downloadPromise;
  expect(errorDownload.suggestedFilename()).toBe('system-i18n-import-errors.csv');
  const downloadPath = testInfo.outputPath('system-i18n-import-errors.csv');
  await errorDownload.saveAs(downloadPath);
  const errorCsv = await fs.readFile(downloadPath, 'utf8');
  expect(errorCsv).toContain('i18n.value.required');
  expect(errorCsv).toContain('import.duplicate.row.2');

  await expect(page.getByRole('button', { name: '搜索' })).toBeVisible();

  const createdListResp = await page.request.get(`${apiBaseUrl}/system/i18n/list`, {
    headers: authHeaders(accessToken),
    params: { key: createKey, page: '1', pageSize: '10' },
  });
  const createdListPayload = await createdListResp.json();
  const createdRowId = createdListPayload.data.items[0]?.id as number | undefined;

  if (createdRowId) {
    await page.request.delete(`${apiBaseUrl}/system/i18n/${createdRowId}`, {
      headers: await verifiedHeaders(page, accessToken),
    }).catch(() => undefined);
  }
  await page.request.delete(`${apiBaseUrl}/system/i18n/${seedPayload.data.id}`, {
    headers: await verifiedHeaders(page, accessToken),
  }).catch(() => undefined);
});

test('setting smoke: security policy saves through setting page UI', async ({ page }) => {
  const accessToken = await signInAsAdmin(page);
  const groupResponse = await page.request.get(`${apiBaseUrl}/system/setting/group/security`, {
    headers: authHeaders(accessToken),
  });
  expect(groupResponse.ok()).toBeTruthy();
  const groupPayload = await groupResponse.json();
  expect(groupPayload.code).toBe(200);
  const originalItems = groupPayload.data.items as SettingItem[];
  const originalValue = originalItems.find((item) => item.settingKey === 'security.password_min_length')?.settingValue ?? '6';
  const nextValue = originalValue === '6' ? '7' : '6';

  try {
    await page.goto('/system/setting/security', { waitUntil: 'networkidle' });
    await installOperationToken(page, accessToken);
    await page.locator('input[role="spinbutton"]').first().fill(nextValue);
    await page.locator('.submit-bar button').last().click();
    await expect.poll(async () => {
      const verifyResponse = await page.request.get(`${apiBaseUrl}/system/setting/group/security`, {
        headers: authHeaders(accessToken),
      });
      const verifyPayload = await verifyResponse.json();
      return (verifyPayload.data.items as Array<{ settingKey: string; settingValue: string }>)
        .find((item) => item.settingKey === 'security.password_min_length')?.settingValue;
    }).toBe(nextValue);
  } finally {
    await updateSettingGroup(page, accessToken, 'security', originalItems);
  }
});

test('setting smoke: setting audit row opens unified operation log detail', async ({ page }) => {
  const accessToken = await signInAsAdmin(page);
  const groupResponse = await page.request.get(`${apiBaseUrl}/system/setting/group/audit`, {
    headers: authHeaders(accessToken),
  });
  expect(groupResponse.ok()).toBeTruthy();
  const groupPayload = await groupResponse.json();
  expect(groupPayload.code).toBe(200);
  const originalItems = groupPayload.data.items as SettingItem[];
  const originalValue =
    originalItems.find((item) => item.settingKey === 'audit.login_log_retention_days')
      ?.settingValue ?? '90';
  const nextValue = originalValue === '90' ? '91' : '90';
  const nextItems = originalItems.map((item) => ({
    settingKey: item.settingKey,
    settingValue:
      item.settingKey === 'audit.login_log_retention_days' ? nextValue : item.settingValue,
  }));

  try {
    const updateResponse = await updateSettingGroup(page, accessToken, 'audit', nextItems);
    expect(updateResponse.ok()).toBeTruthy();

    await page.goto('/system/setting/audit', { waitUntil: 'networkidle' });
    const auditCard = page.locator('.setting-page__audit-card');
    await expect(auditCard).toBeVisible();
    const viewAuditButton = auditCard.getByRole('button', { name: '查看统一审计' }).first();
    await expect(viewAuditButton).toBeVisible();
    await viewAuditButton.click();

    await expect(page).toHaveURL(/\/system\/operation-log\?detailId=\d+/);
    const detailDialog = page.getByRole('dialog');
    await expect(detailDialog).toBeVisible();
    await expect(detailDialog.getByText('请求摘要')).toBeVisible();
    await expect(detailDialog.getByText('日志治理')).toBeVisible();
  } finally {
    await updateSettingGroup(page, accessToken, 'audit', originalItems);
  }
});

test('setting smoke: login policy saves through setting page UI', async ({ page }) => {
  const accessToken = await signInAsAdmin(page);
  const groupResponse = await page.request.get(`${apiBaseUrl}/system/setting/group/login`, {
    headers: authHeaders(accessToken),
  });
  expect(groupResponse.ok()).toBeTruthy();
  const groupPayload = await groupResponse.json();
  expect(groupPayload.code).toBe(200);
  const originalItems = groupPayload.data.items as SettingItem[];
  const originalValue = originalItems.find((item) => item.settingKey === 'login.max_failed_attempts')?.settingValue ?? '5';
  const nextValue = originalValue === '5' ? '6' : '5';

  try {
    await page.goto('/system/setting/login', { waitUntil: 'networkidle' });
    await installOperationToken(page, accessToken);
    await page.locator('input[role="spinbutton"]').first().fill(nextValue);
    await page.locator('.submit-bar button').last().click();
    await expect.poll(async () => {
      const verifyResponse = await page.request.get(`${apiBaseUrl}/system/setting/group/login`, {
        headers: authHeaders(accessToken),
      });
      const verifyPayload = await verifyResponse.json();
      return (verifyPayload.data.items as Array<{ settingKey: string; settingValue: string }>)
        .find((item) => item.settingKey === 'login.max_failed_attempts')?.settingValue;
    }).toBe(nextValue);
  } finally {
    await updateSettingGroup(page, accessToken, 'login', originalItems);
  }
});

test('setting smoke: upload storage driver can be selected through setting page UI', async ({ page }) => {
  const accessToken = await signInAsAdmin(page);
  const groupResponse = await page.request.get(`${apiBaseUrl}/system/setting/group/upload`, {
    headers: authHeaders(accessToken),
  });
  expect(groupResponse.ok()).toBeTruthy();
  const groupPayload = await groupResponse.json();
  expect(groupPayload.code).toBe(200);
  const originalItems = groupPayload.data.items as SettingItem[];
  const currentValue = originalItems.find((item) => item.settingKey === 'upload.storage_driver')?.settingValue ?? 'local';
  const nextValue = currentValue === 'local' ? 's3' : 'local';
  const nextLabel = nextValue === 's3' ? 'S3 兼容对象存储' : '本地存储';

  try {
    await page.goto('/system/setting/upload', { waitUntil: 'networkidle' });
    await installOperationToken(page, accessToken);
    await page.locator('.arco-select-view').first().click();
    await page.locator('.arco-select-option').filter({ hasText: nextLabel }).first().click();
    await page.locator('.submit-bar button').last().click();
    await expect.poll(async () => {
      const verifyResponse = await page.request.get(`${apiBaseUrl}/system/setting/group/upload`, {
        headers: authHeaders(accessToken),
      });
      const verifyPayload = await verifyResponse.json();
      return (verifyPayload.data.items as Array<{ settingKey: string; settingValue: string }>)
        .find((item) => item.settingKey === 'upload.storage_driver')?.settingValue;
    }).toBe(nextValue);
  } finally {
    await updateSettingGroup(page, accessToken, 'upload', originalItems);
  }
});

test('setting smoke: default language applies when there is no explicit choice', async ({ page }) => {
  const accessToken = await signInAsAdmin(page);
  const originalPreferences = await getCurrentUserPreferences(page, accessToken);
  const groupResponse = await page.request.get(`${apiBaseUrl}/system/setting/group/i18n`, {
    headers: authHeaders(accessToken),
  });
  expect(groupResponse.ok()).toBeTruthy();
  const groupPayload = await groupResponse.json();
  expect(groupPayload.code).toBe(200);
  const originalItems = groupPayload.data.items as SettingItem[];
  const nextItems = originalItems.map((item) => ({
    settingKey: item.settingKey,
    settingValue: item.settingKey === 'i18n.default_language' ? 'en-US' : item.settingValue,
  }));

  try {
    await updateCurrentUserPreferences(page, accessToken, {
      theme: originalPreferences.theme,
      language: '',
      layoutMode: originalPreferences.layoutMode,
      densityMode: originalPreferences.densityMode,
    });
    const updateResponse = await updateSettingGroup(page, accessToken, 'i18n', nextItems);
    expect(updateResponse.ok()).toBeTruthy();

    await page.addInitScript(() => {
      localStorage.removeItem('pantheon_lang');
      localStorage.removeItem('pantheon_lang_explicit');
    });
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: 'Workbench' }).first()).toBeVisible();
  } finally {
    await updateCurrentUserPreferences(page, accessToken, originalPreferences);
    await updateSettingGroup(page, accessToken, 'i18n', originalItems);
  }
});

test('setting smoke: default language can be selected through setting page UI', async ({ page }) => {
  const accessToken = await signInAsAdmin(page);
  const groupResponse = await page.request.get(`${apiBaseUrl}/system/setting/group/i18n`, {
    headers: authHeaders(accessToken),
  });
  expect(groupResponse.ok()).toBeTruthy();
  const groupPayload = await groupResponse.json();
  expect(groupPayload.code).toBe(200);
  const originalItems = groupPayload.data.items as SettingItem[];
  const currentValue = originalItems.find((item) => item.settingKey === 'i18n.default_language')?.settingValue ?? 'zh-CN';
  const nextValue = currentValue === 'zh-CN' ? 'en-US' : 'zh-CN';
  const nextLabel = nextValue === 'en-US' ? 'English' : '中文';

  try {
    await page.goto('/system/setting/i18n', { waitUntil: 'networkidle' });
    await installOperationToken(page, accessToken);
    await page.locator('.arco-select-view').first().click();
    await page.locator('.arco-select-option').filter({ hasText: nextLabel }).first().click();
    await page.locator('.submit-bar button').last().click();
    await expect.poll(async () => {
      const verifyResponse = await page.request.get(`${apiBaseUrl}/system/setting/group/i18n`, {
        headers: authHeaders(accessToken),
      });
      const verifyPayload = await verifyResponse.json();
      return (verifyPayload.data.items as Array<{ settingKey: string; settingValue: string }>)
        .find((item) => item.settingKey === 'i18n.default_language')?.settingValue;
    }).toBe(nextValue);
  } finally {
    await updateSettingGroup(page, accessToken, 'i18n', originalItems);
  }
});

test('setting smoke: login page language choice overrides saved preference and system default for the session', async ({
  page,
}) => {
  const accessToken = await signInAsAdmin(page);
  const originalPreferences = await getCurrentUserPreferences(page, accessToken);
  const groupResponse = await page.request.get(`${apiBaseUrl}/system/setting/group/i18n`, {
    headers: authHeaders(accessToken),
  });
  expect(groupResponse.ok()).toBeTruthy();
  const groupPayload = await groupResponse.json();
  expect(groupPayload.code).toBe(200);
  const originalItems = groupPayload.data.items as SettingItem[];
  const nextItems = originalItems.map((item) => ({
    settingKey: item.settingKey,
    settingValue: item.settingKey === 'i18n.default_language' ? 'ja-JP' : item.settingValue,
  }));

  try {
    await updateCurrentUserPreferences(page, accessToken, {
      theme: originalPreferences.theme,
      language: 'zh-CN',
      layoutMode: originalPreferences.layoutMode,
      densityMode: originalPreferences.densityMode,
    });
    const updateResponse = await updateSettingGroup(page, accessToken, 'i18n', nextItems);
    expect(updateResponse.ok()).toBeTruthy();

    await page.context().clearCookies();
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle' });

    await page.locator('.auth-login-page__tools .arco-select-view').click();
    await page.locator('.arco-select-option').filter({ hasText: 'English' }).first().click();
    await page.getByPlaceholder(/username/i).fill(adminCredentials.username);
    await page.getByPlaceholder(/password/i).fill(adminCredentials.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Workbench' }).first()).toBeVisible();
    await expect
      .poll(async () => {
        return page.evaluate(() => ({
          language: localStorage.getItem('pantheon_lang'),
          explicit: localStorage.getItem('pantheon_lang_explicit'),
        }));
      })
      .toEqual({
        language: 'en-US',
        explicit: '1',
      });
  } finally {
    const restoreToken = await signInAsAdmin(page);
    await updateCurrentUserPreferences(page, restoreToken, originalPreferences);
    await updateSettingGroup(page, restoreToken, 'i18n', originalItems);
  }
});

test('setting smoke: logout clears explicit language and falls back to default language', async ({ page }) => {
  const accessToken = await signInAsAdmin(page);
  const originalPreferences = await getCurrentUserPreferences(page, accessToken);
  const groupResponse = await page.request.get(`${apiBaseUrl}/system/setting/group/i18n`, {
    headers: authHeaders(accessToken),
  });
  expect(groupResponse.ok()).toBeTruthy();
  const groupPayload = await groupResponse.json();
  expect(groupPayload.code).toBe(200);
  const originalItems = groupPayload.data.items as SettingItem[];
  const nextItems = originalItems.map((item) => ({
    settingKey: item.settingKey,
    settingValue: item.settingKey === 'i18n.default_language' ? 'en-US' : item.settingValue,
  }));

  try {
    await updateCurrentUserPreferences(page, accessToken, {
      theme: originalPreferences.theme,
      language: '',
      layoutMode: originalPreferences.layoutMode,
      densityMode: originalPreferences.densityMode,
    });
    const updateResponse = await updateSettingGroup(page, accessToken, 'i18n', nextItems);
    expect(updateResponse.ok()).toBeTruthy();

    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /admin/ }).click();
    await page.getByRole('menuitem', { name: '退出登录' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

    await page.getByRole('textbox', { name: 'Username' }).fill('admin');
    await page.getByLabel('Password').fill('123456');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Workbench' }).first()).toBeVisible();
  } finally {
    const restoreToken = await signInAsAdmin(page);
    await updateCurrentUserPreferences(page, restoreToken, originalPreferences);
    await updateSettingGroup(page, restoreToken, 'i18n', originalItems);
  }
});

test('auth smoke: logout sends revoke request without stale invalid-session prompt', async ({ page }) => {
  const tokens = await loginByApi(page.request, adminCredentials);
  await installClientSession(page, tokens);

  let captureAuthFailures = false;
  const authFailures: string[] = [];

  page.on('response', async (response) => {
    if (!captureAuthFailures || !response.url().includes('/api/v1/') || response.url().endsWith('/auth/logout')) {
      return;
    }
    try {
      const payload = await response.json();
      if (!payload || typeof payload !== 'object') {
        return;
      }
      const code = 'code' in payload ? payload.code : undefined;
      const message = 'message' in payload ? payload.message : undefined;
      const isAuthFailure = code === 401
        || message === 'session.invalid'
        || (typeof message === 'string' && message.startsWith('token.'));
      if (isAuthFailure) {
        authFailures.push(`${response.request().method()} ${response.url()} -> ${String(message || code)}`);
      }
    } catch {
      // ignore non-json responses
    }
  });

  await page.goto('/dashboard', { waitUntil: 'networkidle' });
  captureAuthFailures = true;
  const logoutResponsePromise = page.waitForResponse((response) => response.url().includes('/api/v1/auth/logout'));
  await page.getByRole('button', { name: /admin/ }).click();
  await page.getByRole('menuitem', { name: /退出登录|Sign out|Logout/ }).click();
  const logoutPayload = await (await logoutResponsePromise).json();

  await expect(page).toHaveURL(/\/login$/);
  await page.waitForTimeout(1000);
  expect(logoutPayload.code).toBe(200);
  await expect(page.locator('.arco-message').filter({ hasText: /无效会话|session\.invalid|token\./i })).toHaveCount(0);
  expect(authFailures).toEqual([]);
});

test('platform smoke: lock screen keeps current route and opened tabs', async ({ page }) => {
  const accessToken = await signInAsAdmin(page);
  const groupResponse = await page.request.get(`${apiBaseUrl}/system/setting/group/ui`, {
    headers: authHeaders(accessToken),
  });
  expect(groupResponse.ok()).toBeTruthy();
  const groupPayload = await groupResponse.json();
  expect(groupPayload.code).toBe(200);
  const originalItems = groupPayload.data.items as SettingItem[];
  const nextItems = originalItems.map((item) => ({
    settingKey: item.settingKey,
    settingValue: item.settingKey === 'ui.enable_tab_bar' ? 'true' : item.settingValue,
  }));

  try {
    const updateResponse = await updateSettingGroup(page, accessToken, 'ui', nextItems);
    expect(updateResponse.ok()).toBeTruthy();

    await page.goto('/system/user', { waitUntil: 'networkidle' });
    await expectPageIdentityReady(page, '用户管理');
    await expect(page.locator('.app-shell__tabs [role="tab"]')).toHaveCount(2);

    await page.getByRole('button', { name: /admin/i }).click();
    await page.getByRole('menuitem', { name: /锁定屏幕|Lock Screen/i }).click();
    await expect(page.getByRole('dialog')).toContainText(/会话已锁定|Session Locked/);

    await page.getByPlaceholder(/请输入当前账号密码以解锁|Enter the current account password to unlock/).fill('123456');
    await page.getByRole('button', { name: /解锁|Unlock/ }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(/\/system\/user$/);
    await expectPageIdentityReady(page, '用户管理');
    await expect(page.locator('.app-shell__tabs [role="tab"]')).toHaveCount(2);
  } finally {
    await updateSettingGroup(page, accessToken, 'ui', originalItems);
  }
});

test('platform smoke: lock screen refreshes activity timestamp and blocks command palette while locked', async ({
  page,
}) => {
  await signInAsAdmin(page);

  await page.goto('/auth/security', { waitUntil: 'networkidle' });
  await expectVisiblePageTitle(page, '安全中心');

  await page.goto('/system/profile', { waitUntil: 'networkidle' });
  await expectVisiblePageTitle(page, '个人中心');

  const beforeLockActivity = await page.evaluate(() => sessionStorage.getItem('pantheon_shell_last_activity_at'));
  expect(beforeLockActivity).toBeTruthy();

  await page.getByRole('button', { name: /admin/i }).click();
  await page.getByRole('menuitem', { name: /锁定屏幕|Lock Screen/i }).click();
  const lockDialog = page.getByRole('dialog');
  await expect(lockDialog).toContainText(/会话已锁定|Session Locked/);

  await page.keyboard.press(`${process.platform === 'darwin' ? 'Meta' : 'Control'}+K`);
  await expect(page.locator('.app-command')).toHaveCount(0);

  await page.getByPlaceholder(/请输入当前账号密码以解锁|Enter the current account password to unlock/).fill('123456');
  await page.getByRole('button', { name: /解锁|Unlock/ }).click();
  await expect(lockDialog).toHaveCount(0);
  await expect(page).toHaveURL(/\/system\/profile$/);

  const afterUnlockActivity = await page.evaluate(() => sessionStorage.getItem('pantheon_shell_last_activity_at'));
  expect(afterUnlockActivity).toBeTruthy();
  expect(Number(afterUnlockActivity)).toBeGreaterThan(Number(beforeLockActivity));
});

test('auth smoke: login page shows idle-timeout notice once', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    sessionStorage.setItem('pantheon_login_notice', 'session.idle_timeout');
  });

  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByText('当前账号因超过会话空闲时长被自动退出，请重新登录继续操作。', { exact: true })).toBeVisible();

  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByText('当前账号因超过会话空闲时长被自动退出，请重新登录继续操作。', { exact: true })).toHaveCount(0);
});

test('platform + system/auth smoke: locked session times out, relogin notice appears, and security center shows session context', async ({
  page,
}) => {
  test.setTimeout(60_000);

  await page.goto('/system/profile', { waitUntil: 'networkidle' });
  await expectVisiblePageTitle(page, '个人中心');

  await page.getByRole('button', { name: /admin/i }).click();
  await page.getByRole('menuitem', { name: /锁定屏幕|Lock Screen/i }).click();
  const lockDialog = page.getByRole('dialog');
  await expect(lockDialog).toContainText(/会话已锁定|Session Locked/);

  await page.evaluate(() => {
    sessionStorage.setItem(
      'pantheon_shell_last_activity_at',
      String(Date.now() - 31 * 60 * 1000),
    );
  });

  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByRole('dialog')).toContainText(/会话已锁定|Session Locked/);
  await expect(page).toHaveURL(/\/login$/, { timeout: 25_000 });
  await expect(
    page.getByText(
      /当前账号因超过会话空闲时长被自动退出，请重新登录继续操作。|This account was signed out automatically after being idle for too long\. Sign in again to continue\./,
    ),
  ).toBeVisible();

  await signInWithUi(page, adminCredentials);
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/auth/security', { waitUntil: 'networkidle' });
  await expectVisiblePageTitle(page, '安全中心');
  await expect(page.getByText('在线会话', { exact: true })).toBeVisible();
  await expect(page.getByText('最近登录', { exact: true })).toBeVisible();
  await expect(page.getByText('当前设备', { exact: true }).first()).toBeVisible();
  await expect(page.locator('.arco-table')).toHaveCount(2);
  await expect(page.getByText('成功', { exact: true }).first()).toBeVisible();
});

test('setting smoke: logout clears explicit theme and falls back to default theme', async ({ page }) => {
  test.setTimeout(45000);
  const accessToken = await signInAsAdmin(page);
  const originalPreferences = await getCurrentUserPreferences(page, accessToken);
  const groupResponse = await page.request.get(`${apiBaseUrl}/system/setting/group/ui`, {
    headers: authHeaders(accessToken),
  });
  expect(groupResponse.ok()).toBeTruthy();
  const groupPayload = await groupResponse.json();
  expect(groupPayload.code).toBe(200);
  const originalItems = groupPayload.data.items as SettingItem[];
  const nextTheme = 'emerald';
  const nextItems = originalItems.map((item) => ({
    settingKey: item.settingKey,
    settingValue: item.settingKey === 'ui.default_theme' ? nextTheme : item.settingValue,
  }));

  try {
    await updateCurrentUserPreferences(page, accessToken, {
      theme: '',
      language: originalPreferences.language,
      layoutMode: originalPreferences.layoutMode,
      densityMode: originalPreferences.densityMode,
    });
    const updateResponse = await updateSettingGroup(page, accessToken, 'ui', nextItems);
    expect(updateResponse.ok()).toBeTruthy();

    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem('pantheon_theme', 'slate');
      document.documentElement.dataset.pantheonTheme = 'slate';
    });

    await expect.poll(async () => page.evaluate(() => document.documentElement.dataset.pantheonTheme)).toBe('slate');

    await page.getByRole('button', { name: /admin/ }).click();
    await page.getByRole('menuitem', { name: '退出登录' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect.poll(async () => page.evaluate(() => document.documentElement.dataset.pantheonTheme)).toBe(nextTheme);

    await page.getByRole('textbox', { name: /用户名|Username/ }).fill('admin');
    await page.getByLabel(/密码|Password/).fill('123456');
    await page.getByRole('button', { name: /登录|Sign in|Sign In/ }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect.poll(async () => page.evaluate(() => document.documentElement.dataset.pantheonTheme)).toBe(nextTheme);
  } finally {
    const restoreToken = await page.evaluate(() => localStorage.getItem('pantheon_access_token'));
    const effectiveToken = restoreToken || (await signInAsAdmin(page));
    await updateCurrentUserPreferences(page, effectiveToken, originalPreferences);
    await updateSettingGroup(page, effectiveToken, 'ui', originalItems);
  }
});

test('setting smoke: tab bar visibility follows ui preference', async ({ page }) => {
  const accessToken = await signInAsAdmin(page);
  const groupResponse = await page.request.get(`${apiBaseUrl}/system/setting/group/ui`, {
    headers: authHeaders(accessToken),
  });
  expect(groupResponse.ok()).toBeTruthy();
  const groupPayload = await groupResponse.json();
  expect(groupPayload.code).toBe(200);
  const originalItems = groupPayload.data.items as SettingItem[];
  const nextItems = originalItems.map((item) => ({
    settingKey: item.settingKey,
    settingValue: item.settingKey === 'ui.enable_tab_bar' ? 'false' : item.settingValue,
  }));

  try {
    const updateResponse = await updateSettingGroup(page, accessToken, 'ui', nextItems);
    expect(updateResponse.ok()).toBeTruthy();

    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await expect(page.locator('.app-shell__tabs')).toHaveCount(0);
  } finally {
    await updateSettingGroup(page, accessToken, 'ui', originalItems);
  }
});

test('setting smoke: default theme applies when explicit theme preference is cleared', async ({ page }) => {
  const accessToken = await signInAsAdmin(page);
  const originalPreferences = await getCurrentUserPreferences(page, accessToken);
  const groupResponse = await page.request.get(`${apiBaseUrl}/system/setting/group/ui`, {
    headers: authHeaders(accessToken),
  });
  expect(groupResponse.ok()).toBeTruthy();
  const groupPayload = await groupResponse.json();
  expect(groupPayload.code).toBe(200);
  const originalItems = groupPayload.data.items as SettingItem[];
  const nextTheme = 'emerald';
  const nextItems = originalItems.map((item) => ({
    settingKey: item.settingKey,
    settingValue: item.settingKey === 'ui.default_theme' ? nextTheme : item.settingValue,
  }));

  try {
    await updateCurrentUserPreferences(page, accessToken, {
      theme: '',
      language: originalPreferences.language,
      layoutMode: originalPreferences.layoutMode,
      densityMode: originalPreferences.densityMode,
    });
    const updateResponse = await updateSettingGroup(page, accessToken, 'ui', nextItems);
    expect(updateResponse.ok()).toBeTruthy();

    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.removeItem('pantheon_theme');
    });
    await page.reload({ waitUntil: 'networkidle' });

    await expect.poll(async () => page.evaluate(() => document.documentElement.dataset.pantheonTheme)).toBe(nextTheme);
  } finally {
    await updateCurrentUserPreferences(page, accessToken, originalPreferences);
    await updateSettingGroup(page, accessToken, 'ui', originalItems);
  }
});

test('setting smoke: upload config affects runtime upload endpoint', async ({ page }) => {
  const accessToken = await signInAsAdmin(page);
  const groupResponse = await page.request.get(`${apiBaseUrl}/system/setting/group/upload`, {
    headers: authHeaders(accessToken),
  });
  expect(groupResponse.ok()).toBeTruthy();
  const groupPayload = await groupResponse.json();
  expect(groupPayload.code).toBe(200);
  const originalItems = groupPayload.data.items as SettingItem[];
  const nextItems = originalItems.map((item) => {
    switch (item.settingKey) {
      case 'upload.storage_driver':
        return { settingKey: item.settingKey, settingValue: 'local' };
      case 'upload.max_file_size':
        return { settingKey: item.settingKey, settingValue: '1' };
      case 'upload.allowed_types':
        return { settingKey: item.settingKey, settingValue: '["png"]' };
      case 'upload.public_base_url':
        return { settingKey: item.settingKey, settingValue: '' };
      default:
        return item;
    }
  });

  try {
    const updateResponse = await updateSettingGroup(page, accessToken, 'upload', nextItems);
    expect(updateResponse.ok()).toBeTruthy();
    const uploadPayload = await page.request.post(`${apiBaseUrl}/system/upload?scope=profile/avatar`, {
      headers: await requestHeaders(page, accessToken),
      multipart: {
        file: {
          name: 'avatar.png',
          mimeType: 'image/png',
          buffer: Buffer.from('pantheon-upload-smoke', 'utf8'),
        },
      },
    });
    expect(uploadPayload.ok()).toBeTruthy();
    const uploadResult = await uploadPayload.json();
    expect(uploadResult.code).toBe(200);
    expect(uploadResult.data.url).toContain('/api/v1/system/upload/files/profile/avatar/');

    const fileResponse = await page.request.get(uploadResult.data.url);
    expect(fileResponse.ok()).toBeTruthy();
    expect((await fileResponse.body()).toString('utf8')).toBe('pantheon-upload-smoke');

    const blockedPayload = await page.request.post(`${apiBaseUrl}/system/upload?scope=profile/avatar`, {
      headers: await requestHeaders(page, accessToken),
      multipart: {
        file: {
          name: 'avatar.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('blocked', 'utf8'),
        },
      },
    });
    expect(blockedPayload.ok()).toBeTruthy();
    const blockedResult = await blockedPayload.json();
    expect(blockedResult.code).not.toBe(200);
    expect(blockedResult.message).toBe('upload.file.type_not_allowed');
  } finally {
    await updateSettingGroup(page, accessToken, 'upload', originalItems);
  }
});

test('operation log smoke: failed reason and detail summary are visible', async ({ page }) => {
  const accessToken = await signInAsAdmin(page);
  const failedUploadResponse = await page.request.post(`${apiBaseUrl}/system/upload?scope=profile/avatar`, {
    headers: await requestHeaders(page, accessToken),
    multipart: {
      file: {
        name: 'audit-failure.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('audit-failure', 'utf8'),
      },
    },
  });
  expect(failedUploadResponse.ok()).toBeTruthy();
  const failedUploadPayload = await failedUploadResponse.json();
  expect(failedUploadPayload.code).not.toBe(200);
  expect(failedUploadPayload.message).toBe('upload.file.type_not_allowed');

  await page.goto('/system/operation-log', { waitUntil: 'networkidle' });
  await page.getByLabel('操作标题').fill('上传文件');
  await page.locator('.arco-select-view').first().click();
  await page.locator('.arco-select-option').filter({ hasText: '失败' }).first().click();
  await page.locator('.arco-select-view').nth(1).click();
  await page.locator('.arco-select-option').filter({ hasText: '系统配置' }).first().click();
  await page.locator('.arco-select-view').nth(2).click();
  await page.locator('.arco-select-option').filter({ hasText: '参数/校验失败' }).first().click();
  await page.locator('.arco-select-view').nth(3).click();
  await page.locator('.arco-select-option').filter({ hasText: '上传配置' }).first().click();
  await page.getByRole('button', { name: '搜索' }).click();

  const firstRow = page.getByRole('row', { name: /上传文件/ }).first();
  await expect(firstRow).toBeVisible();
  await expect(firstRow).toContainText('上传文件');
  await expect(firstRow).toContainText('系统配置');
  await expect(firstRow).toContainText('当前文件类型不在允许范围内');
  await firstRow.getByRole('button', { name: '详情' }).click();

  const detailDialog = page.getByRole('dialog');
  await expect(detailDialog.getByText('失败原因')).toBeVisible();
  await expect(detailDialog.getByText('参数/校验失败').first()).toBeVisible();
  await expect(detailDialog.getByText('系统配置').first()).toBeVisible();
  await expect(detailDialog.getByText('上传配置').first()).toBeVisible();
  await expect(detailDialog.getByText('当前文件类型不在允许范围内').first()).toBeVisible();
  await expect(detailDialog.getByText('upload.file.type_not_allowed').first()).toBeVisible();
});

test('setting permission smoke: list-only role can view page but cannot save or refresh', async ({ page }) => {
  const adminAccessToken = await signInAsAdmin(page);
  const roleKey = `setting_view_only_${Date.now()}`;
  const username = `setting_viewer_${Date.now()}`;
  const password = 'ChangeMe123';

  await deleteUserByUsername(page, adminAccessToken, username);
  await deleteRoleByKey(page, adminAccessToken, roleKey);

  try {
    const createRoleResponse = await page.request.post(`${apiBaseUrl}/system/role`, {
      headers: await verifiedHeaders(page, adminAccessToken),
      data: {
        roleName: '系统设置只读烟测角色',
        roleKey,
        sort: 10,
        status: 1,
        menuIds: [],
        permissionKeys: ['system:setting:list'],
      },
    });
    expect(createRoleResponse.ok()).toBeTruthy();
    const role = await getRoleByKey(page, adminAccessToken, roleKey);
    expect(role).toBeTruthy();
    await createApiPermission(page, adminAccessToken, roleKey, '/api/v1/system/setting/list', 'GET');
    await createApiPermission(page, adminAccessToken, roleKey, '/api/v1/system/menu/tree', 'GET');

    const createUserResponse = await page.request.post(`${apiBaseUrl}/system/user`, {
      headers: await verifiedHeaders(page, adminAccessToken),
      data: {
        username,
        password,
        nickname: '系统设置只读烟测用户',
        status: 1,
        roleIds: [role!.id],
      },
    });
    expect(createUserResponse.ok()).toBeTruthy();
    const createUserPayload = await createUserResponse.json();
    expect(createUserPayload.code).toBe(200);

    const viewerTokens = await loginByApi(page.request, { username, password });
    const viewerPage = await page.context().newPage();

    try {
      await installClientSession(viewerPage, viewerTokens);
      await viewerPage.goto('/system/setting/basic', { waitUntil: 'networkidle' });
      await expectPageIdentityReady(viewerPage, '系统设置');
      await expectNoPageError(viewerPage);

      const settingPanel = viewerPage.locator('.setting-page__config-card');
      await expect(settingPanel.getByRole('button', { name: '刷新设置缓存' })).toBeDisabled();
      await expect(settingPanel.locator('.submit-bar').getByRole('button', { name: '保存' })).toBeDisabled();
      await expect(settingPanel.locator('.submit-bar').getByRole('button', { name: '取消' })).toBeEnabled();
    } finally {
      await viewerPage.close();
    }
  } finally {
    await deleteUserByUsername(page, adminAccessToken, username);
    await deleteRoleByKey(page, adminAccessToken, roleKey);
  }
});

test('dict permission smoke: list-only role can view page but cannot mutate config', async ({ page }) => {
  const adminAccessToken = await signInAsAdmin(page);
  const roleKey = `dict_view_only_${Date.now()}`;
  const username = `dict_viewer_${Date.now()}`;
  const password = 'ChangeMe123';

  await deleteUserByUsername(page, adminAccessToken, username);
  await deleteRoleByKey(page, adminAccessToken, roleKey);

  try {
    const createRoleResponse = await page.request.post(`${apiBaseUrl}/system/role`, {
      headers: await verifiedHeaders(page, adminAccessToken),
      data: {
        roleName: '字典只读烟测角色',
        roleKey,
        sort: 10,
        status: 1,
        menuIds: [],
        permissionKeys: ['system:dict:list'],
      },
    });
    expect(createRoleResponse.ok()).toBeTruthy();
    const role = await getRoleByKey(page, adminAccessToken, roleKey);
    expect(role).toBeTruthy();
    await createApiPermission(page, adminAccessToken, roleKey, '/api/v1/system/dict/type/list', 'GET');
    await createApiPermission(page, adminAccessToken, roleKey, '/api/v1/system/dict/item/list', 'GET');
    await createApiPermission(page, adminAccessToken, roleKey, '/api/v1/system/menu/tree', 'GET');

    const createUserResponse = await page.request.post(`${apiBaseUrl}/system/user`, {
      headers: await verifiedHeaders(page, adminAccessToken),
      data: {
        username,
        password,
        nickname: '字典只读烟测用户',
        status: 1,
        roleIds: [role!.id],
      },
    });
    expect(createUserResponse.ok()).toBeTruthy();

    const viewerTokens = await loginByApi(page.request, { username, password });
    const viewerPage = await page.context().newPage();

    try {
      await installClientSession(viewerPage, viewerTokens);
      await viewerPage.goto('/system/dict', { waitUntil: 'networkidle' });
      await expectPageIdentityReady(viewerPage, '字典管理');
      await expectNoPageError(viewerPage);

      const typePanel = viewerPage.locator('.dict-page__actions').first();
      await expect(typePanel.getByRole('button', { name: '导出' })).toBeDisabled();
      await expect(typePanel.getByRole('button', { name: '下载模板' })).toBeDisabled();
      await expect(typePanel.getByRole('button', { name: '导入' })).toBeDisabled();
      await expect(typePanel.getByRole('button', { name: '新增' })).toBeDisabled();

      await viewerPage.getByRole('tab', { name: '字典项' }).click();
      const itemPanel = viewerPage.locator('.dict-page__actions').nth(1);
      await expect(itemPanel.getByRole('button', { name: '刷新缓存' })).toBeDisabled();
      await expect(itemPanel.getByRole('button', { name: '导出' })).toBeDisabled();
      await expect(itemPanel.getByRole('button', { name: '下载模板' })).toBeDisabled();
      await expect(itemPanel.getByRole('button', { name: '导入' })).toBeDisabled();
      await expect(itemPanel.getByRole('button', { name: '新增字典项' })).toBeDisabled();
    } finally {
      await viewerPage.close();
    }
  } finally {
    await deleteUserByUsername(page, adminAccessToken, username);
    await deleteRoleByKey(page, adminAccessToken, roleKey);
  }
});

test('i18n permission smoke: list-only role can view page but cannot mutate translations', async ({ page }) => {
  const adminAccessToken = await signInAsAdmin(page);
  const roleKey = `i18n_view_only_${Date.now()}`;
  const username = `i18n_viewer_${Date.now()}`;
  const password = 'ChangeMe123';

  await deleteUserByUsername(page, adminAccessToken, username);
  await deleteRoleByKey(page, adminAccessToken, roleKey);

  try {
    const createRoleResponse = await page.request.post(`${apiBaseUrl}/system/role`, {
      headers: await verifiedHeaders(page, adminAccessToken),
      data: {
        roleName: '国际化只读烟测角色',
        roleKey,
        sort: 10,
        status: 1,
        menuIds: [],
        permissionKeys: ['system:i18n:list'],
      },
    });
    expect(createRoleResponse.ok()).toBeTruthy();
    const role = await getRoleByKey(page, adminAccessToken, roleKey);
    expect(role).toBeTruthy();
    await createApiPermission(page, adminAccessToken, roleKey, '/api/v1/system/i18n/list', 'GET');
    await createApiPermission(page, adminAccessToken, roleKey, '/api/v1/system/i18n/overview', 'GET');
    await createApiPermission(page, adminAccessToken, roleKey, '/api/v1/system/menu/tree', 'GET');

    const createUserResponse = await page.request.post(`${apiBaseUrl}/system/user`, {
      headers: await verifiedHeaders(page, adminAccessToken),
      data: {
        username,
        password,
        nickname: '国际化只读烟测用户',
        status: 1,
        roleIds: [role!.id],
      },
    });
    expect(createUserResponse.ok()).toBeTruthy();

    const viewerTokens = await loginByApi(page.request, { username, password });
    const viewerPage = await page.context().newPage();

    try {
      await installClientSession(viewerPage, viewerTokens);
      await viewerPage.goto('/system/i18n', { waitUntil: 'networkidle' });
      await expectPageIdentityReady(viewerPage, '国际化管理');
      await expectNoPageError(viewerPage);

      const headerActions = viewerPage.locator('.system-list__work-actions').first();
      await expect(headerActions.getByRole('button', { name: '新增' })).toHaveCount(0);
      await expect(headerActions.getByRole('button', { name: '刷新缓存' })).toHaveCount(0);
      await expect(headerActions.getByRole('button', { name: '刷新', exact: true })).toHaveCount(0);
      await expect(headerActions.getByRole('button', { name: '导出' })).toHaveCount(0);
      await expect(headerActions.getByRole('button', { name: '导入' })).toHaveCount(0);
    } finally {
      await viewerPage.close();
    }
  } finally {
    await deleteUserByUsername(page, adminAccessToken, username);
    await deleteRoleByKey(page, adminAccessToken, roleKey);
  }
});

test('login-log permission smoke: list-only role can view page but cannot clear, export, or batch delete', async ({ page }) => {
  const adminAccessToken = await signInAsAdmin(page);
  const roleKey = `login_log_view_only_${Date.now()}`;
  const username = `login_log_viewer_${Date.now()}`;
  const password = 'ChangeMe123';

  await deleteUserByUsername(page, adminAccessToken, username);
  await deleteRoleByKey(page, adminAccessToken, roleKey);

  try {
    const createRoleResponse = await page.request.post(`${apiBaseUrl}/system/role`, {
      headers: await verifiedHeaders(page, adminAccessToken),
      data: {
        roleName: '登录日志只读烟测角色',
        roleKey,
        sort: 10,
        status: 1,
        menuIds: [],
        permissionKeys: ['system:login-log:list'],
      },
    });
    expect(createRoleResponse.ok()).toBeTruthy();
    await createApiPermission(page, adminAccessToken, roleKey, '/api/v1/system/login-log/list', 'GET');
    await createApiPermission(page, adminAccessToken, roleKey, '/api/v1/system/setting/group/audit', 'GET');
    await createApiPermission(page, adminAccessToken, roleKey, '/api/v1/system/menu/tree', 'GET');

    const role = await getRoleByKey(page, adminAccessToken, roleKey);
    expect(role).toBeTruthy();

    const createUserResponse = await page.request.post(`${apiBaseUrl}/system/user`, {
      headers: await verifiedHeaders(page, adminAccessToken),
      data: {
        username,
        password,
        nickname: '登录日志只读烟测用户',
        status: 1,
        roleIds: [role!.id],
      },
    });
    expect(createUserResponse.ok()).toBeTruthy();

    const viewerTokens = await loginByApi(page.request, { username, password });
    const viewerPage = await page.context().newPage();

    try {
      await installClientSession(viewerPage, viewerTokens);
      await viewerPage.goto('/system/login-log', { waitUntil: 'networkidle' });
      await expectPageIdentityReady(viewerPage, '登录日志');
      await expectNoPageError(viewerPage);

      await expect(viewerPage.getByRole('button', { name: '导出' })).toBeDisabled();
      await expect(viewerPage.getByRole('button', { name: '清理日志' })).toHaveCount(0);
      await expect(viewerPage.getByRole('button', { name: '删除所选' })).toHaveCount(0);
    } finally {
      await viewerPage.close();
    }
  } finally {
    await deleteUserByUsername(page, adminAccessToken, username);
    await deleteRoleByKey(page, adminAccessToken, roleKey);
  }
});

test('session permission smoke: list-only role can view page but cannot revoke or clear sessions', async ({ page }) => {
  const adminAccessToken = await signInAsAdmin(page);
  const roleKey = `session_view_only_${Date.now()}`;
  const username = `session_viewer_${Date.now()}`;
  const password = 'ChangeMe123';

  await deleteUserByUsername(page, adminAccessToken, username);
  await deleteRoleByKey(page, adminAccessToken, roleKey);

  try {
    const createRoleResponse = await page.request.post(`${apiBaseUrl}/system/role`, {
      headers: await verifiedHeaders(page, adminAccessToken),
      data: {
        roleName: '会话只读烟测角色',
        roleKey,
        sort: 10,
        status: 1,
        menuIds: [],
        permissionKeys: ['system:session:list'],
      },
    });
    expect(createRoleResponse.ok()).toBeTruthy();
    await createApiPermission(page, adminAccessToken, roleKey, '/api/v1/system/session/list', 'GET');
    await createApiPermission(page, adminAccessToken, roleKey, '/api/v1/system/menu/tree', 'GET');

    const role = await getRoleByKey(page, adminAccessToken, roleKey);
    expect(role).toBeTruthy();

    const createUserResponse = await page.request.post(`${apiBaseUrl}/system/user`, {
      headers: await verifiedHeaders(page, adminAccessToken),
      data: {
        username,
        password,
        nickname: '会话只读烟测用户',
        status: 1,
        roleIds: [role!.id],
      },
    });
    expect(createUserResponse.ok()).toBeTruthy();

    const viewerTokens = await loginByApi(page.request, { username, password });
    const viewerPage = await page.context().newPage();

    try {
      await installClientSession(viewerPage, viewerTokens);
      await viewerPage.goto('/system/session', { waitUntil: 'networkidle' });
      await expectPageIdentityReady(viewerPage, '会话管理');
      await expectNoPageError(viewerPage);

      await expect(viewerPage.getByRole('button', { name: '清理历史会话' })).toHaveCount(0);
      const revokeButtons = viewerPage.getByRole('button', { name: '下线会话' });
      await expect(revokeButtons.first()).toBeDisabled();
    } finally {
      await viewerPage.close();
    }
  } finally {
    await deleteUserByUsername(page, adminAccessToken, username);
    await deleteRoleByKey(page, adminAccessToken, roleKey);
  }
});

test('operation-log permission smoke: list-only role can view page but cannot clear, export, or batch delete', async ({ page }) => {
  const adminAccessToken = await signInAsAdmin(page);
  const roleKey = `operation_log_view_only_${Date.now()}`;
  const username = `operation_log_viewer_${Date.now()}`;
  const password = 'ChangeMe123';

  await deleteUserByUsername(page, adminAccessToken, username);
  await deleteRoleByKey(page, adminAccessToken, roleKey);

  try {
    const createRoleResponse = await page.request.post(`${apiBaseUrl}/system/role`, {
      headers: await verifiedHeaders(page, adminAccessToken),
      data: {
        roleName: '操作日志只读烟测角色',
        roleKey,
        sort: 10,
        status: 1,
        menuIds: [],
        permissionKeys: ['system:operation-log:list'],
      },
    });
    expect(createRoleResponse.ok()).toBeTruthy();
    await createApiPermission(page, adminAccessToken, roleKey, '/api/v1/system/operation-log/list', 'GET');
    await createApiPermission(page, adminAccessToken, roleKey, '/api/v1/system/setting/group/audit', 'GET');
    await createApiPermission(page, adminAccessToken, roleKey, '/api/v1/system/menu/tree', 'GET');

    const role = await getRoleByKey(page, adminAccessToken, roleKey);
    expect(role).toBeTruthy();

    const createUserResponse = await page.request.post(`${apiBaseUrl}/system/user`, {
      headers: await verifiedHeaders(page, adminAccessToken),
      data: {
        username,
        password,
        nickname: '操作日志只读烟测用户',
        status: 1,
        roleIds: [role!.id],
      },
    });
    expect(createUserResponse.ok()).toBeTruthy();

    const viewerTokens = await loginByApi(page.request, { username, password });
    const viewerPage = await page.context().newPage();

    try {
      await installClientSession(viewerPage, viewerTokens);
      await viewerPage.goto('/system/operation-log', { waitUntil: 'networkidle' });
      await expectPageIdentityReady(viewerPage, '操作日志');
      await expectNoPageError(viewerPage);

      await expect(viewerPage.getByRole('button', { name: '导出' })).toBeDisabled();
      await expect(viewerPage.getByRole('button', { name: '清理日志' })).toHaveCount(0);
      await expect(viewerPage.getByRole('button', { name: '删除所选' })).toHaveCount(0);
    } finally {
      await viewerPage.close();
    }
  } finally {
    await deleteUserByUsername(page, adminAccessToken, username);
    await deleteRoleByKey(page, adminAccessToken, roleKey);
  }
});

test('module permission smoke: list-only role can view registry but cannot register or unregister modules', async ({ page }) => {
  const adminAccessToken = await signInAsAdmin(page);
  const roleKey = `module_view_only_${Date.now()}`;
  const username = `module_viewer_${Date.now()}`;
  const password = 'ChangeMe123';

  await deleteUserByUsername(page, adminAccessToken, username);
  await deleteRoleByKey(page, adminAccessToken, roleKey);

  try {
    const createRoleResponse = await page.request.post(`${apiBaseUrl}/system/role`, {
      headers: await verifiedHeaders(page, adminAccessToken),
      data: {
        roleName: '模块注册表只读烟测角色',
        roleKey,
        sort: 10,
        status: 1,
        menuIds: [],
        permissionKeys: ['system:module:list'],
      },
    });
    expect(createRoleResponse.ok()).toBeTruthy();
    await createApiPermission(page, adminAccessToken, roleKey, '/api/v1/system/dynamic-modules', 'GET');
    await createApiPermission(page, adminAccessToken, roleKey, '/api/v1/system/menu/tree', 'GET');

    const role = await getRoleByKey(page, adminAccessToken, roleKey);
    expect(role).toBeTruthy();

    const createUserResponse = await page.request.post(`${apiBaseUrl}/system/user`, {
      headers: await verifiedHeaders(page, adminAccessToken),
      data: {
        username,
        password,
        nickname: '模块注册表只读烟测用户',
        status: 1,
        roleIds: [role!.id],
      },
    });
    expect(createUserResponse.ok()).toBeTruthy();

    const viewerTokens = await loginByApi(page.request, { username, password });
    const viewerPage = await page.context().newPage();

    try {
      await installClientSession(viewerPage, viewerTokens);
      await viewerPage.goto('/system/modules', { waitUntil: 'networkidle' });
      await expectPageIdentityReady(viewerPage, '模块注册表');
      await expectNoPageError(viewerPage);

      await expect(viewerPage.getByRole('button', { name: '前往生成器' })).toHaveCount(0);
      await expect(viewerPage.getByRole('button', { name: '卸载' })).toHaveCount(0);
    } finally {
      await viewerPage.close();
    }
  } finally {
    await deleteUserByUsername(page, adminAccessToken, username);
    await deleteRoleByKey(page, adminAccessToken, roleKey);
  }
});

test('login-log governance smoke: selecting rows enables batch delete affordance', async ({ page }) => {
  await signInAsAdmin(page);
  await page.goto('/system/login-log', { waitUntil: 'networkidle' });
  await expectPageIdentityReady(page, '登录日志');
  await expectNoPageError(page);

  const batchDeleteButton = page.getByRole('button', { name: '删除所选' });
  await expect(batchDeleteButton).toBeDisabled();
  await page.locator('.system-list__table .arco-checkbox').nth(1).click({ force: true });
  await expect(batchDeleteButton).toBeEnabled();
});

test('operation-log governance smoke: selecting rows enables batch delete affordance', async ({ page }) => {
  await signInAsAdmin(page);
  await page.goto('/system/operation-log', { waitUntil: 'networkidle' });
  await expectPageIdentityReady(page, '操作日志');
  await expectNoPageError(page);

  const batchDeleteButton = page.getByRole('button', { name: '删除所选' });
  await expect(batchDeleteButton).toBeDisabled();
  await page.locator('.system-list__table .arco-checkbox').nth(1).click({ force: true });
  await expect(batchDeleteButton).toBeEnabled();
});

test('user governance smoke: cross-page selection keeps the full selected set', async ({ page }) => {
  await page.goto('/system/user', { waitUntil: 'networkidle' });
  await expectPageIdentityReady(page, '用户管理');
  await expectNoPageError(page);
  await expect(page.locator('.arco-checkbox').nth(1)).toBeVisible();

  const selectedText = page.locator('.table-batch-action-bar__meta');
  const firstPageCheckbox = page.locator('.arco-checkbox').nth(1);
  await firstPageCheckbox.click({ force: true });
  await expect(selectedText).toContainText('已选 1 条');

  await page.locator('.system-user-list__table .arco-pagination-item-next').click();
  await expect
    .poll(async () => {
      return page.locator('.system-user-list__table .arco-pagination-item-active').innerText();
    })
    .toBe('2');
  await expect(selectedText).toContainText('已选 1 条');

  const secondPageCheckbox = page.locator('.arco-checkbox').nth(1);
  await secondPageCheckbox.click({ force: true });
  await expect(selectedText).toContainText('已选 2 条');

  await page
    .locator('.system-user-list__table .arco-pagination-item')
    .filter({ hasText: '1' })
    .first()
    .click();
  await expect
    .poll(async () => {
      return page.locator('.system-user-list__table .arco-pagination-item-active').innerText();
    })
    .toBe('1');
  await expect(selectedText).toContainText('已选 2 条');
});

test('session governance smoke: cleanup bar uses the unified governance affordance', async ({ page }) => {
  await signInAsAdmin(page);
  await page.goto('/system/session', { waitUntil: 'networkidle' });
  await expectPageIdentityReady(page, '会话管理');
  await expectNoPageError(page);

  const cleanupBar = page.locator('.page-panel').filter({ has: page.getByRole('button', { name: '清理历史会话' }) }).first();
  await expect(cleanupBar.getByRole('button', { name: '清理历史会话' })).toBeVisible();
  await expect(cleanupBar.getByText('用于清理超出保留窗口的已下线历史会话，减小会话表规模；活跃会话保留。')).toBeVisible();
});

test('refresh sync smoke: setting page auto-updates across isolated contexts', async ({ browser, page }) => {
  test.setTimeout(45000);
  const accessToken = await signInAsAdmin(page);
  const groupResponse = await page.request.get(`${apiBaseUrl}/system/setting/group/basic`, {
    headers: authHeaders(accessToken),
  });
  expect(groupResponse.ok()).toBeTruthy();
  const groupPayload = await groupResponse.json();
  expect(groupPayload.code).toBe(200);
  const originalItems = groupPayload.data.items as SettingItem[];
  const originalSiteName = originalItems.find((item) => item.settingKey === 'site.name')?.settingValue || 'Pantheon Base';
  const nextSiteName = `Pantheon Sync ${Date.now()}`;
  const nextItems = originalItems.map((item) => ({
    settingKey: item.settingKey,
    settingValue: item.settingKey === 'site.name' ? nextSiteName : item.settingValue,
  }));

  const syncContext = await browser.newContext();
  const syncPage = await syncContext.newPage();

  try {
    const adminTokens = await loginByApi(page.request, adminCredentials);
    await installClientSession(syncPage, adminTokens);
    const refreshBootstrap = waitForRefreshBootstrap(syncPage);
    await syncPage.goto('/system/setting/basic', { waitUntil: 'networkidle' });
    const siteNameInput = formItem(syncPage, '站点名称').locator('input').first();
    await expect(siteNameInput).toHaveValue(originalSiteName);
    await refreshBootstrap;

    const updateResponse = await updateSettingGroup(page, accessToken, 'basic', nextItems);
    expect(updateResponse.ok()).toBeTruthy();
    const updatePayload = await updateResponse.json();
    expect(updatePayload.code).toBe(200);

    await expect(siteNameInput).toHaveValue(nextSiteName, { timeout: 15000 });
  } finally {
    await updateSettingGroup(page, accessToken, 'basic', originalItems);
    await closeExtraBrowserContext(syncContext);
  }
});

test('refresh sync smoke: dict page auto-updates across isolated contexts', async ({ browser, page }) => {
  test.setTimeout(45000);
  const accessToken = await signInAsAdmin(page);
  const dictCode = `system_sync_${Date.now()}`;
  const dictName = `system.dict.sync.${Date.now()}`;

  const syncContext = await browser.newContext();
  const syncPage = await syncContext.newPage();

  try {
    const adminTokens = await loginByApi(page.request, adminCredentials);
    await installClientSession(syncPage, adminTokens);
    const refreshBootstrap = waitForRefreshBootstrap(syncPage);
    await syncPage.goto('/system/dict', { waitUntil: 'networkidle' });
    await formItem(syncPage, '字典编码').locator('input').first().fill(dictCode);
    await syncPage.getByRole('button', { name: '搜索' }).click();
    await expect(syncPage.getByText(dictCode, { exact: false })).toHaveCount(0);
    await refreshBootstrap;

    const createResponse = await page.request.post(`${apiBaseUrl}/system/dict/type`, {
      headers: await verifiedHeaders(page, accessToken),
      data: {
        dictCode,
        dictName,
        module: 'system',
        status: 1,
        remark: 'sync smoke',
      },
    });
    expect(createResponse.ok()).toBeTruthy();
    const createPayload = await createResponse.json();
    expect(createPayload.code).toBe(200);
    const createdId = createPayload.data.id as number;

    await expect(syncPage.getByText(dictCode, { exact: false }).first()).toBeVisible({ timeout: 15000 });

    await page.request.delete(`${apiBaseUrl}/system/dict/type/${createdId}`, {
      headers: await verifiedHeaders(page, accessToken),
    }).catch(() => undefined);
  } finally {
    await closeExtraBrowserContext(syncContext);
  }
});

test('refresh sync smoke: i18n page auto-updates across isolated contexts', async ({ browser, page }) => {
  test.setTimeout(45000);
  const accessToken = await signInAsAdmin(page);
  const i18nKey = `i18n.sync.${Date.now()}`;

  const syncContext = await browser.newContext();
  const syncPage = await syncContext.newPage();

  try {
    const adminTokens = await loginByApi(page.request, adminCredentials);
    await installClientSession(syncPage, adminTokens);
    await syncPage.goto('/system/i18n', { waitUntil: 'networkidle' });
    await formItem(syncPage, '翻译键').locator('input').first().fill(i18nKey);
    await syncPage.getByRole('button', { name: '搜索' }).click();
    await expect(syncPage.getByText(i18nKey, { exact: false })).toHaveCount(0);

    const createResponse = await page.request.post(`${apiBaseUrl}/system/i18n`, {
      headers: await verifiedHeaders(page, accessToken),
      data: {
        module: 'system.config',
        group: 'messages',
        key: i18nKey,
        locale: 'zh-CN',
        value: '跨上下文同步',
        remark: 'sync smoke',
      },
    });
    expect(createResponse.ok()).toBeTruthy();
    const createPayload = await createResponse.json();
    expect(createPayload.code).toBe(200);
    const createdId = createPayload.data.id as number;

    await expect(syncPage.getByText(i18nKey, { exact: false }).first()).toBeVisible({ timeout: 15000 });

    await page.request.delete(`${apiBaseUrl}/system/i18n/${createdId}`, {
      headers: await verifiedHeaders(page, accessToken),
    }).catch(() => undefined);
  } finally {
    await closeExtraBrowserContext(syncContext);
  }
});
