import { expect, test, type Page } from '@playwright/test';

const dismissViewportGuardIfPresent = async (page: Page) => {
  const guardHeading = page.getByRole('heading', { name: 'Screen too small' });
  if (await guardHeading.isVisible()) {
    await page.getByRole('button', { name: 'Continue anyway' }).click();
  }
};

test('start, pause, and open leaderboards', async ({ page }) => {
  await page.goto('/');

  await dismissViewportGuardIfPresent(page);

  await expect(page.locator('canvas.board')).toBeVisible();

  await page.getByRole('button', { name: 'Start' }).click();
  await page.keyboard.press('KeyP');
  await expect(page.getByRole('heading', { name: 'Paused' })).toBeVisible();

  await page.getByRole('button', { name: 'View all' }).click();
  await expect(page.getByRole('dialog', { name: 'Leaderboards' })).toBeVisible();
});
