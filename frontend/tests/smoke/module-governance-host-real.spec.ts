import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type APIRequestContext } from '@playwright/test';
import { ModuleExporter } from '../../src/modules/generator/exporter';
import type { GenerateAndRegisterResp, GeneratorTablePreview } from '../../src/modules/generator/api';
import type { ModuleField, ModuleSchema, PageActionKey } from '../../src/modules/generator/schema';
import {
  buildAuditActionKey,
  buildFieldHelpTextKey,
  buildFieldLabelKey,
  buildFieldPlaceholderKey,
  buildModuleNamespace,
  buildPermissionTitleKey,
  buildTitleKey,
  generateDefaultMenus,
  generateDefaultPermissions,
  inferModelName,
} from '../../src/modules/generator/schema';

const apiBaseUrl = 'http://127.0.0.1:8080/api/v1';
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(currentDir, '../../..');
const moduleName = 'cmdb/host';
const moduleKey = 'business.cmdb.host';
const routePath = '/business/cmdb/host';
const backendModuleDir = path.join(workspaceRoot, 'backend', 'modules', 'business', 'cmdb', 'host');
const frontendModuleDir = path.join(workspaceRoot, 'frontend', 'src', 'modules', 'business', 'cmdb', 'host');
const schemaFile = path.join(workspaceRoot, 'schema', 'generated', 'business', 'cmdb', 'host.json');
const backendRegistry = path.join(workspaceRoot, 'backend', 'modules', 'business', 'generated_registry.go');
const frontendRegistry = path.join(workspaceRoot, 'frontend', 'src', 'modules', 'generated', 'business.ts');
const componentRegistry = path.join(workspaceRoot, 'frontend', 'src', 'core', 'router', 'generatedComponentRegistry.ts');
const tableName = 'biz_cmdb_host';

type LoginPayload = {
  accessToken: string;
  refreshToken: string;
};

async function loginByApi(request: APIRequestContext): Promise<LoginPayload> {
  const response = await request.post(`${apiBaseUrl}/auth/login`, {
    data: {
      username: 'admin',
      password: '123456',
    },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.code).toBe(200);
  return {
    accessToken: payload.data.accessToken as string,
    refreshToken: payload.data.refreshToken as string,
  };
}

async function getOperationToken(request: APIRequestContext, accessToken: string) {
  const response = await request.post(`${apiBaseUrl}/auth/operation-verify`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    data: {
      password: '123456',
    },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.code).toBe(200);
  return payload.data.operationToken as string;
}

async function fetchTablePreview(request: APIRequestContext, accessToken: string) {
  const response = await request.get(`${apiBaseUrl}/system/generator/table-schema`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      datasourceId: 'current',
      tableName,
    },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.code).toBe(200);
  return payload.data as GeneratorTablePreview;
}

function buildI18nTranslations(fields: ModuleField[]) {
  const titleKey = buildTitleKey('business', moduleName);
  const zh: Record<string, string> = {
    [titleKey]: '主机管理',
  };
  const en: Record<string, string> = {
    [titleKey]: 'Host Management',
  };

  for (const field of fields) {
    zh[buildFieldLabelKey('business', moduleName, field.name)] = field.label;
    en[buildFieldLabelKey('business', moduleName, field.name)] = field.labelEn || field.label;
    if (field.placeholder) {
      zh[buildFieldPlaceholderKey('business', moduleName, field.name)] = field.placeholder;
      en[buildFieldPlaceholderKey('business', moduleName, field.name)] = field.placeholderEn || field.placeholder;
    }
    if (field.helpText) {
      zh[buildFieldHelpTextKey('business', moduleName, field.name)] = field.helpText;
      en[buildFieldHelpTextKey('business', moduleName, field.name)] = field.helpTextEn || field.helpText;
    }
    for (const option of field.enumOptions || []) {
      const key = `${buildModuleNamespace('business', moduleName)}.field.${field.name}.option.${option.value}`;
      zh[key] = option.label;
      en[key] = option.labelEn || option.label;
    }
  }

  const actions: Exclude<PageActionKey, 'detail'>[] = ['view', 'create', 'update', 'delete', 'export', 'import'];
  const zhActionText: Record<Exclude<PageActionKey, 'detail'>, string> = {
    view: '查看',
    create: '新增',
    update: '编辑',
    delete: '删除',
    export: '导出',
    import: '导入',
  };
  const enActionText: Record<Exclude<PageActionKey, 'detail'>, string> = {
    view: 'View',
    create: 'Create',
    update: 'Update',
    delete: 'Delete',
    export: 'Export',
    import: 'Import',
  };

  for (const action of actions) {
    zh[buildPermissionTitleKey('business', moduleName, action)] = `${zhActionText[action]}主机`;
    en[buildPermissionTitleKey('business', moduleName, action)] = `${enActionText[action]} Host`;
  }

  zh[buildAuditActionKey('business', moduleName, 'create')] = '新增主机';
  zh[buildAuditActionKey('business', moduleName, 'update')] = '编辑主机';
  zh[buildAuditActionKey('business', moduleName, 'delete')] = '删除主机';
  en[buildAuditActionKey('business', moduleName, 'create')] = 'Create Host';
  en[buildAuditActionKey('business', moduleName, 'update')] = 'Update Host';
  en[buildAuditActionKey('business', moduleName, 'delete')] = 'Delete Host';

  return { zh, en };
}

