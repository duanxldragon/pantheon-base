import process from 'node:process';

const apiBaseUrl = process.env.PANTHEON_API_BASE_URL ?? 'http://127.0.0.1:8080/api/v1';
const adminUsername = process.env.PANTHEON_SMOKE_ADMIN_USERNAME ?? 'admin';
const adminPassword = process.env.PANTHEON_SMOKE_ADMIN_PASSWORD ?? '123456';
const smokePrefixes = ['i18n.enter.', 'i18n.smoke.', 'i18n.import.', 'i18n.sync.'];

function readFlag(flag) {
  return process.argv.includes(flag);
}

function readArg(flag, fallback = '') {
  const index = process.argv.indexOf(flag);
  if (index < 0 || index + 1 >= process.argv.length) {
    return fallback;
  }
  return String(process.argv[index + 1] ?? '').trim();
}

function sanitizeAuditLogToken(value) {
  return String(value ?? '')
    .replace(/[^a-zA-Z0-9._:-]/g, '?')
    .slice(0, 160);
}

function sanitizeAuditLogNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function sanitizeAuditSummaryItem(item) {
  return {
    module: sanitizeAuditLogToken(item.module),
    entryCount: sanitizeAuditLogNumber(item.entryCount),
    unusedKeyCount: sanitizeAuditLogNumber(item.unusedKeyCount),
    observingKeyCount: sanitizeAuditLogNumber(item.observingKeyCount),
    archivedKeyCount: sanitizeAuditLogNumber(item.archivedKeyCount),
    deleteEligibleKeyCount: sanitizeAuditLogNumber(item.deleteEligibleKeyCount),
  };
}

function sanitizeAuditUnusedItem(item) {
  return {
    module: sanitizeAuditLogToken(item.module),
    key: sanitizeAuditLogToken(item.key),
    lifecycleStatus: sanitizeAuditLogToken(item.lifecycleStatus),
    observingDays: sanitizeAuditLogNumber(item.observingDays),
    eligibleForArchive: Boolean(item.eligibleForArchive),
    eligibleForDelete: Boolean(item.eligibleForDelete),
  };
}

function sanitizeAuditPayload(payload) {
  return {
    generatedAt: sanitizeAuditLogToken(payload.generatedAt),
    module: payload.module === null ? null : sanitizeAuditLogToken(payload.module),
    totalUnusedKeys: sanitizeAuditLogNumber(payload.totalUnusedKeys),
    totalModules: sanitizeAuditLogNumber(payload.totalModules),
    observationThresholdDays: sanitizeAuditLogNumber(payload.observationThresholdDays),
    archivedRetentionThresholdDays: sanitizeAuditLogNumber(payload.archivedRetentionThresholdDays),
    modules: payload.modules.map(sanitizeAuditSummaryItem),
    smokeKeys: payload.smokeKeys.map(sanitizeAuditUnusedItem),
    deleteEligible: payload.deleteEligible.map(sanitizeAuditUnusedItem),
  };
}

function extractCookieValue(setCookieHeader, name) {
  if (!setCookieHeader) {
    return null;
  }
  const match = setCookieHeader.match(new RegExp(`(?:^|,\\s*)${name}=([^;]+)`));
  return match?.[1] ?? null;
}

function authHeaders(session) {
  return {
    Authorization: `Bearer ${session.accessToken}`,
    'X-CSRF-Token': session.csrfToken,
    Cookie: `pantheon_csrf_token=${session.csrfToken}`,
  };
}

async function login() {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: adminUsername, password: adminPassword }),
  });
  if (!response.ok) {
    throw new Error(`Login failed: HTTP ${response.status}`);
  }
  const payload = await response.json();
  if (payload.code !== 200) {
    throw new Error(`Login failed: code ${payload.code}`);
  }
  return {
    accessToken: payload.data.accessToken,
    csrfToken:
      response.headers.get('x-csrf-token') ??
      extractCookieValue(response.headers.get('set-cookie'), 'pantheon_csrf_token') ??
      `pantheon-audit-csrf-${Date.now()}`,
  };
}

