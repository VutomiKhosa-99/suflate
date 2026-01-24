/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/suflate/posts/[id]/move/route'

// Mock Supabase
const mockSupabaseFrom = jest.fn()

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: mockSupabaseFrom,
  })),
}))

// Mock auth helper
jest.mock('@/utils/supabase/auth-helper', () => ({
  getAuthUser: jest.fn(),
}))

import { getAuthUser } from '@/utils/supabase/auth-helper'

const mockGetAuthUser = getAuthUser as jest.MockedFunction<typeof getAuthUser>

describe('POST /api/suflate/posts/[id]/move - Story 3.8', () => {
  const mockParams = { params: Promise.resolve({ id: 'post-123' }) }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    mockGetAuthUser.mockResolvedValue({ user: null, error: new Error('Unauthorized') })

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123/move', {
      method: 'POST',
      body: JSON.stringify({ targetWorkspaceId: 'workspace-2' }),
    })

    const response = await POST(request, mockParams)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 if targetWorkspaceId is missing', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123/move', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request, mockParams)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('targetWorkspaceId is required')
  })

  it('should return 404 if post is not found', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    const mockPostQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }

    mockSupabaseFrom.mockReturnValue(mockPostQuery)

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123/move', {
      method: 'POST',
      body: JSON.stringify({ targetWorkspaceId: 'workspace-2' }),
    })

    const response = await POST(request, mockParams)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Post not found')
  })

  it('should return 403 if user does not have access to source workspace', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    // Track which table is being queried
    let callCount = 0
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'posts') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'post-123', workspace_id: 'workspace-1' },
            error: null,
          }),
        }
      }
      if (table === 'workspace_members') {
        callCount++
        // First call: source workspace membership check
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null, // No membership
              error: null,
            }),
          }
        }
      }
      return {}
    })

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123/move', {
      method: 'POST',
      body: JSON.stringify({ targetWorkspaceId: 'workspace-2' }),
    })

    const response = await POST(request, mockParams)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('You do not have access to the source workspace')
  })

  it('should return 403 if user does not have access to target workspace', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    let membershipCallCount = 0
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'posts') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'post-123', workspace_id: 'workspace-1' },
            error: null,
          }),
        }
      }
      if (table === 'workspace_members') {
        membershipCallCount++
        const mockMembershipQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: membershipCallCount === 1 ? { role: 'owner' } : null,
            error: null,
          }),
        }
        return mockMembershipQuery
      }
      return {}
    })

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123/move', {
      method: 'POST',
      body: JSON.stringify({ targetWorkspaceId: 'workspace-2' }),
    })

    const response = await POST(request, mockParams)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('You do not have access to the target workspace')
  })

  it('should return 400 if post is already in target workspace', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'posts') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'post-123', workspace_id: 'workspace-1' },
            error: null,
          }),
        }
      }
      if (table === 'workspace_members') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { role: 'owner' },
            error: null,
          }),
        }
      }
      return {}
    })

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123/move', {
      method: 'POST',
      body: JSON.stringify({ targetWorkspaceId: 'workspace-1' }), // Same as current workspace
    })

    const response = await POST(request, mockParams)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Post is already in the target workspace')
  })

  it('should successfully move post to target workspace', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    const updatedPost = {
      id: 'post-123',
      workspace_id: 'workspace-2',
      content: 'Test post',
    }

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'posts') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'post-123', workspace_id: 'workspace-1' },
            error: null,
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: updatedPost,
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'workspace_members') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { role: 'owner' },
            error: null,
          }),
        }
      }
      return {}
    })

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123/move', {
      method: 'POST',
      body: JSON.stringify({ targetWorkspaceId: 'workspace-2' }),
    })

    const response = await POST(request, mockParams)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.movedFrom).toBe('workspace-1')
    expect(data.movedTo).toBe('workspace-2')
  })
})