function buildSchema(preview: GeneratorTablePreview): ModuleSchema {
  const fields = preview.fields;
  const i18n = buildI18nTranslations(fields);
  const schema: ModuleSchema = {
    name: moduleName,
    displayName: '主机管理',
    displayNameEn: 'Host Management',
    description: 'CMDB Host lifecycle smoke test',
    scope: 'business',
    parentMenu: '/business/cmdb',
    templateLevel: 'enterprise',
    pageActionTemplate: 'masterData',
    pageActions: ['view', 'create', 'update', 'delete', 'export', 'import'],
    metadata: {
      boundedContext: 'CMDB',
      owner: 'Pantheon QA',
      summary: '使用平台库 biz_cmdb_host 验证低代码数据库导入闭环',
      sourceMode: 'database',
      sourceDatasourceId: 'current',
      sourceDatasourceName: '当前平台库',
      sourceTable: preview.tableName,
    },
    model: {
      tableName: preview.tableName,
      modelName: inferModelName({
        name: moduleName,
        displayName: '主机管理',
        scope: 'business',
        model: { tableName: preview.tableName, fields },
        menus: [],
        permissions: [],
        i18n: { namespace: '', translations: { zh: {}, en: {} } },
      } as ModuleSchema),
      fields,
    },
    menus: [],
    permissions: [],
    i18n: {
      namespace: buildModuleNamespace('business', moduleName),
      translations: i18n,
    },
    enableExport: true,
    enableImport: true,
    enableAudit: true,
    enableDataScope: false,
  };
  schema.menus = generateDefaultMenus(schema);
  schema.permissions = generateDefaultPermissions(schema);
  return schema;
}

async function purgeModuleIfExists(request: APIRequestContext, accessToken: string, operationToken: string) {
  const response = await request.delete(`${apiBaseUrl}/system/dynamic-modules/${moduleKey}/purge?dropTable=false&purgeSource=true`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Operation-Token': operationToken,
    },
    failOnStatusCode: false,
  });
  if ([200, 404, 500, 403].includes(response.status())) {
    return;
  }
  expect(response.ok()).toBeTruthy();
}

