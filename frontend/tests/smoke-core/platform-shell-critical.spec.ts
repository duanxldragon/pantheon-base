/**
 * Platform Shell Critical - 平台壳层关键路径
 *
 * 覆盖范围:
 * - Shell 结构渲染
 * - 侧边栏菜单展开/折叠
 * - 路由导航
 * - 面包屑更新
 *
 * 优先级: P0 (影响所有用户)
 * 预估耗时: ~2分钟
 */

import { test, expect } from '@playwright/test';
import { signInAsAdmin } from '../smoke/helpers/auth';

test.describe('Platform Shell Critical @priority:critical @smoke:core', () => {
  test('shell renders with correct structure after login', async ({ page }) => {
    await signInAsAdmin(page);

    // 验证 Shell 核心结构
    await expect(page.locator('.app-shell')).toBeVisible();

    // 验证顶部导航栏
    const header = page.locator('.layout-header, header');
    await expect(header).toBeVisible();

    // 验证侧边栏
    const sidebar = page.locator('.layout-sider, aside, .sidebar');
    await expect(sidebar).toBeVisible();

    // 验证主内容区
    const main = page.locator('.layout-content, main, .main-content');
    await expect(main).toBeVisible();
  });

  test('sidebar menu expands and collapses', async ({ page }) => {
    await signInAsAdmin(page);

    // 找到折叠/展开按钮
    const toggleButton = page.locator(
      'button[aria-label*="collapse"], button[aria-label*="expand"], .sidebar-toggle, .menu-toggle'
    ).first();

    // 验证按钮存在
    await expect(toggleButton).toBeVisible();

    // 记录初始状态
    const sidebar = page.locator('.layout-sider, aside, .sidebar').first();
    const initialWidth = await sidebar.boundingBox().then(box => box?.width ?? 0);

    // 点击折叠
    await toggleButton.click();
    await page.waitForLoadState('networkidle');

    // 验证宽度变化
    const collapsedWidth = await sidebar.boundingBox().then(box => box?.width ?? 0);
    expect(collapsedWidth).toBeLessThan(initialWidth);

    // 再次点击展开
    await toggleButton.click();
    await page.waitForLoadState('networkidle');

    // 验证恢复
    const expandedWidth = await sidebar.boundingBox().then(box => box?.width ?? 0);
    expect(expandedWidth).toBeGreaterThan(collapsedWidth);
  });

  test('navigation between system pages works', async ({ page }) => {
    await signInAsAdmin(page);

    // 导航到用户管理
    await page.click('text=/用户管理|User/i');
    await expect(page).toHaveURL(/\/system\/user/, { timeout: 5000 });
    await expect(page.locator('.page-container, .content-wrapper')).toBeVisible();

    // 导航到角色管理
    await page.click('text=/角色管理|Role/i');
    await expect(page).toHaveURL(/\/system\/role/, { timeout: 5000 });
    await expect(page.locator('.page-container, .content-wrapper')).toBeVisible();

    // 导航到菜单管理
    await page.click('text=/菜单管理|Menu/i');
    await expect(page).toHaveURL(/\/system\/menu/, { timeout: 5000 });
    await expect(page.locator('.page-container, .content-wrapper')).toBeVisible();
  });

  test('breadcrumb updates on navigation', async ({ page }) => {
    await signInAsAdmin(page);

    // 导航到用户管理
    await page.click('text=/用户管理|User/i');
    await expect(page).toHaveURL(/\/system\/user/, { timeout: 5000 });

    // 验证面包屑包含正确的路径
    const breadcrumb = page.locator('.arco-breadcrumb, .breadcrumb');
    await expect(breadcrumb).toBeVisible();

    // 应该包含"系统管理"和"用户管理"
    const breadcrumbText = await breadcrumb.textContent();
    expect(breadcrumbText).toMatch(/系统管理|System/);
    expect(breadcrumbText).toMatch(/用户管理|User/);
  });
});
