import fs from 'node:fs/promises';
import { expect, test, type Locator, type Page, type Route } from '@playwright/test';
import { installOperationToken, signInAsAdmin } from '../../helpers/auth';

type CleanupCase = {
  name: string;
  path: string;
  cleanupButtonName: string;
  settingKey: string;
  listRoute: RegExp;
  cleanupRoute: RegExp;
  listPayload: Record<string, unknown>;
};

const cleanupCases: CleanupCase[] = [
  {
    name: 'login-log',
    path: '/system/login-log',
    cleanupButtonName: '清理日志',
    settingKey: 'audit.login_log_retention_options',
    listRoute: /\/api\/v1\/system\/login-log\/list(?:\?.*)?$/,
    cleanupRoute: /\/api\/v1\/system\/login-log\/cleanup$/,
    listPayload: {
      items: [
        {
          id: 1001,
          username: 'admin',
          ipaddr: '127.0.0.1',
          loginLocation: '本地',
          browser: 'Chrome',
          os: 'Windows',
          status: 1,
          msg: '',
          loginTime: '2026-04-29 09:00:00',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
    },
  },
  {
    name: 'session',
    path: '/system/session',
    cleanupButtonName: '清理历史会话',
    settingKey: 'audit.session_cleanup_retention_options',
    listRoute: /\/api\/v1\/system\/session\/list(?:\?.*)?$/,
    cleanupRoute: /\/api\/v1\/system\/session\/cleanup$/,
    listPayload: {
      items: [
        {
          sessionId: 'smoke-target-session',
          userId: 9001,
          username: 'audit_user',
          nickname: '审计用户',
          lastIp: '127.0.0.2',
          browser: 'Chrome',
          os: 'Windows',
          device: 'Desktop',
          userAgent: 'Mozilla/5.0',
          refreshExpiresAt: '2026-04-30 08:00:00',
          lastRefreshAt: '2026-04-29 08:00:00',
          lastActivityAt: '2026-04-29 08:30:00',
          revokedAt: '',
          createdAt: '2026-04-29 08:00:00',
        },
      ],
      total: 1,
      activeCount: 1,
      revokedCount: 0,
      page: 1,
      pageSize: 10,
    },
  },
  {
    name: 'operation-log',
    path: '/system/operation-log',
    cleanupButtonName: '清理日志',
    settingKey: 'audit.operation_log_retention_options',
    listRoute: /\/api\/v1\/system\/operation-log\/list(?:\?.*)?$/,
    cleanupRoute: /\/api\/v1\/system\/operation-log\/cleanup$/,
    listPayload: {
      items: [
        {
          id: 2001,
          title: 'system.user.create',
          businessType: 1,
          method: 'POST',
          operName: 'admin',
          operUrl: '/api/v1/system/user',
          operIp: '127.0.0.1',
          sourceDomain: 'iam',
          sourcePage: 'user',
          operParam: '{}',
          jsonResult: '{"code":200,"message":"ok"}',
          status: 1,
          failureCategory: '',
          errorMsg: '',
          operTime: '2026-04-29 10:00:00',
          costTime: 18,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
    },
  },
];

async function fulfillJson(route: Route, status: number, body: Record<string, unknown>) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function mockAuditSetting(page: Page, settingKey: string) {
  await page.route(/\/api\/v1\/system\/setting\/group\/audit$/, async (route) => {
    await fulfillJson(route, 200, {
      code: 200,
      data: {
        groupKey: 'audit',
        items: [
          {
            settingKey,
            settingValue: '[1,7,30]',
          },
        ],
      },
    });
  });
}

function cleanupBar(page: Page, cleanupButtonName: string) {
  return page
    .locator('.page-panel')
    .filter({
      has: page.getByRole('button', { name: cleanupButtonName, exact: true }),
    })
    .first();
}

function popupConfirmButton(page: Page) {
  return page
    .locator(
      '.arco-popconfirm:visible, .arco-popover:visible, [role="tooltip"]:visible, [role="dialog"]:visible',
    )
    .last()
    .getByRole('button', { name: '确定', exact: true })
    .last();
}

function cleanupDatePopup(page: Page) {
  return page
    .locator(
      'body .table-batch-action-bar__cleanup-date-popup.arco-picker-container, body .table-batch-action-bar__cleanup-date-popup .arco-picker-container',
    )
    .last();
}

function cleanupTimePopup(page: Page) {
  return page
    .locator(
      '.arco-trigger-popup:visible, .arco-picker-container:visible, .arco-timepicker:visible',
    )
    .filter({ has: page.locator('.arco-timepicker-list:visible') })
    .last();
}

function rangePopup(page: Page) {
  return page.locator('body .arco-picker-range-container').last();
}

function popupDateCell(popup: Locator, day: string) {
  return popup
    .locator('.arco-picker-cell-in-view')
    .filter({ hasText: new RegExp(`^${day}$`) })
    .first();
}

async function selectPopupTime(panel: Locator, hour: string, minute: string) {
  await panel.locator('.arco-timepicker-list').nth(0).getByText(hour, { exact: true }).click();
  await panel.locator('.arco-timepicker-list').nth(1).getByText(minute, { exact: true }).click();
}

async function selectCleanupDateField(
  page: Page,
  field: Locator,
  day: string,
  options?: { screenshotPath?: string },
) {
  await field.click();
  const popup = cleanupDatePopup(page);
  await expect(popup).toBeVisible();
  const panel = popup.locator('.arco-panel-date').first();
  const weekLabels = panel.locator('.arco-picker-week-list-item');
  await expect(weekLabels).toHaveText(['一', '二', '三', '四', '五', '六', '日']);

  const firstDateRow = panel.locator('.arco-picker-body .arco-picker-row').first();
  const firstDateCells = firstDateRow.locator('.arco-picker-cell');
  await expect(firstDateCells).toHaveCount(7);

  for (let index = 0; index < 7; index += 1) {
    const weekBox = await weekLabels.nth(index).boundingBox();
    const dayBox = await firstDateCells.nth(index).boundingBox();
    expect(weekBox).not.toBeNull();
    expect(dayBox).not.toBeNull();

    const weekCenter = (weekBox?.x || 0) + (weekBox?.width || 0) / 2;
    const dayCenter = (dayBox?.x || 0) + (dayBox?.width || 0) / 2;
    expect(Math.abs(weekCenter - dayCenter)).toBeLessThanOrEqual(4);
  }

  if (options?.screenshotPath) {
    await panel.screenshot({
      path: options.screenshotPath,
    });
  }

  await popupDateCell(panel, day).click();
  await expect(field).toHaveValue(new RegExp(`^\\d{4}-\\d{2}-${day}$`));
}

async function selectCleanupTimeField(page: Page, field: Locator, hour: string, minute: string) {
  await field.click();
  const timeLists = page.locator('.arco-timepicker-list:visible');
  await expect(timeLists).toHaveCount(2);
  await expect(timeLists.first()).toBeVisible();

  const popup = cleanupTimePopup(page);
  await expect(popup).toBeVisible();
  await selectPopupTime(popup, hour, minute);
  const confirmButton = page.getByRole('button', { name: '确定', exact: true }).last();
  await expect(confirmButton).toBeEnabled();
  await confirmButton.click();
  await expect(field).toHaveValue(new RegExp(`^${hour}:${minute}$`));
}

test.describe('cleanup range governance smoke', () => {
  test.describe.configure({ timeout: 120000 });

  for (const cleanupCase of cleanupCases) {
    test(`${cleanupCase.name} cleanup range submits split date/time selections and keeps calendar centered`, async ({
      page,
    }, testInfo) => {
      const accessToken = await signInAsAdmin(page);
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      await installOperationToken(page, accessToken);

      await mockAuditSetting(page, cleanupCase.settingKey);
      await page.route(cleanupCase.listRoute, async (route) => {
        await fulfillJson(route, 200, {
          code: 200,
          data: cleanupCase.listPayload,
        });
      });

      let capturedCleanupPayload: Record<string, unknown> | null = null;
      await page.route(cleanupCase.cleanupRoute, async (route) => {
        capturedCleanupPayload = route.request().postDataJSON() as Record<string, unknown>;
        await fulfillJson(route, 200, {
          code: 200,
          data: { clearedCount: 1 },
        });
      });

      await page.goto(cleanupCase.path, { waitUntil: 'networkidle' });

      const bar = cleanupBar(page, cleanupCase.cleanupButtonName);
      await expect(bar).toBeVisible();

      const modeSelect = bar.locator('.arco-select').first();
      await modeSelect.click();
      await page.getByRole('option', { name: '按时间范围', exact: true }).click();

      const startDateInput = bar.getByLabel('开始日期').first();
      const startTimeInput = bar.getByLabel('开始时间').first();
      const endDateInput = bar.getByLabel('结束日期').first();
      const endTimeInput = bar.getByLabel('结束时间').first();

      const cleanupButton = bar
        .locator('.table-batch-action-bar__meta')
        .getByRole('button', { name: cleanupCase.cleanupButtonName, exact: true })
        .first();

      await selectCleanupDateField(
        page,
        startDateInput,
        '13',
        cleanupCase.name === 'login-log'
          ? { screenshotPath: testInfo.outputPath('login-log-cleanup-date-popup.png') }
          : undefined,
      );
      await selectCleanupTimeField(page, startTimeInput, '18', '26');
      await selectCleanupDateField(page, endDateInput, '14');
      await selectCleanupTimeField(page, endTimeInput, '09', '45');

      await expect(startDateInput).toHaveValue(/\d{4}-\d{2}-13/);
      await expect(startTimeInput).toHaveValue('18:26');
      await expect(endDateInput).toHaveValue(/\d{4}-\d{2}-14/);
      await expect(endTimeInput).toHaveValue('09:45');

      if (cleanupCase.name === 'login-log') {
        await bar.screenshot({
          path: testInfo.outputPath('login-log-cleanup-filled-bar.png'),
        });
      }

      await cleanupButton.click();
      await popupConfirmButton(page).click();

      await expect.poll(() => capturedCleanupPayload).not.toBeNull();

      expect(capturedCleanupPayload?.retentionDays).toBeUndefined();
      expect(String(capturedCleanupPayload?.startedAt || '')).toMatch(/\d{4}-\d{2}-13T18:26/);
      expect(String(capturedCleanupPayload?.endedAt || '')).toMatch(/\d{4}-\d{2}-14T09:45/);
      await expect(page.locator('.arco-message')).toContainText(/已清理|清理成功/);
    });
  }

  test('login-log filter time range renders Arco shortcuts and horizontal panels', async ({
    page,
  }, testInfo) => {
    const loginLogCase = cleanupCases[0];
    const accessToken = await signInAsAdmin(page);
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await installOperationToken(page, accessToken);

    await mockAuditSetting(page, loginLogCase.settingKey);
    await page.route(loginLogCase.listRoute, async (route) => {
      await fulfillJson(route, 200, {
        code: 200,
        data: loginLogCase.listPayload,
      });
    });

    await page.goto(loginLogCase.path, { waitUntil: 'networkidle' });

    const filterGrid = page.locator('.auth-login-log-page__filter-grid');
    await expect(filterGrid).toBeVisible();

    const rangeTrigger = filterGrid.locator('.auth-login-log-page__time-range-trigger');
    await expect(rangeTrigger).toBeVisible();
    await expect(rangeTrigger).toContainText('最近 24 小时');
    await rangeTrigger.click();

    const popup = rangePopup(page);
    await expect(popup).toBeVisible();

    const popupBox = await popup.boundingBox();
    expect(popupBox).not.toBeNull();
    expect(popupBox?.width ?? 0).toBeGreaterThanOrEqual(580);
    expect(popupBox?.width ?? 0).toBeLessThanOrEqual(640);

    const shell = popup.locator('.auth-login-log-page__time-range-shell');
    await expect(shell).toBeVisible();

    const shortcutRows = shell.locator('.auth-login-log-page__time-range-shortcut-row');
    await expect(shortcutRows).toHaveCount(2);
    await expect(
      shortcutRows.first().locator('.auth-login-log-page__time-range-shortcut'),
    ).toHaveCount(9);
    await expect(
      shortcutRows.nth(1).locator('.auth-login-log-page__time-range-shortcut'),
    ).toHaveCount(2);
    await expect(shell.getByRole('button', { name: '今天', exact: true })).toBeVisible();
    await expect(shell.getByRole('button', { name: '昨天', exact: true })).toBeVisible();

    const summary = shell.locator('.auth-login-log-page__time-range-summary');
    await expect(summary).toBeVisible();
    await expect(summary).toContainText('开始时间');
    await expect(summary).toContainText('结束时间');
    await expect(summary).toContainText('至');

    const summaryBox = await summary.boundingBox();
    expect(summaryBox).not.toBeNull();

    const rangePopupWrapper = popup.locator('.arco-picker-range-wrapper');
    await expect(rangePopupWrapper).toHaveCSS('flex-wrap', 'nowrap');

    const weekLabels = popup
      .locator('.arco-panel-date')
      .first()
      .locator('.arco-picker-week-list-item');
    await expect(weekLabels).toHaveText(['一', '二', '三', '四', '五', '六', '日']);

    const weekList = popup.locator('.arco-panel-date').first().locator('.arco-picker-week-list');
    await expect(weekList).toHaveCSS('display', 'grid');

    const firstDateRow = popup
      .locator('.arco-panel-date')
      .first()
      .locator('.arco-picker-body .arco-picker-row')
      .first();
    await expect(firstDateRow).toHaveCSS('display', 'grid');

    const firstDateCells = firstDateRow.locator('.arco-picker-cell');
    await expect(firstDateCells).toHaveCount(7);
    for (let index = 0; index < 7; index += 1) {
      const weekBox = await weekLabels.nth(index).boundingBox();
      const dayBox = await firstDateCells.nth(index).boundingBox();
      expect(weekBox).not.toBeNull();
      expect(dayBox).not.toBeNull();

      const weekCenter = (weekBox?.x || 0) + (weekBox?.width || 0) / 2;
      const dayCenter = (dayBox?.x || 0) + (dayBox?.width || 0) / 2;
      expect(Math.abs(weekCenter - dayCenter)).toBeLessThanOrEqual(4);
      expect(Math.abs((weekBox?.width || 0) - (dayBox?.width || 0))).toBeLessThanOrEqual(4);
    }

    const rangePanels = popup.locator('.arco-panel-date');
    await expect(rangePanels).toHaveCount(2);
    const leftPanelBox = await rangePanels.nth(0).boundingBox();
    const rightPanelBox = await rangePanels.nth(1).boundingBox();
    expect(leftPanelBox).not.toBeNull();
    expect(rightPanelBox).not.toBeNull();
    expect(Math.abs((leftPanelBox?.y || 0) - (rightPanelBox?.y || 0))).toBeLessThanOrEqual(4);
    expect((rightPanelBox?.x || 0) - (leftPanelBox?.x || 0)).toBeGreaterThan(20);

    expect(
      (leftPanelBox?.y || 0) - ((summaryBox?.y || 0) + (summaryBox?.height || 0)),
    ).toBeGreaterThanOrEqual(0);

    await expect(popup.locator('.arco-picker-btn-confirm')).toBeVisible();
    await expect(shell.getByRole('button', { name: '取消', exact: true })).toBeVisible();
    await popup.screenshot({
      path: testInfo.outputPath('login-log-time-range-picker.png'),
    });

    await expect(popup.locator('.arco-picker-btn-select-time')).toBeVisible();
    await popup.locator('.arco-picker-btn-select-time').click();

    const timePanels = popup.locator('.arco-panel-date-timepicker');
    await expect(timePanels).toHaveCount(2);
    const leftTimeBox = await timePanels.nth(0).boundingBox();
    const rightTimeBox = await timePanels.nth(1).boundingBox();
    expect(leftTimeBox).not.toBeNull();
    expect(rightTimeBox).not.toBeNull();
    expect(Math.abs((leftTimeBox?.y || 0) - (rightTimeBox?.y || 0))).toBeLessThanOrEqual(4);
    expect((rightTimeBox?.x || 0) - (leftTimeBox?.x || 0)).toBeGreaterThan(20);

    await shell.getByRole('button', { name: '今天', exact: true }).click();
    await expect(rangeTrigger).toContainText('今天');
    await expect(popup).toBeHidden();
  });

  test('selected login-log rows export as csv without calling backend export endpoint', async ({
    page,
  }, testInfo) => {
    const accessToken = await signInAsAdmin(page);
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await installOperationToken(page, accessToken);

    await mockAuditSetting(page, 'audit.login_log_retention_options');
    await page.route(/\/api\/v1\/system\/login-log\/list(?:\?.*)?$/, async (route) => {
      await fulfillJson(route, 200, {
        code: 200,
        data: {
          items: [
            {
              id: 1001,
              username: 'export_admin',
              ipaddr: '127.0.0.1',
              loginLocation: '本地',
              browser: 'Chrome',
              os: 'Windows',
              status: 1,
              msg: '',
              loginTime: '2026-04-29 09:00:00',
            },
            {
              id: 1002,
              username: 'export_guest',
              ipaddr: '127.0.0.2',
              loginLocation: '异地',
              browser: 'Firefox',
              os: 'Linux',
              status: 0,
              msg: 'auth.login.failed',
              loginTime: '2026-04-29 10:00:00',
            },
          ],
          total: 2,
          page: 1,
          pageSize: 10,
        },
      });
    });

    let exportRouteHit = false;
    await page.route(/\/api\/v1\/system\/login-log\/export$/, async (route) => {
      exportRouteHit = true;
      await fulfillJson(route, 500, { code: 500, message: 'should.not.call' });
    });

    await page.goto('/system/login-log', { waitUntil: 'networkidle' });
    const firstRow = page.locator('.arco-table tbody tr').first();
    await expect(firstRow).toBeVisible();
    await firstRow.locator('label.arco-checkbox').click();

    const downloadPromise = page.waitForEvent('download');
    await cleanupBar(page, '清理日志').getByRole('button', { name: '导出', exact: true }).click();
    const download = await downloadPromise;
    expect(exportRouteHit).toBe(false);
    expect(download.suggestedFilename()).toBe('system-login-log-export.csv');

    const filePath = testInfo.outputPath('selected-login-log-export.csv');
    await download.saveAs(filePath);
    const csv = await fs.readFile(filePath, 'utf8');
    expect(csv).toContain('username,ipaddr,loginLocation,browser,os,status,msg,loginTime');
    expect(csv).toContain('export_admin,127.0.0.1');
    expect(csv).not.toContain('export_guest,127.0.0.2');
  });

  test('selected operation-log rows export as csv without calling backend export endpoint', async ({
    page,
  }, testInfo) => {
    const accessToken = await signInAsAdmin(page);
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await installOperationToken(page, accessToken);

    await mockAuditSetting(page, 'audit.operation_log_retention_options');
    await page.route(/\/api\/v1\/system\/operation-log\/list(?:\?.*)?$/, async (route) => {
      await fulfillJson(route, 200, {
        code: 200,
        data: {
          items: [
            {
              id: 2001,
              title: 'system.user.create',
              businessType: 1,
              method: 'POST',
              operName: 'export_admin',
              operUrl: '/api/v1/system/user',
              operIp: '127.0.0.1',
              sourceDomain: 'iam',
              sourcePage: 'user',
              operParam: '{}',
              jsonResult: '{"code":200,"message":"ok"}',
              status: 1,
              failureCategory: '',
              errorMsg: '',
              operTime: '2026-04-29 10:00:00',
              costTime: 18,
            },
            {
              id: 2002,
              title: 'system.setting.update',
              businessType: 2,
              method: 'PUT',
              operName: 'export_guest',
              operUrl: '/api/v1/system/setting/group/basic',
              operIp: '127.0.0.2',
              sourceDomain: 'config',
              sourcePage: 'setting',
              operParam: '{}',
              jsonResult: '{"code":400,"message":"request.failed"}',
              status: 2,
              failureCategory: 'validation',
              errorMsg: 'request.failed',
              operTime: '2026-04-29 11:00:00',
              costTime: 27,
            },
          ],
          total: 2,
          page: 1,
          pageSize: 10,
        },
      });
    });

    let exportRouteHit = false;
    await page.route(/\/api\/v1\/system\/operation-log\/export$/, async (route) => {
      exportRouteHit = true;
      await fulfillJson(route, 500, { code: 500, message: 'should.not.call' });
    });

    await page.goto('/system/operation-log', { waitUntil: 'networkidle' });
    const firstRow = page.locator('.arco-table tbody tr').first();
    await expect(firstRow).toBeVisible();
    await firstRow.locator('label.arco-checkbox').click();

    const downloadPromise = page.waitForEvent('download');
    await cleanupBar(page, '清理日志').getByRole('button', { name: '导出', exact: true }).click();
    const download = await downloadPromise;
    expect(exportRouteHit).toBe(false);
    expect(download.suggestedFilename()).toBe('system-operation-log-export.csv');

    const filePath = testInfo.outputPath('selected-operation-log-export.csv');
    await download.saveAs(filePath);
    const csv = await fs.readFile(filePath, 'utf8');
    expect(csv).toContain(
      'requestId,title,businessType,sourceDomain,sourcePage,method,operName,operUrl,operIp,status,failureCategory,errorMsg,operTime,costTime',
    );
    expect(csv).toContain('system.user.create');
    expect(csv).toContain('export_admin');
    expect(csv).not.toContain('system.setting.update');
    expect(csv).not.toContain('export_guest');
  });
});
