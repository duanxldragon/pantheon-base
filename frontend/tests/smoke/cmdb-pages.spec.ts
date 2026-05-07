import { test, expect } from '@playwright/test';

test.describe('CMDB Host Management', () => {
  test('host list page loads with table', async ({ page }) => {
    await page.goto('/operations/cmdb/host');
    await expect(page.locator('.page-container')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('host detail loads by ID', async ({ page }) => {
    await page.goto('/operations/cmdb/host/1');
    await expect(page.locator('.page-container')).toBeVisible();
  });

  test('group list page loads', async ({ page }) => {
    await page.goto('/operations/cmdb/group');
    await expect(page.locator('.page-container')).toBeVisible();
  });
});
