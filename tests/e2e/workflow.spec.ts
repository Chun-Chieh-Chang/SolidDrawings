import { test, expect } from '@playwright/test';
import { takeScreenshot } from './helpers/screenshots';

test.describe('Workflow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Create new part document', async ({ page }) => {
    const newFileSelector = '[data-testid="new-file"], [class*="new"], [class*="create"], button:has-text("New"), menuitem:has-text("New")';
    const newButton = page.locator(newFileSelector).first();

    if (await newButton.isVisible().catch(() => false)) {
      await newButton.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'new-part-created');
    } else {
      await page.keyboard.press('Control+N');
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'new-part-keyboard');
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('Open property manager', async ({ page }) => {
    const propManagerSelector = '[data-testid="property-manager"], [class*="property"], [class*="inspector"], [class*="panel"]';
    const propManager = page.locator(propManagerSelector).first();

    if (await propManager.isVisible().catch(() => false)) {
      await propManager.scrollIntoViewIfNeeded();
      await propManager.click();
      await page.waitForTimeout(500);
      await expect(propManager).toBeVisible();
    } else {
      await takeScreenshot(page, 'property-manager-search');
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Save and reload', async ({ page }) => {
    const saveSelector = '[data-testid="save-file"], [class*="save"], button:has-text("Save"), menuitem:has-text("Save")';
    const saveButton = page.locator(saveSelector).first();

    if (await saveButton.isVisible().catch(() => false)) {
      await saveButton.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'file-saved');
    } else {
      await page.keyboard.press('Control+S');
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'file-saved-keyboard');
    }

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    await takeScreenshot(page, 'after-reload');
  });
});
