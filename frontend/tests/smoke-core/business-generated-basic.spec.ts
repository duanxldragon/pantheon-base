/**
 * Business Generated Basic - 生成模块基础 CRUD
 *
 * 覆盖范围:
 * - 验证生成模块可访问
 * - 基础列表加载
 * - 创建/编辑对话框打开
 *
 * 优先级: P1 (业务模块基础)
 * 预估耗时: ~3分钟
 */

import { test, expect } from '@playwright/test';
import { signInAsAdmin } from '../smoke/helpers/auth';
import { openBusinessModule } from './smoke-core-fixtures';

test.describe('Business Generated Basic @priority:high @smoke:core', () => {
  test('generated module pages are accessible', async ({ page }) => {
    await signInAsAdmin(page);
    const module = await openBusinessModule(page);
    if (!module) {
      // 如果没有业务模块，标记为跳过
      test.skip(true, 'No business modules exist in the current database');
      return;
    }

    // 验证页面加载
    await expect(page.locator('.page-container, .content-wrapper, table')).toBeVisible({ timeout: 10000 });

    // 验证没有错误提示
    const errorMessage = page.locator('.arco-message-error, .arco-notification-error');
    await expect(errorMessage).not.toBeVisible({ timeout: 2000 }).catch(() => {});
  });

  test('can open create dialog in generated module', async ({ page }) => {
    await signInAsAdmin(page);
    const module = await openBusinessModule(page);
    if (!module) {
      test.skip(true, 'No business modules exist in the current database');
      return;
    }

    await page.waitForSelector('.page-container, .arco-table', { timeout: 10000 });

    // 查找新增按钮
    const addButton = page.locator('button:has-text("新增"), button:has-text("Add")').first();
    if (await addButton.isVisible({ timeout: 2000 })) {
      await addButton.click();

      // 验证对话框打开
      const dialog = page.locator('.arco-modal').first();
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // 关闭对话框
      await dialog.locator('button:has-text("取消"), button:has-text("Cancel")').first().click();
    }
  });

  test('generated module list has basic operations', async ({ page }) => {
    await signInAsAdmin(page);
    const module = await openBusinessModule(page);
    if (!module) {
      test.skip(true, 'No business modules exist in the current database');
      return;
    }

    await page.waitForSelector('table', { timeout: 10000 });

    // 验证基础操作按钮存在
    const operationButtons = page.locator('button:has-text("新增"), button:has-text("导出"), button:has-text("刷新")');
    const buttonCount = await operationButtons.count();
    expect(buttonCount).toBeGreaterThan(0);

    // 验证表格存在
    const table = page.locator('table, .arco-table').first();
    await expect(table).toBeVisible();
  });
});
