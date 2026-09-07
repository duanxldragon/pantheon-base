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

import { test, expect } from '@playwright/test';
import { adminCredentials, signInAsAdmin, apiBaseUrl, apiRequestHeaders, loginByApi } from '../smoke/helpers/auth';
import { formInputByLabel, prepareUserSmokeFixture } from './smoke-core-fixtures';

test.describe('System User CRUD @priority:critical @smoke:core', () => {
  const testUsername = 'smoke_test_user';
  let userFixture: Awaited<ReturnType<typeof prepareUserSmokeFixture>>;

  test.beforeEach(async ({ page }) => {
    userFixture = await prepareUserSmokeFixture(page, testUsername);
  });

  test.afterEach(async () => {
    await userFixture?.cleanup();
  });

  test('can create a new user', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/system/user', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.page-container', { timeout: 15000 });

    // 点击新增按钮
    await page.click('button:has-text("新增"), button:has-text("Add")');

    // 等待对话框出现
    const dialog = page.locator('.arco-modal').filter({ hasText: /新增用户|Add User/i }).first();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 填写表单
    await formInputByLabel(dialog, /用户名|Username/i).fill(testUsername);
    await formInputByLabel(dialog, /昵称|Nickname/i).fill('测试用户');
    await formInputByLabel(dialog, /密码|Password/i).fill('Test@123456');

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
    await expect(page.locator(`text="${testUsername}"`)).toBeVisible();
  });

  test('can edit an existing user', async ({ page }) => {
    // 先创建用户
    const login = await loginByApi(page, adminCredentials);
    const createResponse = await page.request.post(`${apiBaseUrl}/system/user`, {
      headers: apiRequestHeaders(login),
      data: {
        username: testUsername,
        nickname: '测试用户',
        password: 'Test@123456',
        status: 1,
        roleIds: [],
      },
    });
    expect(createResponse.ok()).toBeTruthy();

    // 登录并打开用户管理
    await signInAsAdmin(page);
    await page.goto('/system/user', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.page-container', { timeout: 15000 });

    // 找到测试用户的编辑按钮
    const userRow = page.locator(`tr:has-text("${testUsername}")`);
    await expect(userRow).toBeVisible();
    await userRow.locator('button:has-text("编辑"), button:has-text("Edit"), button[aria-label*="edit"]').first().click();

    // 等待对话框
    const dialog = page.locator('.arco-modal').filter({ hasText: /编辑用户|Edit User/i }).first();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 修改姓名
    const nicknameInput = formInputByLabel(dialog, /昵称|Nickname/i);
    await nicknameInput.clear();
    await nicknameInput.fill('测试用户_已修改');

    // 提交
    await dialog.locator('button:has-text("确定"), button:has-text("OK"), button:has-text("Submit")').click();

    // 验证成功
    await expect(page.locator('.arco-message-success')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text="测试用户_已修改"')).toBeVisible();
  });

  test('can delete a user', async ({ page }) => {
    // 先创建用户
    const login = await loginByApi(page, adminCredentials);
    const createResponse = await page.request.post(`${apiBaseUrl}/system/user`, {
      headers: apiRequestHeaders(login),
      data: {
        username: testUsername,
        nickname: '待删除用户',
        password: 'Test@123456',
        status: 1,
        roleIds: [],
      },
    });
    expect(createResponse.ok()).toBeTruthy();

    // 登录并打开用户管理
    await signInAsAdmin(page);
    await page.goto('/system/user', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.page-container', { timeout: 15000 });

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
    await expect(page.locator(`tr:has-text("${testUsername}")`)).not.toBeVisible();
  });

  test('can batch toggle user status', async ({ page }) => {
    // 先创建测试用户
    const login = await loginByApi(page, adminCredentials);
    const createResponse = await page.request.post(`${apiBaseUrl}/system/user`, {
      headers: apiRequestHeaders(login),
      data: {
        username: testUsername,
        nickname: '测试批量操作',
        password: 'Test@123456',
        status: 1,
        roleIds: [],
      },
    });
    expect(createResponse.ok()).toBeTruthy();

    // 登录并打开用户管理
    await signInAsAdmin(page);
    await page.goto('/system/user', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.page-container', { timeout: 15000 });

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
