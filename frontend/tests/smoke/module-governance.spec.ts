import { expect, test, type Page, type Route } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:8080/api/v1';

async function signInAsAdmin(page: Page) {
  const response = await page.request.post(`${apiBaseUrl}/auth/login`, {
    data: {
      username: 'admin',
      password: '123456',
    },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.code).toBe(200);

  await page.addInitScript(
    ({ accessToken, refreshToken, user }) => {
      localStorage.setItem('pantheon_access_token', accessToken);
      localStorage.setItem('pantheon_refresh_token', refreshToken);
      localStorage.setItem('pantheon_lang', 'zh-CN');
      localStorage.setItem('pantheon_lang_explicit', '1');
      localStorage.setItem('pantheon-auth-storage', JSON.stringify({
        state: {
          token: accessToken,
          refreshToken,
          userInfo: user,
        },
        version: 0,
      }));
    },
    {
      accessToken: payload.data.accessToken,
      refreshToken: payload.data.refreshToken,
      user: payload.data.user,
    },
  );
}

async function fulfillJson(route: Route, body: Record<string, unknown>) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function installOperationToken(page: Page, accessToken: string) {
  const response = await page.request.post(`${apiBaseUrl}/auth/operation-verify`, {
    headers: authHeaders(accessToken),
    data: { password: '123456' },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.code).toBe(200);
  await page.evaluate((value) => {
    sessionStorage.setItem('pantheon_op_token', value);
  }, payload.data.operationToken as string);
}

function formItem(page: Page, label: string) {
  return page.locator('.arco-form-item').filter({ has: page.getByText(label, { exact: true }) }).first();
}

async function openFormSelect(page: Page, label: string) {
  await formItem(page, label).getByRole('combobox').click();
}

async function chooseOption(page: Page, name: string | RegExp) {
  await page.locator('[role="listbox"]').last().getByRole('option', { name }).click();
}

async function completeSecondaryVerify(page: Page, password = '123456') {
  const dialog = page.getByRole('dialog', { name: '敏感操作验证' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox', { name: '密码' }).fill(password);
  await dialog.getByRole('button', { name: '确定', exact: true }).click();
}

async function completeSecondaryVerifyIfVisible(page: Page, password = '123456') {
  const dialog = page.getByRole('dialog', { name: '敏感操作验证' });
  try {
    await dialog.waitFor({ state: 'visible', timeout: 1500 });
  } catch {
    return;
  }
  await dialog.getByRole('textbox', { name: '密码' }).fill(password);
  await dialog.getByRole('button', { name: '确定', exact: true }).click();
}

test.describe('module governance smoke', () => {
  test('module manager can re-register an uninstalled managed module', async ({ page }) => {
    await signInAsAdmin(page);

    let listState = 'uninstalled';
    let registerCalled = false;

    await page.route(/\/api\/v1\/system\/dynamic-modules$/, async (route) => {
      if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON() as { name?: string };
        expect(payload.name).toBe('business.asset');
        registerCalled = true;
        listState = 'pending';
        await fulfillJson(route, {
          code: 200,
          data: {
            registered: true,
            message: 'module.register.success',
            module: {
              id: 4101,
              name: 'business.asset',
              displayName: '资产管理',
              scope: 'business',
              source: 'generated',
              tableName: 'biz_asset',
              status: 3,
              installedAt: '2026-04-29T12:00:00+08:00',
              builtIn: false,
            },
          },
        });
        return;
      }
      const status = listState === 'uninstalled' ? 2 : 3;
      await fulfillJson(route, {
        code: 200,
        data: [
          {
            id: 4101,
            name: 'business.asset',
            displayName: '资产管理',
            scope: 'business',
            source: 'generated',
            owner: '平台研发组',
            boundedContext: 'CMDB',
            summary: '资产治理模块',
            sourceTable: 'biz_asset',
            tableName: 'biz_asset',
            status,
            installedAt: '2026-04-29T12:00:00+08:00',
            builtIn: false,
          },
        ],
      });
    });

    await page.goto('/system/modules', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: '模块注册表' })).toBeVisible();

    const targetRow = page.getByRole('row', { name: /business\.asset/ }).first();
    await expect(targetRow).toBeVisible();
    await expect(targetRow.getByText('已卸载', { exact: true })).toBeVisible();

    await targetRow.getByRole('button', { name: '重新接入', exact: true }).click();
    await completeSecondaryVerify(page);

    await expect.poll(() => registerCalled).toBeTruthy();
    await expect(page.locator('.arco-message').getByText('模块已重新接入，等待激活', { exact: true }).last()).toBeVisible();
    await expect(targetRow.getByText('待激活', { exact: true })).toBeVisible();
  });

  test('generator requires overwrite confirmation before replacing an existing module', async ({ page }) => {
    const response = await page.request.post(`${apiBaseUrl}/auth/login`, {
      data: {
        username: 'admin',
        password: '123456',
      },
    });
    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    expect(payload.code).toBe(200);
    const accessToken = payload.data.accessToken as string;

    await page.addInitScript(
      ({ token, refreshToken, user }) => {
        localStorage.setItem('pantheon_access_token', token);
        localStorage.setItem('pantheon_refresh_token', refreshToken);
        localStorage.setItem('pantheon_lang', 'zh-CN');
        localStorage.setItem('pantheon_lang_explicit', '1');
        localStorage.setItem('pantheon-auth-storage', JSON.stringify({
          state: {
            token,
            refreshToken,
            userInfo: user,
          },
          version: 0,
        }));
      },
      {
        token: accessToken,
        refreshToken: payload.data.refreshToken,
        user: payload.data.user,
      },
    );

    let submitCount = 0;
    await page.route(/\/api\/v1\/system\/generator\/tables(?:\?.*)?$/, async (route) => {
      await fulfillJson(route, {
        code: 200,
        data: [
          {
            tableName: 'biz_vendor',
            comment: '供应商表',
            engine: 'InnoDB',
            rows: 12,
          },
        ],
      });
    });

    await page.route(/\/api\/v1\/system\/generator\/table-schema(?:\?.*)?$/, async (route) => {
      await fulfillJson(route, {
        code: 200,
        data: {
          tableName: 'biz_vendor',
          tableComment: '供应商表',
          suggestedName: 'cmdb/vendor',
          suggestedScope: 'business',
          suggestedTitle: '供应商管理',
          fields: [
            {
              name: 'vendorName',
              type: 'string',
              label: '供应商名称',
              labelEn: 'Vendor Name',
              required: true,
              searchable: true,
              sortable: true,
              visibleInList: true,
              visibleInForm: true,
              placeholder: '请输入供应商名称',
              placeholderEn: 'Please enter vendor name',
            },
          ],
        },
      });
    });

    await page.route(/\/api\/v1\/system\/dynamic-modules\/generate$/, async (route) => {
      submitCount += 1;
      const payload = route.request().postDataJSON() as { overwrite?: boolean; schema?: { metadata?: { sourceMode?: string; sourceTable?: string } } };
      expect(payload.schema?.metadata?.sourceMode).toBe('database');
      expect(payload.schema?.metadata?.sourceTable).toBe('biz_vendor');
      if (submitCount === 1) {
        expect(payload.overwrite ?? false).toBeFalsy();
        await fulfillJson(route, {
          code: 400,
          message: 'module.generate.file_exists',
        });
        return;
      }
      expect(payload.overwrite).toBeTruthy();
      await fulfillJson(route, {
        code: 200,
        data: {
          module: {
            id: 5101,
            name: 'business.cmdb.vendor',
            displayName: '供应商管理',
            scope: 'business',
            tableName: 'biz_vendor',
            status: 3,
            installedAt: '2026-04-29T12:30:00+08:00',
          },
          summary: {
            moduleKey: 'business.cmdb.vendor',
            routePath: '/business/cmdb/vendor',
            routeName: 'business-cmdb-vendor',
            componentKey: 'business/cmdb/vendor/CmdbVendorList',
            permissionPrefix: 'business:cmdb:vendor',
            parentMenuPath: '/business/cmdb',
            parentMenuSource: 'inferred',
            parentMenuExists: true,
            backendModulePath: 'backend/modules/business/cmdb/vendor',
            frontendModulePath: 'frontend/src/modules/business/cmdb/vendor',
            schemaPath: 'schema/generated/business/cmdb/vendor.json',
            requiresRestart: true,
            requiresFrontendBuild: true,
            verifications: [],
          },
          writtenFiles: [],
          requiresRestart: true,
          requiresFrontendBuild: true,
          message: 'module.generate.success',
        },
      });
    });

    await page.goto('/system/generator', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: '模块生成向导' })).toBeVisible();
    await installOperationToken(page, accessToken);

    await openFormSelect(page, '建模来源');
    await chooseOption(page, '从数据库表导入');
    await openFormSelect(page, '来源数据表');
    await chooseOption(page, /biz_vendor/);
    await formItem(page, '模块名').locator('input').first().fill('cmdb/vendor');
    await formItem(page, '显示名').locator('input').first().fill('供应商管理');
    await page.getByRole('button', { name: '下一步', exact: true }).click();

    await expect(page.getByText('供应商名称', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '下一步', exact: true }).click();
    await page.getByRole('button', { name: '生成代码', exact: true }).click();
    const generateButton = page.getByRole('button', { name: '一键生成并注册', exact: true });
    await expect(generateButton).toBeEnabled();
    await generateButton.click();
    await completeSecondaryVerifyIfVisible(page);
    await expect.poll(() => submitCount).toBe(1);

    const confirmDialog = page.getByRole('dialog').filter({ has: page.getByText('检测到同名模块', { exact: true }) });
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole('button', { name: '确定', exact: true }).click();

    await expect.poll(() => submitCount).toBe(2);
    await expect(page.locator('.arco-message').getByText('模块源码已写入，等待激活', { exact: true }).last()).toBeVisible();
    await expect(page.getByText('生成结果', { exact: true })).toBeVisible();
  });

  test('generator validates system scope module name before submit and shows a single error hint', async ({ page }) => {
    await signInAsAdmin(page);

    let submitCount = 0;

    await page.route(/\/api\/v1\/system\/generator\/datasources$/, async (route) => {
      await fulfillJson(route, {
        code: 200,
        data: [
          {
            id: 'current',
            name: '当前平台库',
            driver: 'mysql',
            databaseName: 'pantheon',
            status: 1,
            isCurrent: true,
          },
        ],
      });
    });

    await page.route(/\/api\/v1\/system\/dynamic-modules\/generate$/, async (route) => {
      submitCount += 1;
      await fulfillJson(route, {
        code: 400,
        message: 'module.generate.invalid_name',
      });
    });

    await page.goto('/system/generator', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: '模块生成向导' })).toBeVisible();

    await formItem(page, '模块名').locator('input').first().fill('config/audit');
    await formItem(page, '显示名').locator('input').first().fill('审计配置');
    await openFormSelect(page, '模块层级');
    await chooseOption(page, '系统域 system/*');
    await page.getByRole('button', { name: '下一步', exact: true }).click();

    await expect.poll(() => submitCount).toBe(0);
    await expect(formItem(page, '模块名').getByText('模块名格式不正确', { exact: true })).toBeVisible();
    await expect(page.locator('.arco-message').getByText('模块名格式不正确', { exact: true })).toHaveCount(0);
  });

  test('generator workbench entry follows business toggle and relation table role', async ({ page }) => {
    await signInAsAdmin(page);

    await page.route(/\/api\/v1\/system\/generator\/datasources$/, async (route) => {
      await fulfillJson(route, {
        code: 200,
        data: [
          {
            id: 'current',
            name: '当前平台库',
            driver: 'mysql',
            databaseName: 'pantheon',
            status: 1,
            isCurrent: true,
          },
        ],
      });
    });

    await page.goto('/system/generator', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: '模块生成向导' })).toBeVisible();

    await formItem(page, '模块名').locator('input').first().fill('cmdb/workbench_probe');
    await formItem(page, '显示名').locator('input').first().fill('工作台探针');
    await page.getByRole('button', { name: '下一步', exact: true }).click();
    await page.getByRole('button', { name: '名称', exact: true }).click();
    await page.getByRole('button', { name: '状态', exact: true }).click();
    await page.getByRole('button', { name: '下一步', exact: true }).click();
    await expect(page.getByText('工作台入口已接入', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: '上一步', exact: true }).click();
    await page.getByRole('button', { name: '上一步', exact: true }).click();
    await openFormSelect(page, '平台工作台入口');
    await chooseOption(page, '禁用');
    await page.getByRole('button', { name: '下一步', exact: true }).click();
    await page.getByRole('button', { name: '下一步', exact: true }).click();
    await expect(page.getByText('工作台入口未接入', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: '上一步', exact: true }).click();
    await page.getByRole('button', { name: '上一步', exact: true }).click();
    await openFormSelect(page, '平台工作台入口');
    await chooseOption(page, '启用');
    await openFormSelect(page, '表角色');
    await chooseOption(page, '关系表');
    await expect(formItem(page, '平台工作台入口').locator('.arco-select').first()).toHaveClass(/arco-select-disabled/);
    await page.getByRole('button', { name: '下一步', exact: true }).click();
    await page.getByRole('button', { name: '下一步', exact: true }).click();
    await expect(page.getByText('关系表', { exact: true })).toBeVisible();
    await expect(page.getByText('工作台入口未接入', { exact: true })).toBeVisible();
  });
});
