'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { TranscriptionEditor } from '@/components/features/transcription-editor/transcription-editor'
import { ProcessingStepper } from '@/components/features/processing/processing-stepper'

function TranscriptionDisplay({ recordingId }: { recordingId: string }) {
  // This component fetches and displays transcription with editing
  const [transcription, setTranscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTranscription() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('transcriptions')
          .select('*')
          .eq('recording_id', recordingId)
          .single()

        if (!error && data) {
          setTranscription(data)
        }
      } catch (err) {
        console.error('Failed to load transcription:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTranscription()
  }, [recordingId])

  const handleSave = async (data: { id: string; processed_text: string }) => {
    const response = await fetch('/api/suflate/transcription/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcriptionId: data.id,
        processed_text: data.processed_text,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to save transcription')
    }

    // Update local state
    setTranscription((prev: any) => ({
      ...prev,
      processed_text: data.processed_text,
    }))

    return { success: true }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading transcription...</p>
  }

  if (!transcription) {
    return <p className="text-muted-foreground">No transcription found.</p>
  }

  // Story 1.4: Show editable transcription editor
  return (
    <div className="space-y-4">
      <TranscriptionEditor
        transcription={transcription}
        onSave={handleSave}
      />
      {/* Story 1.5 - Amplify into posts */}
      <AmplificationButton recordingId={recordingId} transcriptionId={transcription?.id} />
      {/* Story 5.1 - Create carousel */}
      <CarouselButton recordingId={recordingId} transcriptionId={transcription?.id} />
    </div>
  )
}

// This page shows after recording is uploaded
// Will display transcription and editing interface
export default function RecordingDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [recording, setRecording] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRecording() {
      try {
        // Fetch via API to handle auth and RLS properly
        const response = await fetch(`/api/suflate/voice/${id}`, {
          credentials: 'include',
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          setError(errorData.error || 'Recording not found')
          return
        }

        const data = await response.json()
        setRecording(data.recording)
      } catch (err) {
        setError('Failed to load recording')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchRecording()
    }
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <p>Loading recording...</p>
        </div>
      </div>
    )
  }

  if (error || !recording) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-red-500">{error || 'Recording not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Recording {id.slice(0, 8)}...</h1>
        
        <div className="space-y-6 mt-8">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recording Details</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Status:</strong> {recording.status}</p>
              {recording.duration_seconds && (
                <p><strong>Duration:</strong> {formatDuration(recording.duration_seconds)}</p>
              )}
              {recording.file_size_bytes && (
                <p><strong>File Size:</strong> {(recording.file_size_bytes / 1024 / 1024).toFixed(2)} MB</p>
              )}
            </div>
          </div>

          {/* Transcription Status - Story 1.3 */}
          {recording.status === 'uploaded' && (
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Transcribe Recording</h2>
              <p className="text-muted-foreground mb-4">Ready to transcribe your voice recording.</p>
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/suflate/voice/transcribe', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ recordingId: id }),
                    })

                    if (!response.ok) {
                      throw new Error('Transcription failed')
                    }

                    // Refresh page to show transcription
                    window.location.reload()
                  } catch (err) {
                    alert('Failed to transcribe: ' + (err instanceof Error ? err.message : 'Unknown error'))
                  }
                }}
              >
                Transcribe
              </Button>
            </div>
          )}

          {recording.status === 'transcribing' && (
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6 text-center">Processing your voice...</h2>
              <ProcessingStepper
                steps={[
                  { id: 'transcribing', label: 'Transcribing', status: 'active' },
                  { id: 'structuring', label: 'Structuring', status: 'pending' },
                  { id: 'preserving', label: 'Preserving your voice', status: 'pending' },
                ]}
                currentStep={0}
              />
            </div>
          )}

          {/* Show transcription when ready - Story 1.3 & 1.4 */}
          {recording.status === 'transcribed' && (
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Transcription</h2>
              <TranscriptionDisplay recordingId={id} />
            </div>
          )}
          {/* TODO: Story 1.4 - Show editing interface */}
          {/* TODO: Story 1.5 - Show amplification interface */}
        </div>
      </div>
    </div>
  )
}

function AmplificationButton({ recordingId, transcriptionId }: { recordingId: string; transcriptionId?: string }) {
  const [isAmplifying, setIsAmplifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  if (!transcriptionId) {
    return null
  }

  const handleAmplify = async () => {
    setIsAmplifying(true)
    setError(null)
    setCurrentStep(0)

    try {
      // Step 1: Transcribing (already done, but show in flow)
      setCurrentStep(1)

      // Step 2: Structuring
      setCurrentStep(2)

      const response = await fetch('/api/suflate/amplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcriptionId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to amplify')
      }

      // Step 3: Preserving your voice
      setCurrentStep(3)

      const data = await response.json()

      // Redirect to posts view (Screen 5)
      if (data.posts && data.posts.length > 0) {
        window.location.href = `/record/${recordingId}/posts`
      } else {
        setError('Amplification completed but no posts were created')
        setIsAmplifying(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to amplify')
      setIsAmplifying(false)
      setCurrentStep(0)
    }
  }

  if (isAmplifying) {
    return (
      <div className="mt-6 pt-6 border-t">
        <h3 className="text-xl font-semibold mb-6 text-center">Processing your voice...</h3>
        <ProcessingStepper
          steps={[
            { id: 'transcribing', label: 'Transcribing', status: 'completed' },
            { id: 'structuring', label: 'Structuring', status: currentStep >= 2 ? 'active' : 'completed' },
            { id: 'preserving', label: 'Preserving your voice', status: currentStep >= 3 ? 'active' : currentStep > 0 ? 'completed' : 'pending' },
          ]}
          currentStep={currentStep}
        />
      </div>
    )
  }

  return (
    <div className="mt-6 pt-6 border-t">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800 mb-1">Error</p>
          <p className="text-sm text-red-600">{error}</p>
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
      <Button
        onClick={handleAmplify}
        disabled={isAmplifying}
        size="lg"
        className="w-full"
      >
        Amplify into Posts
      </Button>
    </div>
  )
}

/**
 * Story 5.1: Create Carousel Button
 * Allows users to create a carousel from their transcription
 */
function CarouselButton({ recordingId, transcriptionId }: { recordingId: string; transcriptionId?: string }) {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!transcriptionId) {
    return null
  }

  const handleCreateCarousel = async () => {
    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/suflate/amplify/carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcriptionId,
          templateType: 'minimal',
          slideCount: 7,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create carousel')
      }

      const data = await response.json()

      // Redirect to carousel editor
      if (data.carousel) {
        window.location.href = `/carousel/${data.carousel.id}`
      } else {
        setError('Carousel created but no data returned')
        setIsCreating(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create carousel')
      setIsCreating(false)
    }
  }

  return (
    <div className="pt-4">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800 mb-1">Error</p>
          <p className="text-sm text-red-600">{error}</p>
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
      <Button
        onClick={handleCreateCarousel}
        disabled={isCreating}
        variant="outline"
        size="lg"
        className="w-full"
      >
        {isCreating ? 'Creating Carousel...' : '🎠 Create Carousel'}
      </Button>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Transform your voice note into a LinkedIn carousel (10 credits)
      </p>
    </div>
  )
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
