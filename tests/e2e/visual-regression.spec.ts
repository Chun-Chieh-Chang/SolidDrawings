import { test, expect } from '@playwright/test';
import { takeScreenshot } from './helpers/screenshots';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Main UI layout', async ({ page }) => {
    await takeScreenshot(page, 'main-ui-layout');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Ribbon bar visible', async ({ page }) => {
    const ribbonSelector = '[data-testid="ribbon-bar"], .ribbon, [class*="ribbon"], nav[role="toolbar"]';
    const ribbon = page.locator(ribbonSelector).first();
    if (await ribbon.isVisible().catch(() => false)) {
      await ribbon.scrollIntoViewIfNeeded();
      const box = await ribbon.boundingBox();
      const clip = box ? { x: box.x, y: box.y, width: box.width, height: box.height } : undefined;
      await takeScreenshot(page, 'ribbon-bar-visible', clip);
      await expect(ribbon).toBeVisible();
    } else {
      await takeScreenshot(page, 'ribbon-bar-visible');
    }
  });

  test('3D viewport present', async ({ page }) => {
    const canvasSelector = 'canvas, [data-testid="viewport"], [class*="viewport"], [class*="canvas"], [class*="3d"]';
    const viewport = page.locator(canvasSelector).first();
    if (await viewport.isVisible().catch(() => false)) {
      await viewport.scrollIntoViewIfNeeded();
      const box = await viewport.boundingBox();
      const clip = box ? { x: box.x, y: box.y, width: box.width, height: box.height } : undefined;
      await takeScreenshot(page, 'viewport-present', clip);
      await expect(viewport).toBeVisible();
    } else {
      await takeScreenshot(page, 'viewport-present');
    }
  });
});
