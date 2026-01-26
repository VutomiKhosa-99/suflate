'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Search } from 'lucide-react'

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

// Emoji categories with commonly used emojis for LinkedIn posts
const EMOJI_CATEGORIES = {
  'Frequently Used': [
    '👋', '🙌', '💪', '🔥', '🚀', '✨', '💡', '🎯', '📈', '💰',
    '🤝', '👍', '❤️', '🎉', '⭐', '✅', '💯', '🏆', '🌟', '📢',
  ],
  'Smileys': [
    '😊', '😄', '😃', '🙂', '😁', '😅', '🤣', '😂', '🥹', '😍',
    '🤩', '😎', '🤓', '🧐', '🤔', '😏', '😌', '🥺', '😇', '🤗',
  ],
  'Gestures': [
    '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
    '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎',
    '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏', '💪',
  ],
  'Business': [
    '💼', '📊', '📈', '📉', '📋', '📁', '💻', '🖥️', '📱', '⌨️',
    '💳', '💰', '💵', '💸', '🏦', '🏢', '🏭', '📧', '📬', '✉️',
  ],
  'Success': [
    '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '🎗️', '🎉', '🎊', '🎁',
    '✅', '☑️', '✔️', '💯', '⭐', '🌟', '💫', '🔝', '🎯', '🚀',
  ],
  'Ideas': [
    '💡', '🧠', '📚', '📖', '📝', '✏️', '🔍', '🔎', '🔬', '🔭',
    '📐', '📏', '🗂️', '📌', '📍', '🗓️', '📆', '📅', '⏰', '⌛',
  ],
  'Hearts': [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💗',
    '💖', '💝', '💘', '💕', '❣️', '💟', '♥️', '🫶', '💓', '💞',
  ],
  'Arrows': [
    '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️',
    '🔄', '🔃', '🔙', '🔚', '🔛', '🔜', '🔝', '▶️', '⏩', '⏭️',
  ],
  'Symbols': [
    '✓', '✗', '◆', '◇', '■', '□', '▲', '△', '●', '○',
    '★', '☆', '♦', '♣', '♠', '♥', '•', '→', '←', '↑',
  ],
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Frequently Used')
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Filter emojis based on search (simple text match for emoji characters)
  const getFilteredEmojis = () => {
    if (!search) {
      return EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES] || []
    }

    // Search across all categories
    const allEmojis = Object.values(EMOJI_CATEGORIES).flat()
    // For now, just return all if searching (emojis don't have text to search)
    // In a production app, you'd have an emoji database with names
    return [...new Set(allEmojis)]
  }

  const filteredEmojis = getFilteredEmojis()

  return (
    <div 
      ref={pickerRef}
      className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[320px] overflow-hidden"
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emojis..."
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="flex gap-1 p-2 border-b border-gray-100 overflow-x-auto scrollbar-hide">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div className="p-2 h-[200px] overflow-y-auto">
        <div className="grid grid-cols-8 gap-1">
          {filteredEmojis.map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              onClick={() => onSelect(emoji)}
              className="w-8 h-8 flex items-center justify-center text-xl rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
        {filteredEmojis.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            No emojis found
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>Click to insert</span>
        <button 
          onClick={onClose}
          className="text-gray-600 hover:text-gray-800"
        >
          Close
        </button>
      </div>
    </div>
  )
}
