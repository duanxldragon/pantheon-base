import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(new URL('../../../frontend/package.json', import.meta.url));
const { chromium } = require('playwright');

const BASE = 'http://127.0.0.1:5173';
const SCREENS = path.join(process.env.TEMP, 'pantheon-accept', 'screens');
const report = JSON.parse(fs.readFileSync(new URL('./report.json', import.meta.url), 'utf8'));
const tenantPassword = process.env.ACCEPT_TENANT_PASSWORD;
const adminPassword = process.env.ACCEPT_ADMIN_PASSWORD;
if (!tenantPassword || !adminPassword) {
  throw new Error('Set ACCEPT_TENANT_PASSWORD and ACCEPT_ADMIN_PASSWORD before running.');
}
fs.mkdirSync(SCREENS, { recursive: true });

const PLATFORM_ONLY_LABELS = ['租户管理', '菜单管理', '国际化管理'];
const UPGRADE_TITLE = '当前套餐不包含此功能';
const results = { plans: {}, platform: {}, generatedAt: new Date().toISOString() };

const browser = await chromium.launch({ headless: true });

async function withPage(run) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  try {
    return await run(page);
  } finally {
    await context.close();
  }
}

async function login(page, username, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.locator('input[autocomplete="username"]').fill(username);
  await page.locator('input[autocomplete="current-password"]').fill(password);
  await page.locator('.auth-login-card__submit').click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1600);
  if (page.url().includes('/login')) {
    throw new Error(`login did not leave the login page for ${username}`);
  }
}

async function labels(page) {
  return page.locator('.app-shell__menu-entry-label').allTextContents();
}

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENS, name), fullPage: false });
}

async function bodyText(page) {
  return page.locator('body').innerText();
}

async function visit(page, route) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  return bodyText(page);
}

for (const plan of ['free', 'basic', 'professional', 'enterprise']) {
  const entry = report.tenants[plan];
  const result = { username: entry.username, tenantId: entry.tenantId };
  results.plans[plan] = result;

  await withPage(async (page) => {
    await login(page, entry.username, tenantPassword);
    const menuLabels = await labels(page);
    result.menuLabels = menuLabels;
    result.issue1 = {
      platformOnlyMenuVisible: PLATFORM_ONLY_LABELS.filter((label) => menuLabels.includes(label)),
    };
    result.issue3 = {
      moduleManagerMenu: menuLabels.includes('模块管理'),
      generatorMenu: menuLabels.includes('模块生成器'),
      lowcodeGroupMenu: menuLabels.includes('低代码平台'),
    };
    await screenshot(page, `menu-${plan}.png`);

    const tenantPageText = await visit(page, '/system/tenant');
    result.issue1.tenantPageUrl = page.url();
    result.issue1.tenantPageShowsTenantConsole =
      tenantPageText.includes('租户编码') || tenantPageText.includes('新增租户');
    result.issue1.tenantPageSnippet = tenantPageText.slice(0, 300);
    await screenshot(page, `tenant-page-${plan}.png`);

    const logText = await visit(page, '/system/login-log');
    result.issue2 = {
      showsOwnLogin: logText.includes(entry.username),
      tableRows: await page.locator('.arco-table-tr').count(),
      snippet: logText.slice(0, 400),
    };
    await screenshot(page, `login-log-${plan}.png`);

    if (plan === 'free' || plan === 'basic' || plan === 'professional') {
      const modulesText = await visit(page, '/system/modules');
      result.issue3.modulesPage = {
        upgradeShown: modulesText.includes(UPGRADE_TITLE),
        url: page.url(),
      };
      await screenshot(page, `modules-page-${plan}.png`);
    }

    if (plan === 'free' || plan === 'basic') {
      const generatorText = await visit(page, '/system/generator');
      result.issue3.generatorPage = {
        upgradeShown: generatorText.includes(UPGRADE_TITLE),
        url: page.url(),
      };
      await screenshot(page, `generator-page-${plan}.png`);
    }

    if (plan === 'professional' || plan === 'enterprise') {
      const generatorText = await visit(page, '/system/generator');
      const manualSelect = page.locator('.arco-select-view-value', { hasText: '手工建模' }).first();
      if ((await manualSelect.count()) > 0) {
        await manualSelect.click();
        await page.waitForTimeout(400);
        await page.getByText('从数据库表导入', { exact: true }).last().click();
        await page.waitForTimeout(1200);
      }
      const datasourceText = await bodyText(page);
      const manageButton = page.getByRole('button', { name: '管理数据源' });
      result.issue3.generatorPage = {
        upgradeShown: generatorText.includes(UPGRADE_TITLE),
        planLockedTag: datasourceText.includes('外部数据源需旗舰版套餐'),
        manageButtonVisible: await manageButton.count(),
        manageButtonDisabled:
          (await manageButton.count()) > 0 ? await manageButton.first().isDisabled() : null,
      };
      await screenshot(page, `generator-datasource-${plan}.png`);
    }
  });
}

results.platform = await withPage(async (page) => {
  await login(page, 'admin', adminPassword);
  const menuLabels = await labels(page);
  const platform = {
    menuLabels,
    platformOnlyMenuVisible: PLATFORM_ONLY_LABELS.filter((label) => menuLabels.includes(label)),
  };
  await screenshot(page, 'menu-platform.png');

  await page.goto(`${BASE}/system/tenant`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const createButton = page.getByRole('button', { name: '新增', exact: true });
  platform.createButtonVisible = await createButton.count();
  if ((await createButton.count()) > 0) {
    await createButton.first().click();
    await page.waitForTimeout(800);
    const modal = page.locator('.arco-modal');
    const modalText = await modal.first().innerText();
    platform.matrix = {
      titleVisible: modalText.includes('套餐功能对照'),
      featureRows: ['动态模块管理', '代码生成器', '外部数据源导入'].filter((label) =>
        modalText.includes(label),
      ),
      planColumns: ['免费版', '基础版', '专业版', '旗舰版'].filter((label) =>
        modalText.includes(label),
      ),
      currentPlanTag: modalText.includes('当前套餐'),
    };
    await page.screenshot({ path: path.join(SCREENS, 'tenant-create-matrix.png'), fullPage: true });
    const cancel = page.getByRole('button', { name: '取消' });
    if ((await cancel.count()) > 0) {
      await cancel.first().click();
    }
  }
  return platform;
});

await browser.close();
fs.writeFileSync(
  path.join(process.env.TEMP, 'pantheon-accept', 'acceptance-result.json'),
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
