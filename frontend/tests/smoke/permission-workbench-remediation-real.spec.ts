import { expect, test, type Page } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:8080/api/v1';

type LoginResult = {
  accessToken: string;
  refreshToken: string;
};

type MenuNode = {
  id: number;
  parentId: number;
  titleKey: string;
  path: string;
  pagePerm: string;
  perms: string;
  type: string;
  module: string;
  children?: MenuNode[];
};

type WorkbenchRole = {
  roleKey: string;
  hasApiGap: boolean;
  missingApiPolicyCount: number;
  apiPolicies: Array<{ path: string; method: string }>;
  missingApiPolicies: Array<{ path: string; method: string }>;
};

async function loginByApi(page: Page, username: string, password: string): Promise<LoginResult> {
  const response = await page.request.post(`${apiBaseUrl}/auth/login`, {
    data: { username, password },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.code).toBe(200);
  return {
    accessToken: payload.data.accessToken as string,
    refreshToken: payload.data.refreshToken as string,
  };
}

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function verifiedHeaders(page: Page, accessToken: string) {
  const response = await page.request.post(`${apiBaseUrl}/auth/operation-verify`, {
    headers: authHeaders(accessToken),
    data: { password: '123456' },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.code).toBe(200);
  return {
    ...authHeaders(accessToken),
    'X-Operation-Token': payload.data.operationToken as string,
  };
}

async function signInAsAdmin(page: Page) {
  const tokens = await loginByApi(page, 'admin', '123456');
  await page.addInitScript(
    ({ accessToken, refreshToken }) => {
      localStorage.setItem('pantheon_access_token', accessToken);
      localStorage.setItem('pantheon_refresh_token', refreshToken);
      localStorage.setItem('pantheon_lang', 'zh-CN');
      localStorage.setItem('pantheon_lang_explicit', '1');
      sessionStorage.removeItem('pantheon_op_token');
    },
    tokens,
  );
  return tokens.accessToken;
}

async function deleteRoleByKey(page: Page, accessToken: string, roleKey: string) {
  const response = await page.request.get(`${apiBaseUrl}/system/role/list`, {
    headers: authHeaders(accessToken),
    params: { roleKey, page: 1, pageSize: 20 },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  const items = Array.isArray(payload.data?.items) ? payload.data.items : [];
  for (const item of items) {
    if (item.roleKey === roleKey && item.roleKey !== 'admin') {
      await page.request.delete(`${apiBaseUrl}/system/role/${item.id}`, {
        headers: await verifiedHeaders(page, accessToken),
      });
    }
  }
}

async function fetchManageMenuTree(page: Page, accessToken: string): Promise<MenuNode[]> {
  const response = await page.request.get(`${apiBaseUrl}/system/menu/tree`, {
    headers: authHeaders(accessToken),
    params: { scope: 'manage' },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.code).toBe(200);
  return Array.isArray(payload.data) ? payload.data as MenuNode[] : [];
}

function flattenMenus(nodes: MenuNode[]): MenuNode[] {
  return nodes.flatMap((node) => [node, ...flattenMenus(node.children || [])]);
}

async function ensureGeneratePermissionMenu(page: Page, accessToken: string): Promise<number | null> {
  const menus = flattenMenus(await fetchManageMenuTree(page, accessToken));
  const existing = menus.find((item) => item.perms === 'system:module:generate');
  if (existing) {
    return null;
  }

  const generatorPage = menus.find((item) => item.path === '/system/generator' && item.pagePerm === 'system:generator:use');
  expect(generatorPage).toBeTruthy();

  const response = await page.request.post(`${apiBaseUrl}/system/menu`, {
    headers: authHeaders(accessToken),
    data: {
      parentId: generatorPage?.id,
      titleKey: 'system.permission.module.generate',
      path: '',
      component: '',
      pagePerm: '',
      perms: 'system:module:generate',
      type: 'F',
      icon: '',
      routeName: '',
      module: 'system.config',
      sort: 99,
      isVisible: 1,
      isCache: 0,
      isExternal: 0,
      activeMenu: '',
    },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.code).toBe(200);
  return payload.data.id as number;
}

async function deleteMenuById(page: Page, accessToken: string, menuId: number | null) {
  if (!menuId) {
    return;
  }
  await page.request.delete(`${apiBaseUrl}/system/menu/${menuId}`, {
    headers: authHeaders(accessToken),
  });
}

async function createRole(page: Page, accessToken: string, roleKey: string) {
  const response = await page.request.post(`${apiBaseUrl}/system/role`, {
    headers: authHeaders(accessToken),
    data: {
      roleName: '权限工作台整改回归',
      roleKey,
      sort: 998,
      status: 1,
      menuIds: [],
      permissionKeys: ['system:generator:use', 'system:module:generate'],
    },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.code).toBe(200);
}

async function fetchWorkbenchRole(page: Page, accessToken: string, roleKey: string): Promise<WorkbenchRole> {
  const response = await page.request.get(`${apiBaseUrl}/system/permission/workbench`, {
    headers: authHeaders(accessToken),
    params: { roleKey },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.code).toBe(200);
  const roles = Array.isArray(payload.data?.roles) ? payload.data.roles : [];
  const role = roles.find((item: WorkbenchRole) => item.roleKey === roleKey);
  expect(role).toBeTruthy();
  return role as WorkbenchRole;
}

test('permission workbench can remediate recommended generator policy against real backend', async ({ page }) => {
  const accessToken = await signInAsAdmin(page);
  const roleKey = `qa_perm_real_${Date.now()}`;
  let createdMenuId: number | null = null;

  await deleteRoleByKey(page, accessToken, roleKey);

  try {
    createdMenuId = await ensureGeneratePermissionMenu(page, accessToken);
    await createRole(page, accessToken, roleKey);

    const before = await fetchWorkbenchRole(page, accessToken, roleKey);
    expect(before.hasApiGap).toBeTruthy();
    expect(before.missingApiPolicyCount).toBe(1);
    expect(before.missingApiPolicies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/api/v1/system/dynamic-modules/generate', method: 'POST' }),
      ]),
    );

    await page.goto('/system/permission', { waitUntil: 'networkidle' });

    const roleRow = page.locator('.arco-table-tr').filter({ hasText: roleKey }).first();
    await expect(roleRow).toBeVisible();
    await roleRow.getByRole('button', { name: '详情', exact: true }).click();

    const detailDialog = page.getByRole('dialog').filter({ hasText: roleKey }).first();
    await expect(detailDialog).toBeVisible();
    await expect(detailDialog.getByText('/api/v1/system/dynamic-modules/generate', { exact: true })).toBeVisible();

    await detailDialog.getByRole('button', { name: '一键补齐推荐策略', exact: true }).click();

    const verifyDialog = page.getByRole('dialog').filter({ has: page.getByText('敏感操作验证', { exact: true }) }).last();
    await expect(verifyDialog).toBeVisible();
    await verifyDialog.locator('input').first().fill('123456');
    await verifyDialog.getByRole('button', { name: '确定', exact: true }).click();

    await expect(page.locator('.arco-message').getByText('已补齐 1 条推荐接口策略', { exact: false }).last()).toBeVisible();
    await expect(detailDialog.getByRole('button', { name: '一键补齐推荐策略', exact: true })).toHaveCount(0);

    const after = await fetchWorkbenchRole(page, accessToken, roleKey);
    expect(after.hasApiGap).toBeFalsy();
    expect(after.missingApiPolicyCount).toBe(0);
    expect(after.apiPolicies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/api/v1/system/dynamic-modules/generate', method: 'POST' }),
      ]),
    );
  } finally {
    await deleteRoleByKey(page, accessToken, roleKey);
    await deleteMenuById(page, accessToken, createdMenuId);
  }
});