async function getModuleStatus(request: APIRequestContext, accessToken: string) {
  const response = await request.get(`${apiBaseUrl}/system/dynamic-modules/${moduleKey}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    failOnStatusCode: false,
  });
  return {
    status: response.status(),
    payload: await response.json(),
  };
}

async function readFileContains(target: string, fragment: string) {
  const content = await fs.readFile(target, 'utf8');
  return content.includes(fragment);
}

test('cmdb host database-import flow can generate register verify and purge without dropping source table', async ({ page }) => {
  const login = await loginByApi(page.request);
  const operationToken = await getOperationToken(page.request, login.accessToken);

  await purgeModuleIfExists(page.request, login.accessToken, operationToken);

  const preview = await fetchTablePreview(page.request, login.accessToken);
  expect(preview.tableName).toBe(tableName);
  expect(preview.suggestedName).toBe(moduleName);
  expect(preview.suggestedScope).toBe('business');
  expect(preview.fields.length).toBeGreaterThan(8);
  expect(preview.fields.some((field) => field.name === 'hostCode')).toBeTruthy();
  expect(preview.fields.some((field) => field.name === 'hostname')).toBeTruthy();
  expect(preview.fields.some((field) => field.name === 'ipAddress')).toBeTruthy();
  expect(preview.fields.some((field) => field.name === 'environment' && field.type === 'enum')).toBeTruthy();

  const schema = buildSchema(preview);
  const exporter = new ModuleExporter(schema);
  const files = exporter.generateAll();
  expect(files.length).toBe(8);

  const generateResponse = await page.request.post(`${apiBaseUrl}/system/dynamic-modules/generate`, {
    headers: {
      Authorization: `Bearer ${login.accessToken}`,
      'X-Operation-Token': operationToken,
    },
    data: {
      schema,
      files,
      overwrite: false,
    },
  });
  expect(generateResponse.ok()).toBeTruthy();
  const generatePayload = await generateResponse.json();
  expect(generatePayload.code).toBe(200);

  const result = generatePayload.data as GenerateAndRegisterResp;
  expect(result.module.name).toBe(moduleKey);
  expect(result.module.status).toBe(3);
  expect(result.module.tableName).toBe(tableName);
  expect(result.summary.routePath).toBe(routePath);
  expect(result.summary.parentMenuPath).toBe('/business/cmdb');
  expect(result.summary.parentMenuSource).toBe('explicit');
  expect(result.summary.backendModulePath).toBe('backend/modules/business/cmdb/host');
  expect(result.summary.frontendModulePath).toBe('frontend/src/modules/business/cmdb/host');
  expect(result.summary.schemaPath).toBe('schema/generated/business/cmdb/host.json');

  await expect.poll(async () => {
    const status = (await getModuleStatus(page.request, login.accessToken)).payload.data?.status;
    return status === 1 || status === 3;
  }).toBe(true);

  await expect.poll(async () => {
    try {
      await fs.stat(backendModuleDir);
      await fs.stat(frontendModuleDir);
      await fs.stat(schemaFile);
      return true;
    } catch {
      return false;
    }
  }).toBe(true);

  await expect.poll(async () => readFileContains(backendRegistry, 'backend/modules/business/cmdb/host')).toBe(true);
  await expect.poll(async () => readFileContains(backendRegistry, 'InitCmdbHostModule')).toBe(true);
  await expect.poll(async () => readFileContains(frontendRegistry, '../business/cmdb/host')).toBe(true);
  await expect.poll(async () => readFileContains(frontendRegistry, 'CmdbHostModule')).toBe(true);
  await expect.poll(async () => readFileContains(componentRegistry, 'business/cmdb/host/CmdbHostList')).toBe(true);

  const purgeResponse = await page.request.delete(`${apiBaseUrl}/system/dynamic-modules/${moduleKey}/purge?dropTable=false&purgeSource=true`, {
    headers: {
      Authorization: `Bearer ${login.accessToken}`,
      'X-Operation-Token': operationToken,
    },
  });
  expect(purgeResponse.ok()).toBeTruthy();
  const purgePayload = await purgeResponse.json();
  expect(purgePayload.code).toBe(200);

  await expect.poll(async () => {
    const response = await getModuleStatus(page.request, login.accessToken);
    return response.payload.code;
  }).not.toBe(200);
  await expect.poll(async () => {
    const response = await page.request.get(`${apiBaseUrl}/system/dynamic-modules`, {
      headers: {
        Authorization: `Bearer ${login.accessToken}`,
      },
    });
    const payload = await response.json();
    return Array.isArray(payload.data) && payload.data.some((item: { name: string }) => item.name === moduleKey);
  }).toBe(false);

  await expect.poll(async () => {
    try {
      await fs.stat(backendModuleDir);
      return true;
    } catch {
      return false;
    }
  }).toBe(false);
  await expect.poll(async () => {
    try {
      await fs.stat(frontendModuleDir);
      return true;
    } catch {
      return false;
    }
  }).toBe(false);
  await expect.poll(async () => {
    try {
      await fs.stat(schemaFile);
      return true;
    } catch {
      return false;
    }
  }).toBe(false);

  await expect.poll(async () => readFileContains(backendRegistry, 'backend/modules/business/cmdb/host')).toBe(false);
  await expect.poll(async () => readFileContains(frontendRegistry, '../business/cmdb/host')).toBe(false);
  await expect.poll(async () => readFileContains(componentRegistry, 'business/cmdb/host/CmdbHostList')).toBe(false);

  const tableCheck = await page.request.get(`${apiBaseUrl}/system/generator/table-schema`, {
    headers: {
      Authorization: `Bearer ${login.accessToken}`,
    },
    params: {
      datasourceId: 'current',
      tableName,
    },
  });
  expect(tableCheck.ok()).toBeTruthy();
  const tablePayload = await tableCheck.json();
  expect(tablePayload.code).toBe(200);
  expect(tablePayload.data?.tableName).toBe(tableName);
});
