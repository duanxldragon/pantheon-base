import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(new URL('../../../frontend/package.json', import.meta.url));
const { chromium } = require('playwright');

const BASE = 'http://127.0.0.1:5173';
const report = JSON.parse(fs.readFileSync(new URL('./report.json', import.meta.url), 'utf8'));
const password = process.env.ACCEPT_TENANT_PASSWORD;
if (!password) {
  throw new Error('ACCEPT_TENANT_PASSWORD is required');
}

const entry = report.tenants.free;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.locator('input[autocomplete="username"]').fill(entry.username);
await page.locator('input[autocomplete="current-password"]').fill(password);
await page.locator('.auth-login-card__submit').click();
await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 });
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1600);

const tabTexts = () => page.locator('[role="tab"]').allTextContents();
const before = await tabTexts();

await page.goto(`${BASE}/system/tenant`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
const afterTenant = await tabTexts();
const tenantBody = await page.locator('body').innerText();
await page.screenshot({ path: path.join(process.env.TEMP, 'pantheon-accept', 'tab-residual-tenant.png') });

await page.goto(`${BASE}/system/generator`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
const afterGenerator = await tabTexts();
await page.screenshot({ path: path.join(process.env.TEMP, 'pantheon-accept', 'tab-residual-generator.png') });

const upgradeShown = (await page.locator('body').innerText()).includes('当前套餐不包含此功能');
const result = {
  before,
  afterTenant,
  afterGenerator,
  tenantShows403: tenantBody.includes('403'),
  tenantTabLeaked: afterTenant.some((text) => text.includes('租户管理')),
  generatorTabLeaked: afterGenerator.some((text) => text.includes('模块生成器')),
  upgradeShown,
};
fs.writeFileSync(path.join(process.env.TEMP, 'pantheon-accept', 'tab-residual-result.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));

await browser.close();
