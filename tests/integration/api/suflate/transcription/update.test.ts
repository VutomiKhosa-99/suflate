import { PATCH } from '@/app/api/suflate/transcription/update/route'
import { createClient } from '@/utils/supabase/server'

// Mock Supabase
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}))

describe('PATCH /api/suflate/transcription/update - Story 1.4', () => {
  function createMockFrom() {
    const chain = {
      select: jest.fn(() => chain),
      eq: jest.fn(() => chain),
      single: jest.fn(),
      update: jest.fn(() => chain),
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

  describe('Given I have edited a transcription', () => {
    test('When I save changes, Then processed_text is updated in the database', async () => {
      const transcriptionId = 'test-transcription-id'
      const editedText = 'This is the edited transcription text.'

      const updateChain = createMockFrom()
      updateChain.eq.mockResolvedValue({
        data: {
          id: transcriptionId,
          processed_text: editedText,
        },
        error: null,
      })
      mockSupabaseClient.from.mockReturnValueOnce(updateChain as any)

      const request = new Request('http://localhost:3000/api/suflate/transcription/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptionId,
          processed_text: editedText,
        }),
      }) as any

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(updateChain.update).toHaveBeenCalledWith({
        processed_text: editedText,
      })
      expect(updateChain.eq).toHaveBeenCalledWith('id', transcriptionId)
      expect(data.success).toBe(true)
    })

    test('When transcription does not exist, Then I see an error', async () => {
      const transcriptionId = 'non-existent-id'

      const updateChain = createMockFrom()
      updateChain.eq.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      })
      mockSupabaseClient.from.mockReturnValueOnce(updateChain as any)

      const request = new Request('http://localhost:3000/api/suflate/transcription/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptionId,
          processed_text: 'Edited text',
        }),
      }) as any

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('Transcription not found')
    })

    test('When update fails, Then I see an error message', async () => {
      const transcriptionId = 'test-transcription-id'

      const updateChain = createMockFrom()
      updateChain.eq.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })
      mockSupabaseClient.from.mockReturnValueOnce(updateChain as any)

      const request = new Request('http://localhost:3000/api/suflate/transcription/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptionId,
          processed_text: 'Edited text',
        }),
      }) as any

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to update transcription')
    })
  })

  describe('Validation', () => {
    test('When processed_text is empty, Then I see a validation error', async () => {
      const request = new Request('http://localhost:3000/api/suflate/transcription/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptionId: 'test-id',
          processed_text: '',
        }),
      }) as any

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('processed_text is required')
    })

    test('When transcriptionId is missing, Then I see a validation error', async () => {
      const request = new Request('http://localhost:3000/api/suflate/transcription/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processed_text: 'Edited text',
        }),
      }) as any

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('transcriptionId is required')
    })
  })
})
