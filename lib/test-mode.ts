/**
 * Test mode utilities for testing before Epic 2 (Auth & Workspace) is complete
 * This allows testing the app with placeholder authentication
 */

export const TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE === 'true'

/**
 * Get placeholder user ID for testing
 */
export function getTestUserId(): string {
  return process.env.TEST_USER_ID || 'test-user-id-placeholder'
}

/**
 * Get placeholder workspace ID for testing
 */
export function getTestWorkspaceId(): string {
  return process.env.TEST_WORKSPACE_ID || 'test-workspace-id-placeholder'
}

/**
 * Check if we should use test mode (no real auth)
 */
export function shouldUseTestMode(): boolean {
  return TEST_MODE || process.env.NODE_ENV === 'development'
}
