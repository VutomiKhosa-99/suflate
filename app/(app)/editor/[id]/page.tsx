'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RichTextEditor } from '@/components/features/post-editor/rich-text-editor'
import { Button } from '@/components/ui/button'
import { LinkedInConnectCard } from '@/components/features/linkedin/linkedin-connect-card'
import { SchedulePicker } from '@/components/features/scheduler/schedule-picker'

/**
 * Screen 6: Editor - Reinforce control
 * Screen 7: Connect LinkedIn - Enable posting
 * Screen 8: Post / Schedule - Publish without friction
 */
export default function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [post, setPost] = useState<any>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await fetch(`/api/suflate/posts/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch post')
        }
        const data = await response.json()
        setPost(data.post)
        setContent(data.post?.content || '')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [id])

  const handleFixGrammar = async (): Promise<string> => {
    // TODO: Implement AI grammar fix API
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
    // TODO: Implement AI clarity API
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
    // TODO: Implement AI shorten API
    const response = await fetch('/api/suflate/ai-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'shorten', content }),
    })
    if (!response.ok) throw new Error('Failed to shorten')
    const data = await response.json()
    return data.content
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/suflate/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) throw new Error('Failed to save')
      // Show success message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  const handleLinkedInConnect = () => {
    // TODO: Implement LinkedIn OAuth
    window.location.href = '/api/linkedin/oauth'
  }

  const handlePostNow = async () => {
    if (!isLinkedInConnected) {
      alert('Please connect LinkedIn first')
      return
    }

    try {
      const response = await fetch(`/api/suflate/posts/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Failed to post')
      
      alert('Posted to LinkedIn!')
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post')
    }
  }

  const handleSchedule = async (date: Date) => {
    try {
      const response = await fetch(`/api/suflate/posts/${id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at: date.toISOString() }),
      })
      if (!response.ok) throw new Error('Failed to schedule')
      
      alert('Post scheduled!')
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <p>Loading editor...</p>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-red-500">{error || 'Post not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Edit Post</h1>
          <Button onClick={() => router.back()} variant="outline">
            Back
          </Button>
        </div>

        {/* Screen 6: Editor */}
        <RichTextEditor
          initialContent={content}
          onChange={setContent}
          onFixGrammar={handleFixGrammar}
          onMakeClearer={handleMakeClearer}
          onShorten={handleShorten}
        />

        <div className="flex gap-4">
          <Button onClick={handleSave} variant="outline">
            Save Draft
          </Button>
        </div>

        {/* Screen 7: Connect LinkedIn */}
        <LinkedInConnectCard
          isConnected={isLinkedInConnected}
          onConnect={handleLinkedInConnect}
        />

        {/* Screen 8: Post / Schedule */}
        {isLinkedInConnected && (
          <div className="space-y-4">
            {!showSchedule ? (
              <div className="flex gap-4">
                <Button onClick={handlePostNow} size="lg" className="flex-1">
                  Post on LinkedIn
                </Button>
                <Button
                  onClick={() => setShowSchedule(true)}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  Schedule
                </Button>
              </div>
            ) : (
              <SchedulePicker onSchedule={handleSchedule} onPostNow={handlePostNow} />
            )}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
