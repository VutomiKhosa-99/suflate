import { POST } from '@/app/api/suflate/amplify/route'
import { createClient } from '@/utils/supabase/server'
import { generatePostVariations } from '@/lib/integrations/openrouter'

// Mock Supabase
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}))

// Mock OpenRouter integration
jest.mock('@/lib/integrations/openrouter', () => ({
  generatePostVariations: jest.fn(),
}))

// Mock crypto.randomUUID
const mockRandomUUID = jest.fn(() => 'test-post-id')
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: () => mockRandomUUID(),
}))

describe('POST /api/suflate/amplify - Story 1.5', () => {
  function createMockFrom() {
    const chain = {
      select: jest.fn(() => chain),
      eq: jest.fn(() => chain),
      single: jest.fn(),
      insert: jest.fn(() => chain),
    }
    return chain
  }

  const mockSupabaseClient = {
    from: jest.fn(),
  }

  const mockGeneratePostVariations = generatePostVariations as jest.MockedFunction<
    typeof generatePostVariations
  >

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabaseClient)
    mockSupabaseClient.from.mockImplementation(() => createMockFrom())
  })

  describe('Given I have a transcribed voice note', () => {
    test('When I request amplification, Then 5 post variations are generated', async () => {
      const transcriptionId = 'test-transcription-id'

      // Mock transcription exists
      const transcriptionChain = createMockFrom()
      transcriptionChain.single.mockResolvedValue({
        data: {
          id: transcriptionId,
          recording_id: 'test-recording-id',
          processed_text: 'This is a test transcription.',
          raw_text: 'This is a test transcription.',
          detected_language: 'en',
        },
        error: null,
      })
      mockSupabaseClient.from.mockReturnValueOnce(transcriptionChain as any)

      // Mock post variations generation
      const variations = [
        'Professional thought leadership post',
        'Personal story post',
        'Actionable tips post',
        'Discussion starter post',
        'Bold opinion post',
      ]

      mockGeneratePostVariations.mockResolvedValueOnce({
        variations,
        usage: {
          prompt_tokens: 100,
          completion_tokens: 500,
          total_tokens: 600,
        },
      })

      // Mock post insertions (5 posts)
      const variationTypes = ['professional', 'personal', 'actionable', 'discussion', 'bold']
      
      variationTypes.forEach((type, index) => {
        const insertChain = createMockFrom()
        insertChain.single = jest.fn().mockResolvedValue({
          data: {
            id: `post-${index}-id`,
            transcription_id: transcriptionId,
            content: variations[index],
            variation_type: type,
            status: 'draft',
          },
          error: null,
        })
        mockSupabaseClient.from.mockReturnValueOnce(insertChain as any)
      })

      const request = new Request('http://localhost:3000/api/suflate/amplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcriptionId }),
      }) as any

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('posts')
      expect(data.posts).toHaveLength(5)
      expect(mockGeneratePostVariations).toHaveBeenCalledWith(
        'This is a test transcription.',
        expect.any(Object)
      )
    })

    test('When amplification completes, Then posts are stored in database', async () => {
      const transcriptionId = 'test-transcription-id'

      const transcriptionChain = createMockFrom()
      transcriptionChain.single.mockResolvedValue({
        data: {
          id: transcriptionId,
          processed_text: 'Test transcription',
          raw_text: 'Test transcription',
        },
        error: null,
      })
      mockSupabaseClient.from.mockReturnValueOnce(transcriptionChain as any)

      mockGeneratePostVariations.mockResolvedValueOnce({
        variations: ['Variation 1', 'Variation 2', 'Variation 3', 'Variation 4', 'Variation 5'],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 500,
          total_tokens: 600,
        },
      })

      const variationTypes = ['professional', 'personal', 'actionable', 'discussion', 'bold']
      
      variationTypes.forEach((type, index) => {
        const insertChain = createMockFrom()
        insertChain.single.mockResolvedValue({
          data: { id: `post-${index}-id` },
          error: null,
        })
        mockSupabaseClient.from.mockReturnValueOnce(insertChain as any)
      })

      const request = new Request('http://localhost:3000/api/suflate/amplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcriptionId }),
      }) as any

      await POST(request)

      // Verify posts were inserted
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(6) // 1 transcription fetch + 5 post inserts
    })

    test('When amplification completes, Then each post has correct variation_type', async () => {
      const transcriptionId = 'test-transcription-id'

      const transcriptionChain = createMockFrom()
      transcriptionChain.single.mockResolvedValue({
        data: {
          id: transcriptionId,
          processed_text: 'Test transcription',
        },
        error: null,
      })
      mockSupabaseClient.from.mockReturnValueOnce(transcriptionChain as any)

      mockGeneratePostVariations.mockResolvedValueOnce({
        variations: ['Var 1', 'Var 2', 'Var 3', 'Var 4', 'Var 5'],
        usage: { prompt_tokens: 100, completion_tokens: 500, total_tokens: 600 },
      })

      const variationTypes = ['professional', 'personal', 'actionable', 'discussion', 'bold']
      const mockInserts: jest.Mock[] = []
      
      variationTypes.forEach((type, index) => {
        const insertChain = createMockFrom()
        insertChain.single.mockResolvedValue({
          data: { id: `post-${index}-id` },
          error: null,
        })
        mockInserts.push(insertChain.insert as jest.Mock)
        mockSupabaseClient.from.mockReturnValueOnce(insertChain as any)
      })

      const request = new Request('http://localhost:3000/api/suflate/amplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcriptionId }),
      }) as any

      await POST(request)

      // Verify each insert was called with correct variation_type
      mockInserts.forEach((mockInsert, index) => {
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            variation_type: variationTypes[index],
          })
        )
      })
    })
  })

  describe('Error Handling', () => {
    test('Given transcription does not exist, When I request amplification, Then I see an error', async () => {
      const transcriptionId = 'non-existent-id'

      const transcriptionChain = createMockFrom()
      transcriptionChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      })
      mockSupabaseClient.from.mockReturnValueOnce(transcriptionChain as any)

      const request = new Request('http://localhost:3000/api/suflate/amplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcriptionId }),
      }) as any

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('Transcription not found')
      expect(mockGeneratePostVariations).not.toHaveBeenCalled()
    })

    test('Given OpenRouter API fails, When error occurs, Then I see an error message', async () => {
      const transcriptionId = 'test-transcription-id'

      const transcriptionChain = createMockFrom()
      transcriptionChain.single.mockResolvedValue({
        data: {
          id: transcriptionId,
          processed_text: 'Test transcription',
        },
        error: null,
      })
      mockSupabaseClient.from.mockReturnValueOnce(transcriptionChain as any)

      mockGeneratePostVariations.mockRejectedValueOnce(
        new Error('OpenRouter API error')
      )

      const request = new Request('http://localhost:3000/api/suflate/amplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcriptionId }),
      }) as any

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to generate post variations')
    })
  })
})
