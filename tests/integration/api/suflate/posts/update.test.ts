/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, PATCH, DELETE } from '@/app/api/suflate/posts/[id]/route'

// Mock Supabase
const mockSupabaseUpdate = jest.fn()
const mockSupabaseDelete = jest.fn()
const mockSupabaseSelect = jest.fn()
const mockSupabaseFrom = jest.fn(() => ({
  select: mockSupabaseSelect,
  update: mockSupabaseUpdate,
  delete: mockSupabaseDelete,
}))

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

describe('GET /api/suflate/posts/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    mockGetAuthUser.mockResolvedValue({ user: null, error: new Error('Unauthorized') })

    const request = new NextRequest('http://localhost/api/suflate/posts/123')
    const response = await GET(request, { params: Promise.resolve({ id: '123' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return post for authenticated user', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    const mockPost = {
      id: 'post-123',
      content: 'Test content',
      variation_type: 'professional',
      status: 'draft',
    }

    mockSupabaseSelect.mockReturnValue({
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockPost, error: null }),
    })

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123')
    const response = await GET(request, { params: Promise.resolve({ id: 'post-123' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.post).toEqual(mockPost)
  })

  it('should return 404 if post not found', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    mockSupabaseSelect.mockReturnValue({
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      }),
    })

    const request = new NextRequest('http://localhost/api/suflate/posts/nonexistent')
    const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Post not found')
  })
})

describe('PATCH /api/suflate/posts/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    mockGetAuthUser.mockResolvedValue({ user: null, error: new Error('Unauthorized') })

    const request = new NextRequest('http://localhost/api/suflate/posts/123', {
      method: 'PATCH',
      body: JSON.stringify({ content: 'Updated content' }),
    })
    const response = await PATCH(request, { params: Promise.resolve({ id: '123' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should update post content', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    const updatedPost = {
      id: 'post-123',
      content: 'Updated content',
      word_count: 2,
      character_count: 15,
    }

    mockSupabaseUpdate.mockReturnValue({
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: updatedPost, error: null }),
    })

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123', {
      method: 'PATCH',
      body: JSON.stringify({ content: 'Updated content' }),
    })
    const response = await PATCH(request, { params: Promise.resolve({ id: 'post-123' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.post).toEqual(updatedPost)
  })

  it('should update post tags', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    const updatedPost = {
      id: 'post-123',
      tags: ['test', 'demo'],
    }

    mockSupabaseUpdate.mockReturnValue({
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: updatedPost, error: null }),
    })

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123', {
      method: 'PATCH',
      body: JSON.stringify({ tags: ['test', 'demo'] }),
    })
    const response = await PATCH(request, { params: Promise.resolve({ id: 'post-123' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.post.tags).toEqual(['test', 'demo'])
  })

  it('should return 400 if no update fields provided', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123', {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
    const response = await PATCH(request, { params: Promise.resolve({ id: 'post-123' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('No update fields provided')
  })

  it('should return 400 for invalid status', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'invalid' }),
    })
    const response = await PATCH(request, { params: Promise.resolve({ id: 'post-123' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid status')
  })

  it('should return 400 for invalid tags format', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123', {
      method: 'PATCH',
      body: JSON.stringify({ tags: 'not-an-array' }),
    })
    const response = await PATCH(request, { params: Promise.resolve({ id: 'post-123' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Tags must be an array of strings')
  })
})

describe('DELETE /api/suflate/posts/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    mockGetAuthUser.mockResolvedValue({ user: null, error: new Error('Unauthorized') })

    const request = new NextRequest('http://localhost/api/suflate/posts/123', {
      method: 'DELETE',
    })
    const response = await DELETE(request, { params: Promise.resolve({ id: '123' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should soft delete post by default', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    mockSupabaseUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    })

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123', {
      method: 'DELETE',
    })
    const response = await DELETE(request, { params: Promise.resolve({ id: 'post-123' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.deleted).toBe(true)
    expect(data.hardDelete).toBe(false)
    expect(mockSupabaseUpdate).toHaveBeenCalled()
  })

  it('should hard delete when hard=true', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    mockSupabaseDelete.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    })

    const request = new NextRequest('http://localhost/api/suflate/posts/post-123?hard=true', {
      method: 'DELETE',
    })
    const response = await DELETE(request, { params: Promise.resolve({ id: 'post-123' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.deleted).toBe(true)
    expect(data.hardDelete).toBe(true)
    expect(mockSupabaseDelete).toHaveBeenCalled()
  })
})
