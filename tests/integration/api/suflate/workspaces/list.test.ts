/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/suflate/workspaces/route'

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

describe('GET /api/suflate/workspaces - Story 3.8', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    mockGetAuthUser.mockResolvedValue({ user: null, error: new Error('Unauthorized') })

    const request = new NextRequest('http://localhost/api/suflate/workspaces')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return list of workspaces for authenticated user', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    const mockMemberships = [
      {
        workspace_id: 'workspace-1',
        role: 'owner',
        workspaces: {
          id: 'workspace-1',
          name: 'Personal Workspace',
          plan: 'starter',
          credits_remaining: 100,
          credits_total: 100,
        },
      },
      {
        workspace_id: 'workspace-2',
        role: 'admin',
        workspaces: {
          id: 'workspace-2',
          name: 'Client A',
          plan: 'agency',
          credits_remaining: 500,
          credits_total: 750,
        },
      },
    ]

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: mockMemberships,
        error: null,
      }),
    }

    mockSupabaseFrom.mockReturnValue(mockQuery)

    const request = new NextRequest('http://localhost/api/suflate/workspaces')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.workspaces).toHaveLength(2)
    expect(data.workspaces[0]).toEqual({
      id: 'workspace-1',
      name: 'Personal Workspace',
      plan: 'starter',
      credits_remaining: 100,
      credits_total: 100,
      role: 'owner',
    })
    expect(data.workspaces[1]).toEqual({
      id: 'workspace-2',
      name: 'Client A',
      plan: 'agency',
      credits_remaining: 500,
      credits_total: 750,
      role: 'admin',
    })
    expect(data.count).toBe(2)
  })

  it('should return empty array if user has no workspaces', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }

    mockSupabaseFrom.mockReturnValue(mockQuery)

    const request = new NextRequest('http://localhost/api/suflate/workspaces')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.workspaces).toEqual([])
    expect(data.count).toBe(0)
  })

  it('should filter out memberships with missing workspace data', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    const mockMemberships = [
      {
        workspace_id: 'workspace-1',
        role: 'owner',
        workspaces: {
          id: 'workspace-1',
          name: 'Personal Workspace',
          plan: 'starter',
          credits_remaining: 100,
          credits_total: 100,
        },
      },
      {
        workspace_id: 'workspace-2',
        role: 'admin',
        workspaces: null, // Missing workspace data
      },
    ]

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: mockMemberships,
        error: null,
      }),
    }

    mockSupabaseFrom.mockReturnValue(mockQuery)

    const request = new NextRequest('http://localhost/api/suflate/workspaces')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.workspaces).toHaveLength(1)
    expect(data.workspaces[0].name).toBe('Personal Workspace')
  })

  it('should return 500 on database error', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    }

    mockSupabaseFrom.mockReturnValue(mockQuery)

    const request = new NextRequest('http://localhost/api/suflate/workspaces')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch workspaces')
  })

  it('should include user role for each workspace', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetAuthUser.mockResolvedValue({ user: mockUser, error: null })

    const mockMemberships = [
      {
        workspace_id: 'workspace-1',
        role: 'owner',
        workspaces: {
          id: 'workspace-1',
          name: 'My Workspace',
          plan: 'starter',
          credits_remaining: 100,
          credits_total: 100,
        },
      },
      {
        workspace_id: 'workspace-2',
        role: 'editor',
        workspaces: {
          id: 'workspace-2',
          name: 'Team Workspace',
          plan: 'agency',
          credits_remaining: 500,
          credits_total: 750,
        },
      },
      {
        workspace_id: 'workspace-3',
        role: 'viewer',
        workspaces: {
          id: 'workspace-3',
          name: 'Readonly Workspace',
          plan: 'creator',
          credits_remaining: 200,
          credits_total: 250,
        },
      },
    ]

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: mockMemberships,
        error: null,
      }),
    }

    mockSupabaseFrom.mockReturnValue(mockQuery)

    const request = new NextRequest('http://localhost/api/suflate/workspaces')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.workspaces[0].role).toBe('owner')
    expect(data.workspaces[1].role).toBe('editor')
    expect(data.workspaces[2].role).toBe('viewer')
  })
})
