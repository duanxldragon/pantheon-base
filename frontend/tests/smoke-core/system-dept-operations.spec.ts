/**
 * System Department Operations - 部门树操作关键路径
 *
 * 覆盖范围:
 * - 添加根部门
 * - 添加子部门
 * - 编辑部门
 * - 删除部门
 *
 * 优先级: P1 (树形结构操作)
 * 预估耗时: ~2分钟
 */

import { test, expect } from '@playwright/test';
import { adminCredentials, signInAsAdmin, apiBaseUrl, apiRequestHeaders, loginByApi } from '../smoke/helpers/auth';
import { formInputByLabel, prepareDeptSmokeFixture } from './smoke-core-fixtures';

test.describe('System Department Operations @priority:high @smoke:core', () => {
  const testDeptName = '测试部门_Smoke';
  let deptFixture: Awaited<ReturnType<typeof prepareDeptSmokeFixture>>;

  test.beforeEach(async ({ page }) => {
    deptFixture = await prepareDeptSmokeFixture(page, testDeptName);
  });

  test.afterEach(async () => {
    await deptFixture?.cleanup();
  });

  test('can create a root department', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/system/dept', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.page-container', { timeout: 15000 });

    // 点击新增按钮
    await page.click('button:has-text("新增"), button:has-text("Add")');

    // 等待对话框
    const dialog = page.locator('.arco-modal').filter({ hasText: /新增部门|Add Department/i }).first();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 填写部门信息
    await formInputByLabel(dialog, /部门名称|Department Name/i).fill(testDeptName);
    await formInputByLabel(dialog, /排序|Sort/i).fill('999');

    // 提交
    await dialog.locator('button:has-text("确定"), button:has-text("OK")').click();

    // 验证成功
    await expect(page.locator('.arco-message-success')).toBeVisible({ timeout: 5000 });

    // 验证部门出现在树中
    await expect(page.locator(`text="${testDeptName}"`)).toBeVisible();
  });

  test('can edit a department', async ({ page }) => {
    // 先创建部门
    const login = await loginByApi(page, adminCredentials);
    const createResponse = await page.request.post(`${apiBaseUrl}/system/dept`, {
      headers: apiRequestHeaders(login),
      data: {
        deptName: testDeptName,
        sort: 999,
        status: 1,
      },
    });
    expect(createResponse.ok()).toBeTruthy();

    // 登录并打开部门管理
    await signInAsAdmin(page);
    await page.goto('/system/dept', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.page-container', { timeout: 15000 });

    // 找到测试部门的编辑按钮
    const deptRow = page.locator(`tr:has-text("${testDeptName}"), .arco-tree-node:has-text("${testDeptName}")`).first();
    await expect(deptRow).toBeVisible();

    // 点击编辑按钮（可能需要hover触发）
    await deptRow.hover();
    const editButton = deptRow.locator('button:has-text("编辑"), button:has-text("Edit"), button[aria-label*="edit"]').first();
    await editButton.click();

    // 等待对话框
    const dialog = page.locator('.arco-modal').filter({ hasText: /编辑部门|Edit Department/i }).first();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 修改部门名称
    const deptNameInput = formInputByLabel(dialog, /部门名称|Department Name/i);
    await deptNameInput.clear();
    await deptNameInput.fill(`${testDeptName}_已修改`);

    // 提交
    await dialog.locator('button:has-text("确定"), button:has-text("OK")').click();

    // 验证成功
    await expect(page.locator('.arco-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('can delete a department', async ({ page }) => {
    // 先创建部门
    const login = await loginByApi(page, adminCredentials);
    const createResponse = await page.request.post(`${apiBaseUrl}/system/dept`, {
      headers: apiRequestHeaders(login),
      data: {
        deptName: testDeptName,
        sort: 999,
        status: 1,
      },
    });
    expect(createResponse.ok()).toBeTruthy();

    // 登录并打开部门管理
    await signInAsAdmin(page);
    await page.goto('/system/dept', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.page-container', { timeout: 15000 });

    // 找到测试部门的删除按钮
    const deptRow = page.locator(`tr:has-text("${testDeptName}"), .arco-tree-node:has-text("${testDeptName}")`).first();
    await expect(deptRow).toBeVisible();

    await deptRow.hover();
    const deleteButton = deptRow.locator('button:has-text("删除"), button:has-text("Delete")').first();
    await deleteButton.click();

    // 确认删除
    const confirmDialog = page.locator('.arco-modal, .arco-popconfirm').filter({ hasText: /确认删除|Confirm/i }).first();
    await expect(confirmDialog).toBeVisible({ timeout: 3000 });
    await confirmDialog.locator('button:has-text("确定"), button:has-text("OK")').click();

    // 验证成功
    await expect(page.locator('.arco-message-success')).toBeVisible({ timeout: 5000 });

    // 验证部门从树中消失
    await expect(page.locator(`text="${testDeptName}"`)).not.toBeVisible();
  });
});
