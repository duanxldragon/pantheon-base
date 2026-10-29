const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE = process.env.UI_BASE || 'http://127.0.0.1:5174';
const OUT = process.env.ACCEPT_OUT || '.';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'zh-CN' });
  const page = await context.newPage();
  const requests = [];
  const consoleErrors = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/v1/')) requests.push(req.url());
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 300));
  });

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const inputs = page.locator('form input');
  await inputs.nth(0).fill(process.env.TENANT_ADMIN || 'acmeadmin');
  await inputs.nth(1).fill(process.env.TENANT_PWD || 'AcmeAdmin123!');
  await page.locator('form button[type=submit], form button').first().click();
  await page.waitForTimeout(3500);

  const snapshot = async (route) => {
    requests.length = 0;
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    return {
      route,
      requests: [...requests],
      tenantConsoleCalls: requests.filter((u) => u.includes('/system/tenant/list') || u.includes('/system/tenant?')),
      platformOnly: /tenant\.platformOnly/.test(text),
      textSnippet: text.slice(0, 400),
    };
  };

  const users = await snapshot('/system/user');
  const dept = await snapshot('/system/dept');

  const deptTotal = (dept.textSnippet.match(/总数\s*(\d+)/) || [])[1] || null;
  const out = {
    base: BASE,
    capturedAt: new Date().toISOString(),
    usersPage: users,
    deptPage: dept,
    deptTotal,
    deptChildVisible: /研发中心/.test(dept.textSnippet) && Number(deptTotal) > 1,
    tenantConsoleCallsAnyPage: [...users.tenantConsoleCalls, ...dept.tenantConsoleCalls],
    platformOnlyToasts: [users, dept].filter((p) => p.platformOnly).map((p) => p.route),
    consoleErrors,
  };
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'network-after.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})().catch((err) => { console.error(err); process.exit(1); });
