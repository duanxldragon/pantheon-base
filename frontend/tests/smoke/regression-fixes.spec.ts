import { expect, test } from '@playwright/test';

test.describe('UI Structural Audit (Direct CSS/DOM Verification)', () => {
  test('verify global radii and gradient removal', async ({ page }) => {
    await page.goto('/login');
    
    // Audit Login Card
    const loginCard = page.locator('.auth-login-card');
    await expect(loginCard).toBeVisible();
    
    const audit = await loginCard.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        borderRadius: style.borderRadius,
        backgroundImage: style.backgroundImage,
        boxShadow: style.boxShadow
      };
    });

    console.log('Login Card Audit:', audit);
    
    // Radii should be small (4px standard)
    expect(parseInt(audit.borderRadius)).toBeLessThanOrEqual(8);
    // Background should not have linear-gradient (except maybe login grid background on the page, but not the card)
    expect(audit.backgroundImage).toBe('none');
  });

  test('verify modal structural integrity and layering', async ({ page }) => {
    // We can check the CSS directly in the stylesheet if we want, but checking computed is safer
    await page.goto('/login');
    
    const zIndexAudit = await page.evaluate(() => {
      // Create a dummy app-dialog to check its computed style
      const div = document.createElement('div');
      div.className = 'app-dialog';
      div.style.position = 'fixed'; // Required for z-index to matter
      document.body.appendChild(div);
      const style = window.getComputedStyle(div);
      const val = style.zIndex;
      document.body.removeChild(div);
      return val;
    });

    console.log('App Dialog Z-Index:', zIndexAudit);
    expect(parseInt(zIndexAudit)).toBeGreaterThanOrEqual(2500);
  });

  test('verify layout overflow protection (Physical Isolation)', async ({ page }) => {
    await page.goto('/login');
    
    const overflowAudit = await page.evaluate(() => {
      const div = document.createElement('div');
      div.className = 'page-main-column';
      document.body.appendChild(div);
      const style = window.getComputedStyle(div);
      const results = {
        overflow: style.overflow,
        minWidth: style.minWidth
      };
      document.body.removeChild(div);
      return results;
    });

    console.log('Main Column Overflow Audit:', overflowAudit);
    expect(overflowAudit.overflow).toBe('hidden');
    expect(overflowAudit.minWidth).toBe('0px');
  });

  test('verify page panel border strength', async ({ page }) => {
    await page.goto('/login');
    
    const panelAudit = await page.evaluate(() => {
      const div = document.createElement('div');
      div.className = 'page-panel';
      document.body.appendChild(div);
      const style = window.getComputedStyle(div);
      const border = style.border;
      const borderColor = style.borderColor;
      document.body.removeChild(div);
      return { border, borderColor };
    });

    console.log('Panel Border Audit:', panelAudit);
    // Should have 1px solid border
    expect(panelAudit.border).toContain('1px solid');
  });
});
