const { chromium, request } = require('../frontend/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const baseUrl = 'http://127.0.0.1:5173';
const apiBaseUrl = 'http://127.0.0.1:8080/api/v1';
const outDir = path.resolve(__dirname);

async function login(api) {
  const resp = await api.post(`${apiBaseUrl}/auth/login`, {
    data: { username: 'admin', password: '123456' }
  });
  const payload = await resp.json();
  if (!resp.ok() || payload.code !== 200) {
    throw new Error(`login failed: ${resp.status()} ${JSON.stringify(payload)}`);
  }
  return payload.data;
}

async function preparePage(page, tokens) {
  await page.addInitScript(({ accessToken, refreshToken }) => {
    localStorage.setItem('pantheon_access_token', accessToken);
    localStorage.setItem('pantheon_refresh_token', refreshToken);
    localStorage.setItem('pantheon_lang', 'zh-CN');
    localStorage.setItem('pantheon_lang_explicit', '1');
  }, tokens);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const api = await request.newContext();
  const tokens = await login(api);

  const shots = [
    { name: 'dict-desktop', url: '/system/dict', viewport: { width: 1600, height: 1100 } },
    { name: 'dict-laptop', url: '/system/dict', viewport: { width: 1280, height: 960 } },
    { name: 'i18n-desktop', url: '/system/i18n', viewport: { width: 1600, height: 1300 } },
    { name: 'i18n-laptop', url: '/system/i18n', viewport: { width: 1280, height: 1100 } },
  ];

  for (const shot of shots) {
    const context = await browser.newContext({ viewport: shot.viewport, baseURL: baseUrl });
    const page = await context.newPage();
    await preparePage(page, tokens);
    const consoleErrors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    await page.goto(shot.url, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(outDir, `${shot.name}.png`), fullPage: true });
    fs.writeFileSync(path.join(outDir, `${shot.name}.log.txt`), consoleErrors.join('\n'), 'utf8');
    await context.close();
  }

  await api.dispose();
  await browser.close();
})();
