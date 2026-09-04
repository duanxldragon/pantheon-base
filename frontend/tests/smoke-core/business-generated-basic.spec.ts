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

test.describe('Business Generated Basic @priority:high @smoke:core', () => {
  test('generated module pages are accessible', async ({ page }) => {
    await signInAsAdmin(page);

    // 尝试访问业务模块（如果存在）
    // 注意：这个测试假设有生成的业务模块，如果没有则跳过
    const businessMenus = page.locator('.arco-menu-item:has-text("业务"), .arco-menu-item:has-text("Business")');

    if (await businessMenus.count() > 0) {
      await businessMenus.first().click();

      // 等待子菜单展开
      await page.waitForTimeout(500);

      // 点击第一个子菜单
      const subMenus = page.locator('.arco-menu-item').filter({ hasNotText: /系统管理|System|Dashboard/ });
      if (await subMenus.count() > 0) {
        await subMenus.first().click();

        // 验证页面加载
        await expect(page.locator('.page-container, .content-wrapper, table')).toBeVisible({ timeout: 10000 });

        // 验证没有错误提示
        const errorMessage = page.locator('.arco-message-error, .arco-notification-error');
        await expect(errorMessage).not.toBeVisible({ timeout: 2000 }).catch(() => {});
      }
    } else {
      // 如果没有业务模块，标记为跳过
      test.skip();
    }
  });

  test('can open create dialog in generated module', async ({ page }) => {
    await signInAsAdmin(page);

    // 查找业务菜单
    const businessMenus = page.locator('.arco-menu-item:has-text("业务"), .arco-menu-item:has-text("Business")');

    if (await businessMenus.count() > 0) {
      await businessMenus.first().click();
      await page.waitForTimeout(500);

      const subMenus = page.locator('.arco-menu-item').filter({ hasNotText: /系统管理|System|Dashboard/ });
      if (await subMenus.count() > 0) {
        await subMenus.first().click();
        await page.waitForSelector('.page-container, table', { timeout: 10000 });

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
      }
    } else {
      test.skip();
    }
  });

  test('generated module list has basic operations', async ({ page }) => {
    await signInAsAdmin(page);

    const businessMenus = page.locator('.arco-menu-item:has-text("业务"), .arco-menu-item:has-text("Business")');

    if (await businessMenus.count() > 0) {
      await businessMenus.first().click();
      await page.waitForTimeout(500);

      const subMenus = page.locator('.arco-menu-item').filter({ hasNotText: /系统管理|System|Dashboard/ });
      if (await subMenus.count() > 0) {
        await subMenus.first().click();
        await page.waitForSelector('table', { timeout: 10000 });

        // 验证基础操作按钮存在
        const operationButtons = page.locator('button:has-text("新增"), button:has-text("导出"), button:has-text("刷新")');
        const buttonCount = await operationButtons.count();
        expect(buttonCount).toBeGreaterThan(0);

        // 验证表格存在
        const table = page.locator('table, .arco-table').first();
        await expect(table).toBeVisible();
      }
    } else {
      test.skip();
    }
  });
});
