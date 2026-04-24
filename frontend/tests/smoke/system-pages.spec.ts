import { expect, test, type Page } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:8080/api/v1';
const pageErrorTitles = ['加载失败', '网络异常', '请求超时', '500'];
const pageEmptyTexts = ['暂无数据', '请选择左侧字典类型后维护字典项', '暂无字典类型', '暂无字典项'];

const systemPages = [
  { path: '/system/user', title: '用户管理' },
  { path: '/system/role', title: '角色管理' },
  { path: '/system/menu', title: '菜单管理' },
  { path: '/system/dept', title: '部门管理' },
  { path: '/system/post', title: '岗位管理' },
  { path: '/system/permission', title: '权限管理' },
  { path: '/system/dict', title: '字典管理' },
  { path: '/system/setting', title: '系统设置' },
  { path: '/system/login-log', title: '登录日志' },
  { path: '/system/session', title: '会话管理' },
  { path: '/system/operation-log', title: '操作日志' },
] as const;

async function signInAsAdmin(page: Page) {
  const response = await page.request.post(`${apiBaseUrl}/auth/login`, {
    data: {
      username: 'admin',
      password: '123456',
    },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.code).toBe(200);

  await page.addInitScript(
    ({ accessToken, refreshToken }) => {
      localStorage.setItem('pantheon_access_token', accessToken);
      localStorage.setItem('pantheon_refresh_token', refreshToken);
      localStorage.setItem('pantheon_lang', 'zh-CN');
    },
    {
      accessToken: payload.data.accessToken,
      refreshToken: payload.data.refreshToken,
    },
  );

  return payload.data.accessToken as string;
}

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function expectNoPageError(page: Page) {
  for (const title of pageErrorTitles) {
    await expect(page.getByText(title, { exact: false })).toHaveCount(0);
  }
}

async function expectPageBodyReady(page: Page) {
  const table = page.locator('.arco-table');
  const empty = page.locator('.arco-empty');

  const hasTable = (await table.count()) > 0;
  const hasEmpty = (await empty.count()) > 0;

  expect(hasTable || hasEmpty).toBeTruthy();

  if (hasEmpty) {
    const emptyText = await empty.first().innerText();
    expect(pageEmptyTexts.some((text) => emptyText.includes(text))).toBeTruthy();
  }
}

test.beforeEach(async ({ page }) => {
  await signInAsAdmin(page);
});

for (const pageMeta of systemPages) {
  test(`system smoke: ${pageMeta.path}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    await page.goto(pageMeta.path, { waitUntil: 'networkidle' });

    await expect(page).toHaveURL(new RegExp(`${pageMeta.path.replace(/\//g, '\\/')}$`));
    await expect(page.locator('.page-header').getByRole('heading', { name: pageMeta.title })).toBeVisible();
    await expectNoPageError(page);
    await expectPageBodyReady(page);
    expect(consoleErrors).toEqual([]);
  });
}

test('setting smoke: site name updates public brand display', async ({ page }) => {
  const accessToken = await signInAsAdmin(page);
  const groupResponse = await page.request.get(`${apiBaseUrl}/system/setting/group/basic`, {
    headers: authHeaders(accessToken),
  });
  expect(groupResponse.ok()).toBeTruthy();
  const groupPayload = await groupResponse.json();
  expect(groupPayload.code).toBe(200);
  const originalItems = groupPayload.data.items as Array<{ settingKey: string; settingValue: string }>;
  const nextSiteName = `Pantheon QA ${Date.now()}`;
  const nextItems = originalItems.map((item) => ({
    settingKey: item.settingKey,
    settingValue: item.settingKey === 'site.name' ? nextSiteName : item.settingValue,
  }));

  try {
    const updateResponse = await page.request.put(`${apiBaseUrl}/system/setting/group/basic`, {
      headers: authHeaders(accessToken),
      data: { items: nextItems },
    });
    expect(updateResponse.ok()).toBeTruthy();
    const updatePayload = await updateResponse.json();
    expect(updatePayload.code).toBe(200);

    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await expect(page.locator('.app-shell__brand-title')).toHaveText(nextSiteName);
    await expect(page).toHaveTitle(nextSiteName);
  } finally {
    await page.request.put(`${apiBaseUrl}/system/setting/group/basic`, {
      headers: authHeaders(accessToken),
      data: { items: originalItems },
    });
  }
});

test('setting smoke: default language applies when there is no explicit choice', async ({ page }) => {
  const accessToken = await signInAsAdmin(page);
  const groupResponse = await page.request.get(`${apiBaseUrl}/system/setting/group/i18n`, {
    headers: authHeaders(accessToken),
  });
  expect(groupResponse.ok()).toBeTruthy();
  const groupPayload = await groupResponse.json();
  expect(groupPayload.code).toBe(200);
  const originalItems = groupPayload.data.items as Array<{ settingKey: string; settingValue: string }>;
  const nextItems = originalItems.map((item) => ({
    settingKey: item.settingKey,
    settingValue: item.settingKey === 'i18n.default_language' ? 'en-US' : item.settingValue,
  }));

  try {
    const updateResponse = await page.request.put(`${apiBaseUrl}/system/setting/group/i18n`, {
      headers: authHeaders(accessToken),
      data: { items: nextItems },
    });
    expect(updateResponse.ok()).toBeTruthy();

    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.removeItem('pantheon_lang');
      localStorage.removeItem('pantheon_lang_explicit');
    });
    await page.reload({ waitUntil: 'networkidle' });

    await expect(page.locator('.page-header').getByRole('heading', { name: 'Workbench' })).toBeVisible();
  } finally {
    await page.request.put(`${apiBaseUrl}/system/setting/group/i18n`, {
      headers: authHeaders(accessToken),
      data: { items: originalItems },
    });
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
  const originalItems = groupPayload.data.items as Array<{ settingKey: string; settingValue: string }>;
  const nextItems = originalItems.map((item) => ({
    settingKey: item.settingKey,
    settingValue: item.settingKey === 'ui.enable_tab_bar' ? 'false' : item.settingValue,
  }));

  try {
    const updateResponse = await page.request.put(`${apiBaseUrl}/system/setting/group/ui`, {
      headers: authHeaders(accessToken),
      data: { items: nextItems },
    });
    expect(updateResponse.ok()).toBeTruthy();

    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await expect(page.locator('.app-shell__tabs')).toHaveCount(0);
  } finally {
    await page.request.put(`${apiBaseUrl}/system/setting/group/ui`, {
      headers: authHeaders(accessToken),
      data: { items: originalItems },
    });
  }
});
