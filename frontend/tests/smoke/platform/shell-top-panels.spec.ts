import { test } from '../../fixtures/coverage';
import { expect } from '@playwright/test';
import { signInAsAdmin } from '../helpers/auth';

async function readWidth(locator: import('@playwright/test').Locator) {
  return locator.evaluate((element) => Math.round(element.getBoundingClientRect().width));
}

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

async function readBox(locator: import('@playwright/test').Locator): Promise<Box> {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box as Box;
}

// Arco Dropdown popups position themselves asynchronously (autoFitPosition) and
// may still be animating in when a test measures them. A mid-transition box
// reads as if the panel escaped the viewport, which made the narrow-viewport
// containment assertions flaky. Wait until the box signature stops changing and
// any in-flight animations have finished before measuring. This does not relax
// the containment bound; it only removes the measurement race.
async function settlePanel(locator: import('@playwright/test').Locator) {
  let previous = '';
  await expect
    .poll(
      async () => {
        const box = await locator.boundingBox();
        if (!box) return false;
        const signature = `${Math.round(box.x)}:${Math.round(box.y)}:${Math.round(box.width)}:${Math.round(box.height)}`;
        const stable = signature === previous;
        previous = signature;
        return stable;
      },
      { timeout: 5000, intervals: [100, 150, 200, 250] },
    )
    .toBe(true);
  await locator.evaluate(async (element) => {
    const animations = element.getAnimations({ subtree: true });
    await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
  });
}

async function expectNoViewportOverflow(page: import('@playwright/test').Page) {
  await expect
    .poll(async () =>
      page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(1);
}

function expectBoxInsideViewport(page: import('@playwright/test').Page, box: Box) {
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.y).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport!.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport!.height + 1);
}

test('shell top panels keep readable desktop widths', async ({ page }, testInfo) => {
  await signInAsAdmin(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

  const noticeTrigger = page.getByRole('button', { name: /通知中心|Notification Center/ });
  await expect(noticeTrigger).toBeVisible();
  await noticeTrigger.click();

  const noticePanel = page.locator('.app-shell__notice-panel');
  await expect(noticePanel).toBeVisible();
  await expect(await readWidth(noticePanel)).toBeGreaterThanOrEqual(380);
  await page.screenshot({ path: testInfo.outputPath('shell-top-panels-desktop-notice.png') });

  await page.mouse.click(24, 24);
  await expect(noticePanel).toHaveCount(0);

  const preferenceTrigger = page.getByRole('button', { name: /平台偏好|Platform Preferences/ });
  await expect(preferenceTrigger).toBeVisible();
  await preferenceTrigger.click();

  const preferencePanel = page.locator('.app-shell__preference-panel');
  await expect(preferencePanel).toBeVisible();
  await expect(await readWidth(preferencePanel)).toBeGreaterThanOrEqual(380);
});

test('shell top panels and profile page stay contained on narrow viewports', async ({
  page,
}, testInfo) => {
  await signInAsAdmin(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

  const searchTrigger = page.locator('.app-shell__search-trigger');
  await expect(searchTrigger).toBeVisible();
  const searchBox = await readBox(searchTrigger);

  const noticeTrigger = page.getByRole('button', { name: /通知中心|Notification Center/ });
  await expect(noticeTrigger).toBeVisible();
  await noticeTrigger.click();

  const noticePanel = page.locator('.app-shell__notice-panel');
  await expect(noticePanel).toBeVisible();
  await settlePanel(noticePanel);
  const noticeBox = await readBox(noticePanel);
  expect(noticeBox.y).toBeGreaterThanOrEqual(searchBox.y + searchBox.height - 1);
  expectBoxInsideViewport(page, noticeBox);
  await expect(await readWidth(noticePanel)).toBeLessThanOrEqual(358);
  await page.screenshot({ path: testInfo.outputPath('shell-top-panels-narrow-notice.png') });
  await expectNoViewportOverflow(page);

  await noticeTrigger.click();
  await expect(noticePanel).toHaveCount(0);
  const preferenceTrigger = page.getByRole('button', { name: /平台偏好|Platform Preferences/ });
  await preferenceTrigger.click();
  const preferencePanel = page.locator('.app-shell__preference-panel');
  await expect(preferencePanel).toBeVisible();
  await settlePanel(preferencePanel);
  expectBoxInsideViewport(page, await readBox(preferencePanel));
  await expect(await readWidth(preferencePanel)).toBeLessThanOrEqual(358);
  await expectNoViewportOverflow(page);

  await page.goto('/system/profile', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.submit-bar')).toBeVisible();
  await expect(page.locator('.arco-form')).toBeVisible();
  await expectNoViewportOverflow(page);
});
