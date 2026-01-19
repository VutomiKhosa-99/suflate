'use client'

import { use, useEffect, useState } from 'react'
import { PostVariationTabs } from '@/components/features/post-variations/post-variation-tabs'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface Post {
  id: string
  content: string
  variation_type: 'professional' | 'personal' | 'actionable' | 'discussion' | 'bold'
  status: string
  created_at: string
}

// Map variation types to UX labels
const variationTypeToLabel: Record<string, 'Story' | 'Lesson' | 'Opinion'> = {
  personal: 'Story',
  actionable: 'Lesson',
  professional: 'Lesson',
  discussion: 'Opinion',
  bold: 'Opinion',
}

/**
 * Screen 5: Generated Posts - Post Variations Page
 * Deliver Aha moment with post variations
 */
export default function PostVariationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const handleEdit = (variation: any) => {
    router.push(`/editor/${variation.id}`)
  }

  // Transform posts to PostVariation format for tabs
  const variations = posts.map((post) => ({
    id: post.id,
    title: `${variationTypeToLabel[post.variation_type] || 'Post'} Variation`,
    content: post.content,
    label: variationTypeToLabel[post.variation_type] || ('Story' as const),
  }))

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Generating your posts...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center p-12">
            <p className="text-lg text-gray-600 mb-4">No posts generated yet.</p>
            <Button onClick={() => router.push(`/record/${id}`)} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Post Variations</h1>
          <p className="text-gray-600">
            Choose a variation to edit and post. Each one preserves your voice in a different way.
          </p>
        </div>

        <PostVariationTabs variations={variations} onEdit={handleEdit} />
      </div>
    </div>
  )
}
