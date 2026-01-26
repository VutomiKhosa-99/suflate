'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Mic, Pause, Play, Square, RefreshCw, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

interface RecordVoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRecordingComplete: (blob: Blob) => void
}

type RecordingStatus = 'idle' | 'recording' | 'paused' | 'completed' | 'uploading' | 'success'

export function RecordVoiceModal({
  open,
  onOpenChange,
  onRecordingComplete,
}: RecordVoiceModalProps) {
  const [status, setStatus] = useState<RecordingStatus>('idle')
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  // Audio playback refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  const MAX_DURATION = 180 // 3 minutes

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
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
      setAudioBlob(null)
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
        setAudioBlob(blob)
        setStatus('completed')
        
        // Stop stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
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
      mediaRecorderRef.current.stop()
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const handleReRecord = () => {
    setAudioBlob(null)
    setStatus('idle')
    setDuration(0)
    setCurrentTime(0)
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }

  const handleSubmit = async () => {
    if (!audioBlob) return
    
    setStatus('uploading')
    setUploadProgress(0)
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + Math.random() * 15
      })
    }, 200)
    
    try {
      // Complete the recording callback
      onRecordingComplete(audioBlob)
      
      // Simulate completion
      setTimeout(() => {
        clearInterval(progressInterval)
        setUploadProgress(100)
        setStatus('success')
      }, 1000)
    } catch (err) {
      clearInterval(progressInterval)
      setError('Failed to upload recording')
      setStatus('completed')
    }
  }

  // Audio playback handlers
  const togglePlayback = async () => {
    if (!audioRef.current || !audioUrl) return
    
    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (err) {
      console.error('Playback error:', err)
      setIsPlaying(false)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleClose = () => {
    if (status !== 'idle' && status !== 'success') {
      // Stop recording without saving
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.ondataavailable = null
        mediaRecorderRef.current.onstop = null
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop()
        }
      }
      cleanup()
    }
    setStatus('idle')
    setDuration(0)
    setAudioBlob(null)
    setCurrentTime(0)
    setIsPlaying(false)
    onOpenChange(false)
  }

  const handleSuccessClose = () => {
    setStatus('idle')
    setDuration(0)
    setAudioBlob(null)
    setCurrentTime(0)
    setIsPlaying(false)
    onOpenChange(false)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStatus('idle')
      setDuration(0)
      setError(null)
      setAudioBlob(null)
      setCurrentTime(0)
      setIsPlaying(false)
    }
  }, [open])

  // Create stable audio URL when blob is available
  const audioUrl = useMemo(() => {
    if (audioBlob) {
      return URL.createObjectURL(audioBlob)
    }
    return null
  }, [audioBlob])

  // Clean up audio URL on unmount or when blob changes
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  // Load audio when URL is available
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.load()
    }
  }, [audioUrl])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-6">
        {/* Success State */}
        {status === 'success' ? (
          <div className="py-8 text-center">
            {/* High Five SVG Illustration */}
            <div className="w-32 h-32 mx-auto mb-6">
              <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Left hand */}
                <path d="M25 70 Q20 50 30 35 Q35 30 40 35 L45 50 Q50 60 45 70 Z" fill="#FEE2E2" stroke="#F87171" strokeWidth="2"/>
                {/* Right hand */}
                <path d="M95 70 Q100 50 90 35 Q85 30 80 35 L75 50 Q70 60 75 70 Z" fill="#FEE2E2" stroke="#F87171" strokeWidth="2"/>
                {/* Sparkles */}
                <circle cx="35" cy="25" r="3" fill="#FCD34D"/>
                <circle cx="85" cy="25" r="3" fill="#FCD34D"/>
                <circle cx="60" cy="15" r="4" fill="#FCD34D"/>
                {/* Impact lines */}
                <path d="M55 45 L50 40" stroke="#F97316" strokeWidth="2" strokeLinecap="round"/>
                <path d="M65 45 L70 40" stroke="#F97316" strokeWidth="2" strokeLinecap="round"/>
                <path d="M60 50 L60 43" stroke="#F97316" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your voice note is recorded!
            </h2>
            <p className="text-gray-500 mb-6">
              We&apos;re processing your audio now. Check your voice notes to see when it&apos;s ready!
            </p>
            
            <Button 
              onClick={handleSuccessClose}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Done
            </Button>
          </div>
        ) : status === 'uploading' ? (
          /* Uploading State */
          <div className="py-8">
            <DialogTitle className="sr-only">Uploading Recording</DialogTitle>
            <div className="text-center mb-6">
              <div className="text-2xl font-mono font-bold text-gray-900 mb-2">
                {formatTime(duration)}
              </div>
              <p className="text-gray-500">Uploading...</p>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 text-center mt-2">
                {uploadProgress.toFixed(0)}%
              </p>
            </div>
          </div>
        ) : status === 'completed' ? (
          /* Review State */
          <div className="py-4">
            <DialogTitle className="text-xl font-semibold text-gray-900 mb-2">
              Your voice note is recorded!
            </DialogTitle>
            <p className="text-gray-500 text-sm mb-6">
              Take a moment to review your audio before submitting to ensure it sounds just right.
            </p>
            
            {/* Audio Player */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  preload="auto"
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleAudioEnded}
                  onLoadedMetadata={() => {
                    // Audio is ready to play
                    console.log('Audio loaded, duration:', audioRef.current?.duration)
                  }}
                />
              )}
              
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlayback}
                  className="w-12 h-12 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center text-white transition-colors flex-shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </button>
                
                <div className="flex-1">
                  <input
                    type="range"
                    min={0}
                    max={duration}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{formatTime(Math.floor(currentTime))}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Re-record Card */}
            <div className="bg-orange-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Not Feeling It?</p>
                  <p className="text-sm text-gray-500">Give It Another Go!</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleReRecord}
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                >
                  Re-record
                </Button>
              </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}
            
            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3"
            >
              Submit Recording
            </Button>
          </div>
        ) : (
          /* Recording States: idle, recording, paused */
          <>
            <DialogTitle className="text-xl font-semibold text-gray-900 mb-6">
              Record your Voice
            </DialogTitle>

            <div className="flex flex-col items-center py-6">
              {/* Mic Icon with Pulse Animation */}
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

              {status === 'idle' && !error && (
                <div className="mb-6">
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                    <Mic className="w-10 h-10 text-gray-400" />
                  </div>
                </div>
              )}

              {/* Timer */}
              <div className="text-4xl font-mono font-bold text-gray-900 mb-2">
                {formatTime(duration)}
              </div>

              {/* Status Text */}
              {status === 'recording' && (
                <p className="text-sm text-gray-500 mb-6">Recording...</p>
              )}
              {status === 'paused' && (
                <p className="text-sm text-gray-500 mb-6">Recording Paused</p>
              )}
              {status === 'idle' && !error && (
                <p className="text-sm text-gray-500 mb-6">Click to start recording</p>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600 text-center">{error}</p>
                </div>
              )}

              {/* Controls */}
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
                  <Button
                    onClick={pauseRecording}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
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
                  <Button
                    onClick={resumeRecording}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
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

              {/* Max Duration Note */}
              {(status === 'recording' || status === 'paused') && (
                <p className="text-xs text-gray-400 mt-4">
                  Maximum recording time: 3 minutes
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
