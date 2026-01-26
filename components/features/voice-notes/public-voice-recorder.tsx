'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, Pause, Play, Square, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'

interface PublicVoiceRecordPageProps {
  linkId: string
  requesterEmail?: string
  questions?: string
}

type RecordingStatus = 'idle' | 'recording' | 'paused' | 'completed' | 'uploading' | 'success'

export function PublicVoiceRecorder({ linkId, requesterEmail, questions }: PublicVoiceRecordPageProps) {
  const [status, setStatus] = useState<RecordingStatus>('idle')
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const MAX_DURATION = 180 // 3 minutes
  const MIN_DURATION = 30 // 30 seconds recommended

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    mediaRecorderRef.current = null
    audioChunksRef.current = []
  }, [])

  const startRecording = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        setStatus('completed')
        
        // Cleanup stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(100)

      setStatus('recording')
      setDuration(0)

      // Start timer
      let time = 0
      timerRef.current = setInterval(() => {
        time += 1
        setDuration(time)

        if (time >= MAX_DURATION) {
          stopRecording()
        }
      }, 1000)
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access denied. Please allow microphone access to record.')
      } else {
        setError('Failed to access microphone. Please check your settings.')
      }
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.pause()
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setStatus('paused')
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && status === 'paused') {
      mediaRecorderRef.current.resume()

      let time = duration
      timerRef.current = setInterval(() => {
        time += 1
        setDuration(time)

        if (time >= MAX_DURATION) {
          stopRecording()
        }
      }, 1000)

      setStatus('recording')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && (status === 'recording' || status === 'paused')) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      mediaRecorderRef.current.stop()
    }
  }

  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
    setCurrentTime(0)
    setIsPlaying(false)
    setStatus('idle')
    setError(null)
  }

  const togglePlayback = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }

  const uploadRecording = async () => {
    if (!audioBlob) return

    setStatus('uploading')
    setUploadProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('linkId', linkId)
      formData.append('duration', duration.toString())

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/public/voice-recording/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload recording')
      }

      setUploadProgress(100)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload recording')
      setStatus('completed')
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [cleanup, audioUrl])

  // Success State
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="py-8 text-center">
          <Logo className="mx-auto" />
        </div>

        <div className="max-w-xl mx-auto px-4 text-center">
          {/* Success Illustration */}
          <div className="mb-8">
            <svg width="200" height="160" viewBox="0 0 200 160" fill="none" className="mx-auto">
              {/* High five hands illustration */}
              <path d="M60 80 L80 40 L85 42 L68 78 Z" fill="#0EA5E9" />
              <path d="M70 85 L95 50 L100 53 L78 85 Z" fill="#0EA5E9" />
              <path d="M80 88 L110 60 L115 64 L88 90 Z" fill="#0EA5E9" />
              <path d="M55 90 L50 50 L56 48 L62 88 Z" fill="#0EA5E9" />
              <ellipse cx="70" cy="100" rx="25" ry="20" fill="#0EA5E9" />
              
              <path d="M140 80 L120 40 L115 42 L132 78 Z" fill="#0EA5E9" />
              <path d="M130 85 L105 50 L100 53 L122 85 Z" fill="#0EA5E9" />
              <path d="M120 88 L90 60 L85 64 L112 90 Z" fill="#0EA5E9" />
              <path d="M145 90 L150 50 L144 48 L138 88 Z" fill="#0EA5E9" />
              <ellipse cx="130" cy="100" rx="25" ry="20" fill="#0EA5E9" />
              
              {/* Star burst */}
              <polygon points="100,20 103,30 113,30 105,37 108,47 100,41 92,47 95,37 87,30 97,30" fill="#10B981" />
              <circle cx="60" cy="35" r="3" fill="#F59E0B" />
              <circle cx="145" cy="40" r="2" fill="#8B5CF6" />
              <text x="50" y="130" fill="#6B7280" fontSize="8">+</text>
              <text x="155" y="70" fill="#6B7280" fontSize="10">~</text>
            </svg>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Your voice note is recorded!
          </h2>
          <p className="text-gray-500">
            We&apos;re processing your audio now. We&apos;ll let{' '}
            <span className="font-medium">{requesterEmail || 'the requester'}</span>{' '}
            know when it&apos;s ready!
          </p>
        </div>

        <div className="fixed bottom-0 left-0 right-0 py-4 text-center text-sm text-gray-400">
          Powered by Suflate | Copyright © {new Date().getFullYear()} Suflate. All rights reserved.
        </div>
      </div>
    )
  }

  // Uploading State
  if (status === 'uploading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="py-8 text-center">
          <Logo className="mx-auto" />
        </div>

        <div className="max-w-xl mx-auto px-4">
          <h1 className="text-2xl font-semibold text-gray-900 text-center mb-2">
            Your voice note is recorded!
          </h1>
          <p className="text-gray-500 text-center mb-8">
            Take a moment to review your audio before submitting to ensure it sounds just right.
          </p>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-gray-900 mb-2">
                {formatTime(duration)}
              </div>
              <p className="text-gray-500 mb-6">Uploading...</p>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400">{uploadProgress.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 py-4 text-center text-sm text-gray-400">
          Powered by Suflate | Copyright © {new Date().getFullYear()} Suflate. All rights reserved.
        </div>
      </div>
    )
  }

  // Completed State - Review before submit
  if (status === 'completed' && audioUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="py-8 text-center">
          <Logo className="mx-auto" />
        </div>

        <div className="max-w-xl mx-auto px-4">
          <h1 className="text-2xl font-semibold text-gray-900 text-center mb-2">
            Your voice note is recorded!
          </h1>
          <p className="text-gray-500 text-center mb-8">
            Take a moment to review your audio before submitting to ensure it sounds just right.
          </p>

          {/* Audio Player Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
            <audio 
              ref={audioRef} 
              src={audioUrl} 
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleAudioEnded}
              className="hidden"
            />
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-10">{formatTime(currentTime)}</span>
              
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              
              <span className="text-sm text-gray-500 w-10">{formatTime(duration)}</span>
              
              <Button
                onClick={togglePlayback}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
            </div>
          </div>

          {/* Re-record Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 text-center">
            <h3 className="font-semibold text-gray-900 mb-2">
              Not Feeling It? Give It Another Go!
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              If the recording didn&apos;t capture your best, no worries! Hit re-record and let&apos;s try again.
            </p>
            <Button variant="outline" onClick={resetRecording} className="flex items-center gap-2 mx-auto">
              <RefreshCw className="w-4 h-4" />
              Re-record
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="text-center">
            <Button
              onClick={uploadRecording}
              className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3"
            >
              Submit Recording
            </Button>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 py-4 text-center text-sm text-gray-400">
          Powered by Suflate | Copyright © {new Date().getFullYear()} Suflate. All rights reserved.
        </div>
      </div>
    )
  }

  // Recording State (idle, recording, paused)
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="py-8 text-center">
        <Logo className="mx-auto" />
      </div>

      <div className="max-w-xl mx-auto px-4">
        <p className="text-center text-gray-700 mb-4">
          Hey, <span className="font-medium">{requesterEmail || 'Someone'}</span> has requested you to record your voice note
        </p>

        <h1 className="text-2xl font-semibold text-gray-900 text-center mb-2">
          Record your voice note
        </h1>
        
        <p className="text-gray-500 text-center mb-6">
          Your voice recording should be at least 30 seconds for best results.
        </p>

        {questions && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Questions to answer:</h3>
            <p className="text-sm text-blue-700 whitespace-pre-wrap">{questions}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col items-center">
            {status === 'recording' && (
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-cyan-400/30 animate-ping" />
                <div className="relative w-24 h-24 rounded-full bg-cyan-500 flex items-center justify-center">
                  <Mic className="w-10 h-10 text-white" />
                </div>
              </div>
            )}

            {status === 'paused' && (
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-cyan-500 flex items-center justify-center">
                  <Mic className="w-10 h-10 text-white" />
                </div>
              </div>
            )}

            <div className="text-4xl font-mono font-bold text-gray-900 mb-2">
              {formatTime(duration)}
            </div>

            {status === 'recording' && (
              <p className="text-gray-500 mb-6">Recording...</p>
            )}
            {status === 'paused' && (
              <p className="text-gray-500 mb-6">Recording Paused</p>
            )}

            {error && (
              <div className="w-full mb-4 p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}

            {status === 'idle' && (
              <Button
                onClick={startRecording}
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-2"
              >
                Start Recording
              </Button>
            )}

            {status === 'recording' && (
              <div className="flex items-center gap-3">
                <Button onClick={pauseRecording} variant="outline" className="flex items-center gap-2">
                  <Pause className="w-4 h-4" />
                  Pause
                </Button>
                <Button
                  onClick={stopRecording}
                  variant="outline"
                  className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              </div>
            )}

            {status === 'paused' && (
              <div className="flex items-center gap-3">
                <Button onClick={resumeRecording} variant="outline" className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Resume
                </Button>
                <Button
                  onClick={stopRecording}
                  variant="outline"
                  className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 py-4 text-center text-sm text-gray-400">
        Powered by Suflate | Copyright © {new Date().getFullYear()} Suflate. All rights reserved.
      </div>
    </div>
  )
}
