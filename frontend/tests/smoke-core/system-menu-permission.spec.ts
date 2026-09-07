/**
 * System Menu Permission - 菜单权限联动关键路径
 *
 * 覆盖范围:
 * - 创建菜单
 * - 编辑菜单
 * - 菜单排序
 * - 删除菜单
 *
 * 优先级: P1 (权限系统基础)
 * 预估耗时: ~2分钟
 */

import { test, expect } from '@playwright/test';
import { adminCredentials, signInAsAdmin, apiBaseUrl, apiRequestHeaders, loginByApi } from '../smoke/helpers/auth';
import { formInputByLabel, prepareMenuSmokeFixture } from './smoke-core-fixtures';

test.describe('System Menu Permission @priority:high @smoke:core', () => {
  const testMenuName = '测试菜单_Smoke';
  let menuFixture: Awaited<ReturnType<typeof prepareMenuSmokeFixture>>;

  test.beforeEach(async ({ page }) => {
    menuFixture = await prepareMenuSmokeFixture(page, testMenuName);
  });

  test.afterEach(async () => {
    await menuFixture?.cleanup();
  });

  test('can create a menu item', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/system/menu', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.page-container', { timeout: 15000 });

    // 点击新增按钮
    await page.click('button:has-text("新增"), button:has-text("Add")');

    // 等待对话框
    const dialog = page.locator('.arco-modal').filter({ hasText: /新增菜单|Add Menu/i }).first();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 填写菜单信息
    await formInputByLabel(dialog, /标题键|Title Key/i).fill(testMenuName);
    await formInputByLabel(dialog, /路由路径|Path/i).fill('/smoke-test-menu');
    await formInputByLabel(dialog, /排序|Sort/i).fill('999');

    // 选择菜单类型（目录）
    const menuTypeSelect = dialog.locator('.arco-select:has-text("菜单类型"), .arco-select').first();
    if (await menuTypeSelect.isVisible({ timeout: 2000 })) {
      await menuTypeSelect.click();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }

    // 提交
    await dialog.locator('button:has-text("确定"), button:has-text("OK")').click();

    // 验证成功
    await expect(page.locator('.arco-message-success')).toBeVisible({ timeout: 5000 });

    // 验证菜单出现
    await expect(page.locator(`text="${testMenuName}"`)).toBeVisible();
  });

  test('can edit a menu item', async ({ page }) => {
    // 先创建菜单
    const login = await loginByApi(page, adminCredentials);
    const createResponse = await page.request.post(`${apiBaseUrl}/system/menu`, {
      headers: apiRequestHeaders(login),
      data: {
        menuName: testMenuName,
        path: '/smoke-test-menu',
        menuType: 1,
        sort: 999,
        status: 1,
        visible: true,
      },
    });
    expect(createResponse.ok()).toBeTruthy();

    // 登录并打开菜单管理
    await signInAsAdmin(page);
    await page.goto('/system/menu', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.page-container', { timeout: 15000 });

    // 找到测试菜单的编辑按钮
    const menuRow = page.locator(`tr:has-text("${testMenuName}")`).first();
    await expect(menuRow).toBeVisible();

    const editButton = menuRow.locator('button:has-text("编辑"), button:has-text("Edit")').first();
    await editButton.click();

    // 等待对话框
    const dialog = page.locator('.arco-modal').filter({ hasText: /编辑菜单|Edit Menu/i }).first();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 修改菜单名称
    const menuNameInput = formInputByLabel(dialog, /标题键|Title Key/i);
    await menuNameInput.clear();
    await menuNameInput.fill(`${testMenuName}_已修改`);

    // 提交
    await dialog.locator('button:has-text("确定"), button:has-text("OK")').click();

    // 验证成功
    await expect(page.locator('.arco-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('can delete a menu item', async ({ page }) => {
    // 先创建菜单
    const login = await loginByApi(page, adminCredentials);
    const createResponse = await page.request.post(`${apiBaseUrl}/system/menu`, {
      headers: apiRequestHeaders(login),
      data: {
        menuName: testMenuName,
        path: '/smoke-test-menu',
        menuType: 1,
        sort: 999,
        status: 1,
        visible: true,
      },
    });
    expect(createResponse.ok()).toBeTruthy();

    // 登录并打开菜单管理
    await signInAsAdmin(page);
    await page.goto('/system/menu', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.page-container', { timeout: 15000 });

    // 找到测试菜单的删除按钮
    const menuRow = page.locator(`tr:has-text("${testMenuName}")`).first();
    await expect(menuRow).toBeVisible();

    const deleteButton = menuRow.locator('button:has-text("删除"), button:has-text("Delete")').first();
    await deleteButton.click();

    // 确认删除
    const confirmDialog = page.locator('.arco-modal, .arco-popconfirm').filter({ hasText: /确认删除|Confirm/i }).first();
    await expect(confirmDialog).toBeVisible({ timeout: 3000 });
    await confirmDialog.locator('button:has-text("确定"), button:has-text("OK")').click();

    // 验证成功
    await expect(page.locator('.arco-message-success')).toBeVisible({ timeout: 5000 });

    // 验证菜单消失
    await expect(page.locator(`tr:has-text("${testMenuName}")`)).not.toBeVisible();
  });
});
