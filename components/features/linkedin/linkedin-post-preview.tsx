'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ThumbsUp, MessageCircle, Repeat2, Send, Globe, MoreHorizontal } from 'lucide-react'

interface LinkedInPostPreviewProps {
  content: string
  userName?: string
  userTitle?: string
  userAvatar?: string
  imageUrl?: string
}

export function LinkedInPostPreview({
  content,
  userName = 'Your Name',
  userTitle = 'Your Title',
  userAvatar,
}: LinkedInPostPreviewProps) {
  const [formattedContent, setFormattedContent] = useState('')

  useEffect(() => {
    // Format content for LinkedIn-like display
    // Convert line breaks and add "...see more" if too long
    let formatted = content
    
    // Truncate at ~300 chars for preview with "see more"
    if (formatted.length > 300) {
      const truncated = formatted.slice(0, 300)
      // Find last complete word
      const lastSpace = truncated.lastIndexOf(' ')
      formatted = truncated.slice(0, lastSpace) + '...'
    }
    
    setFormattedContent(formatted)
  }, [content])

  // Get initials for avatar fallback
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden max-w-[500px]">
      {/* LinkedIn-style header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt={userName}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          
          {/* User info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 text-sm leading-tight">{userName}</h4>
                <p className="text-xs text-gray-500 line-clamp-1">{userTitle}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <span>Just now</span>
                  <span>•</span>
                  <Globe className="w-3 h-3" />
                </div>
              </div>
              <button className="p-1 hover:bg-gray-100 rounded-full">
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Post content */}
      <div className="px-4 py-2">
        <div className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
          {formattedContent}
          {content.length > 300 && (
            <button className="text-gray-500 hover:text-blue-600 hover:underline ml-1">
              ...see more
            </button>
          )}
        </div>
      </div>

      {/* Engagement stats (mock) */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-500 border-b border-gray-100">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
              <ThumbsUp className="w-2.5 h-2.5 text-white" fill="white" />
            </div>
            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[8px]">
              ❤️
            </div>
          </div>
          <span className="ml-1">Preview</span>
        </div>
        <div className="flex items-center gap-3">
          <span>0 comments</span>
          <span>0 reposts</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-2 py-1 flex items-center justify-between">
        <button className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <ThumbsUp className="w-5 h-5" />
          <span className="text-sm font-medium">Like</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Comment</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Repeat2 className="w-5 h-5" />
          <span className="text-sm font-medium">Repost</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Send className="w-5 h-5" />
          <span className="text-sm font-medium">Send</span>
        </button>
      </div>
    </div>
  )
}
