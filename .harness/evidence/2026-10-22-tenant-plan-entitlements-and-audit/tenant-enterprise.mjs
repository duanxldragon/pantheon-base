import fs from 'node:fs';

const BASE = 'http://127.0.0.1:8080/api/v1';
const report = JSON.parse(fs.readFileSync(new URL('./report.json', import.meta.url), 'utf8'));
const suffix = report.suffix;
const password = process.env.ACCEPT_TENANT_PASSWORD;
const adminPassword = process.env.ACCEPT_ADMIN_PASSWORD;
if (!password || !adminPassword) {
  throw new Error('Set ACCEPT_TENANT_PASSWORD and ACCEPT_ADMIN_PASSWORD before running.');
}

const cookies = new Map();
let csrf = '';
async function request(path, { method = 'GET', body, csrf: needsCsrf = false } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (cookies.size > 0) headers.Cookie = [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  if (needsCsrf && csrf) headers['X-CSRF-Token'] = csrf;
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  for (const raw of response.headers.getSetCookie()) {
    const pair = raw.split(';')[0];
    const index = pair.indexOf('=');
    if (index > 0) cookies.set(pair.slice(0, index), pair.slice(index + 1));
  }
  const headerCsrf = response.headers.get('x-csrf-token');
  if (headerCsrf) csrf = headerCsrf;
  return { status: response.status, json: await response.json() };
}

const login = await request('/auth/login', { method: 'POST', body: { username: 'admin', password: adminPassword } });
if (login.json.code !== 200) throw new Error('admin login failed');

const code = `acc-ent-${suffix}`;
const create = await request('/system/tenant', {
  method: 'POST',
  csrf: true,
  body: {
    code,
    name: `Acceptance enterprise ${suffix}`,
    plan: 'enterprise',
    admin_username: `${code}-admin`,
    admin_password: password,
    admin_nickname: 'Acceptance enterprise admin',
  },
});
if (create.json.code !== 200) throw new Error(`create failed: ${create.json.message}`);
report.tenants.enterprise = {
  plan: 'enterprise',
  code,
  username: `${code}-admin`,
  createStatus: create.status,
  createCode: create.json.code,
  tenantId: create.json.data?.tenant?.id ?? create.json.data?.id ?? null,
};
fs.writeFileSync(new URL('./report.json', import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ enterprise: { code, username: report.tenants.enterprise.username, tenantId: report.tenants.enterprise.tenantId } }, null, 2));
