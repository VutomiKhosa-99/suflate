'use client'

import { useState, useRef, useEffect } from 'react'
import { Tag, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TagManagerProps {
  tags: string[]
  availableTags?: string[]
  onChange: (tags: string[]) => void
  maxTags?: number
  placeholder?: string
}

/**
 * Story 3.6: Tag Drafts for Organization
 * 
 * Component for managing tags on a draft post
 * - Create new tags
 * - Select from existing tags
 * - Remove tags
 */
export function TagManager({
  tags,
  availableTags = [],
  onChange,
  maxTags = 10,
  placeholder = 'Add tag...',
}: TagManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newTag, setNewTag] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isAdding])

  // Compute suggestions without useEffect to avoid infinite loop
  // tags array reference changes on every render from parent
  const computedSuggestions = newTag.trim()
    ? availableTags
        .filter(
          (t) =>
            t.toLowerCase().includes(newTag.toLowerCase()) &&
            !tags.includes(t)
        )
        .slice(0, 5)
    : availableTags.filter((t) => !tags.includes(t)).slice(0, 5)

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onChange([...tags, trimmedTag])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault()
      addTag(newTag)
    } else if (e.key === 'Escape') {
      setIsAdding(false)
      setNewTag('')
    } else if (e.key === 'Backspace' && !newTag && tags.length > 0) {
      // Remove last tag when backspace is pressed with empty input
      removeTag(tags[tags.length - 1])
    }
  }

  const handleBlur = () => {
    // Slight delay to allow clicking on suggestions
    setTimeout(() => {
      if (newTag.trim()) {
        addTag(newTag)
      }
      setIsAdding(false)
    }, 150)
  }

  return (
    <div className="space-y-2">
      {/* Current tags */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm"
          >
            <Tag className="w-3 h-3" />
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-blue-900 focus:outline-none"
              aria-label={`Remove ${tag} tag`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Add tag button/input */}
        {tags.length < maxTags && (
          isAdding ? (
            <div className="relative">
              <Input
                ref={inputRef}
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder={placeholder}
                className="h-7 w-32 text-sm"
              />
              
              {/* Suggestions dropdown */}
              {computedSuggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  {computedSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onMouseDown={() => addTag(suggestion)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Tag className="w-3 h-3 text-gray-400" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1 px-2 py-1 border border-dashed border-gray-300 text-gray-500 rounded-md text-sm hover:border-gray-400 hover:text-gray-600 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add tag
            </button>
          )
        )}
      </div>

      {/* Tag limit warning */}
      {tags.length >= maxTags && (
        <p className="text-xs text-gray-500">
          Maximum {maxTags} tags reached
        </p>
      )}
    </div>
  )
}
