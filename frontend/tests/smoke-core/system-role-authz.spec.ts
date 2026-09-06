/**
 * System Role Authorization - 角色授权关键路径
 *
 * 覆盖范围:
 * - 创建角色
 * - 分配菜单权限
 * - 验证权限生效
 *
 * 优先级: P0 (权限系统核心)
 * 预估耗时: ~3分钟
 */

import { test, expect, type Page } from '@playwright/test';
import { signInAsAdmin, apiBaseUrl, authHeaders, loginByApi } from '../smoke/helpers/auth';

async function deleteRoleByKey(page: Page, accessToken: string, roleKey: string) {
  const listResponse = await page.request.get(`${apiBaseUrl}/system/role/list`, {
    headers: authHeaders(accessToken),
    params: { roleKey, page: 1, pageSize: 10 },
  });

  if (listResponse.ok()) {
    const payload = await listResponse.json();
    const roles = Array.isArray(payload.data?.items) ? payload.data.items : [];
    for (const role of roles) {
      if (role.roleKey === roleKey && role.roleKey !== 'admin') {
        await page.request.delete(`${apiBaseUrl}/system/role/${role.id}`, {
          headers: authHeaders(accessToken),
        });
      }
    }
  }
}

test.describe('System Role Authorization @priority:critical @smoke:core', () => {
  const testRoleKey = 'smoke_test_role';

  test.beforeEach(async ({ page }) => {
    const { accessToken } = await loginByApi(page);
    await deleteRoleByKey(page, accessToken, testRoleKey);
  });

  test.afterEach(async ({ page }) => {
    const { accessToken } = await loginByApi(page);
    await deleteRoleByKey(page, accessToken, testRoleKey);
  });

  test('can create a new role', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/system/role', { waitUntil: 'domcontentloaded' });

    // 点击新增角色
    await page.click('button:has-text("新增"), button:has-text("Add")');

    // 等待对话框
    const dialog = page.locator('.arco-modal').filter({ hasText: /新增角色|Add Role/i }).first();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 填写基本信息
    await dialog.locator('input[name="roleName"], input[placeholder*="角色名称"]').fill('测试角色');
    await dialog.locator('input[name="roleKey"], input[placeholder*="角色标识"]').fill(testRoleKey);
    await dialog.locator('input[name="sort"], input[placeholder*="排序"]').fill('999');

    // 提交
    await dialog.locator('button:has-text("确定"), button:has-text("OK"), button:has-text("Submit")').click();

    // 验证成功
    await expect(page.locator('.arco-message-success')).toBeVisible({ timeout: 5000 });

    // 验证角色出现在列表
    await expect(page.locator(`text="${testRoleKey}"`)).toBeVisible();
  });

  test('can assign menu permissions to role', async ({ page }) => {
    // 先创建角色
    const { accessToken } = await loginByApi(page);
    const createResponse = await page.request.post(`${apiBaseUrl}/system/role`, {
      headers: authHeaders(accessToken),
      data: {
        roleName: '测试角色',
        roleKey: testRoleKey,
        sort: 999,
        status: 1,
      },
    });
    expect(createResponse.ok()).toBeTruthy();
    // roleId would be extracted here for future API-based permission assignment

    // 登录并打开角色管理
    await signInAsAdmin(page);
    await page.goto('/system/role', { waitUntil: 'domcontentloaded' });

    // 找到测试角色的权限配置按钮
    const roleRow = page.locator(`tr:has-text("${testRoleKey}")`);
    await expect(roleRow).toBeVisible();

    // 点击权限配置按钮（可能是"权限配置"、"配置"、"Permission"等文本）
    const permissionButton = roleRow.locator(
      'button:has-text("权限"), button:has-text("配置"), button:has-text("Permission")'
    ).first();
    await permissionButton.click();

    // 等待权限配置对话框
    const dialog = page.locator('.arco-modal').filter({ hasText: /权限配置|Permission/i }).first();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 展开菜单树并选择一些权限
    const menuTree = dialog.locator('.arco-tree, .menu-tree').first();
    await expect(menuTree).toBeVisible();

    // 选择第一个可选的菜单项
    const firstCheckbox = menuTree.locator('input[type="checkbox"]').first();
    await firstCheckbox.check();

    // 提交权限配置
    await dialog.locator('button:has-text("确定"), button:has-text("OK"), button:has-text("Submit")').click();

    // 验证成功
    await expect(page.locator('.arco-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('can delete a role', async ({ page }) => {
    // 先创建角色
    const { accessToken } = await loginByApi(page);
    const createResponse = await page.request.post(`${apiBaseUrl}/system/role`, {
      headers: authHeaders(accessToken),
      data: {
        roleName: '待删除角色',
        roleKey: testRoleKey,
        sort: 999,
        status: 1,
      },
    });
    expect(createResponse.ok()).toBeTruthy();

    // 登录并打开角色管理
    await signInAsAdmin(page);
    await page.goto('/system/role', { waitUntil: 'domcontentloaded' });

    // 找到测试角色的删除按钮
    const roleRow = page.locator(`tr:has-text("${testRoleKey}")`);
    await expect(roleRow).toBeVisible();
    await roleRow.locator('button:has-text("删除"), button:has-text("Delete")').first().click();

    // 确认删除
    const confirmDialog = page.locator('.arco-modal, .arco-popconfirm').filter({ hasText: /确认删除|Confirm/i }).first();
    await expect(confirmDialog).toBeVisible({ timeout: 3000 });
    await confirmDialog.locator('button:has-text("确定"), button:has-text("OK")').click();

    // 验证成功
    await expect(page.locator('.arco-message-success')).toBeVisible({ timeout: 5000 });

    // 验证角色从列表消失
    await expect(page.locator(`tr:has-text("${testRoleKey}")`)).not.toBeVisible();
  });
});
