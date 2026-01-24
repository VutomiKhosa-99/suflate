# E2E Testing with Playwright - Quick Start

## ✅ Setup Complete!

Playwright E2E tests are now set up and ready to run. The tests automate the complete authentication and FTUX flow.

## Quick Start

### 1. Install Browsers (One-time setup)

```bash
npx playwright install chromium
```

### 2. Run Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (recommended for first run)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

## What's Tested

### ✅ Authentication Flow (`auth-flow.spec.ts`)
- Sign up with email/password
- Form validation (empty fields, password mismatch)
- Login with valid credentials
- Error handling for invalid credentials
- Route protection (redirects unauthenticated users)
- Redirect authenticated users away from auth pages

### ✅ FTUX Critical Path (`ftux-flow.spec.ts`)
- Landing page → Record page navigation
- Voice recorder UI (large mic button, timer, waveform)
- Microphone permission error handling
- Processing stepper display
- Post variations with tabs
- Editor with AI assist toolbar
- LinkedIn connect card

### ✅ Voice Recording (`voice-recording-e2e.spec.ts`)
- Recording interface display
- File upload option
- File upload handling
- Invalid file type validation
- Waveform display
- Timer display

## Test Features

### Automatic User Management
- Tests automatically create test users
- Users are cleaned up after tests complete
- Uses Supabase admin API for faster setup (if available)
- Falls back to UI signup if admin API not available

### Smart Authentication
- `authenticatedPage` fixture provides pre-authenticated pages
- Skips email verification for faster tests
- Handles both admin-created and UI-created users

### Test Data
- Uses Faker.js for random test data
- Each test gets unique email: `test-{random}@example.com`
- Consistent password: `TestPassword123!`

## Environment Setup

Make sure your `.env.local` has:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key  # Optional but recommended
```

**Note:** If `SUPABASE_SERVICE_ROLE_KEY` is set, tests will create users via admin API (faster). Otherwise, tests will use the UI signup flow.

## Running Specific Tests

```bash
# Run only auth tests
npx playwright test auth-flow

# Run only FTUX tests
npx playwright test ftux-flow

# Run with grep filter
npx playwright test --grep "sign up"
```

## Viewing Results

After tests run, view the HTML report:

```bash
npm run test:e2e:report
```

This opens an interactive HTML report with:
- Test results
- Screenshots on failure
- Videos on failure
- Trace files for debugging

## Debugging Tests

### Debug Mode

```bash
npm run test:e2e:debug
```

This opens Playwright Inspector where you can:
- Step through tests
- Inspect page state
- See network requests
- View console logs

### UI Mode (Recommended)

```bash
npm run test:e2e:ui
```

Opens Playwright UI where you can:
- See all tests
- Run tests individually
- Watch tests execute
- Debug failures easily

## Test Structure

```
tests/e2e/
├── fixtures/
│   └── auth.ts          # Authentication fixtures
├── auth-flow.spec.ts    # Authentication tests
├── ftux-flow.spec.ts    # FTUX flow tests
├── voice-recording-e2e.spec.ts  # Voice recording tests
└── README.md            # Detailed documentation
```

## Next Steps

1. **Run the tests**: `npm run test:e2e:ui`
2. **Review results**: Check the HTML report
3. **Add more tests**: Follow the patterns in existing tests
4. **Integrate with CI**: Tests are ready for CI/CD pipelines

## Troubleshooting

### "Missing Supabase credentials"
- Check `.env.local` has required variables
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

### "Port 3000 already in use"
- Tests will reuse existing `npm run dev` server
- Or stop any process on port 3000

### "Browser not found"
- Run `npx playwright install chromium`

### Tests fail with auth errors
- Check email verification is disabled in Supabase (Settings → Auth → Email)
- Or ensure `SUPABASE_SERVICE_ROLE_KEY` is set for admin user creation

## CI/CD Integration

Tests are configured for CI:
- Retries: 2 attempts on failure
- Reports: HTML + JUnit XML
- Screenshots: On failure
- Videos: On failure

Add to your CI pipeline:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npm run test:e2e
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

---

**Ready to test!** Run `npm run test:e2e:ui` to get started. 🚀
