import { expect, test, type Page } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:8080/api/v1';

type LoginResult = {
  accessToken: string;
  refreshToken: string;
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
  return tokens;
}

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function getOperationToken(page: Page, accessToken: string) {
  const response = await page.request.post(`${apiBaseUrl}/auth/operation-verify`, {
    headers: authHeaders(accessToken),
    data: { password: '123456' },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.code).toBe(200);
  return payload.data.operationToken as string;
}

async function verifiedHeaders(page: Page, accessToken: string) {
  return {
    ...authHeaders(accessToken),
    'X-Operation-Token': await getOperationToken(page, accessToken),
  };
}

function formItem(page: Page, label: string) {
  return page.locator('.arco-form-item').filter({ has: page.getByText(label, { exact: true }) }).first();
}

async function waitForDialog(page: Page, title: string) {
  const dialog = page.getByRole('dialog').filter({ has: page.getByText(title, { exact: true }) });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe('enter submit smoke', () => {
  test('login page submits with Enter key', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });

    await page.getByPlaceholder(/请输入用户名|username/i).fill('admin');
    await page.getByPlaceholder(/请输入密码|password/i).fill('123456');
    await page.locator('input[type="password"]').press('Enter');

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('.app-shell')).toBeVisible();
  });

  test('list filters submit with Enter key on auth pages', async ({ page }) => {
    await signInAsAdmin(page);

    await page.goto('/system/login-log', { waitUntil: 'networkidle' });
    const loginLogUsername = formItem(page, '用户名').locator('input').first();
    const loginLogRequest = page.waitForRequest((request) => (
      request.method() === 'GET'
      && request.url().includes('/api/v1/system/login-log/list')
      && request.url().includes('username=admin')
    ));
    await loginLogUsername.fill('admin');
    await loginLogUsername.press('Enter');
    await loginLogRequest;

    await page.goto('/system/session', { waitUntil: 'networkidle' });
    const sessionUsername = formItem(page, '用户名').locator('input').first();
    const sessionRequest = page.waitForRequest((request) => (
      request.method() === 'GET'
      && request.url().includes('/api/v1/system/session/list')
      && request.url().includes('username=admin')
    ));
    await sessionUsername.fill('admin');
    await sessionUsername.press('Enter');
    await sessionRequest;
  });

  test('dict, i18n, and permission dialogs submit with Enter key', async ({ page }) => {
    const { accessToken } = await signInAsAdmin(page);
    const dictCode = `enter_dict_${Date.now()}`;
    const dictName = `回车测试字典_${Date.now()}`;
    const i18nKey = `i18n.enter.${Date.now()}`;
    const permissionPath = `/api/v1/system/permission/enter-smoke-${Date.now()}`;
    let createdDictId = 0;
    let createdI18nId = 0;
    let createdPermissionId = 0;

    try {
      await page.goto('/system/dict', { waitUntil: 'networkidle' });
      await page.locator('.dict-page__actions').first().getByRole('button', { name: '新增', exact: true }).click();
      const dictDialog = await waitForDialog(page, '新增字典类型');
      const dictInputs = dictDialog.locator('input:not([disabled])');
      await dictInputs.nth(0).fill(dictCode);
      await dictInputs.nth(1).fill(dictName);
      await dictInputs.nth(1).press('Enter');
      await expect(dictDialog).toHaveCount(0);
      await expect(page.locator('.arco-message').getByText('创建成功', { exact: false }).last()).toBeVisible();

      await expect.poll(async () => {
        const response = await page.request.get(`${apiBaseUrl}/system/dict/type/list`, {
          headers: authHeaders(accessToken),
          params: { dictCode },
        });
        const payload = await response.json();
        const item = Array.isArray(payload.data) ? payload.data[0] : undefined;
        createdDictId = Number(item?.id || 0);
        return createdDictId > 0;
      }).toBeTruthy();

      await page.goto('/system/i18n', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: '新增', exact: true }).click();
      const i18nDialog = await waitForDialog(page, '新增翻译');
      const i18nInputs = i18nDialog.locator('input:not([disabled])');
      await i18nInputs.nth(0).fill('system.config');
      await i18nInputs.nth(1).fill('messages');
      await i18nInputs.nth(2).fill(i18nKey);
      await i18nDialog.locator('textarea').first().fill('回车提交文案');
      await i18nInputs.nth(2).press('Enter');
      await expect(i18nDialog).toHaveCount(0);
      await expect(page.locator('.arco-message').getByText('创建成功', { exact: false }).last()).toBeVisible();

      await expect.poll(async () => {
        const response = await page.request.get(`${apiBaseUrl}/system/i18n/list`, {
          headers: authHeaders(accessToken),
          params: { key: i18nKey, page: '1', pageSize: '10' },
        });
        const payload = await response.json();
        const item = payload.data?.items?.[0];
        createdI18nId = Number(item?.id || 0);
        return createdI18nId > 0;
      }).toBeTruthy();

      await page.goto('/system/permission', { waitUntil: 'networkidle' });
      await page.getByRole('tab', { name: '接口策略', exact: true }).click();
      await page.getByRole('button', { name: '新增', exact: true }).click();
      const permissionDialog = await waitForDialog(page, '新增策略');
      await permissionDialog.locator('.arco-select-view').first().click();
      await page.getByRole('option', { name: 'superadmin', exact: true }).click();
      const pathInput = permissionDialog.getByPlaceholder('/api/v1/system/user/list');
      await pathInput.fill(permissionPath);
      await pathInput.press('Enter');
      await expect(permissionDialog).toHaveCount(0);
      await expect(page.locator('.arco-message').getByText('创建成功', { exact: false }).last()).toBeVisible();

      await expect.poll(async () => {
        const response = await page.request.get(`${apiBaseUrl}/system/permission/list`, {
          headers: authHeaders(accessToken),
          params: { path: permissionPath, page: '1', pageSize: '10' },
        });
        const payload = await response.json();
        const item = payload.data?.items?.find((row: { path?: string }) => row.path === permissionPath);
        createdPermissionId = Number(item?.id || 0);
        return createdPermissionId > 0;
      }).toBeTruthy();
    } finally {
      const headers = await verifiedHeaders(page, accessToken);
      if (createdPermissionId > 0) {
        await page.request.delete(`${apiBaseUrl}/system/permission/${createdPermissionId}`, {
          headers,
        }).catch(() => undefined);
      }
      if (createdI18nId > 0) {
        await page.request.delete(`${apiBaseUrl}/system/i18n/${createdI18nId}`, {
          headers,
        }).catch(() => undefined);
      }
      if (createdDictId > 0) {
        await page.request.delete(`${apiBaseUrl}/system/dict/type/${createdDictId}`, {
          headers,
        }).catch(() => undefined);
      }
    }
  });
});
