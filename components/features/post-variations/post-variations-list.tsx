'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Post {
  id: string
  content: string
  variation_type: 'professional' | 'personal' | 'actionable' | 'discussion' | 'bold'
  status: string
  created_at: string
}

interface PostVariationsListProps {
  posts: Post[]
  selectedPostId?: string
  loading?: boolean
  onSelect?: (postId: string) => void
}

const variationLabels: Record<string, string> = {
  professional: 'Professional Thought Leadership',
  personal: 'Personal Story',
  actionable: 'Actionable Tips',
  discussion: 'Discussion Starter',
  bold: 'Bold Opinion',
}

/**
 * PostVariationsList Component - Story 1.6
 * Displays all generated post variations with labels
 */
export function PostVariationsList({
  posts,
  selectedPostId,
  loading = false,
  onSelect,
}: PostVariationsListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading posts...</p>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground mb-4">No post variations generated yet.</p>
        <p className="text-sm text-muted-foreground">Amplify your voice note to generate posts.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4" data-testid="post-variations">
      {posts.map((post) => {
        const isSelected = selectedPostId === post.id
        const label = variationLabels[post.variation_type] || post.variation_type

        return (
          <Card
            key={post.id}
            className={`p-6 cursor-pointer transition-all ${
              isSelected
                ? 'border-blue-500 border-2 bg-blue-50'
                : 'border hover:border-gray-300'
            }`}
            data-selected={isSelected}
            onClick={() => onSelect?.(post.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {post.status}
                </span>
              </div>
              {isSelected && (
                <span className="text-xs text-blue-600 font-medium">Selected</span>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap">{post.content}</p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  // TODO: Navigate to edit view
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  // TODO: Open publish/schedule dialog
                }}
              >
                Publish
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
