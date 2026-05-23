const { chromium, request } = require("playwright");
(async () => {
  const appBaseUrl = process.env.PANTHEON_WEB_BASE_URL ?? 'http://127.0.0.1:5173';
  const api = await request.newContext({ baseURL: "http://127.0.0.1:8080/api/v1" });
  const resp = await api.post('/auth/login', { data: { username: 'admin', password: '123456' } });
  if (!resp.ok()) throw new Error('login failed');
  const payload = await resp.json();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(({ accessToken, refreshToken }) => {
    localStorage.setItem('pantheon_access_token', accessToken);
    localStorage.setItem('pantheon_refresh_token', refreshToken);
    localStorage.setItem('pantheon_lang', 'zh-CN');
    localStorage.setItem('pantheon_lang_explicit', '1');
  }, { accessToken: payload.data.accessToken, refreshToken: payload.data.refreshToken });

  const urls = [
    ['dashboard', `${appBaseUrl}/dashboard`],
    ['user', `${appBaseUrl}/system/user`]
  ];

  for (const [name, url] of urls) {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `frontend/test-results/icon-audit-${name}.png`, fullPage: true });
  }
  await browser.close();
  await api.dispose();
})();
