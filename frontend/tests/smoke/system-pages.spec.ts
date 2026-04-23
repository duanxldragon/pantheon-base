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
