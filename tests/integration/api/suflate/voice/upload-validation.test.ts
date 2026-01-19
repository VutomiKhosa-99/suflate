import { POST } from '@/app/api/suflate/voice/upload/route'
import { createClient } from '@/utils/supabase/server'

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}))

// Mock crypto.randomUUID
jest.spyOn(global.crypto, 'randomUUID').mockReturnValue('test-uuid-123')

describe('POST /api/suflate/voice/upload - File Validation (Story 1.2)', () => {
  const mockSupabaseClient = {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        remove: jest.fn(),
      })),
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabaseClient)
  })

  describe('File Type Validation', () => {
    test('Given I upload an MP3 file, When the file is valid, Then upload succeeds', async () => {
      const validFile = new File(['test audio'], 'recording.mp3', {
        type: 'audio/mpeg',
      })

      const formData = new FormData()
      formData.append('audio', validFile)

      const request = new Request('http://localhost:3000/api/suflate/voice/upload', {
        method: 'POST',
        body: formData,
      }) as any

      mockSupabaseClient.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test-path' },
          error: null,
        }),
        remove: jest.fn(),
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'test-id' },
              error: null,
            }),
          })),
        })),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })

    test('Given I upload a WAV file, When the file is valid, Then upload succeeds', async () => {
      const validFile = new File(['test audio'], 'recording.wav', {
        type: 'audio/wav',
      })

      const formData = new FormData()
      formData.append('audio', validFile)

      const request = new Request('http://localhost:3000/api/suflate/voice/upload', {
        method: 'POST',
        body: formData,
      }) as any

      mockSupabaseClient.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test-path' },
          error: null,
        }),
        remove: jest.fn(),
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'test-id' },
              error: null,
            }),
          })),
        })),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })

    test('Given I upload a WebM file, When the file is valid, Then upload succeeds', async () => {
      const validFile = new File(['test audio'], 'recording.webm', {
        type: 'audio/webm',
      })

      const formData = new FormData()
      formData.append('audio', validFile)

      const request = new Request('http://localhost:3000/api/suflate/voice/upload', {
        method: 'POST',
        body: formData,
      }) as any

      mockSupabaseClient.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test-path' },
          error: null,
        }),
        remove: jest.fn(),
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'test-id' },
              error: null,
            }),
          })),
        })),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })

    test('Given I upload an invalid file type (PDF), When validation runs, Then I see an error', async () => {
      const invalidFile = new File(['test'], 'document.pdf', {
        type: 'application/pdf',
      })

      const formData = new FormData()
      formData.append('audio', invalidFile)

      const request = new Request('http://localhost:3000/api/suflate/voice/upload', {
        method: 'POST',
        body: formData,
      }) as any

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid file type')
      expect(mockSupabaseClient.storage.from).not.toHaveBeenCalled()
    })
  })

  describe('File Size Validation', () => {
    test('Given I upload a file exceeding 10MB, When validation runs, Then I see an error', async () => {
      // Create a file that exceeds 10MB
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.webm', {
        type: 'audio/webm',
      })

      const formData = new FormData()
      formData.append('audio', largeFile)

      const request = new Request('http://localhost:3000/api/suflate/voice/upload', {
        method: 'POST',
        body: formData,
      }) as any

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('File size exceeds')
      expect(mockSupabaseClient.storage.from).not.toHaveBeenCalled()
    })

    test('Given I upload a file within 10MB limit, When validation runs, Then upload proceeds', async () => {
      // Create a file within limit (9MB)
      const validFile = new File(['x'.repeat(9 * 1024 * 1024)], 'valid.webm', {
        type: 'audio/webm',
      })

      const formData = new FormData()
      formData.append('audio', validFile)

      const request = new Request('http://localhost:3000/api/suflate/voice/upload', {
        method: 'POST',
        body: formData,
      }) as any

      mockSupabaseClient.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test-path' },
          error: null,
        }),
        remove: jest.fn(),
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'test-id' },
              error: null,
            }),
          })),
        })),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })
  })

  describe('File Duration Validation', () => {
    test('Given I upload a file, When a voice_recordings record is created, Then duration is nullable (will be set during transcription)', async () => {
      const validFile = new File(['test'], 'recording.webm', {
        type: 'audio/webm',
      })

      const formData = new FormData()
      formData.append('audio', validFile)

      const request = new Request('http://localhost:3000/api/suflate/voice/upload', {
        method: 'POST',
        body: formData,
      }) as any

      const mockInsert = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'test-id', duration_seconds: null },
              error: null,
            }),
          })),
        })),
      }

      mockSupabaseClient.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test-path' },
          error: null,
        }),
        remove: jest.fn(),
      })

      mockSupabaseClient.from.mockReturnValue(mockInsert)

      const response = await POST(request)
      expect(response.status).toBe(200)

      // Verify insert was called with null duration
      expect(mockInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          duration_seconds: null,
        })
      )
    })
  })

  describe('Error Recovery', () => {
    test('Given upload fails, When I see an error, Then I can retry with the same or different file', async () => {
      const validFile = new File(['test'], 'recording.webm', {
        type: 'audio/webm',
      })

      const formData = new FormData()
      formData.append('audio', validFile)

      const request = new Request('http://localhost:3000/api/suflate/voice/upload', {
        method: 'POST',
        body: formData,
      }) as any

      // First attempt fails
      mockSupabaseClient.storage.from.mockReturnValueOnce({
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Storage error' },
        }),
        remove: jest.fn(),
      })

      const firstResponse = await POST(request)
      expect(firstResponse.status).toBe(500)

      // Second attempt succeeds
      mockSupabaseClient.storage.from.mockReturnValueOnce({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test-path' },
          error: null,
        }),
        remove: jest.fn(),
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'test-id' },
              error: null,
            }),
          })),
        })),
      })

      const secondRequest = new Request('http://localhost:3000/api/suflate/voice/upload', {
        method: 'POST',
        body: formData,
      }) as any

      const secondResponse = await POST(secondRequest)
      expect(secondResponse.status).toBe(200)
    })
  })
})
