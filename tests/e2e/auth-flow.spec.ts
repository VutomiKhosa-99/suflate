import { test, expect } from './fixtures/auth'
import { faker } from '@faker-js/faker'

/**
 * E2E Tests for Authentication Flow
 * Tests the complete signup → verify → login flow
 */
test.describe('Authentication Flow', () => {
  test('should sign up with email and password', async ({ page, testUser }) => {
    await page.goto('/signup')

    // Fill signup form
    await page.fill('input[type="email"]', testUser.email)
    await page.fill('input[type="text"][placeholder*="name" i]', testUser.name)
    
    const passwordInputs = await page.locator('input[type="password"]').all()
    await passwordInputs[0].fill(testUser.password)
    if (passwordInputs.length > 1) {
      await passwordInputs[1].fill(testUser.password)
    }

    // Submit form
    await page.click('button:has-text("Signup")')

    // Should redirect to verify-email page
    await expect(page).toHaveURL(/\/verify-email/)
    await expect(page.locator('text=Verify Your Email')).toBeVisible()
  })

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/signup')

    // Try to submit empty form
    await page.click('button:has-text("Signup")')

    // Should show validation errors
    await expect(page.locator('text=/fill in all fields|required/i')).toBeVisible()
  })

  test('should show error for password mismatch', async ({ page, testUser }) => {
    await page.goto('/signup')

    await page.fill('input[type="email"]', testUser.email)
    const passwordInputs = await page.locator('input[type="password"]').all()
    await passwordInputs[0].fill(testUser.password)
    if (passwordInputs.length > 1) {
      await passwordInputs[1].fill('DifferentPassword123!')
    }

    await page.click('button:has-text("Signup")')

    // Should show password mismatch error
    await expect(page.locator('text=/password.*match|passwords do not match/i')).toBeVisible()
  })

  test('should login with valid credentials', async ({ page, testUser, supabaseAdmin }) => {
    // First, create and verify user via Supabase admin
    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
      user_metadata: {
        name: testUser.name,
      },
    })

    expect(signUpError).toBeNull()

    // Now test login
    await page.goto('/login')
    await page.fill('input[type="email"]', testUser.email)
    await page.fill('input[type="password"]', testUser.password)
    await page.click('button:has-text("Login")')

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    
    // Cleanup
    if (signUpData?.user?.id) {
      await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id)
    }
  })

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'nonexistent@example.com')
    await page.fill('input[type="password"]', 'WrongPassword123!')
    await page.click('button:has-text("Login")')

    // Should show error message
    await expect(page.locator('text=/invalid|incorrect|wrong/i')).toBeVisible({ timeout: 5000 })
  })

  test('should redirect authenticated users away from auth pages', async ({ authenticatedPage }) => {
    // Try to access login page when already authenticated
    await authenticatedPage.goto('/login')
    
    // Should redirect to dashboard
    await expect(authenticatedPage).toHaveURL(/\/dashboard/)
  })

  test('should protect dashboard routes', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })
})