async function apiGet(session, path, params = {}) {
  const url = new URL(`${apiBaseUrl}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, {
    headers: authHeaders(session),
  });
  if (!response.ok) {
    throw new Error(`GET ${path} failed: HTTP ${response.status}`);
  }
  const payload = await response.json();
  if (payload.code !== 200) {
    throw new Error(`GET ${path} failed: code ${payload.code}`);
  }
  return payload.data;
}

function compareModuleRisk(a, b) {
  if (a.deleteEligibleKeyCount !== b.deleteEligibleKeyCount) {
    return b.deleteEligibleKeyCount - a.deleteEligibleKeyCount;
  }
  if (a.archivedKeyCount !== b.archivedKeyCount) {
    return b.archivedKeyCount - a.archivedKeyCount;
  }
  if (a.observingKeyCount !== b.observingKeyCount) {
    return b.observingKeyCount - a.observingKeyCount;
  }
  if (a.unusedKeyCount !== b.unusedKeyCount) {
    return b.unusedKeyCount - a.unusedKeyCount;
  }
  return String(a.module).localeCompare(String(b.module));
}

function toModuleSummary(item) {
  return {
    module: item.module,
    entryCount: item.entryCount,
    unusedKeyCount: item.unusedKeyCount,
    observingKeyCount: item.observingKeyCount,
    archivedKeyCount: item.archivedKeyCount,
    deleteEligibleKeyCount: item.deleteEligibleKeyCount ?? 0,
  };
}

function toUnusedKeySummary(item) {
  return {
    module: item.module,
    key: item.key,
    lifecycleStatus: item.lifecycleStatus,
    observingDays: item.observingDays,
    eligibleForArchive: item.eligibleForArchive,
    eligibleForDelete: item.eligibleForDelete,
  };
}

async function main() {
  const targetModule = readArg('--module', '');
  const jsonOnly = readFlag('--json');
  const session = await login();
  const audit = await apiGet(session, '/system/i18n/audit');

  const moduleRows = Array.isArray(audit.modules) ? audit.modules : [];
  const unusedRows = Array.isArray(audit.unusedKeys) ? audit.unusedKeys : [];

  const filteredModules = moduleRows
    .filter((item) => !targetModule || item.module === targetModule)
    .filter(
      (item) =>
        item.unusedKeyCount > 0 ||
        item.observingKeyCount > 0 ||
        item.archivedKeyCount > 0 ||
        (item.deleteEligibleKeyCount ?? 0) > 0,
    )
    .map(toModuleSummary)
    .sort(compareModuleRisk);

  const filteredUnused = unusedRows
    .filter((item) => !targetModule || item.module === targetModule)
    .map(toUnusedKeySummary);

  const smokeKeys = filteredUnused
    .filter((item) => smokePrefixes.some((prefix) => item.key.startsWith(prefix)))
    .sort((a, b) =>
      a.module === b.module ? a.key.localeCompare(b.key) : a.module.localeCompare(b.module),
    );

  const deleteEligible = filteredUnused
    .filter((item) => item.eligibleForDelete)
    .sort((a, b) =>
      a.module === b.module ? a.key.localeCompare(b.key) : a.module.localeCompare(b.module),
    );

  const payload = {
    generatedAt: new Date().toISOString(),
    module: targetModule || null,
    totalUnusedKeys: filteredUnused.length,
    totalModules: filteredModules.length,
    observationThresholdDays: audit.unusedObservationThresholdDays,
    archivedRetentionThresholdDays:
      typeof audit.archivedRetentionThresholdDays === 'number'
        ? audit.archivedRetentionThresholdDays
        : null,
    modules: filteredModules,
    smokeKeys,
    deleteEligible,
  };
  const safePayload = sanitizeAuditPayload(payload);

  if (jsonOnly) {
    console.log(JSON.stringify(safePayload, null, 2));
    return;
  }

  const deleteThresholdLabel =
    safePayload.archivedRetentionThresholdDays === null
      ? 'n/a'
      : `${safePayload.archivedRetentionThresholdDays}d`;
  const observationThresholdLabel =
    safePayload.observationThresholdDays === null ? 'n/a' : `${safePayload.observationThresholdDays}d`;

  console.log(`system_i18n runtime audit @ ${safePayload.generatedAt}`);
  console.log(
    `unused=${safePayload.totalUnusedKeys} modules=${safePayload.totalModules} observe>=${observationThresholdLabel} delete>=${deleteThresholdLabel}`,
  );
  console.log('');

  if (safePayload.modules.length === 0) {
    console.log('No unused/observing/archived modules found.');
  } else {
    console.log('Modules');
    for (const item of safePayload.modules) {
      console.log(
        `- ${item.module}: unused=${item.unusedKeyCount}, observing=${item.observingKeyCount}, archived=${item.archivedKeyCount}, deleteEligible=${item.deleteEligibleKeyCount}`,
      );
    }
  }

  console.log('');
  console.log(`Smoke keys (${safePayload.smokeKeys.length})`);
  if (safePayload.smokeKeys.length === 0) {
    console.log('- none');
  } else {
    for (const item of safePayload.smokeKeys) {
      console.log(
        `- ${item.module} :: ${item.key} [${item.lifecycleStatus}] observingDays=${item.observingDays}`,
      );
    }
  }

  console.log('');
  console.log(`Delete-eligible keys (${safePayload.deleteEligible.length})`);
  if (safePayload.deleteEligible.length === 0) {
    console.log('- none');
  } else {
    for (const item of safePayload.deleteEligible) {
      console.log(
        `- ${item.module} :: ${item.key} [${item.lifecycleStatus}] observingDays=${item.observingDays}`,
      );
    }
  }
}

await main();
