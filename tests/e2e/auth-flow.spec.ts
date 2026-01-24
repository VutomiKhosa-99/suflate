import { test, expect } from '@playwright/test'

// Auth tests need to run serially to avoid cookie interference
test.describe.serial('Authentication Flow', () => {
  test('should login with email/password and access dashboard', async ({ page }) => {
    // Go to login page
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()

    // Fill in credentials
    await page.fill('input[type="email"]', 'khosavutomi99@gmail.com')
    await page.fill('input[type="password"]', '82014741')
    
    // Click login button
    await page.click('button:has-text("Login with Email")')
    
    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    
    // Verify on dashboard
    expect(page.url()).toContain('/dashboard')
  })

  test('should redirect to login when accessing protected route unauthenticated', async ({ page }) => {
    // Try to access dashboard directly
    await page.goto('/dashboard')
    
    // Should redirect to login with redirect param
    await page.waitForURL('**/login**', { timeout: 5000 })
    expect(page.url()).toContain('/login')
    expect(page.url()).toContain('redirect')
  })

  test('should show Google OAuth button on login page', async ({ page }) => {
    await page.goto('/login')
    
    // Google button should be visible
    const googleButton = page.getByRole('button', { name: /continue with google/i })
    await expect(googleButton).toBeVisible()
    
    // LinkedIn button should also be visible
    const linkedInButton = page.getByRole('button', { name: /continue with linkedin/i })
    await expect(linkedInButton).toBeVisible()
  })

  test('should redirect to Google OAuth when clicking Google button', async ({ page }) => {
    await page.goto('/login')
    
    // Click Google button
    const googleButton = page.getByRole('button', { name: /continue with google/i })
    await googleButton.click()
    
    // Should redirect to Google OAuth
    await page.waitForURL('**/accounts.google.com/**', { timeout: 10000 })
    expect(page.url()).toContain('accounts.google.com')
  })

  test('should persist session across protected routes', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'khosavutomi99@gmail.com')
    await page.fill('input[type="password"]', '82014741')
    await page.click('button:has-text("Login with Email")')
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    
    // Wait for session to fully sync
    await page.waitForTimeout(1000)

    // Navigate to record page (another protected route)
    await page.goto('/record')
    
    // Wait for navigation - either record page or redirect to login
    await page.waitForLoadState('networkidle')
    
    // Should stay on record page (not redirected to login)
    expect(page.url()).toContain('/record')
    expect(page.url()).not.toContain('/login')

    // Navigate back to dashboard using link
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Should stay on dashboard (not redirected to login)
    expect(page.url()).toContain('/dashboard')
    expect(page.url()).not.toContain('/login')
  })

  test('should logout and redirect to home', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'khosavutomi99@gmail.com')
    await page.fill('input[type="password"]', '82014741')
    await page.click('button:has-text("Login with Email")')
    await page.waitForURL('**/dashboard', { timeout: 10000 })

    // Click logout button
    const logoutButton = page.getByRole('button', { name: /logout/i })
    await logoutButton.click()

    // Should redirect to home page
    await page.waitForURL('**/', { timeout: 5000 })
    
    // Try to access dashboard again - should redirect to login
    await page.goto('/dashboard')
    await page.waitForURL('**/login**', { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })

  test('should reject upload API without authentication', async ({ request }) => {
    // Try to upload without being logged in
    const response = await request.post('/api/suflate/voice/upload', {
      multipart: {
        audio: {
          name: 'test.webm',
          mimeType: 'audio/webm',
          buffer: Buffer.from('test audio data'),
        },
      },
    })

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
  })

  test('should allow upload API with authentication', async ({ page, request }) => {
    // Login first to get session cookies
    await page.goto('/login')
    await page.fill('input[type="email"]', 'khosavutomi99@gmail.com')
    await page.fill('input[type="password"]', '82014741')
    await page.click('button:has-text("Login with Email")')
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    
    // Wait for session to sync
    await page.waitForTimeout(1000)

    // Get cookies from page context
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ')

    // Try upload with session cookies
    const response = await request.post('/api/suflate/voice/upload', {
      headers: {
        'Cookie': cookieHeader,
      },
      multipart: {
        audio: {
          name: 'test.webm',
          mimeType: 'audio/webm',
          buffer: Buffer.from('fake audio data for testing'),
        },
      },
    })

    // Should NOT return 401 (authentication passed)
    // May return 400/500 due to invalid audio, but not 401
    expect(response.status()).not.toBe(401)
  })

  test('should redirect logged-in user from login page to dashboard', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'khosavutomi99@gmail.com')
    await page.fill('input[type="password"]', '82014741')
    await page.click('button:has-text("Login with Email")')
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    
    // Wait for session to sync
    await page.waitForTimeout(1000)

    // Now try to navigate to login page manually
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Should be redirected back to dashboard
    expect(page.url()).toContain('/dashboard')
    expect(page.url()).not.toContain('/login')
  })

  test('should redirect logged-in user from signup page to dashboard', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'khosavutomi99@gmail.com')
    await page.fill('input[type="password"]', '82014741')
    await page.click('button:has-text("Login with Email")')
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    
    // Wait for session to sync
    await page.waitForTimeout(1000)

    // Now try to navigate to signup page manually
    await page.goto('/signup')
    await page.waitForLoadState('networkidle')
    
    // Should be redirected back to dashboard
    expect(page.url()).toContain('/dashboard')
    expect(page.url()).not.toContain('/signup')
  })

  test('should redirect logged-in user from landing page to dashboard', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'khosavutomi99@gmail.com')
    await page.fill('input[type="password"]', '82014741')
    await page.click('button:has-text("Login with Email")')
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    
    // Wait for session to sync
    await page.waitForTimeout(1000)

    // Now try to navigate to landing page manually
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Should be redirected to dashboard
    expect(page.url()).toContain('/dashboard')
  })

  test('should access settings page when logged in', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'khosavutomi99@gmail.com')
    await page.fill('input[type="password"]', '82014741')
    await page.click('button:has-text("Login with Email")')
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    
    // Navigate to settings
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    
    // Should stay on settings page
    expect(page.url()).toContain('/settings')
    
    // Should see settings content
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /connected services/i })).toBeVisible()
  })

  test('should show forgot password functionality', async ({ page }) => {
    await page.goto('/login')
    
    // Forgot password button should be visible
    const forgotButton = page.getByRole('button', { name: /forgot password/i })
    await expect(forgotButton).toBeVisible()
  })

  test('should show reset password page', async ({ page }) => {
    await page.goto('/auth/reset-password')
    
    // Should show reset password form
    await expect(page.getByRole('heading', { name: /reset your password/i })).toBeVisible()
    await expect(page.getByLabel(/new password/i)).toBeVisible()
    await expect(page.getByLabel(/confirm password/i)).toBeVisible()
  })
})
