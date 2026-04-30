const { chromium, request } = require(''playwright'');
(async () => {
  const api = await request.newContext({ baseURL: ''http://127.0.0.1:8080/api/v1'' });
  const resp = await api.post(''/auth/login'', { data: { username: ''admin'', password: ''123456'' } });
  if (!resp.ok()) throw new Error(''login failed'');
  const payload = await resp.json();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(({ accessToken, refreshToken }) => {
    localStorage.setItem(''pantheon_access_token'', accessToken);
    localStorage.setItem(''pantheon_refresh_token'', refreshToken);
    localStorage.setItem(''pantheon_lang'', ''zh-CN'');
    localStorage.setItem(''pantheon_lang_explicit'', ''1'');
  }, { accessToken: payload.data.accessToken, refreshToken: payload.data.refreshToken });
  await page.goto(''http://127.0.0.1:4173/dashboard'', { waitUntil: ''networkidle'' }).catch(async () => {
    await page.goto(''http://127.0.0.1:5173/dashboard'', { waitUntil: ''networkidle'' });
  });
  await page.screenshot({ path: ''test-results/icon-audit-dashboard.png'', fullPage: true });
  await page.goto(''http://127.0.0.1:4173/system/user'', { waitUntil: ''networkidle'' }).catch(async () => {
    await page.goto(''http://127.0.0.1:5173/system/user'', { waitUntil: ''networkidle'' });
  });
  await page.screenshot({ path: ''test-results/icon-audit-user.png'', fullPage: true });
  await browser.close();
  await api.dispose();
})();
