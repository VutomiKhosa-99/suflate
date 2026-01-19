import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VoiceRecorder } from '@/components/features/voice-recorder/voice-recorder'

// Mock MediaRecorder API
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  state: 'inactive',
  ondataavailable: null as any,
  onstop: null as any,
  mimeType: 'audio/webm;codecs=opus',
}

const mockStream = {
  getTracks: jest.fn(() => [
    { stop: jest.fn() },
  ]),
}

// Mock getUserMedia
global.navigator.mediaDevices = {
  getUserMedia: jest.fn(() => Promise.resolve(mockStream as any)),
} as any

// Mock MediaRecorder constructor
global.MediaRecorder = jest.fn(() => mockMediaRecorder as any) as any
global.MediaRecorder.isTypeSupported = jest.fn(() => true)

// Mock AudioContext
global.AudioContext = jest.fn(() => ({
  createAnalyser: jest.fn(() => ({
    fftSize: 256,
    frequencyBinCount: 128,
  })),
  createMediaStreamSource: jest.fn(() => ({
    connect: jest.fn(),
  })),
  close: jest.fn(),
})) as any

// Mock fetch
global.fetch = jest.fn()

describe('VoiceRecorder Component - Story 1.1', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Given I am logged in and on the recording screen', () => {
    test('When I tap the record button, Then recording starts immediately', async () => {
      const user = userEvent.setup({ delay: null })
      render(<VoiceRecorder />)

      const recordButton = screen.getByRole('button', { name: /🎙️/i })
      await user.click(recordButton)

      expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: true,
      })
      expect(global.MediaRecorder).toHaveBeenCalled()
      expect(mockMediaRecorder.start).toHaveBeenCalledWith(100)
    })

    test('When recording starts, Then I see a timer counting up to 3:00 maximum', async () => {
      const user = userEvent.setup({ delay: null })
      render(<VoiceRecorder />)

      const recordButton = screen.getByRole('button', { name: /🎙️/i })
      await user.click(recordButton)

      // Wait for recording to start
      await waitFor(() => {
        expect(screen.getByText(/0:00 \/ 3:00/i)).toBeInTheDocument()
      })

      // Advance timer by 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(screen.getByText(/0:05 \/ 3:00/i)).toBeInTheDocument()
    })

    test('When recording starts, Then I can see a waveform visualization while recording', async () => {
      const user = userEvent.setup({ delay: null })
      render(<VoiceRecorder />)

      const recordButton = screen.getByRole('button', { name: /🎙️/i })
      await user.click(recordButton)

      await waitFor(() => {
        const waveform = screen.getByRole('img', { hidden: true }) || 
                        document.querySelector('canvas')
        expect(waveform).toBeInTheDocument()
      })
    })

    test('When I tap pause, Then recording pauses and I can resume', async () => {
      const user = userEvent.setup({ delay: null })
      render(<VoiceRecorder />)

      // Start recording
      const recordButton = screen.getByRole('button', { name: /🎙️/i })
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
      })

      // Pause recording
      const pauseButton = screen.getByRole('button', { name: /pause/i })
      await user.click(pauseButton)

      expect(mockMediaRecorder.pause).toHaveBeenCalled()
      expect(screen.getByText(/recording paused/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument()

      // Resume recording
      const resumeButton = screen.getByRole('button', { name: /resume/i })
      await user.click(resumeButton)

      expect(mockMediaRecorder.resume).toHaveBeenCalled()
    })

    test('When I tap stop, Then recording stops and I can play back the recording', async () => {
      const user = userEvent.setup({ delay: null })
      render(<VoiceRecorder />)

      // Start recording
      const recordButton = screen.getByRole('button', { name: /🎙️/i })
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
      })

      // Simulate recording data
      act(() => {
        mockMediaRecorder.ondataavailable({
          data: new Blob(['test'], { type: 'audio/webm' }),
        })
      })

      // Stop recording
      const stopButton = screen.getByRole('button', { name: /stop/i })
      await user.click(stopButton)

      act(() => {
        mockMediaRecorder.onstop()
      })

      await waitFor(() => {
        expect(mockMediaRecorder.stop).toHaveBeenCalled()
        expect(screen.getByRole('button', { name: /upload & continue/i })).toBeInTheDocument()
      })

      // Check for audio playback element
      const audioElement = screen.getByRole('application', { hidden: true }) ||
                          document.querySelector('audio')
      expect(audioElement).toBeInTheDocument()
    })
  })

  describe('Given I have recorded a voice note', () => {
    test('When the recording exceeds 3 minutes, Then recording automatically stops at 3:00', async () => {
      const user = userEvent.setup({ delay: null })
      render(<VoiceRecorder />)

      // Start recording
      const recordButton = screen.getByRole('button', { name: /🎙️/i })
      await user.click(recordButton)

      // Simulate recording data
      act(() => {
        mockMediaRecorder.ondataavailable({
          data: new Blob(['test'], { type: 'audio/webm' }),
        })
      })

      // Advance timer to 3 minutes (180 seconds)
      act(() => {
        jest.advanceTimersByTime(180000) // 3 minutes in milliseconds
      })

      await waitFor(() => {
        expect(mockMediaRecorder.stop).toHaveBeenCalled()
        expect(screen.getByText(/maximum duration/i)).toBeInTheDocument()
      })
    })

    test('When recording stops automatically at 3:00, Then I see a notification that the maximum duration was reached', async () => {
      const user = userEvent.setup({ delay: null })
      render(<VoiceRecorder />)

      // Start recording
      const recordButton = screen.getByRole('button', { name: /🎙️/i })
      await user.click(recordButton)

      // Simulate recording data
      act(() => {
        mockMediaRecorder.ondataavailable({
          data: new Blob(['test'], { type: 'audio/webm' }),
        })
      })

      // Advance to 3 minutes
      act(() => {
        jest.advanceTimersByTime(180000)
      })

      // Trigger stop
      act(() => {
        mockMediaRecorder.onstop()
      })

      await waitFor(() => {
        expect(screen.getByText(/maximum duration \(3 minutes\) reached/i)).toBeInTheDocument()
      })
    })
  })

  describe('File Upload (Story 1.2)', () => {
    test('When I upload an audio file, Then it is uploaded to Supabase Storage', async () => {
      const user = userEvent.setup({ delay: null })
      
      // Mock window.location.href
      delete (window as any).location
      ;(window as any).location = { href: '' }

      render(<VoiceRecorder />)

      const mockFile = new File(['test audio'], 'test.mp3', { type: 'audio/mpeg' })

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ recordingId: 'test-id' }),
      })

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      
      // Simulate file selection
      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      }, { timeout: 3000 })
    })
  })
})
