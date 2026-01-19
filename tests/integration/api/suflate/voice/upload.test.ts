import { POST } from '@/app/api/suflate/voice/upload/route'
import { createClient } from '@/utils/supabase/server'

// Mock Supabase
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}))

// Mock crypto.randomUUID
jest.spyOn(global.crypto, 'randomUUID').mockReturnValue('test-uuid-123')

describe('POST /api/suflate/voice/upload - Story 1.1', () => {
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

  describe('Given I am uploading a voice recording', () => {
    test('When I upload a valid audio file, Then it is uploaded to Supabase Storage and a record is created', async () => {
      const audioFile = new File(['test audio content'], 'recording.webm', {
        type: 'audio/webm',
      })

      const formData = new FormData()
      formData.append('audio', audioFile)

      const request = new Request('http://localhost:3000/api/suflate/voice/upload', {
        method: 'POST',
        body: formData,
      }) as any

      // Mock successful storage upload
      mockSupabaseClient.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test-path' },
          error: null,
        }),
        remove: jest.fn(),
      })

      // Mock successful database insert
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'test-uuid-123',
                storage_path: 'test-path',
                status: 'uploaded',
              },
              error: null,
            }),
          })),
        })),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('recordingId')
      expect(data).toHaveProperty('storagePath')
      expect(data.status).toBe('uploaded')
      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('voice-recordings')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('voice_recordings')
    })

    test('When I upload an invalid file type, Then I see an error message', async () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })

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
    })

    test('When I upload a file exceeding 10MB, Then I see an error message', async () => {
      // Create a mock file that exceeds 10MB
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
    })

    test('When no audio file is provided, Then I see an error message', async () => {
      const formData = new FormData()

      const request = new Request('http://localhost:3000/api/suflate/voice/upload', {
        method: 'POST',
        body: formData,
      }) as any

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('No audio file provided')
    })

    test('When Supabase storage upload fails, Then I see an error message', async () => {
      const audioFile = new File(['test'], 'recording.webm', { type: 'audio/webm' })

      const formData = new FormData()
      formData.append('audio', audioFile)

      const request = new Request('http://localhost:3000/api/suflate/voice/upload', {
        method: 'POST',
        body: formData,
      }) as any

      // Mock storage upload failure
      mockSupabaseClient.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Storage error' },
        }),
        remove: jest.fn(),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to upload file to storage')
    })

    test('When database insert fails, Then uploaded file is cleaned up', async () => {
      const audioFile = new File(['test'], 'recording.webm', { type: 'audio/webm' })

      const formData = new FormData()
      formData.append('audio', audioFile)

      const request = new Request('http://localhost:3000/api/suflate/voice/upload', {
        method: 'POST',
        body: formData,
      }) as any

      const mockRemove = jest.fn().mockResolvedValue({})

      // Mock successful storage upload
      mockSupabaseClient.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test-path' },
          error: null,
        }),
        remove: mockRemove,
      })

      // Mock database insert failure
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          })),
        })),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to create recording record')
      expect(mockRemove).toHaveBeenCalledWith(['test-path'])
    })
  })
})
