'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { WaveformVisualizer } from './waveform-visualizer'
import { validateAudioFile } from '@/lib/validation/audio'
import { ErrorState } from './error-states'

interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioBlob: Blob | null
  audioUrl: string | null
}

export function VoiceRecorder() {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
  })
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | 'mic-permission' | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)

  const MAX_DURATION = 180 // 3 minutes in seconds

  // Request microphone access and set up MediaRecorder
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Set up Web Audio API for waveform visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      
      analyser.fftSize = 256
      source.connect(analyser)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        setRecordingState((prev) => ({
          ...prev,
          audioBlob,
          audioUrl,
          isRecording: false,
          isPaused: false,
        }))

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(100) // Collect data every 100ms

      setRecordingState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioBlob: null,
        audioUrl: null,
      })

      // Start timer
      let duration = 0
      timerRef.current = setInterval(() => {
        duration += 1
        setRecordingState((prev) => ({ ...prev, duration }))

        // Auto-stop at 3 minutes
        if (duration >= MAX_DURATION) {
          stopRecording()
        }
      }, 1000)
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('mic-permission')
      } else {
        setError('Failed to access microphone. Please check permissions.')
      }
      console.error('Error accessing microphone:', err)
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.pause()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      setRecordingState((prev) => ({ ...prev, isPaused: true, isRecording: false }))
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState.isPaused) {
      mediaRecorderRef.current.resume()
      
      // Resume timer
      let { duration } = recordingState
      timerRef.current = setInterval(() => {
        duration += 1
        setRecordingState((prev) => ({ ...prev, duration }))

        // Auto-stop at 3 minutes
        if (duration >= MAX_DURATION) {
          stopRecording()
        }
      }, 1000)
      
      setRecordingState((prev) => ({ ...prev, isPaused: false, isRecording: true }))
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && (recordingState.isRecording || recordingState.isPaused)) {
      mediaRecorderRef.current.stop()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const uploadRecording = async () => {
    if (!recordingState.audioBlob) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('audio', recordingState.audioBlob, 'recording.webm')

      const response = await fetch('/api/suflate/voice/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || errorData.message || 'Failed to upload recording'
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      // Redirect to transcription/editing page
      window.location.href = `/record/${data.recordingId}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload recording')
    } finally {
      setIsUploading(false)
    }
  }

  const resetRecording = () => {
    if (recordingState.audioUrl) {
      URL.revokeObjectURL(recordingState.audioUrl)
    }
    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
    })
    setError(null)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (recordingState.audioUrl) {
        URL.revokeObjectURL(recordingState.audioUrl)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Screen 3: Voice Recording - Large mic button, waveform, timer */}
      <div className="flex flex-col items-center space-y-8 p-12">
        {!recordingState.audioBlob ? (
          <>
            {/* Visual Waveform - Screen 3 requirement */}
            {(recordingState.isRecording || recordingState.isPaused) && (
              <div className="w-full max-w-2xl h-40 mb-6">
                <WaveformVisualizer
                  analyser={analyserRef.current}
                  dataArray={dataArrayRef.current}
                  isActive={recordingState.isRecording && !recordingState.isPaused}
                />
              </div>
            )}

            {/* Timer (0-3:00) - Screen 3 requirement */}
            <div className="text-6xl md:text-7xl font-mono font-bold text-gray-900 tracking-tight">
              {formatTime(recordingState.duration)}
            </div>

            {/* Large Mic Button - Screen 3 requirement */}
            <div className="flex flex-col items-center gap-6">
              {!recordingState.isRecording && !recordingState.isPaused && (
                <Button
                  onClick={startRecording}
                  className="h-32 w-32 md:h-40 md:w-40 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-2xl hover:shadow-red-500/50 transition-all hover:scale-105"
                >
                  <span className="text-6xl md:text-7xl">🎙</span>
                </Button>
              )}

              {recordingState.isRecording && (
                <div className="flex flex-col items-center gap-4">
                  <Button
                    onClick={stopRecording}
                    className="h-24 w-24 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-xl animate-pulse"
                  >
                    <div className="h-12 w-12 bg-white rounded-lg" />
                  </Button>
                  <Button onClick={pauseRecording} variant="outline" size="lg">
                    Pause
                  </Button>
                </div>
              )}

              {recordingState.isPaused && (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-lg font-medium text-gray-600 mb-2">Recording paused</p>
                  <div className="flex gap-4">
                    <Button
                      onClick={resumeRecording}
                      className="h-24 w-24 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-xl"
                    >
                      <span className="text-4xl">▶</span>
                    </Button>
                    <Button onClick={stopRecording} variant="outline" size="lg">
                      Stop
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Recorded State - Screen 3 requirement */}
            <div className="w-full max-w-2xl space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                  <span className="text-4xl">✓</span>
                </div>
                <p className="text-lg font-medium text-gray-900">
                  Recording complete ({formatTime(recordingState.duration)})
                </p>
              </div>
              
              <audio
                src={recordingState.audioUrl || undefined}
                controls
                className="w-full"
              />

              <div className="flex gap-4 justify-center">
                <Button onClick={uploadRecording} disabled={isUploading} size="lg" className="px-8">
                  {isUploading ? 'Uploading...' : 'Continue'}
                </Button>
                <Button onClick={resetRecording} variant="outline" size="lg">
                  Record Again
                </Button>
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="mt-4 max-w-md w-full">
            {error === 'mic-permission' ? (
              <ErrorState
                error="mic-permission"
                onRetry={() => {
                  setError(null)
                  startRecording()
                }}
              />
            ) : (
              <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg text-center">
                {error}
                <Button
                  onClick={() => setError(null)}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        )}

        {recordingState.duration >= MAX_DURATION && (
          <div className="text-sm text-gray-600 text-center">
            Maximum duration (3 minutes) reached
          </div>
        )}
      </div>

      {/* Upload Audio File Option */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">Or upload an existing audio file</p>
        <label htmlFor="audio-upload" className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
          Upload Audio File
          <input
            id="audio-upload"
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return

              setError(null)
              setIsUploading(true)

              try {
                // Client-side validation (Story 1.2)
                const validation = await validateAudioFile(file)
                
                if (!validation.valid) {
                  setError(validation.error || 'Invalid file')
                  setIsUploading(false)
                  return
                }

                // Upload file
                const formData = new FormData()
                formData.append('audio', file)

                const response = await fetch('/api/suflate/voice/upload', {
                  method: 'POST',
                  body: formData,
                })

                if (!response.ok) {
                  const errorData = await response.json()
                  throw new Error(errorData.error || 'Failed to upload file')
                }

                const data = await response.json()
                
                // Redirect to recording detail page
                window.location.href = `/record/${data.recordingId}`
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to upload file')
                setIsUploading(false)
              }
            }}
          />
        </label>
        {isUploading && (
          <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
        )}
      </div>
    </div>
  )
}
