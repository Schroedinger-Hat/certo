import { test, expect } from '@playwright/test'

test('verify page loads and displays verification UI', async ({ page }) => {
  await page.goto('/verify')
  await expect(page.locator('form, [data-testid="verify-form"]')).toBeVisible()
}) 