import { expect, test } from '@playwright/test';
import { signInAsAdmin } from '../helpers/auth';

async function readWidth(locator: import('@playwright/test').Locator) {
  return locator.evaluate((element) => Math.round(element.getBoundingClientRect().width));
}

async function expectNoViewportOverflow(page: import('@playwright/test').Page) {
  await expect
    .poll(async () =>
      page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    )
    .toBeLessThanOrEqual(1);
}

test('shell top panels keep readable desktop widths', async ({ page }) => {
  await signInAsAdmin(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/dashboard', { waitUntil: 'networkidle' });

  const noticeTrigger = page.getByRole('button', { name: /通知中心|Notification Center/ });
  await expect(noticeTrigger).toBeVisible();
  await noticeTrigger.click();

  const noticePanel = page.locator('.app-shell__notice-panel');
  await expect(noticePanel).toBeVisible();
  await expect(await readWidth(noticePanel)).toBeGreaterThanOrEqual(380);

  await page.mouse.click(24, 24);
  await expect(noticePanel).toHaveCount(0);

  const preferenceTrigger = page.getByRole('button', { name: /平台偏好|Platform Preferences/ });
  await expect(preferenceTrigger).toBeVisible();
  await preferenceTrigger.click();

  const preferencePanel = page.locator('.app-shell__preference-panel');
  await expect(preferencePanel).toBeVisible();
  await expect(await readWidth(preferencePanel)).toBeGreaterThanOrEqual(380);
});

test('shell top panels and profile page stay contained on narrow viewports', async ({ page }) => {
  await signInAsAdmin(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dashboard', { waitUntil: 'networkidle' });

  const noticeTrigger = page.getByRole('button', { name: /通知中心|Notification Center/ });
  await noticeTrigger.click();
  const noticePanel = page.locator('.app-shell__notice-panel');
  await expect(noticePanel).toBeVisible();
  await expect(await readWidth(noticePanel)).toBeLessThanOrEqual(358);
  await expectNoViewportOverflow(page);

  await page.mouse.click(20, 20);
  const preferenceTrigger = page.getByRole('button', { name: /平台偏好|Platform Preferences/ });
  await preferenceTrigger.click();
  const preferencePanel = page.locator('.app-shell__preference-panel');
  await expect(preferencePanel).toBeVisible();
  await expect(await readWidth(preferencePanel)).toBeLessThanOrEqual(358);
  await expectNoViewportOverflow(page);

  await page.goto('/system/profile', { waitUntil: 'networkidle' });
  await expect(page.locator('.submit-bar')).toBeVisible();
  await expect(page.locator('.arco-form')).toBeVisible();
  await expectNoViewportOverflow(page);
});
