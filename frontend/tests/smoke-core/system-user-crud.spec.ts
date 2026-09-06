/**
 * System User CRUD - 用户管理关键路径
 *
 * 覆盖范围:
 * - 创建用户
 * - 编辑用户
 * - 删除用户
 * - 批量启用/禁用
 *
 * 优先级: P0 (数据破坏性操作)
 * 预估耗时: ~3分钟
 */

import { test, expect, type Page } from '@playwright/test';
import { signInAsAdmin, apiBaseUrl, authHeaders, loginByApi } from '../smoke/helpers/auth';

async function deleteTestUser(page: Page, accessToken: string, username: string) {
  const listResponse = await page.request.get(`${apiBaseUrl}/system/user/list`, {
    headers: authHeaders(accessToken),
    params: { username, page: 1, pageSize: 10 },
  });

  if (listResponse.ok()) {
    const payload = await listResponse.json();
    const users = Array.isArray(payload.data?.items) ? payload.data.items : [];
    for (const user of users) {
      if (user.username === username) {
        await page.request.delete(`${apiBaseUrl}/system/user/${user.id}`, {
          headers: authHeaders(accessToken),
        });
      }
    }
  }
}

test.describe('System User CRUD @priority:critical @smoke:core', () => {
  const testUsername = 'smoke_test_user';

  test.beforeEach(async ({ page }) => {
    const { accessToken } = await loginByApi(page);
    await deleteTestUser(page, accessToken, testUsername);
  });

  test.afterEach(async ({ page }) => {
    const { accessToken } = await loginByApi(page);
    await deleteTestUser(page, accessToken, testUsername);
  });

  test('can create a new user', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/system/user', { waitUntil: 'domcontentloaded' });

    // 点击新增按钮
    await page.click('button:has-text("新增"), button:has-text("Add")');

    // 等待对话框出现
    const dialog = page.locator('.arco-modal').filter({ hasText: /新增用户|Add User/i }).first();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 填写表单
    await dialog.locator('input[name="username"], input[placeholder*="用户名"]').fill(testUsername);
    await dialog.locator('input[name="realName"], input[placeholder*="姓名"]').fill('测试用户');
    await dialog.locator('input[name="password"], input[type="password"]').first().fill('Test@123456');

    // 选择部门（如果有）
    const deptSelect = dialog.locator('.arco-select:has-text("部门"), .arco-select:has-text("Department")').first();
    if (await deptSelect.isVisible()) {
      await deptSelect.click();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }

    // 提交
    await dialog.locator('button:has-text("确定"), button:has-text("OK"), button:has-text("Submit")').click();

    // 验证成功提示
    await expect(page.locator('.arco-message-success, .arco-notification-success')).toBeVisible({
      timeout: 5000,
    });

    // 验证用户出现在列表中
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text="${testUsername}"`)).toBeVisible();
  });

  test('can edit an existing user', async ({ page }) => {
    // 先创建用户
    const { accessToken } = await loginByApi(page);
    const createResponse = await page.request.post(`${apiBaseUrl}/system/user`, {
      headers: authHeaders(accessToken),
      data: {
        username: testUsername,
        realName: '测试用户',
        password: 'Test@123456',
        status: 1,
      },
    });
    expect(createResponse.ok()).toBeTruthy();

    // 登录并打开用户管理
    await signInAsAdmin(page);
    await page.goto('/system/user', { waitUntil: 'domcontentloaded' });

    // 找到测试用户的编辑按钮
    const userRow = page.locator(`tr:has-text("${testUsername}")`);
    await expect(userRow).toBeVisible();
    await userRow.locator('button:has-text("编辑"), button:has-text("Edit"), button[aria-label*="edit"]').first().click();

    // 等待对话框
    const dialog = page.locator('.arco-modal').filter({ hasText: /编辑用户|Edit User/i }).first();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 修改姓名
    const realNameInput = dialog.locator('input[name="realName"], input[placeholder*="姓名"]');
    await realNameInput.clear();
    await realNameInput.fill('测试用户_已修改');

    // 提交
    await dialog.locator('button:has-text("确定"), button:has-text("OK"), button:has-text("Submit")').click();

    // 验证成功
    await expect(page.locator('.arco-message-success')).toBeVisible({ timeout: 5000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text="测试用户_已修改"')).toBeVisible();
  });

  test('can delete a user', async ({ page }) => {
    // 先创建用户
    const { accessToken } = await loginByApi(page);
    const createResponse = await page.request.post(`${apiBaseUrl}/system/user`, {
      headers: authHeaders(accessToken),
      data: {
        username: testUsername,
        realName: '待删除用户',
        password: 'Test@123456',
        status: 1,
      },
    });
    expect(createResponse.ok()).toBeTruthy();

    // 登录并打开用户管理
    await signInAsAdmin(page);
    await page.goto('/system/user', { waitUntil: 'domcontentloaded' });

    // 找到测试用户的删除按钮
    const userRow = page.locator(`tr:has-text("${testUsername}")`);
    await expect(userRow).toBeVisible();
    await userRow.locator('button:has-text("删除"), button:has-text("Delete"), button[aria-label*="delete"]').first().click();

    // 确认删除
    const confirmDialog = page.locator('.arco-modal, .arco-popconfirm').filter({ hasText: /确认删除|Confirm|Delete/i }).first();
    await expect(confirmDialog).toBeVisible({ timeout: 3000 });
    await confirmDialog.locator('button:has-text("确定"), button:has-text("OK"), button:has-text("Confirm")').click();

    // 验证成功
    await expect(page.locator('.arco-message-success')).toBeVisible({ timeout: 5000 });

    // 验证用户从列表消失
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`tr:has-text("${testUsername}")`)).not.toBeVisible();
  });

  test('can batch toggle user status', async ({ page }) => {
    // 先创建测试用户
    const { accessToken } = await loginByApi(page);
    const createResponse = await page.request.post(`${apiBaseUrl}/system/user`, {
      headers: authHeaders(accessToken),
      data: {
        username: testUsername,
        realName: '测试批量操作',
        password: 'Test@123456',
        status: 1,
      },
    });
    expect(createResponse.ok()).toBeTruthy();

    // 登录并打开用户管理
    await signInAsAdmin(page);
    await page.goto('/system/user', { waitUntil: 'domcontentloaded' });

    // 勾选测试用户
    const userRow = page.locator(`tr:has-text("${testUsername}")`);
    await expect(userRow).toBeVisible();
    const checkbox = userRow.locator('input[type="checkbox"]').first();
    await checkbox.check();

    // 查找批量操作按钮（禁用/启用）
    const batchDisableButton = page.locator('button:has-text("禁用"), button:has-text("Disable")').first();
    if (await batchDisableButton.isVisible()) {
      await batchDisableButton.click();

      // 确认操作
      const confirmDialog = page.locator('.arco-modal, .arco-popconfirm').first();
      if (await confirmDialog.isVisible({ timeout: 2000 })) {
        await confirmDialog.locator('button:has-text("确定"), button:has-text("OK")').click();
      }

      // 验证成功
      await expect(page.locator('.arco-message-success, .arco-notification-success')).toBeVisible({
        timeout: 5000,
      });
    }
  });
});
