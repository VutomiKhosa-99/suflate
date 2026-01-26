'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Play, Pause, X, FileText, ChevronRight, Sparkles, Edit2, Trash2, RefreshCw, Check, RotateCcw } from 'lucide-react'

interface VoiceRecording {
  id: string
  title?: string
  status: string
  duration_seconds?: number
  file_size_bytes?: number
  storage_path?: string
  created_at: string
}

interface Transcription {
  id: string
  raw_text: string
  processed_text?: string
  detected_language?: string
  detected_content_type?: string
}

interface ExistingPost {
  id: string
  content: string
  variation_type: string
  status: string
  created_at: string
}

// Transcript Modal Component with Editing
function TranscriptModal({ 
  isOpen, 
  onClose, 
  transcription,
  onSave
}: { 
  isOpen: boolean
  onClose: () => void
  transcription: Transcription | null
  onSave: (text: string) => Promise<void>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (transcription) {
      setEditedText(transcription.processed_text || transcription.raw_text)
    }
  }, [transcription])

  // Reset success message when modal opens/closes or editing starts
  useEffect(() => {
    if (isEditing) {
      setSaveSuccess(false)
      setSaveError(null)
    }
  }, [isEditing])

  if (!isOpen || !transcription) return null

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      await onSave(editedText)
      setIsEditing(false)
      setSaveSuccess(true)
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to save:', err)
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedText(transcription.processed_text || transcription.raw_text)
    setIsEditing(false)
    setSaveError(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Transcript</h2>
            {saveSuccess && (
              <span className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <Check className="w-4 h-4" />
                Saved!
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                title="Edit transcript"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            ) : null}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Error message */}
        {saveError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {saveError}
          </div>
        )}
        
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {isEditing ? (
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="min-h-[300px] text-gray-700 leading-relaxed resize-none"
              placeholder="Edit your transcript..."
            />
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {transcription.processed_text || transcription.raw_text}
            </p>
          )}
        </div>

        {/* Footer with actions */}
        {isEditing && (
          <div className="p-4 border-t flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Post Format Option Component
function PostFormatOption({ 
  icon, 
  title, 
  description,
  onClick,
  disabled,
  isGenerating
}: { 
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
  disabled?: boolean
  isGenerating?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-200 hover:shadow-sm transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0">
          {isGenerating ? (
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            icon
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>
    </button>
  )
}

export default function VoiceNoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  
  const [recording, setRecording] = useState<VoiceRecording | null>(null)
  const [transcription, setTranscription] = useState<Transcription | null>(null)
  const [existingPosts, setExistingPosts] = useState<ExistingPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingType, setGeneratingType] = useState<string | null>(null) // Track which type is generating
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcribeProgress, setTranscribeProgress] = useState(0)
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
  const [pendingGenerationType, setPendingGenerationType] = useState<string | null>(null)
  const [showRegenerateOptions, setShowRegenerateOptions] = useState(false) // Show tone options for regeneration
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editingPostContent, setEditingPostContent] = useState('')
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  
  // Audio player state
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch recording
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

        // Fetch transcription if available
        const supabase = createClient()
        const { data: transcriptionData } = await supabase
          .from('transcriptions')
          .select('*')
          .eq('recording_id', id)
          .single()

        if (transcriptionData) {
          setTranscription(transcriptionData as Transcription)
          
          // Fetch existing posts for this transcription
          const { data: postsData } = await supabase
            .from('posts')
            .select('id, content, variation_type, status, created_at')
            .eq('transcription_id', (transcriptionData as Transcription).id)
            .order('created_at', { ascending: false })
          
          if (postsData && postsData.length > 0) {
            setExistingPosts(postsData as ExistingPost[])
          }
        }

        // Get audio URL if available
        if (data.recording?.storage_path) {
          const { data: urlData } = await supabase.storage
            .from('voice-recordings')
            .createSignedUrl(data.recording.storage_path, 3600)
          
          if (urlData?.signedUrl) {
            setAudioUrl(urlData.signedUrl)
          }
        }
      } catch (err) {
        setError('Failed to load recording')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id])

  // Audio playback handlers
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Generate title from transcription
  const getTitle = (): string => {
    if (recording?.title) return recording.title
    if (transcription?.processed_text || transcription?.raw_text) {
      const text = transcription.processed_text || transcription.raw_text
      // Get first sentence or first 50 chars
      const firstSentence = text.split(/[.!?]/)[0]
      return firstSentence.length > 60 ? firstSentence.slice(0, 60) + '...' : firstSentence
    }
    return 'Voice Note'
  }

  // Generate summary from transcription
  const getSummary = (): string[] => {
    if (!transcription) return []
    const text = transcription.processed_text || transcription.raw_text
    // Split into sentences and return first 3-5 key points
    const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 20)
    return sentences.slice(0, 4).map(s => s.trim())
  }

  // Handle generate posts
  const handleGeneratePosts = async (variationType?: 'professional' | 'personal' | 'actionable' | 'discussion' | 'bold') => {
    if (!transcription) return
    
    // Check if there are existing posts and ask for confirmation
    if (existingPosts.length > 0 && !showRegenerateConfirm) {
      setPendingGenerationType(variationType || 'all')
      setShowRegenerateConfirm(true)
      return
    }
    
    // Reset confirmation state
    setShowRegenerateConfirm(false)
    setPendingGenerationType(null)
    
    setIsGenerating(true)
    setGeneratingType(variationType || 'all')
    try {
      const response = await fetch('/api/suflate/amplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcriptionId: transcription.id,
          variationType, // Pass the specific type if selected
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate posts')
      }

      // Redirect to posts view
      router.push(`/record/${id}/posts`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate posts')
      setIsGenerating(false)
      setGeneratingType(null)
    }
  }
  
  // Confirm regeneration (adds new posts, keeps existing)
  const confirmRegenerate = () => {
    const type = pendingGenerationType
    setShowRegenerateConfirm(false)
    setPendingGenerationType(null)
    // Call with the type, bypassing the confirmation check
    if (type === 'all') {
      actuallyGeneratePosts()
    } else {
      actuallyGeneratePosts(type as any)
    }
  }
  
  // Actually generate posts (bypasses confirmation)
  const actuallyGeneratePosts = async (variationType?: 'professional' | 'personal' | 'actionable' | 'discussion' | 'bold') => {
    if (!transcription) return
    
    setIsGenerating(true)
    setGeneratingType(variationType || 'all')
    try {
      const response = await fetch('/api/suflate/amplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcriptionId: transcription.id,
          variationType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate posts')
      }

      // Redirect to posts view
      router.push(`/record/${id}/posts`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate posts')
      setIsGenerating(false)
      setGeneratingType(null)
    }
  }

  // Save transcript changes
  const handleSaveTranscript = async (newText: string) => {
    if (!transcription) return
    
    try {
      const response = await fetch('/api/suflate/transcription/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptionId: transcription.id,
          processed_text: newText,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save transcript')
      }

      // Update local state
      setTranscription({
        ...transcription,
        processed_text: newText,
      })
    } catch (err) {
      throw err
    }
  }

  // Edit a post
  const handleEditPost = async (postId: string, newContent: string) => {
    try {
      const response = await fetch(`/api/suflate/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      })

      if (!response.ok) {
        throw new Error('Failed to update post')
      }

      // Update local state
      setExistingPosts(posts => 
        posts.map(p => p.id === postId ? { ...p, content: newContent } : p)
      )
      setEditingPostId(null)
      setEditingPostContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post')
    }
  }

  // Delete a post
  const handleDeletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/suflate/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }

      // Update local state
      setExistingPosts(posts => posts.filter(p => p.id !== postId))
      setDeletingPostId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post')
    }
  }

  // Handle transcription if needed
  const handleTranscribe = async () => {
    setIsTranscribing(true)
    setTranscribeProgress(0)
    setError(null)
    
    // Simulate progress while waiting
    const progressInterval = setInterval(() => {
      setTranscribeProgress(prev => {
        if (prev >= 90) return prev
        // Slow down as we approach 90%
        const increment = prev < 30 ? 8 : prev < 60 ? 5 : prev < 80 ? 3 : 1
        return Math.min(prev + increment, 90)
      })
    }, 500)

    try {
      const response = await fetch('/api/suflate/voice/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordingId: id }),
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Transcription failed')
      }

      setTranscribeProgress(100)
      
      // Short delay to show 100% before refreshing
      await new Promise(resolve => setTimeout(resolve, 500))
      window.location.reload()
    } catch (err) {
      clearInterval(progressInterval)
      setIsTranscribing(false)
      setTranscribeProgress(0)
      setError(err instanceof Error ? err.message : 'Failed to transcribe')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-40 bg-gray-200 rounded-xl" />
            <div className="h-60 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !recording) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.push('/record')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Voice Notes
          </button>
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">{error || 'Recording not found'}</p>
            <Button
              onClick={() => router.push('/record')}
              className="mt-4"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Needs transcription
  if (recording.status === 'uploaded' && !transcription) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.push('/record')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Voice Notes
          </button>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Ready to Transcribe</h2>
            <p className="text-gray-500 mb-6">
              Your voice note is uploaded. Click below to transcribe it.
            </p>
            
            {/* Audio Player */}
            {audioUrl && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                />
                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePlayback}
                    className="w-12 h-12 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center text-white transition-colors"
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
                      max={recording.duration_seconds || 100}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(recording.duration_seconds || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {isTranscribing ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-700 font-medium">Transcribing...</span>
                </div>
                <div className="w-full max-w-xs mx-auto">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 transition-all duration-300 ease-out"
                      style={{ width: `${transcribeProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    {transcribeProgress < 30 && 'Uploading audio...'}
                    {transcribeProgress >= 30 && transcribeProgress < 60 && 'Processing audio...'}
                    {transcribeProgress >= 60 && transcribeProgress < 90 && 'Transcribing speech...'}
                    {transcribeProgress >= 90 && 'Finalizing...'}
                  </p>
                </div>
              </div>
            ) : (
              <Button onClick={handleTranscribe} size="lg" className="bg-orange-500 hover:bg-orange-600">
                Transcribe Voice Note
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Processing
  if (recording.status === 'transcribing' || recording.status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.push('/record')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Voice Notes
          </button>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Processing...</h2>
            <p className="text-gray-500">
              {recording.status === 'transcribing' 
                ? 'Transcribing your voice note...' 
                : 'Processing your content...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Main detail view with transcription
  const summary = getSummary()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/record')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Voice Notes
        </button>

        {/* Title & Transcript Button */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{getTitle()}</h1>
          <Button
            variant="outline"
            onClick={() => setShowTranscript(true)}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            View Transcript
          </Button>
        </div>

        {/* Audio Player */}
        {audioUrl && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
            />
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
                  max={recording.duration_seconds || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(recording.duration_seconds || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Section */}
        {summary.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <ul className="space-y-3">
              {summary.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-gray-700">{point}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Existing Posts Section */}
        {existingPosts.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Your Generated Posts ({existingPosts.length})
              </h2>
              <Button
                onClick={() => router.push(`/record/${id}/posts`)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                View All Posts
              </Button>
            </div>
            
            <div className="space-y-3">
              {existingPosts.slice(0, 3).map((post) => (
                <div 
                  key={post.id}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        post.variation_type === 'professional' ? 'bg-blue-100 text-blue-700' :
                        post.variation_type === 'personal' ? 'bg-purple-100 text-purple-700' :
                        post.variation_type === 'actionable' ? 'bg-green-100 text-green-700' :
                        post.variation_type === 'discussion' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {post.variation_type.charAt(0).toUpperCase() + post.variation_type.slice(1)}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        post.status === 'published' ? 'bg-green-100 text-green-700' :
                        post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                      </span>
                    </div>
                    
                    {/* Edit/Delete buttons */}
                    <div className="flex items-center gap-1">
                      {editingPostId === post.id ? (
                        <>
                          <button
                            onClick={() => {
                              handleEditPost(post.id, editingPostContent)
                            }}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                            title="Save changes"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingPostId(null)
                              setEditingPostContent('')
                            }}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                            title="Cancel"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingPostId(post.id)
                              setEditingPostContent(post.content)
                            }}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                            title="Edit post"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingPostId(post.id)}
                            className="p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                            title="Delete post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Editing mode or display mode */}
                  {editingPostId === post.id ? (
                    <Textarea
                      value={editingPostContent}
                      onChange={(e) => setEditingPostContent(e.target.value)}
                      className="min-h-[80px] text-gray-700 text-sm resize-none"
                    />
                  ) : (
                    <p className="text-gray-700 text-sm line-clamp-2">
                      {post.content.slice(0, 150)}...
                    </p>
                  )}
                </div>
              ))}
              
              {existingPosts.length > 3 && (
                <p className="text-sm text-gray-500 text-center">
                  +{existingPosts.length - 3} more posts
                </p>
              )}
            </div>
            
            {/* Regenerate button */}
            {!showRegenerateOptions && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowRegenerateOptions(true)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate with different tones
                </button>
              </div>
            )}
          </div>
        )}
        {/* Generate Post Section - Only show when no posts exist, or when regenerate options are shown */}
        {(existingPosts.length === 0 || showRegenerateOptions) && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {existingPosts.length > 0 ? 'Regenerate Posts' : 'Generate Post'}
                </h2>
                {existingPosts.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Choose a tone to generate new variations
                  </p>
                )}
              </div>
              {showRegenerateOptions && (
                <button
                  onClick={() => setShowRegenerateOptions(false)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          
          <div className="space-y-3">
            <PostFormatOption
              icon={<Sparkles className="w-5 h-5" />}
              title="Generate All Formats"
              description="Create 5 post variations (one of each type)"
              onClick={() => handleGeneratePosts()}
              disabled={isGenerating || !transcription}
              isGenerating={generatingType === 'all'}
            />
            
            <PostFormatOption
              icon={<span className="text-lg">💼</span>}
              title="Professional Thought Leadership"
              description="3 variations with executive tone, industry insights"
              onClick={() => handleGeneratePosts('professional')}
              disabled={isGenerating || !transcription}
              isGenerating={generatingType === 'professional'}
            />
            
            <PostFormatOption
              icon={<span className="text-lg">📖</span>}
              title="Personal Story"
              description="3 variations with narrative format, emotional connection"
              onClick={() => handleGeneratePosts('personal')}
              disabled={isGenerating || !transcription}
              isGenerating={generatingType === 'personal'}
            />
            
            <PostFormatOption
              icon={<span className="text-lg">📋</span>}
              title="Actionable Tips"
              description="3 variations with list-based, practical value"
              onClick={() => handleGeneratePosts('actionable')}
              disabled={isGenerating || !transcription}
              isGenerating={generatingType === 'actionable'}
            />
            
            <PostFormatOption
              icon={<span className="text-lg">💬</span>}
              title="Discussion Starter"
              description="3 variations with question-driven, engagement-focused"
              onClick={() => handleGeneratePosts('discussion')}
              disabled={isGenerating || !transcription}
              isGenerating={generatingType === 'discussion'}
            />
            
            <PostFormatOption
              icon={<span className="text-lg">🔥</span>}
              title="Bold Opinion"
              description="3 variations with controversial stance, conversation-driving"
              onClick={() => handleGeneratePosts('bold')}
              disabled={isGenerating || !transcription}
              isGenerating={generatingType === 'bold'}
            />
          </div>
          
          {isGenerating && (
            <div className="mt-4 p-4 bg-orange-50 rounded-xl text-center">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-orange-700">
                {generatingType === 'all' 
                  ? 'Generating 5 post variations...' 
                  : `Generating 3 ${generatingType} variations...`}
              </p>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Transcript Modal */}
      <TranscriptModal
        isOpen={showTranscript}
        onClose={() => setShowTranscript(false)}
        transcription={transcription}
        onSave={handleSaveTranscript}
      />
      
      {/* Delete Post Confirmation Dialog */}
      {deletingPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeletingPostId(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Post?
            </h3>
            <p className="text-gray-600 mb-4">
              This will permanently delete this post variation. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeletingPostId(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDeletePost(deletingPostId)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </Button>
            </div>
            <button
              onClick={() => setDeletingPostId(null)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      )}
      
      {/* Regenerate Confirmation Dialog */}
      {showRegenerateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRegenerateConfirm(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Generate More Variations?
            </h3>
            <p className="text-gray-600 mb-4">
              You already have {existingPosts.length} post variation{existingPosts.length > 1 ? 's' : ''} saved. 
              Generating new ones will add to your existing posts.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/record/${id}/posts`)}
                className="flex-1"
              >
                View Existing Posts
              </Button>
              <Button
                onClick={confirmRegenerate}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Generate New
              </Button>
            </div>
            <button
              onClick={() => setShowRegenerateConfirm(false)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
