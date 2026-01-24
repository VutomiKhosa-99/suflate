# E2E Tests with Playwright

This directory contains end-to-end tests for Suflate using Playwright.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install chromium
```

### 3. Environment Variables

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Optional, for faster test user creation
```

## Running Tests

### Run All Tests

```bash
npm run test:e2e
```

### Run Tests in UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

### Run Tests in Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

### Run Tests in Debug Mode

```bash
npm run test:e2e:debug
```

### Run Specific Test File

```bash
npx playwright test auth-flow
npx playwright test ftux-flow
npx playwright test voice-recording-e2e
```

### View Test Report

```bash
npm run test:e2e:report
```

## Test Structure

- `auth-flow.spec.ts` - Authentication tests (signup, login, validation)
- `ftux-flow.spec.ts` - First Time User Experience flow tests
- `voice-recording-e2e.spec.ts` - Voice recording feature tests
- `fixtures/auth.ts` - Authentication fixtures and helpers

## Writing Tests

### Using Auth Fixtures

```typescript
import { test, expect } from './fixtures/auth'

test('my test', async ({ authenticatedPage, testUser }) => {
  // authenticatedPage is already logged in
  // testUser contains email, password, name
  await authenticatedPage.goto('/record')
  // ... your test
})
```

### Manual Authentication

```typescript
import { test, expect } from '@playwright/test'

test('manual login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'user@example.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button:has-text("Login")')
  await expect(page).toHaveURL(/\/dashboard/)
})
```

## Test Data

Tests use `@faker-js/faker` to generate random test data. Each test gets a unique user with:
- Random email: `test-{random}@example.com`
- Password: `TestPassword123!`
- Random name

Test users are automatically cleaned up after tests complete.

## CI/CD

Tests are configured to:
- Retry failed tests 2 times in CI
- Generate HTML reports
- Capture screenshots on failure
- Record videos on failure
- Generate JUnit XML for CI integration

## Troubleshooting

### Tests Fail with "Missing Supabase credentials"

Make sure `.env.local` has the required Supabase environment variables.

### Tests Fail with Authentication Errors

1. Check that email verification is disabled in Supabase Dashboard (for faster tests)
2. Or ensure `SUPABASE_SERVICE_ROLE_KEY` is set for admin user creation

### Browser Not Found

Run `npx playwright install chromium` to install the browser.

### Port 3000 Already in Use

The test server will try to reuse an existing server. If you have `npm run dev` running, tests will use that. Otherwise, stop any process on port 3000.
