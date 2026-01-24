/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST, PATCH, DELETE, GET } from '@/app/api/suflate/posts/[id]/schedule/route'

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

describe('POST /api/suflate/posts/[id]/schedule - Story 4.1, 4.2', () => {
  const mockParams = { params: Promise.resolve({ id: 'post-123' }) }
  const futureDate = new Date(Date.now() + 86400000).toISOString() // Tomorrow

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    mockGetAuthUser.mockResolvedValue({ user: null, error: new Error('Unauthorized') })

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123/schedule', {
      method: 'POST',
      body: JSON.stringify({ scheduledFor: futureDate }),
    })

    const response = await POST(request, mockParams)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 if scheduledFor is missing', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123/schedule', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request, mockParams)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('scheduledFor is required')
  })

  it('should return 400 if scheduledFor is in the past', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    const pastDate = new Date(Date.now() - 86400000).toISOString() // Yesterday
    const request = new NextRequest('http://localhost/api/suflate/posts/post-123/schedule', {
      method: 'POST',
      body: JSON.stringify({ scheduledFor: pastDate }),
    })

    const response = await POST(request, mockParams)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Scheduled time must be in the future')
  })

  it('should return 404 if post is not found', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'posts') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      return {}
    })

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123/schedule', {
      method: 'POST',
      body: JSON.stringify({ scheduledFor: futureDate }),
    })

    const response = await POST(request, mockParams)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Post not found')
  })

  it('should return 409 if post is already scheduled', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'posts') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'post-123', workspace_id: 'workspace-1', content: 'Test' },
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
      if (table === 'scheduled_posts') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'scheduled-123' }, // Already exists
            error: null,
          }),
        }
      }
      return {}
    })

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123/schedule', {
      method: 'POST',
      body: JSON.stringify({ scheduledFor: futureDate }),
    })

    const response = await POST(request, mockParams)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('Post is already scheduled. Use PATCH to reschedule.')
  })

  it('should successfully schedule a post', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'posts') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'post-123', workspace_id: 'workspace-1', content: 'Test' },
            error: null,
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
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
      if (table === 'scheduled_posts') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null, // No existing schedule
            error: null,
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'scheduled-new', scheduled_for: futureDate },
                error: null,
              }),
            }),
          }),
        }
      }
      return {}
    })

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123/schedule', {
      method: 'POST',
      body: JSON.stringify({ scheduledFor: futureDate }),
    })

    const response = await POST(request, mockParams)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.scheduledPost).toBeDefined()
  })
})

describe('DELETE /api/suflate/posts/[id]/schedule - Story 4.5', () => {
  const mockParams = { params: Promise.resolve({ id: 'post-123' }) }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    mockGetAuthUser.mockResolvedValue({ user: null, error: new Error('Unauthorized') })

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123/schedule', {
      method: 'DELETE',
    })

    const response = await DELETE(request, mockParams)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 404 if scheduled post is not found', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'scheduled_posts') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      return {}
    })

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123/schedule', {
      method: 'DELETE',
    })

    const response = await DELETE(request, mockParams)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Scheduled post not found')
  })

  it('should return 400 if post is already published', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'scheduled_posts') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'scheduled-123', workspace_id: 'workspace-1', posted: true },
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

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123/schedule', {
      method: 'DELETE',
    })

    const response = await DELETE(request, mockParams)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Cannot cancel a post that has already been published')
  })
})
