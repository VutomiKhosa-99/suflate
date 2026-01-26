import { test as base, expect } from '@playwright/test'
import { faker } from '@faker-js/faker'
import { createClient } from '@supabase/supabase-js'

type AuthFixtures = {
  authenticatedPage: any
  testUser: {
    email: string
    password: string
    name: string
  }
  supabaseAdmin: any
}

/**
 * Auth fixtures for E2E tests
 * Provides authenticated pages and test user management
 */
export const test = base.extend<AuthFixtures>({
  // Test user data
  testUser: async ({}, use) => {
    const user = {
      email: `test-${faker.string.alphanumeric(10)}@example.com`,
      password: 'TestPassword123!',
      name: faker.person.fullName(),
    }
    await use(user)
  },

  // Supabase admin client for cleanup (optional)
  supabaseAdmin: async ({}, use: (arg: unknown) => Promise<void>) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      await use(supabase)
    } else {
      // If credentials not available, use a no-op
      await use(null)
    }
  },

  // Authenticated page - automatically signs up and logs in
  authenticatedPage: async ({ page, testUser, supabaseAdmin }: { page: unknown; testUser: unknown; supabaseAdmin: unknown }, use: (arg: unknown) => Promise<void>) => {
    // Option 1: Use Supabase admin to create and verify user (faster)
    if (supabaseAdmin) {
      try {
        const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
          email: testUser.email,
          password: testUser.password,
          email_confirm: true, // Skip email verification
          user_metadata: {
            name: testUser.name,
          },
        })

        if (!signUpError && signUpData?.user) {
          // User created, now log in via UI
          await page.goto('/login')
          await page.fill('input[type="email"]', testUser.email)
          await page.fill('input[type="password"]', testUser.password)
          await page.click('button:has-text("Login"), button:has-text("Log in")')
          await page.waitForURL(/\/dashboard/, { timeout: 10000 })
        }
      } catch (error) {
        console.warn('Failed to create user via admin, falling back to UI signup:', error)
      }
    }

    // Option 2: Fallback to UI signup if admin method failed
    if (!page.url().includes('/dashboard')) {
      // Sign up via UI
      await page.goto('/signup')
      await page.fill('input[type="email"]', testUser.email)
      
      // Try to fill name field (may not exist)
      const nameInput = page.locator('input[type="text"][placeholder*="name" i], input[name*="name" i]')
      if (await nameInput.count() > 0) {
        await nameInput.fill(testUser.name)
      }
      
      const passwordInputs = await page.locator('input[type="password"]').all()
      await passwordInputs[0].fill(testUser.password)
      if (passwordInputs.length > 1) {
        await passwordInputs[1].fill(testUser.password)
      }

      await page.click('button:has-text("Signup"), button:has-text("Sign up")')
      
      // Wait for redirect
      await page.waitForURL(/\/verify-email|\/dashboard/, { timeout: 10000 })
      
      // If email verification required, try to verify via admin or skip
      if (page.url().includes('/verify-email') && supabaseAdmin) {
        try {
          const { data: users } = await supabaseAdmin.auth.admin.listUsers()
          const user = users?.users.find((u: any) => u.email === testUser.email)
          if (user) {
            await supabaseAdmin.auth.admin.updateUserById(user.id, {
              email_confirm: true,
            })
          }
        } catch (error) {
          console.warn('Could not verify email via admin')
        }
        
        // Navigate to login
        await page.goto('/login')
        await page.fill('input[type="email"]', testUser.email)
        await page.fill('input[type="password"]', testUser.password)
        await page.click('button:has-text("Login"), button:has-text("Log in")')
        await page.waitForURL(/\/dashboard/, { timeout: 10000 })
      }
    }

    // Use the authenticated page
    await use(page)

    // Cleanup: Delete test user
    if (supabaseAdmin) {
      try {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers()
        const user = users?.users.find((u: any) => u.email === testUser.email)
        if (user) {
          await supabaseAdmin.auth.admin.deleteUser(user.id)
        }
      } catch (error) {
        console.warn('Failed to cleanup test user:', error)
      }
    }
  },
})

export { expect }
