'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { RichTextEditor } from '@/components/features/post-editor/rich-text-editor'
import { Button } from '@/components/ui/button'
import { LinkedInConnectCard } from '@/components/features/linkedin/linkedin-connect-card'
import { SchedulePicker } from '@/components/features/scheduler/schedule-picker'
import { TagManager } from '@/components/features/drafts/tag-manager'
import { DeleteDialog } from '@/components/features/drafts/delete-dialog'
import {
  ArrowLeft,
  Mic,
  FileText,
  Twitter,
  Save,
  Check,
  Loader2,
  Trash2,
  Copy,
  Clock,
} from 'lucide-react'

// Source type icons
const SOURCE_ICONS: Record<string, React.ReactNode> = {
  voice: <Mic className="w-4 h-4" />,
  repurpose_blog: <FileText className="w-4 h-4" />,
  repurpose_tweet: <Twitter className="w-4 h-4" />,
}

// Variation type labels
const VARIATION_LABELS: Record<string, string> = {
  professional: 'Professional',
  personal: 'Personal Story',
  actionable: 'Actionable Tips',
  discussion: 'Discussion Starter',
  bold: 'Bold Opinion',
}

interface Post {
  id: string
  content: string
  title?: string
  tags?: string[]
  source_type: string
  variation_type: string
  word_count?: number
  character_count?: number
  status: string
  created_at: string
  updated_at: string
  transcriptions?: {
    id: string
    raw_text: string
    processed_text?: string
    voice_recordings?: {
      id: string
      duration_seconds?: number
    }
  }
}

/**
 * Story 3.3: Edit Draft Content
 * Story 3.6: Tag Drafts for Organization
 * 
 * Screen 6: Editor - Reinforce control
 * Screen 7: Connect LinkedIn - Enable posting
 * Screen 8: Post / Schedule - Publish without friction
 */
