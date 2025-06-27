import { expect, test } from '@playwright/test'

test('homepage loads and displays main content', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1, h2')).toHaveCount(5, { timeout: 5000 })
  // Adjust selector and text as needed for your homepage
})
