import { type Locator, type Page } from '@playwright/test';
import { adminCredentials, apiBaseUrl, apiRequestHeaders, authHeaders, loginByApi, type BrowserLoginResult } from '../smoke/helpers/auth';

async function deleteUserByUsername(page: Page, login: BrowserLoginResult, username: string) {
  const response = await page.request.get(`${apiBaseUrl}/system/user/list`, {
    headers: authHeaders(login.accessToken),
    params: { username, page: 1, pageSize: 10 },
  });

  if (!response.ok()) {
    return;
  }

  const payload = await response.json();
  const users = Array.isArray(payload.data?.items) ? payload.data.items : [];
  for (const user of users) {
    if (user.username === username) {
      await page.request.delete(`${apiBaseUrl}/system/user/${user.id}`, {
        headers: apiRequestHeaders(login),
      });
    }
  }
}

async function deleteTreeItemByName(
  page: Page,
  login: BrowserLoginResult,
  listPath: '/system/dept/tree' | '/system/menu/tree',
  deletePath: '/system/dept' | '/system/menu',
  keyName: string,
  getName: (item: { deptName?: string; menuName?: string }) => string | undefined,
) {
  const response = await page.request.get(`${apiBaseUrl}${listPath}`, {
    headers: authHeaders(login.accessToken),
  });

  if (!response.ok()) {
    return;
  }

  const payload = await response.json();
  const items = Array.isArray(payload.data) ? payload.data : [];

  const walk = async (nodes: Array<{ id: string; children?: unknown[] }>) => {
    for (const node of nodes) {
      if (getName(node as { deptName?: string; menuName?: string }) === keyName) {
        await page.request.delete(`${apiBaseUrl}${deletePath}/${node.id}`, {
          headers: apiRequestHeaders(login),
        });
      }
      if (Array.isArray(node.children)) {
        await walk(node.children as Array<{ id: string; children?: unknown[] }>);
      }
    }
  };

  await walk(items);
}

async function deleteRoleByKey(page: Page, login: BrowserLoginResult, roleKey: string) {
  const response = await page.request.get(`${apiBaseUrl}/system/role/list`, {
    headers: authHeaders(login.accessToken),
    params: { roleKey, page: 1, pageSize: 10 },
  });

  if (!response.ok()) {
    return;
  }

  const payload = await response.json();
  const roles = Array.isArray(payload.data?.items) ? payload.data.items : [];
  for (const role of roles) {
    if (role.roleKey === roleKey && role.roleKey !== 'admin') {
      await page.request.delete(`${apiBaseUrl}/system/role/${role.id}`, {
        headers: apiRequestHeaders(login),
      });
    }
  }
}

export async function prepareUserSmokeFixture(page: Page, username: string) {
  const login = await loginByApi(page, adminCredentials);
  await deleteUserByUsername(page, login, username);
  return {
    cleanup: async () => {
      const cleanupLogin = await loginByApi(page, adminCredentials);
      await deleteUserByUsername(page, cleanupLogin, username);
    },
  };
}

export async function prepareDeptSmokeFixture(page: Page, deptName: string) {
  const login = await loginByApi(page, adminCredentials);
  await deleteTreeItemByName(page, login, '/system/dept/tree', '/system/dept', deptName, (item) => item.deptName);
  return {
    cleanup: async () => {
      const cleanupLogin = await loginByApi(page, adminCredentials);
      await deleteTreeItemByName(page, cleanupLogin, '/system/dept/tree', '/system/dept', deptName, (item) => item.deptName);
    },
  };
}

export async function prepareMenuSmokeFixture(page: Page, menuName: string) {
  const login = await loginByApi(page, adminCredentials);
  await deleteTreeItemByName(page, login, '/system/menu/tree', '/system/menu', menuName, (item) => item.menuName);
  return {
    cleanup: async () => {
      const cleanupLogin = await loginByApi(page, adminCredentials);
      await deleteTreeItemByName(page, cleanupLogin, '/system/menu/tree', '/system/menu', menuName, (item) => item.menuName);
    },
  };
}

export async function prepareRoleSmokeFixture(page: Page, roleKey: string) {
  const login = await loginByApi(page, adminCredentials);
  await deleteRoleByKey(page, login, roleKey);
  return {
    cleanup: async () => {
      const cleanupLogin = await loginByApi(page, adminCredentials);
      await deleteRoleByKey(page, cleanupLogin, roleKey);
    },
  };
}

export async function openBusinessModule(page: Page) {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

  const businessMenus = page.locator('.arco-menu-item:has-text("业务"), .arco-menu-item:has-text("Business")');
  if ((await businessMenus.count()) === 0) {
    return null;
  }

  await businessMenus.first().click();
  const subMenus = page.locator('.arco-menu-item').filter({ hasNotText: /系统管理|System|Dashboard/ });
  if ((await subMenus.count()) === 0) {
    return null;
  }

  await subMenus.first().click();
  return {
    subMenus,
  };
}

export function formInputByLabel(container: Locator, label: RegExp) {
  return container.locator('.arco-form-item').filter({ hasText: label }).locator('input').first();
}