export default function EditorPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  
  const [post, setPost] = useState<Post | null>(null)
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved')
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Auto-save timer ref
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedContent = useRef('')
  const lastSavedTags = useRef<string[]>([])

  // Fetch post data and LinkedIn status
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch post and LinkedIn status in parallel
        const [postResponse, linkedInResponse] = await Promise.all([
          fetch(`/api/suflate/posts/${id}`),
          fetch('/api/linkedin/status'),
        ])

        // Handle post response
        if (!postResponse.ok) {
          if (postResponse.status === 404) {
            setError('Post not found')
          } else if (postResponse.status === 401) {
            router.push('/login')
            return
          } else {
            throw new Error('Failed to fetch post')
          }
          return
        }
        const postData = await postResponse.json()
        setPost(postData.post)
        setContent(postData.post?.content || '')
        setTags(postData.post?.tags || [])
        lastSavedContent.current = postData.post?.content || ''
        lastSavedTags.current = postData.post?.tags || []

        // Handle LinkedIn status response
        if (linkedInResponse.ok) {
          const linkedInData = await linkedInResponse.json()
          setIsLinkedInConnected(linkedInData.connected)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, router])

  // Auto-save function
  const saveChanges = useCallback(async (contentToSave: string, tagsToSave: string[]) => {
    // Don't save if nothing changed
    if (
      contentToSave === lastSavedContent.current &&
      JSON.stringify(tagsToSave) === JSON.stringify(lastSavedTags.current)
    ) {
      return
    }

    setSaving(true)
    setSaveStatus('saving')

    try {
      const response = await fetch(`/api/suflate/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contentToSave,
          tags: tagsToSave,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save')
      }

      lastSavedContent.current = contentToSave
      lastSavedTags.current = tagsToSave
      setSaveStatus('saved')
    } catch (err) {
      setSaveStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }, [id])

  // Handle content change with debounced auto-save
  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setSaveStatus('unsaved')

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    // Set new timer for auto-save (2 seconds after last change)
    saveTimerRef.current = setTimeout(() => {
      saveChanges(newContent, tags)
    }, 2000)
  }

  // Handle tags change
  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags)
    setSaveStatus('unsaved')

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    // Set new timer for auto-save
    saveTimerRef.current = setTimeout(() => {
      saveChanges(content, newTags)
    }, 2000)
  }

  // Manual save
  const handleManualSave = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveChanges(content, tags)
  }

  // AI assist handlers
  const handleFixGrammar = async (): Promise<string> => {
    const response = await fetch('/api/suflate/ai-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'fix-grammar', content }),
    })
    if (!response.ok) throw new Error('Failed to fix grammar')
    const data = await response.json()
    return data.content
  }

  const handleMakeClearer = async (): Promise<string> => {
    const response = await fetch('/api/suflate/ai-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'make-clearer', content }),
    })
    if (!response.ok) throw new Error('Failed to improve clarity')
    const data = await response.json()
    return data.content
  }

  const handleShorten = async (): Promise<string> => {
    const response = await fetch('/api/suflate/ai-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'shorten', content }),
    })
    if (!response.ok) throw new Error('Failed to shorten')
    const data = await response.json()
    return data.content
  }

  const handleLinkedInConnect = () => {
    window.location.href = '/api/linkedin/oauth'
  }

  const handlePostNow = async () => {
    try {
      setPublishing(true)
      
      // Try to publish directly to LinkedIn
      const response = await fetch(`/api/suflate/posts/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish')
      }
      
      if (data.postedDirectly) {
        // Successfully posted directly to LinkedIn!
        alert(`✅ Successfully posted to LinkedIn!\n\nYour post is now live.${data.linkedInPostUrl ? `\n\nView it at: ${data.linkedInPostUrl}` : ''}`)
        router.push('/drafts')
      } else {
        // Fallback: Copy to clipboard and open LinkedIn
        await navigator.clipboard.writeText(content)
        window.open(data.shareUrl || 'https://www.linkedin.com/feed/?shareActive=true', '_blank')
        
        alert('✅ Your post content has been copied to clipboard!\n\n1. LinkedIn is opening in a new tab\n2. Click "Start a post"\n3. Paste (Ctrl+V / Cmd+V) your content\n4. Click "Post"')
        router.push('/drafts')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post')
    } finally {
      setPublishing(false)
    }
  }

  const handleSchedule = async (date: Date) => {
    try {
      const response = await fetch(`/api/suflate/posts/${id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledFor: date.toISOString() }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to schedule')
      }
      
      router.push('/calendar')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule')
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/suflate/posts/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete')
      router.push('/drafts')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  if (error && !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error === 'Post not found' ? 'Draft not found' : 'Error loading draft'}
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/drafts')}>Back to Drafts</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              type="button"
              onClick={() => {
                console.log('Back button clicked')
                router.push('/drafts')
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {/* Source indicator (Story 3.2) */}
            {post && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                  {SOURCE_ICONS[post.source_type] || <FileText className="w-3 h-3" />}
                </span>
                <span className="font-medium">
                  {VARIATION_LABELS[post.variation_type] || post.variation_type}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Save status indicator */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mr-2">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Saved</span>
                </>
              )}
              {saveStatus === 'unsaved' && (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Unsaved changes</span>
                </>
              )}
              {saveStatus === 'error' && (
                <span className="text-red-600">Save failed</span>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSave}
              disabled={saving || saveStatus === 'saved'}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="min-w-[100px]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tags management (Story 3.6) */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <TagManager
            tags={tags}
            onChange={handleTagsChange}
            maxTags={10}
            placeholder="Add tag..."
          />
        </div>

        {/* Editor (Story 3.3) */}
        <RichTextEditor
          initialContent={content}
          onChange={handleContentChange}
          onFixGrammar={handleFixGrammar}
          onMakeClearer={handleMakeClearer}
          onShorten={handleShorten}
        />

        {/* Word and character count */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{content.trim().split(/\s+/).filter(Boolean).length} words</span>
          <span>{content.length} characters</span>
          {content.length > 3000 && (
            <span className="text-yellow-600">
              LinkedIn limit: 3000 characters
            </span>
          )}
        </div>

        {/* LinkedIn connection */}
        <LinkedInConnectCard
          isConnected={isLinkedInConnected}
          onConnect={handleLinkedInConnect}
        />

        {/* Post/Schedule actions */}
        {isLinkedInConnected && (
          <div className="space-y-4">
            {!showSchedule ? (
              <div className="flex gap-4">
                <Button 
                  onClick={handlePostNow} 
                  size="lg" 
                  className="flex-1"
                  disabled={publishing}
                >
                  {publishing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Post on LinkedIn'
                  )}
                </Button>
                <Button
                  onClick={() => setShowSchedule(true)}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  disabled={publishing}
                >
                  Schedule
                </Button>
              </div>
            ) : (
              <SchedulePicker onSchedule={handleSchedule} onPostNow={handlePostNow} />
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <DeleteDialog
        isOpen={showDeleteDialog}
        title="Delete Draft"
        message="Are you sure you want to delete this draft? This action cannot be undone."
        confirmLabel="Delete Draft"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  )
}
