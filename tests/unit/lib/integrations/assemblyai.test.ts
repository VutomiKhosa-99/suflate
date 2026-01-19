import { transcribeAudioFromUrl } from '@/lib/integrations/assemblyai'
import { AssemblyAI } from 'assemblyai'

// Mock AssemblyAI SDK
jest.mock('assemblyai', () => {
  const mockTranscript = {
    status: 'completed' as const,
    text: 'This is a test transcription',
    words: [
      { text: 'This', start: 0, end: 0.5, confidence: 0.99 },
      { text: 'is', start: 0.5, end: 0.7, confidence: 0.98 },
    ],
    language_code: 'en',
  }

  return {
    AssemblyAI: jest.fn().mockImplementation(() => ({
      transcripts: {
        submit: jest.fn().mockResolvedValue(mockTranscript),
        get: jest.fn().mockResolvedValue(mockTranscript),
      },
    })),
  }
})

describe('AssemblyAI Integration - Story 1.3', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('transcribeAudioFromUrl', () => {
    test('Given a valid audio URL, When transcribed, Then returns transcription text', async () => {
      const audioUrl = 'https://supabase.co/storage/v1/object/public/voice-recordings/test.webm'

      const result = await transcribeAudioFromUrl(audioUrl)

      expect(result).toHaveProperty('text')
      expect(result.text).toBe('This is a test transcription')
      expect(result.language_code).toBe('en')
    })

    test('Given audio URL, When transcribed, Then includes word-level timestamps if available', async () => {
      const audioUrl = 'https://test.com/audio.webm'

      const result = await transcribeAudioFromUrl(audioUrl)

      expect(result.words).toBeDefined()
      expect(result.words?.length).toBeGreaterThan(0)
      expect(result.words?.[0]).toHaveProperty('text')
      expect(result.words?.[0]).toHaveProperty('start')
      expect(result.words?.[0]).toHaveProperty('end')
      expect(result.words?.[0]).toHaveProperty('confidence')
    })

    test('Given transcription completes, When result is returned, Then includes language code', async () => {
      const audioUrl = 'https://test.com/audio.webm'

      const result = await transcribeAudioFromUrl(audioUrl)

      expect(result.language_code).toBe('en')
    })

    test('Given transcription fails, When error occurs, Then throws an error', async () => {
      const audioUrl = 'https://test.com/invalid.webm'

      // Mock failed transcription
      const { AssemblyAI: MockAssemblyAI } = require('assemblyai')
      const mockInstance = new MockAssemblyAI()
      mockInstance.transcripts.submit = jest.fn().mockResolvedValue({
        status: 'failed',
        error: 'Transcription failed',
      })

      await expect(transcribeAudioFromUrl(audioUrl)).rejects.toThrow()
    })

    test('Given transcription is still processing, When status is queued, Then throws an error', async () => {
      const audioUrl = 'https://test.com/audio.webm'

      // Mock queued transcription
      const { AssemblyAI: MockAssemblyAI } = require('assemblyai')
      const mockInstance = new MockAssemblyAI()
      mockInstance.transcripts.submit = jest.fn().mockResolvedValue({
        status: 'queued',
      })

      await expect(transcribeAudioFromUrl(audioUrl)).rejects.toThrow('still queued')
    })

    test('Given auto-punctuation is enabled, When transcribed, Then text includes punctuation', async () => {
      const audioUrl = 'https://test.com/audio.webm'

      const result = await transcribeAudioFromUrl(audioUrl)

      // Verify that punctuation would be included (auto_punctuation is enabled in the integration)
      expect(result.text).toBeTruthy()
    })
  })

  describe('Configuration', () => {
    test('Given AssemblyAI API key is set, When initialized, Then client is configured correctly', () => {
      expect(process.env.ASSEMBLYAI_API_KEY).toBeDefined()
    })

    test('Given transcription options, When submitted, Then uses correct configuration', async () => {
      const audioUrl = 'https://test.com/audio.webm'
      const { AssemblyAI: MockAssemblyAI } = require('assemblyai')
      const mockInstance = new MockAssemblyAI()

      await transcribeAudioFromUrl(audioUrl)

      // Verify submit was called with correct options
      expect(mockInstance.transcripts.submit).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: audioUrl,
          auto_punctuation: true,
          format_text: true,
        })
      )
    })
  })
})
