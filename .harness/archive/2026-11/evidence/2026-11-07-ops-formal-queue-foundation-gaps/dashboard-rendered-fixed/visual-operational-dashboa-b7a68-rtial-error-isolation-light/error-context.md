# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual\operational-dashboard.spec.ts >> operational dashboard partial error isolation light
- Location: tests\visual\operational-dashboard.spec.ts:4:2

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('数据已过期')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('数据已过期') with timeout 10000ms
  - waiting for getByText('数据已过期')

```

```yaml
- main: 部分数据 operational.fixture.empty operational.fixture.error 就绪
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | import { primeChineseLocale } from '../smoke/helpers/auth';
  3  | for (const mode of ['light','dark'] as const) {
  4  |  test(`operational dashboard partial error isolation ${mode}`,async ({page},testInfo)=>{
  5  |   await primeChineseLocale(page);await page.addInitScript(color=>localStorage.setItem('pantheon_color_mode',color),mode);
  6  |   await page.goto('/__visual/operational-workbench?dashboard=1');
  7  |   await expect(page.locator('.operational-dashboard-widget')).toHaveCount(4);
> 8  |   await expect(page.getByText('数据已过期')).toBeVisible();await expect(page.getByText('部分结果')).toBeVisible();
     |                                         ^ Error: expect(locator).toBeVisible() failed
  9  |   await expect(page.getByRole('button',{name:'重试'})).toBeVisible();
  10 |   await expect(page.locator('.operational-dashboard-widget__items')).toHaveCount(2);
  11 |   await page.getByRole('button',{name:'重试'}).focus();await expect(page.getByRole('button',{name:'重试'})).toBeFocused();
  12 |   for(const [name,width,height] of [['desktop',1440,900],['mobile',390,844]] as const) {
  13 |    await page.setViewportSize({width,height});
  14 |    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  15 |    await page.screenshot({path:testInfo.outputPath(`dashboard-${mode}-${name}.png`),fullPage:true});
  16 |   }
  17 |  });
  18 | }
  19 |
```
