'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PostVariationsEditor, type PostVariation } from '@/components/features/post-variations/post-variations-editor'

interface LinkedInProfile {
  id: string
  name: string
  firstName: string
  lastName: string
  email: string
  picture: string
  headline: string
}

/**
 * Post Variations Page
 * Shows generated post variations with LinkedIn-style preview and editing
 */
export default function PostVariationsPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const [posts, setPosts] = useState<PostVariation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState('Your Name')
  const [userTitle, setUserTitle] = useState('Your Title')
  const [userAvatar, setUserAvatar] = useState<string | undefined>(undefined)
  const [linkedInConnected, setLinkedInConnected] = useState(false)

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/suflate/posts?recordingId=${id}`)

        if (!response.ok) {
          throw new Error('Failed to fetch posts')
        }

        const data = await response.json()
        setPosts(data.posts || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load posts')
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [id])

  // Fetch LinkedIn profile
  useEffect(() => {
    async function fetchLinkedInProfile() {
      try {
        const response = await fetch('/api/linkedin/profile')
        if (response.ok) {
          const data = await response.json()
          if (data.connected && data.profile) {
            setLinkedInConnected(true)
            setUserName(data.profile.name || 'Your Name')
            setUserTitle(data.profile.headline || 'Your Title')
            setUserAvatar(data.profile.picture || undefined)
          }
        }
      } catch (err) {
        console.log('LinkedIn profile not available:', err)
      }
    }
    fetchLinkedInProfile()
  }, [])

  const handlePost = async (postId: string, content: string, imageUrl?: string) => {
    // Try to post directly to LinkedIn if connected
    if (linkedInConnected) {
      try {
        const response = await fetch('/api/linkedin/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, postId }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            // Show success and optionally open the post
            alert(`Posted to LinkedIn! ${data.postUrl ? `\n\nView your post: ${data.postUrl}` : ''}`)
            if (data.postUrl) {
              window.open(data.postUrl, '_blank')
            }
            return
          }
        }

        // If API post failed, fall back to share URL
        const errorData = await response.json().catch(() => ({}))
        console.error('Direct post failed:', errorData)
        alert(`Direct posting failed: ${errorData.error || 'Unknown error'}. Falling back to share dialog.`)
      } catch (err) {
        console.error('Post error:', err)
      }
    }
    
    // Fallback: Generate LinkedIn share URL
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`
    
    // Copy content to clipboard
    await navigator.clipboard.writeText(content)
    alert('Content copied to clipboard! Paste it in the LinkedIn post dialog.')
    
    // Open LinkedIn share dialog
    window.open(linkedInUrl, '_blank', 'width=600,height=600')
    
    // Update post status
    await fetch(`/api/suflate/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published', content }),
    })
  }

  const handleSchedule = async (postId: string, content: string, scheduledFor: Date, imageUrl?: string) => {
    const response = await fetch('/api/schedule/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId,
        content,
        scheduledFor: scheduledFor.toISOString(),
        imageUrl,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to schedule post')
    }

    // Update post status
    await fetch(`/api/suflate/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'scheduled', content }),
    })
  }

  const handleSaveDraft = async (postId: string, content: string, imageUrl?: string) => {
    await fetch(`/api/suflate/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'draft', content }),
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your posts...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push('/record')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Voice Notes
          </button>
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push('/record')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Voice Notes
          </button>
          <div className="text-center p-12 bg-white rounded-xl border border-gray-200">
            <p className="text-lg text-gray-600 mb-4">No posts generated yet.</p>
            <Button onClick={() => router.push(`/record/${id}`)} variant="outline">
              Go Back to Recording
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/record')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Your Post Variations</h1>
              <p className="text-sm text-gray-500">
                Select a variation to edit, preview, and post to LinkedIn
              </p>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="h-[calc(100vh-140px)]">
          <PostVariationsEditor
            variations={posts}
            userName={userName}
            userAvatar={userAvatar}
            userTitle={userTitle}
            onPost={handlePost}
            onSchedule={handleSchedule}
            onSaveDraft={handleSaveDraft}
          />
        </div>
      </div>
    </div>
  )
}
