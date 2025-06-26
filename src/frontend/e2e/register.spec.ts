import { test, expect } from '@playwright/test'

test('register page loads and form is present', async ({ page }) => {
  await page.goto('/register')
  await expect(page.locator('form')).toBeVisible()
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]').first()).toBeVisible()
  await expect(page.locator('button[type="submit"]')).toBeVisible()
}) 