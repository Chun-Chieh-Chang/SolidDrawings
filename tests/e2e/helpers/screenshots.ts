import { Page } from '@playwright/test';

export async function takeScreenshot(
  page: Page,
  name: string,
  clip?: { x: number; y: number; width: number; height: number },
): Promise<string> {
  const filePath = `tests/e2e/screenshots/${name}.png`;

  await page.screenshot({ path: filePath, fullPage: false, ...(clip ? { clip } : {}) });

  return filePath;
}

export async function takeSectionScreenshot(
  page: Page,
  selector: string,
  name: string,
): Promise<string> {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  const box = await element.boundingBox();
  const clip = box ? { x: box.x, y: box.y, width: box.width, height: box.height } : undefined;
  return takeScreenshot(page, name, clip);
}
