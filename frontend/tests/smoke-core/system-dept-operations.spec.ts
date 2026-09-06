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

import { test, expect, type Page } from '@playwright/test';
import { signInAsAdmin, apiBaseUrl, authHeaders, loginByApi } from '../smoke/helpers/auth';

async function deleteTestDept(page: Page, accessToken: string, deptName: string) {
  const listResponse = await page.request.get(`${apiBaseUrl}/system/dept/tree`, {
    headers: authHeaders(accessToken),
  });

  if (listResponse.ok()) {
    const payload = await listResponse.json();
    const depts = Array.isArray(payload.data) ? payload.data : [];

    // 递归查找并删除
    const findAndDelete = async (items: Array<{ id: string; deptName: string; children?: unknown[] }>) => {
      for (const dept of items) {
        if (dept.deptName === deptName) {
          await page.request.delete(`${apiBaseUrl}/system/dept/${dept.id}`, {
            headers: authHeaders(accessToken),
          });
        }
        if (Array.isArray(dept.children)) {
          await findAndDelete(dept.children);
        }
      }
    };

    await findAndDelete(depts);
  }
}

test.describe('System Department Operations @priority:high @smoke:core', () => {
  const testDeptName = '测试部门_Smoke';

  test.beforeEach(async ({ page }) => {
    const { accessToken } = await loginByApi(page);
    await deleteTestDept(page, accessToken, testDeptName);
  });

  test.afterEach(async ({ page }) => {
    const { accessToken } = await loginByApi(page);
    await deleteTestDept(page, accessToken, testDeptName);
  });

  test('can create a root department', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/system/dept', { waitUntil: 'domcontentloaded' });

    // 点击新增按钮
    await page.click('button:has-text("新增"), button:has-text("Add")');

    // 等待对话框
    const dialog = page.locator('.arco-modal').filter({ hasText: /新增部门|Add Department/i }).first();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 填写部门信息
    await dialog.locator('input[name="deptName"], input[placeholder*="部门名称"]').fill(testDeptName);
    await dialog.locator('input[name="sort"], input[placeholder*="排序"]').fill('999');

    // 提交
    await dialog.locator('button:has-text("确定"), button:has-text("OK")').click();

    // 验证成功
    await expect(page.locator('.arco-message-success')).toBeVisible({ timeout: 5000 });

    // 验证部门出现在树中
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text="${testDeptName}"`)).toBeVisible();
  });

  test('can edit a department', async ({ page }) => {
    // 先创建部门
    const { accessToken } = await loginByApi(page);
    const createResponse = await page.request.post(`${apiBaseUrl}/system/dept`, {
      headers: authHeaders(accessToken),
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
    const deptNameInput = dialog.locator('input[name="deptName"], input[placeholder*="部门名称"]');
    await deptNameInput.clear();
    await deptNameInput.fill(`${testDeptName}_已修改`);

    // 提交
    await dialog.locator('button:has-text("确定"), button:has-text("OK")').click();

    // 验证成功
    await expect(page.locator('.arco-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('can delete a department', async ({ page }) => {
    // 先创建部门
    const { accessToken } = await loginByApi(page);
    const createResponse = await page.request.post(`${apiBaseUrl}/system/dept`, {
      headers: authHeaders(accessToken),
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
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text="${testDeptName}"`)).not.toBeVisible();
  });
});
