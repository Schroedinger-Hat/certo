import { expect, test } from '@playwright/test'

test('about page loads and displays content', async ({ page }) => {
  await page.goto('/about')
  await expect(page.locator('h1, h2')).toHaveCount(6, { timeout: 5000 })
  await expect(page.locator('text=About').first()).toBeVisible()
  await expect(page.locator('text=About').first()).toBeVisible()
})
