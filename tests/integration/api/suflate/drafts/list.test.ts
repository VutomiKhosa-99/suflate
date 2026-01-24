/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/suflate/drafts/route'

// Mock Supabase
const mockSupabaseSelect = jest.fn()
const mockSupabaseFrom = jest.fn(() => ({
  select: mockSupabaseSelect,
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

describe('GET /api/suflate/drafts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    mockGetAuthUser.mockResolvedValue({ user: null, error: new Error('Unauthorized') })

    const request = new NextRequest('http://localhost/api/suflate/drafts')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return drafts for authenticated user', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    // Create a chainable mock that handles all query methods
    const createChainableMock = (finalData: any, finalCount?: number) => {
      const mock: any = {}
      const chainMethods = ['select', 'eq', 'limit', 'single', 'order', 'range', 'ilike', 'overlaps']
      
      chainMethods.forEach(method => {
        if (method === 'single') {
          mock[method] = jest.fn().mockResolvedValue({ data: finalData, error: null })
        } else {
          mock[method] = jest.fn().mockReturnValue(mock)
        }
      })
      
      // Make the last chained call resolve with data
      mock.range = jest.fn().mockResolvedValue({ 
        data: Array.isArray(finalData) ? finalData : [finalData], 
        count: finalCount ?? 1, 
        error: null 
      })
      
      return mock
    }

    const membershipMock = createChainableMock({ workspace_id: 'workspace-123' })
    const draftsMock = createChainableMock([
      {
        id: 'post-1',
        content: 'Test draft content',
        source_type: 'voice',
        variation_type: 'professional',
        status: 'draft',
        tags: ['test'],
        created_at: new Date().toISOString(),
      },
    ], 1)
    const tagsMock = createChainableMock([{ tags: ['test', 'demo'] }])
    // For tags query the chain ends with .eq().eq() - need different structure
    tagsMock.eq = jest.fn().mockImplementation(() => ({
      eq: jest.fn().mockResolvedValue({ data: [{ tags: ['test', 'demo'] }], error: null })
    }))

    let postsQueryCount = 0
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'workspace_members') return membershipMock
      if (table === 'posts') {
        postsQueryCount++
        // First call is for drafts list, second is for tags
        if (postsQueryCount === 1) return draftsMock
        return tagsMock
      }
      return {}
    })

    const request = new NextRequest('http://localhost/api/suflate/drafts')
    const response = await GET(request)

    expect(response.status).toBe(200)
  })

  it('should apply search filter when provided', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { workspace_id: 'workspace-123' },
        error: null,
      }),
      overlaps: jest.fn().mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      }),
    }

    mockSupabaseFrom.mockReturnValue(mockQuery)

    const request = new NextRequest('http://localhost/api/suflate/drafts?search=test')
    await GET(request)

    // Verify ilike was called for search
    expect(mockQuery.ilike).toHaveBeenCalled()
  })

  it('should filter by source type', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { workspace_id: 'workspace-123' },
        error: null,
      }),
      overlaps: jest.fn().mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      }),
    }

    mockSupabaseFrom.mockReturnValue(mockQuery)

    const request = new NextRequest('http://localhost/api/suflate/drafts?sourceType=voice')
    await GET(request)

    // Verify eq was called with source_type
    expect(mockQuery.eq).toHaveBeenCalledWith('source_type', 'voice')
  })

  it('should filter by tags', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { workspace_id: 'workspace-123' },
        error: null,
      }),
      overlaps: jest.fn().mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      }),
    }

    mockSupabaseFrom.mockReturnValue(mockQuery)

    const request = new NextRequest('http://localhost/api/suflate/drafts?tags=test,demo')
    await GET(request)

    // Verify overlaps was called for tags
    expect(mockQuery.overlaps).toHaveBeenCalledWith('tags', ['test', 'demo'])
  })

  it('should return 404 when user has no workspace', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }

    mockSupabaseFrom.mockReturnValue(mockQuery)

    const request = new NextRequest('http://localhost/api/suflate/drafts')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('No workspace found')
  })
})
