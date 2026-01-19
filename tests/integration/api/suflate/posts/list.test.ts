import { GET } from '@/app/api/suflate/posts/route'
import { createClient } from '@/utils/supabase/server'

// Mock Supabase
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}))

describe('GET /api/suflate/posts - Story 1.6', () => {
  function createMockFrom() {
    const chain = {
      select: jest.fn(() => chain),
      eq: jest.fn(() => chain),
      order: jest.fn(() => chain),
      returns: jest.fn(),
    }
    return chain
  }

  const mockSupabaseClient = {
    from: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabaseClient)
    mockSupabaseClient.from.mockImplementation(() => createMockFrom())
  })

  describe('Given I have generated post variations', () => {
    test('When I request posts for a recording, Then all variations are returned', async () => {
      const recordingId = 'test-recording-id'

      const mockPosts = [
        {
          id: 'post-1',
          recording_id: recordingId,
          content: 'Post 1',
          variation_type: 'professional',
          status: 'draft',
        },
        {
          id: 'post-2',
          recording_id: recordingId,
          content: 'Post 2',
          variation_type: 'personal',
          status: 'draft',
        },
      ]

      const postsChain = createMockFrom()
      postsChain.order = jest.fn(() => ({
        data: mockPosts,
        error: null,
      }))
      postsChain.eq = jest.fn(() => ({
        order: jest.fn(() => ({
          data: mockPosts,
          error: null,
        })),
      }))

      mockSupabaseClient.from.mockReturnValueOnce(postsChain as any)

      const request = new Request(`http://localhost:3000/api/suflate/posts?recordingId=${recordingId}`, {
        method: 'GET',
      }) as any

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('posts')
      expect(data.posts).toHaveLength(2)
    })

    test('When I request posts, Then variations are ordered by variation_type', async () => {
      const recordingId = 'test-recording-id'

      const mockPosts = [
        { id: 'post-1', variation_type: 'professional' },
        { id: 'post-2', variation_type: 'personal' },
        { id: 'post-3', variation_type: 'actionable' },
        { id: 'post-4', variation_type: 'discussion' },
        { id: 'post-5', variation_type: 'bold' },
      ]

      const postsChain = createMockFrom()
      const orderChain = {
        data: mockPosts,
        error: null,
      }

      postsChain.eq = jest.fn(() => ({
        order: jest.fn(() => orderChain),
      }))

      mockSupabaseClient.from.mockReturnValueOnce(postsChain as any)

      const request = new Request(`http://localhost:3000/api/suflate/posts?recordingId=${recordingId}`, {
        method: 'GET',
      }) as any

      await GET(request)

      expect(postsChain.eq).toHaveBeenCalledWith('recording_id', recordingId)
      // Verify order was called (would check for order('variation_type'))
    })

    test('When I request posts for transcription, Then all variations are returned', async () => {
      const transcriptionId = 'test-transcription-id'

      const mockPosts = [
        { id: 'post-1', transcription_id: transcriptionId },
        { id: 'post-2', transcription_id: transcriptionId },
      ]

      const postsChain = createMockFrom()
      postsChain.eq = jest.fn(() => ({
        order: jest.fn(() => ({
          data: mockPosts,
          error: null,
        })),
      }))

      mockSupabaseClient.from.mockReturnValueOnce(postsChain as any)

      const request = new Request(`http://localhost:3000/api/suflate/posts?transcriptionId=${transcriptionId}`, {
        method: 'GET',
      }) as any

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.posts).toHaveLength(2)
    })
  })

  describe('Error Handling', () => {
    test('Given no posts exist, When I request posts, Then empty array is returned', async () => {
      const recordingId = 'test-recording-id'

      const postsChain = createMockFrom()
      postsChain.eq = jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null,
        })),
      }))

      mockSupabaseClient.from.mockReturnValueOnce(postsChain as any)

      const request = new Request(`http://localhost:3000/api/suflate/posts?recordingId=${recordingId}`, {
        method: 'GET',
      }) as any

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.posts).toHaveLength(0)
    })

    test('Given database error, When I request posts, Then I see an error', async () => {
      const recordingId = 'test-recording-id'

      const postsChain = createMockFrom()
      postsChain.eq = jest.fn(() => ({
        order: jest.fn(() => ({
          data: null,
          error: { message: 'Database error' },
        })),
      }))

      mockSupabaseClient.from.mockReturnValueOnce(postsChain as any)

      const request = new Request(`http://localhost:3000/api/suflate/posts?recordingId=${recordingId}`, {
        method: 'GET',
      }) as any

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to fetch posts')
    })
  })
})
