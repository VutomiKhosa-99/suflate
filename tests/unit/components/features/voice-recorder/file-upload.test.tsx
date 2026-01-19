import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VoiceRecorder } from '@/components/features/voice-recorder/voice-recorder'

// Mock audio validation - must be defined before the mock
const mockValidateAudioFile = jest.fn()

jest.mock('@/lib/validation/audio', () => ({
  validateAudioFile: (...args: any[]) => mockValidateAudioFile(...args),
}))

// Mock fetch
global.fetch = jest.fn()

// Mock MediaRecorder API (not needed for file upload, but component uses it)
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  state: 'inactive',
  ondataavailable: null as any,
  onstop: null as any,
}

const mockStream = {
  getTracks: jest.fn(() => [{ stop: jest.fn() }]),
}

global.navigator.mediaDevices = {
  getUserMedia: jest.fn(() => Promise.resolve(mockStream as any)),
} as any

global.MediaRecorder = jest.fn(() => mockMediaRecorder as any) as any
global.MediaRecorder.isTypeSupported = jest.fn(() => true)

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
  writable: true,
})

describe('File Upload - Story 1.2', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    mockValidateAudioFile.mockClear()
    // Default: validation passes
    mockValidateAudioFile.mockResolvedValue({
      valid: true,
      duration: 120,
    })
  })

  describe('Given I am on the recording screen', () => {
    test('When I tap "Upload audio file", Then I can select an audio file from my device', async () => {
      const user = userEvent.setup({ delay: null })
      render(<VoiceRecorder />)

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveAttribute('accept', 'audio/*')
    })

    test('When I select a valid audio file, Then the file is validated and uploaded', async () => {
      const user = userEvent.setup({ delay: null })
      
      mockValidateAudioFile.mockResolvedValueOnce({
        valid: true,
        duration: 120,
      })

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          recordingId: 'test-recording-id',
          storagePath: 'test/path',
          fileSize: 1024000,
          status: 'uploaded',
        }),
      })

      render(<VoiceRecorder />)

      const mockFile = new File(['test audio content'], 'recording.mp3', {
        type: 'audio/mpeg',
      })

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(mockValidateAudioFile).toHaveBeenCalledWith(mockFile)
        expect(global.fetch).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    test('When file upload succeeds, Then I am redirected to the recording detail page', async () => {
      const user = userEvent.setup({ delay: null })
      
      mockValidateAudioFile.mockResolvedValueOnce({
        valid: true,
        duration: 120,
      })

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          recordingId: 'test-recording-id',
          storagePath: 'test/path',
          fileSize: 1024000,
          status: 'uploaded',
        }),
      })

      render(<VoiceRecorder />)

      const mockFile = new File(['test audio'], 'recording.mp3', {
        type: 'audio/mpeg',
      })

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(window.location.href).toBe('/record/test-recording-id')
      }, { timeout: 3000 })
    })
  })

  describe('Given I upload an invalid file', () => {
    test('When the file exceeds 10MB, Then I see an error message and can try again', async () => {
      const user = userEvent.setup({ delay: null })
      
      // Mock validation to fail on size
      mockValidateAudioFile.mockResolvedValueOnce({
        valid: false,
        error: 'File size exceeds 10MB limit',
      })

      render(<VoiceRecorder />)

      // Create a file that exceeds 10MB
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.mp3', {
        type: 'audio/mpeg',
      })

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await user.upload(fileInput, largeFile)

      await waitFor(() => {
        expect(screen.getByText(/file size exceeds/i)).toBeInTheDocument()
      })

      // Verify fetch was NOT called (client-side validation prevented upload)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    test('When the file is not a supported format, Then I see an error message', async () => {
      const user = userEvent.setup({ delay: null })
      
      // Mock validation to fail on file type
      mockValidateAudioFile.mockResolvedValueOnce({
        valid: false,
        error: 'Invalid file type. Allowed: MP3, WAV, WebM, OGG, M4A',
      })

      render(<VoiceRecorder />)

      const invalidFile = new File(['test'], 'document.txt', {
        type: 'text/plain',
      })

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await user.upload(fileInput, invalidFile)

      await waitFor(() => {
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument()
      })

      // Verify fetch was NOT called (client-side validation prevented upload)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    test('When upload fails, Then I can try uploading again', async () => {
      const user = userEvent.setup({ delay: null })
      
      mockValidateAudioFile
        .mockResolvedValueOnce({
          valid: true,
          duration: 120,
        })
        .mockResolvedValueOnce({
          valid: true,
          duration: 120,
        })

      ;(global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            recordingId: 'test-id',
            status: 'uploaded',
          }),
        })

      render(<VoiceRecorder />)

      const mockFile = new File(['test'], 'recording.mp3', {
        type: 'audio/mpeg',
      })

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      // First upload fails
      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(screen.getByText(/failed to upload/i)).toBeInTheDocument()
      })

      // Can try again
      const retryFile = new File(['test'], 'recording2.mp3', {
        type: 'audio/mpeg',
      })

      await user.upload(fileInput, retryFile)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('File Validation', () => {
    test('When I select a file, Then client-side validation runs before upload', async () => {
      const user = userEvent.setup({ delay: null })
      
      // Mock validation to fail
      mockValidateAudioFile.mockResolvedValueOnce({
        valid: false,
        error: 'Invalid file type',
      })

      render(<VoiceRecorder />)

      const invalidFile = new File(['test'], 'document.pdf', {
        type: 'application/pdf',
      })

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      await user.upload(fileInput, invalidFile)

      // Client-side validation should run first
      await waitFor(() => {
        expect(mockValidateAudioFile).toHaveBeenCalledWith(invalidFile)
      })

      // If validation fails, fetch should not be called
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })
})
