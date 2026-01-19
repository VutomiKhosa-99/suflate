# Test-Driven Development (TDD) Guide for Suflate

## TDD Process

We follow **Test-Driven Development** for all story implementations:

1. **RED** - Write failing tests first
2. **GREEN** - Implement minimum code to pass tests
3. **REFACTOR** - Improve code while keeping tests green

## Testing Structure

### Test Organization

```
tests/
├── __mocks__/              # Mock files and utilities
├── unit/                   # Unit tests (components, utilities)
│   └── components/
│       └── features/
├── integration/            # Integration tests (API routes, services)
│   └── api/
└── e2e/                    # End-to-end test specifications
```

### Test Types

**Unit Tests:**
- Test individual components in isolation
- Mock external dependencies (APIs, Supabase, etc.)
- Fast execution
- Example: `tests/unit/components/features/voice-recorder/voice-recorder.test.tsx`

**Integration Tests:**
- Test API routes and service interactions
- Test with real Supabase client (mocked)
- Verify data flow between components
- Example: `tests/integration/api/suflate/voice/upload.test.ts`

**E2E Tests:**
- Test complete user flows
- Use Playwright or Cypress (future implementation)
- Test in real browser environment
- Example: `tests/e2e/voice-recording.spec.ts`

## Testing Standards

### Writing Tests

1. **Test Structure**: Follow Given-When-Then pattern matching acceptance criteria
2. **Test Naming**: Descriptive names that explain what is being tested
3. **Test Isolation**: Each test should be independent
4. **Mock External Services**: Mock Supabase, APIs, and browser APIs
5. **Coverage**: Aim for >80% code coverage on new code

### Test Examples

```typescript
// Unit Test Example
describe('VoiceRecorder Component', () => {
  test('Given I am on the recording screen, When I tap record, Then recording starts', async () => {
    // Arrange (Given)
    render(<VoiceRecorder />)
    
    // Act (When)
    await user.click(screen.getByRole('button', { name: /record/i }))
    
    // Assert (Then)
    expect(mockMediaRecorder.start).toHaveBeenCalled()
  })
})
```

```typescript
// Integration Test Example
describe('POST /api/suflate/voice/upload', () => {
  test('Given valid audio file, When uploaded, Then it is stored in Supabase', async () => {
    // Test implementation
  })
})
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test voice-recorder.test.tsx
```

## Test Coverage Goals

- **Unit Tests**: >90% coverage for components and utilities
- **Integration Tests**: >80% coverage for API routes
- **E2E Tests**: Cover critical user flows

## TDD Workflow Per Story

1. **Read Story & Acceptance Criteria**
   - Understand what needs to be built
   - Identify test cases from acceptance criteria

2. **Write Tests First (RED)**
   - Write unit tests for components
   - Write integration tests for API routes
   - Write E2E test specifications
   - All tests should fail initially

3. **Implement Feature (GREEN)**
   - Write minimum code to pass tests
   - Focus on making tests green, not perfect code

4. **Refactor (REFACTOR)**
   - Improve code quality
   - Keep all tests passing
   - Maintain test coverage

5. **Review**
   - Ensure all acceptance criteria are tested
   - Verify edge cases are covered
   - Check test coverage

## Mocking Guidelines

### Supabase Client
```typescript
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => ({
    // Mock Supabase client
  })),
}))
```

### Browser APIs
```typescript
global.navigator.mediaDevices = {
  getUserMedia: jest.fn(),
} as any
```

### Next.js Router
```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))
```

## Test Data Factories

Create reusable test data factories for common entities:

```typescript
// tests/__mocks__/factories.ts
export const createMockRecording = (overrides = {}) => ({
  id: 'test-id',
  workspace_id: 'workspace-id',
  user_id: 'user-id',
  status: 'uploaded',
  ...overrides,
})
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Before deployment

## Best Practices

1. **Test Behavior, Not Implementation**: Test what the user sees/experiences
2. **Keep Tests Fast**: Unit tests should run in <1 second
3. **Avoid Test Interdependence**: Each test should work in isolation
4. **Use Descriptive Assertions**: Clear error messages when tests fail
5. **Test Edge Cases**: Invalid inputs, error states, boundary conditions
6. **Maintain Test Quality**: Refactor tests when refactoring code

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)
