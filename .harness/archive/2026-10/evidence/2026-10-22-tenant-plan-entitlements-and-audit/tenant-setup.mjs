import fs from 'node:fs';

const BASE = 'http://127.0.0.1:8080/api/v1';
const suffix = process.env.ACCEPT_SUFFIX || String(Date.now()).slice(-6);
const ADMIN_PASSWORD = process.env.ACCEPT_ADMIN_PASSWORD;
const TENANT_PASSWORD = process.env.ACCEPT_TENANT_PASSWORD;
if (!ADMIN_PASSWORD || !TENANT_PASSWORD) {
  throw new Error('Set ACCEPT_ADMIN_PASSWORD and ACCEPT_TENANT_PASSWORD before running.');
}

function createClient() {
  const cookies = new Map();
  let csrf = '';
  return {
    get csrf() {
      return csrf;
    },
    cookies,
    async request(path, { method = 'GET', body, csrf: needsCsrf = false } = {}) {
      const headers = { Accept: 'application/json' };
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      if (cookies.size > 0) {
        headers.Cookie = [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
      }
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
      const text = await response.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = { raw: text };
      }
      return { status: response.status, json };
    },
  };
}

async function login(username, password) {
  const client = createClient();
  const result = await client.request('/auth/login', {
    method: 'POST',
    body: { username, password },
  });
  return { client, ...result };
}

function collectPaths(nodes, out = []) {
  for (const node of nodes || []) {
    if (node.path) out.push(node.path);
    collectPaths(node.children, out);
  }
  return out;
}

const report = { suffix, tenants: {}, checks: {} };

const adminLogin = await login('admin', ADMIN_PASSWORD);
report.checks.adminLogin = adminLogin.status === 200 && adminLogin.json?.code === 200;
if (!report.checks.adminLogin) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

const existing = await adminLogin.client.request('/system/tenant/list?page=1&size=100');
report.checks.adminTenantList = existing.status === 200;
report.existingTenantCodes = (existing.json?.data?.items || []).map((item) => item.code);

const plans = [
  { plan: 'free', code: `acc-free-${suffix}` },
  { plan: 'basic', code: `acc-basic-${suffix}` },
  { plan: 'professional', code: `acc-pro-${suffix}` },
];

for (const { plan, code } of plans) {
  const username = `${code}-admin`;
  const create = await adminLogin.client.request('/system/tenant', {
    method: 'POST',
    csrf: true,
    body: {
      code,
      name: `Acceptance ${plan} ${suffix}`,
      plan,
      admin_username: username,
      admin_password: TENANT_PASSWORD,
      admin_nickname: `Acceptance ${plan} admin`,
    },
  });
  const entry = { plan, code, username, createStatus: create.status, createCode: create.json?.code };
  if (create.status !== 200 || create.json?.code !== 200) {
    entry.createMessage = create.json?.message;
    report.tenants[plan] = entry;
    continue;
  }
  entry.tenantId = create.json?.data?.tenant?.id ?? create.json?.data?.id ?? null;

  const tenantLogin = await login(username, TENANT_PASSWORD);
  entry.loginStatus = tenantLogin.json?.code ?? tenantLogin.status;
  entry.loginMessage = tenantLogin.json?.message;
  if (tenantLogin.json?.code === 200) {
    const tree = await tenantLogin.client.request('/system/menu/tree?scope=nav');
    const paths = collectPaths(tree.json?.data || []);
    entry.navPaths = paths;
    entry.hiddenPlatformPaths = ['/system/tenant', '/system/menu', '/system/i18n'].filter(
      (path) => !paths.includes(path),
    );
    entry.lowcodePaths = paths.filter((path) => path.startsWith('/system/modules') || path.startsWith('/system/generator'));

    const directTenantPage = await tenantLogin.client.request('/system/tenant/list?page=1&size=10');
    entry.platformOnlyApiStatus = directTenantPage.status;
    entry.platformOnlyApiMessage = directTenantPage.json?.message;

    const loginLogs = await tenantLogin.client.request('/system/login-log/list?page=1&size=20');
    entry.loginLogStatus = loginLogs.status;
    entry.loginLogCode = loginLogs.json?.code;
    entry.loginLogTotal = loginLogs.json?.data?.total ?? null;
    entry.loginLogRowsForAdmin = (loginLogs.json?.data?.items || []).filter(
      (row) => row.username === username || row.username === entry.username,
    ).length;
    entry.loginLogSample = (loginLogs.json?.data?.items || []).slice(0, 3).map((row) => ({
      username: row.username,
      status: row.status,
      messageKey: row.messageKey ?? row.message_key,
      tenantId: row.tenantId ?? row.tenant_id,
      loginTime: row.loginTime ?? row.login_time,
    }));
    entry.tenantContext = await tenantLogin.client.request('/auth/tenants/current').then((r) => r.json?.data ?? null);
  }
  report.tenants[plan] = entry;
}

const after = await adminLogin.client.request('/system/tenant/list?page=1&size=100');
report.tenantListPlans = Object.fromEntries(
  (after.json?.data?.items || [])
    .filter((item) => item.code.startsWith(`acc-`))
    .map((item) => [item.code, item.plan]),
);

const outPath = process.env.ACCEPT_REPORT_PATH || 'accept-report.json';
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
