import { test, expect } from '@playwright/test'

/**
 * Test login with specific test user credentials
 * User: khosavutomi99@gmail.com
 * Password: 82014741
 */
test.describe('Login with Test User', () => {
  test('should successfully login with test user credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
    
    // Verify we're on the login page
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('h1:has-text("welcome"), h1:has-text("Welcome")')).toBeVisible()

    // Fill in test user credentials
    await page.fill('input[type="email"]', 'khosavutomi99@gmail.com')
    await page.fill('input[type="password"]', '82014741')

    // Click login button and wait for navigation
    await Promise.all([
      // Wait for navigation to dashboard
      page.waitForURL(/\/dashboard/, { timeout: 15000 }),
      // Click the login button
      page.click('button:has-text("Login"), button:has-text("Log in")')
    ])

    // Verify we're on the dashboard
    await expect(page).toHaveURL(/\/dashboard/)
    console.log('✅ Login successful! Redirected to:', page.url())
  })

  test('should show error for wrong password', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[type="email"]', 'khosavutomi99@gmail.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button:has-text("Login"), button:has-text("Log in")')

    // Should show error message (red error box)
    await expect(page.locator('div.bg-red-50')).toBeVisible({ timeout: 5000 })
    console.log('✅ Error handling works correctly')
  })

  test('should access protected routes after login', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'khosavutomi99@gmail.com')
    await page.fill('input[type="password"]', '82014741')
    
    await Promise.all([
      page.waitForURL(/\/dashboard/, { timeout: 15000 }),
      page.click('button:has-text("Login"), button:has-text("Log in")')
    ])

    // Try to access protected route
    await page.goto('/record')
    
    // Should be able to access (not redirected to login)
    await expect(page).toHaveURL(/\/record/)
    await expect(page.locator('text=/Record/i')).toBeVisible()
    console.log('✅ Protected routes accessible after login')
  })
})
