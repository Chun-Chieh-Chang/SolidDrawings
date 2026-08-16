import { test, expect } from '@playwright/test';
import { takeScreenshot } from './helpers/screenshots';

test.describe('OpenSCAD Integration Smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Open panel from ribbon, compile cube, insert into feature tree', async ({ page }) => {
    // 1. Open the OpenSCAD task pane via the Ribbon FEATURES tab
    const openscadButton = page.locator('button:has-text("OpenSCAD")').first();
    await expect(openscadButton).toBeVisible({ timeout: 30000 });
    await openscadButton.click();

    // Panel header + Editor tab visible
    await expect(page.locator('text=OpenSCAD / Import / Text-to-CAD')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("Editor")')).toBeVisible();

    // 2. Input simple scad code
    const codeArea = page.locator('textarea[placeholder*="Write OpenSCAD code"]');
    await expect(codeArea).toBeVisible();
    await codeArea.fill('cube([10, 10, 10]);');

    // 3. Compile & preview — backend compiles with real OpenSCAD binary
    await page.locator('button:has-text("Compile & Preview")').click();

    // Mesh preview canvas appears (MeshPreview renders a canvas inside the slate-800 box)
    const previewBox = page.locator('div.rounded.border.border-slate-600.bg-slate-800');
    await expect(previewBox).toBeVisible({ timeout: 60000 });
    await expect(previewBox.locator('canvas')).toBeVisible({ timeout: 15000 });
    await takeScreenshot(page, 'openscad-compile-preview');

    // 4. Insert as feature
    await page.locator('button:has-text("Add as Feature")').click();

    // 5. Feature appears in the feature tree (OPENSCAD type)
    await expect(page.locator('text=OpenSCAD Script').first()).toBeVisible({ timeout: 15000 });
    await takeScreenshot(page, 'openscad-feature-inserted');

    // 6. Viewport still renders (main 3D canvas alive)
    const viewportCanvas = page.locator('canvas').first();
    await expect(viewportCanvas).toBeVisible();
  });

  test('Text-to-CAD tab is reachable and validates empty input', async ({ page }) => {
    await page.locator('button:has-text("OpenSCAD")').first().click();
    await page.locator('button:has-text("Text-to-CAD")').click();

    const generateBtn = page.locator('button:has-text("Generate")');
    await expect(generateBtn).toBeVisible();
    // Empty description → button disabled
    await expect(generateBtn).toBeDisabled();
    await takeScreenshot(page, 'openscad-texttocad-tab');
  });
});