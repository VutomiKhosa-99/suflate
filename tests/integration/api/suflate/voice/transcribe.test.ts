/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/suflate/voice/transcribe/route'
import { createClient } from '@/utils/supabase/server'
import { transcribeAudioFromUrl } from '@/lib/integrations/assemblyai'

// Mock Supabase
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}))

// Mock auth helper
jest.mock('@/utils/supabase/auth-helper', () => ({
  getAuthUser: jest.fn(),
}))

import { getAuthUser } from '@/utils/supabase/auth-helper'

const mockGetAuthUser = getAuthUser as jest.MockedFunction<typeof getAuthUser>

// Mock AssemblyAI integration
jest.mock('@/lib/integrations/assemblyai', () => ({
  transcribeAudioFromUrl: jest.fn(),
}))

// Mock crypto.randomUUID
const mockRandomUUID = jest.fn(() => 'test-transcription-id')
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: () => mockRandomUUID(),
}))

// Helper to create mock Supabase chain
function createMockFrom() {
  const chain = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    single: jest.fn(),
    update: jest.fn(() => chain),
    insert: jest.fn(() => chain),
  }
  return chain
}

describe('POST /api/suflate/voice/transcribe - Story 1.3', () => {
  const mockSupabaseClient = {
    from: jest.fn(),
    storage: {
      from: jest.fn(() => ({
        getPublicUrl: jest.fn(),
      })),
    },
  }

  const mockTranscribeAudioFromUrl = transcribeAudioFromUrl as jest.MockedFunction<
    typeof transcribeAudioFromUrl
  >

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock authenticated user
    mockGetAuthUser.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      error: null,
    })
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabaseClient)
    mockSupabaseClient.from.mockImplementation(() => createMockFrom())
  })

  describe('Given I have uploaded a voice recording', () => {
    test('When I request transcription, Then AssemblyAI transcribes the audio file', async () => {
      const recordingId = 'test-recording-id'

      // Mock recording exists
      const recordingChain = createMockFrom()
      recordingChain.single.mockResolvedValue({
        data: {
          id: recordingId,
          storage_path: 'workspace/user/recording.webm',
          status: 'uploaded',
        },
        error: null,
      })
      mockSupabaseClient.from.mockReturnValueOnce(recordingChain as any)

      // Mock public URL
      mockSupabaseClient.storage.from.mockReturnValueOnce({
        getPublicUrl: jest.fn().mockReturnValue({
          data: {
            publicUrl: 'https://supabase.co/storage/v1/object/public/voice-recordings/workspace/user/recording.webm',
          },
        }),
      } as any)

      // Mock AssemblyAI transcription
      mockTranscribeAudioFromUrl.mockResolvedValueOnce({
        text: 'This is a test transcription of the voice recording.',
        words: [
          { text: 'This', start: 0, end: 0.5, confidence: 0.99 },
          { text: 'is', start: 0.5, end: 0.7, confidence: 0.98 },
        ],
        language_code: 'en',
      })

      // Mock transcription record creation
      const insertChain = createMockFrom()
      insertChain.single.mockResolvedValue({
        data: {
          id: 'test-transcription-id',
          recording_id: recordingId,
          raw_text: 'This is a test transcription of the voice recording.',
          status: 'completed',
        },
        error: null,
      })
      mockSupabaseClient.from.mockReturnValueOnce(insertChain as any)

      // Mock recording status updates (transcribing, then transcribed)
      const updateChain1 = createMockFrom()
      updateChain1.eq.mockResolvedValue({ data: {}, error: null })
      const updateChain2 = createMockFrom()
      updateChain2.eq.mockResolvedValue({ data: {}, error: null })
      mockSupabaseClient.from.mockReturnValueOnce(updateChain1 as any)
      mockSupabaseClient.from.mockReturnValueOnce(updateChain2 as any)

      const request = new NextRequest('http://localhost:3000/api/suflate/voice/transcribe', {
        method: 'POST',
        body: JSON.stringify({ recordingId }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockTranscribeAudioFromUrl).toHaveBeenCalled()
      expect(data).toHaveProperty('transcriptionId')
      expect(data).toHaveProperty('text')
      expect(data.text).toContain('This is a test transcription')
    })

    test('When transcription completes, Then a transcription record is created in the database', async () => {
      const recordingId = 'test-recording-id'

      const recordingChain = createMockFrom()
      recordingChain.single.mockResolvedValue({
        data: {
          id: recordingId,
          storage_path: 'workspace/user/recording.webm',
          status: 'uploaded',
        },
        error: null,
      })
      mockSupabaseClient.from.mockReturnValueOnce(recordingChain as any)

      mockSupabaseClient.storage.from.mockReturnValueOnce({
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://test.com/audio.webm' },
        }),
      } as any)

      mockTranscribeAudioFromUrl.mockResolvedValueOnce({
        text: 'Test transcription',
        language_code: 'en',
      })

      const mockInsert = createMockFrom()
      mockInsert.single.mockResolvedValue({
        data: {
          id: 'transcription-id',
          recording_id: recordingId,
          raw_text: 'Test transcription',
        },
        error: null,
      })
      mockSupabaseClient.from.mockReturnValueOnce(mockInsert as any)

      const updateChain1 = createMockFrom()
      updateChain1.eq.mockResolvedValue({ data: {}, error: null })
      const updateChain2 = createMockFrom()
      updateChain2.eq.mockResolvedValue({ data: {}, error: null })
      mockSupabaseClient.from.mockReturnValueOnce(updateChain1 as any)
      mockSupabaseClient.from.mockReturnValueOnce(updateChain2 as any)

      const request = new NextRequest('http://localhost:3000/api/suflate/voice/transcribe', {
        method: 'POST',
        body: JSON.stringify({ recordingId }),
      })

      await POST(request)

      expect(mockInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          recording_id: recordingId,
          raw_text: 'Test transcription',
          processed_text: 'Test transcription',
          transcription_model: 'assemblyai',
        })
      )
    })

    test('When transcription completes, Then the recording status is updated to "transcribed"', async () => {
      const recordingId = 'test-recording-id'

      const recordingChain = createMockFrom()
      recordingChain.single.mockResolvedValue({
        data: {
          id: recordingId,
          storage_path: 'workspace/user/recording.webm',
          status: 'uploaded',
        },
        error: null,
      })
      mockSupabaseClient.from.mockReturnValueOnce(recordingChain as any)

      mockSupabaseClient.storage.from.mockReturnValueOnce({
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://test.com/audio.webm' },
        }),
      } as any)

      mockTranscribeAudioFromUrl.mockResolvedValueOnce({
        text: 'Test transcription',
        language_code: 'en',
      })

      const insertChain = createMockFrom()
      insertChain.single.mockResolvedValue({
        data: { id: 'transcription-id' },
        error: null,
      })
      mockSupabaseClient.from.mockReturnValueOnce(insertChain as any)

      const mockUpdate1 = createMockFrom()
      mockUpdate1.eq.mockResolvedValue({ data: {}, error: null })
      const mockUpdate2 = createMockFrom()
      mockUpdate2.eq.mockResolvedValue({ data: {}, error: null })
      mockSupabaseClient.from.mockReturnValueOnce(mockUpdate1 as any)
      mockSupabaseClient.from.mockReturnValueOnce(mockUpdate2 as any)

      const request = new NextRequest('http://localhost:3000/api/suflate/voice/transcribe', {
        method: 'POST',
        body: JSON.stringify({ recordingId }),
      })

      await POST(request)

      expect(mockUpdate2.update).toHaveBeenCalledWith({
        status: 'transcribed',
      })
      expect(mockUpdate2.eq).toHaveBeenCalledWith('id', recordingId)
    })
  })

  describe('Error Handling', () => {
    test('Given the recording does not exist, When I request transcription, Then I see an error', async () => {
      const recordingId = 'non-existent-id'

      const recordingChain = createMockFrom()
      recordingChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      })
      mockSupabaseClient.from.mockReturnValueOnce(recordingChain as any)

      const request = new NextRequest('http://localhost:3000/api/suflate/voice/transcribe', {
        method: 'POST',
        body: JSON.stringify({ recordingId }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('Recording not found')
      expect(mockTranscribeAudioFromUrl).not.toHaveBeenCalled()
    })

    test('Given AssemblyAI transcription fails, When error occurs, Then I see an error message', async () => {
      const recordingId = 'test-recording-id'

      const recordingChain = createMockFrom()
      recordingChain.single.mockResolvedValue({
        data: {
          id: recordingId,
          storage_path: 'workspace/user/recording.webm',
          status: 'uploaded',
        },
        error: null,
      })
      mockSupabaseClient.from.mockReturnValueOnce(recordingChain as any)

      mockSupabaseClient.storage.from.mockReturnValueOnce({
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://test.com/audio.webm' },
        }),
      } as any)

      mockTranscribeAudioFromUrl.mockRejectedValueOnce(
        new Error('AssemblyAI API error: Transcription failed')
      )

      const updateChain = createMockFrom()
      updateChain.eq.mockResolvedValue({ data: {}, error: null })
      mockSupabaseClient.from.mockReturnValueOnce(updateChain as any)

      const request = new NextRequest('http://localhost:3000/api/suflate/voice/transcribe', {
        method: 'POST',
        body: JSON.stringify({ recordingId }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to transcribe audio')
    })

    test('Given transcription record creation fails, When error occurs, Then I see an error and recording status is not updated', async () => {
      const recordingId = 'test-recording-id'

      const recordingChain = createMockFrom()
      recordingChain.single.mockResolvedValue({
        data: {
          id: recordingId,
          storage_path: 'workspace/user/recording.webm',
          status: 'uploaded',
        },
        error: null,
      })
      mockSupabaseClient.from.mockReturnValueOnce(recordingChain as any)

      mockSupabaseClient.storage.from.mockReturnValueOnce({
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://test.com/audio.webm' },
        }),
      } as any)

      mockTranscribeAudioFromUrl.mockResolvedValueOnce({
        text: 'Test transcription',
        language_code: 'en',
      })

      const insertChain = createMockFrom()
      insertChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })
      mockSupabaseClient.from.mockReturnValueOnce(insertChain as any)

      const updateChain = createMockFrom()
      updateChain.eq.mockResolvedValue({ data: {}, error: null })
      mockSupabaseClient.from.mockReturnValueOnce(updateChain as any)

      const request = new NextRequest('http://localhost:3000/api/suflate/voice/transcribe', {
        method: 'POST',
        body: JSON.stringify({ recordingId }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to create transcription record')
    })
  })
})
