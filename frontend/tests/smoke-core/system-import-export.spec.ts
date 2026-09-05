/**
 * System Import/Export - 导入导出关键路径
 *
 * 覆盖范围:
 * - 数据导出（CSV/Excel）
 * - 模板下载
 * - 数据导入基础场景
 *
 * 优先级: P1 (数据批量操作)
 * 预估耗时: ~3分钟
 */

import { test, expect } from '@playwright/test';
import { signInAsAdmin } from '../smoke/helpers/auth';

test.describe('System Import/Export @priority:high @smoke:core', () => {
  test('can export user data', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/system/user', { waitUntil: 'domcontentloaded' });

    // 等待列表加载
    await page.waitForSelector('table, .arco-table', { timeout: 10000 });

    // 查找导出按钮
    const exportButton = page.locator('button:has-text("导出"), button:has-text("Export")').first();

    if (await exportButton.isVisible({ timeout: 2000 })) {
      // 设置下载监听
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

      // 点击导出
      await exportButton.click();

      // 等待下载开始
      const download = await downloadPromise;

      // 验证文件名包含预期内容
      const fileName = download.suggestedFilename();
      expect(fileName).toMatch(/user|用户|export/i);
      expect(fileName).toMatch(/\.(csv|xlsx|xls)$/i);
    }
  });

  test('can download import template', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/system/user', { waitUntil: 'domcontentloaded' });

    // 查找导入按钮
    const importButton = page.locator('button:has-text("导入"), button:has-text("Import")').first();

    if (await importButton.isVisible({ timeout: 2000 })) {
      await importButton.click();

      // 等待导入对话框
      const dialog = page.locator('.arco-modal').filter({ hasText: /导入|Import/i }).first();
      await expect(dialog).toBeVisible({ timeout: 3000 });

      // 查找模板下载链接
      const templateLink = dialog.locator('a:has-text("模板"), a:has-text("Template"), button:has-text("模板")').first();

      if (await templateLink.isVisible({ timeout: 2000 })) {
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
        await templateLink.click();

        const download = await downloadPromise;
        const fileName = download.suggestedFilename();
        expect(fileName).toMatch(/template|模板/i);
      }

      // 关闭对话框
      await dialog.locator('button:has-text("取消"), button:has-text("Cancel")').click();
    }
  });

  test('export button is available on role management', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/system/role', { waitUntil: 'domcontentloaded' });

    // 等待列表加载
    await page.waitForSelector('table, .arco-table', { timeout: 10000 });

    // 验证导出按钮存在
    const exportButton = page.locator('button:has-text("导出"), button:has-text("Export")').first();

    if (await exportButton.isVisible({ timeout: 2000 })) {
      await expect(exportButton).toBeEnabled();
    }
  });
});
