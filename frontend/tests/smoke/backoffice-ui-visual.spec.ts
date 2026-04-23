import { expect, test, type Page } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const apiBaseUrl = 'http://127.0.0.1:8080/api/v1';
const artifactDir = join(process.cwd(), 'test-results', 'backoffice-ui');

const pageErrorTexts = ['加载失败', '网络异常', '请求超时', '500'];

const authenticatedPages = [
  { path: '/dashboard', title: '工作台', screenshot: 'dashboard-desktop.png' },
  { path: '/system/user', title: '用户管理', screenshot: 'system-user-desktop.png' },
  { path: '/system/setting', title: '系统设置', screenshot: 'system-setting-desktop.png' },
  { path: '/auth/security', title: '安全中心', screenshot: 'auth-security-desktop.png' },
] as const;

async function ensureArtifactDir() {
  if (!existsSync(artifactDir)) {
    mkdirSync(artifactDir, { recursive: true });
  }
}

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

function collectRuntimeErrors(page: Page) {
  const runtimeErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      runtimeErrors.push(message.text());
    }
  });

  page.on('pageerror', (error) => {
    runtimeErrors.push(error.message);
  });

  return runtimeErrors;
}

async function expectNoPageError(page: Page) {
  for (const text of pageErrorTexts) {
    await expect(page.getByText(text, { exact: false })).toHaveCount(0);
  }
}

async function expectProfessionalBackofficeSurface(page: Page) {
  await expect(page.locator('.app-shell__sider')).toBeVisible();
  await expect(page.locator('.app-shell__header')).toBeVisible();
  await expect(page.locator('.app-shell__content')).toBeVisible();
  await expect(page.locator('.page-panel').first()).toBeVisible();
  await expect(page.locator('.arco-layout-sider-dark')).toHaveCount(0);
}

test.beforeAll(async () => {
  await ensureArtifactDir();
});

test.describe('backoffice UI visual acceptance', () => {
  test('login page keeps a professional authentication console on desktop and mobile', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login', { waitUntil: 'networkidle' });

    await expect(page.locator('.auth-login-page')).toBeVisible();
    await expect(page.locator('.auth-login-card')).toBeVisible();
    await expect(page.locator('.auth-login-page__brand-pane')).toBeVisible();
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible();
    await expect(page.locator('.arco-carousel')).toHaveCount(0);
    await expect(page.getByText('记住我', { exact: false })).toHaveCount(0);
    await expect(page.getByText('忘记密码', { exact: false })).toHaveCount(0);
    await expect(page.getByText('AI', { exact: true })).toHaveCount(0);
    await page.screenshot({ path: join(artifactDir, 'login-desktop.png'), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/login', { waitUntil: 'networkidle' });
    await expect(page.locator('.auth-login-card')).toBeVisible();
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible();
    await page.screenshot({ path: join(artifactDir, 'login-mobile.png'), fullPage: true });

    expect(runtimeErrors).toEqual([]);
  });

  for (const pageMeta of authenticatedPages) {
    test(`${pageMeta.path} has unified shell and no runtime UI regression`, async ({ page }) => {
      const runtimeErrors = collectRuntimeErrors(page);
      await signInAsAdmin(page);

      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(pageMeta.path, { waitUntil: 'networkidle' });

      await expect(page).toHaveURL(new RegExp(`${pageMeta.path.replace(/\//g, '\\/')}$`));
      await expect(page.locator('.page-header').getByRole('heading', { name: pageMeta.title })).toBeVisible();
      await expectNoPageError(page);
      await expectProfessionalBackofficeSurface(page);
      await page.screenshot({ path: join(artifactDir, pageMeta.screenshot), fullPage: true });

      expect(runtimeErrors).toEqual([]);
    });
  }

  test('platform dashboard does not hard-code business module cards', async ({ page }) => {
    await signInAsAdmin(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    const dashboardContent = page.locator('.dashboard-page');
    await expect(dashboardContent).toBeVisible();
    await expect(dashboardContent.getByText('业务资产', { exact: false })).toHaveCount(0);
    await expect(dashboardContent.getByText('CMDB', { exact: false })).toHaveCount(0);
  });
});
