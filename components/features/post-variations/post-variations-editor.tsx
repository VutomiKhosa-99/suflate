'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { 
  X, 
  ImageIcon, 
  Calendar,
  Clock,
  ChevronDown,
  Briefcase,
  BookOpen,
  Lightbulb,
  MessageSquare,
  Flame,
  Check,
  AtSign,
  Smile,
  Crop,
  RotateCw,
  Trash2,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

// Common emojis for quick access
const EMOJI_CATEGORIES = {
  recent: ['😊', '👍', '🎉', '💡', '🚀', '✨', '💪', '🔥'],
  smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥'],
  gestures: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
  objects: ['💼', '📊', '📈', '📉', '📋', '📌', '📍', '🎯', '💡', '🔑', '🔒', '🔓', '🔔', '📢', '💬', '💭', '🗣️', '👤', '👥', '🏆', '🎖️', '🏅', '🥇', '🥈', '🥉', '⭐', '🌟', '✨', '💫', '🔥'],
  symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✅', '❌', '⭕', '❗', '❓', '💯', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣'],
}

// Variation type configurations
const VARIATION_CONFIG = {
  professional: {
    label: 'Professional Thought Leadership',
    description: 'Executive tone, industry insights',
    icon: Briefcase,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  personal: {
    label: 'Personal Story',
    description: 'Narrative format, emotional connection',
    icon: BookOpen,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
  },
  actionable: {
    label: 'Actionable Tips',
    description: 'List-based, practical value',
    icon: Lightbulb,
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
  },
  discussion: {
    label: 'Discussion Starter',
    description: 'Question-driven, engagement-focused',
    icon: MessageSquare,
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
  },
  bold: {
    label: 'Bold Opinion',
    description: 'Controversial stance, conversation-driving',
    icon: Flame,
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
  },
}

// Mock LinkedIn connections (in real app, fetch from LinkedIn API)
const MOCK_CONNECTIONS = [
  { id: '1', name: 'Vutomi K.', title: 'QA Automation Engineer', avatar: null },
  { id: '2', name: 'Sarah Johnson', title: 'Software Engineer at Google', avatar: null },
  { id: '3', name: 'Michael Chen', title: 'Product Manager', avatar: null },
  { id: '4', name: 'Emily Davis', title: 'UX Designer at Meta', avatar: null },
  { id: '5', name: 'James Wilson', title: 'Tech Lead at Amazon', avatar: null },
  { id: '6', name: 'Lisa Thompson', title: 'Data Scientist', avatar: null },
]

export interface PostVariation {
  id: string
  content: string
  variation_type: keyof typeof VARIATION_CONFIG
  status: string
  created_at: string
}

interface PostVariationsEditorProps {
  variations: PostVariation[]
  userName?: string
  userAvatar?: string
  userTitle?: string
  onPost: (postId: string, content: string, imageUrl?: string) => Promise<void>
  onSchedule: (postId: string, content: string, scheduledFor: Date, imageUrl?: string) => Promise<void>
  onSaveDraft: (postId: string, content: string, imageUrl?: string) => Promise<void>
}

export function PostVariationsEditor({
  variations,
  userName = 'Your Name',
  userAvatar,
  userTitle = 'Your Title',
  onPost,
  onSchedule,
  onSaveDraft,
}: PostVariationsEditorProps) {
  const [selectedVariation, setSelectedVariation] = useState<PostVariation | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showScheduler, setShowScheduler] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [postedIds, setPostedIds] = useState<string[]>([])
  
  // New states for emoji, tagging, and image editing
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [emojiCategory, setEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>('recent')
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [tagSearch, setTagSearch] = useState('')
  const [taggedPeople, setTaggedPeople] = useState<typeof MOCK_CONNECTIONS>([])
  const [imageRotation, setImageRotation] = useState(0)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const tagPickerRef = useRef<HTMLDivElement>(null)

  // Close pickers when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
      if (tagPickerRef.current && !tagPickerRef.current.contains(event.target as Node)) {
        setShowTagPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectVariation = (variation: PostVariation) => {
    setSelectedVariation(variation)
    setEditedContent(variation.content)
    setSelectedImage(null)
    setShowScheduler(false)
    setTaggedPeople([])
    setImageRotation(0)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setImageRotation(0)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImageRotation(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRotateImage = () => {
    setImageRotation((prev) => (prev + 90) % 360)
  }

  const handleInsertEmoji = (emoji: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = editedContent.slice(0, start) + emoji + editedContent.slice(end)
      setEditedContent(newContent)
      // Move cursor after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length
        textarea.focus()
      }, 0)
    } else {
      setEditedContent(editedContent + emoji)
    }
  }

  const handleTagPerson = (person: typeof MOCK_CONNECTIONS[0]) => {
    if (!taggedPeople.find(p => p.id === person.id)) {
      setTaggedPeople([...taggedPeople, person])
      // Insert @mention in content
      const mention = `@${person.name} `
      setEditedContent(editedContent + mention)
    }
    setShowTagPicker(false)
    setTagSearch('')
  }

  const handleRemoveTag = (personId: string) => {
    const person = taggedPeople.find(p => p.id === personId)
    if (person) {
      setTaggedPeople(taggedPeople.filter(p => p.id !== personId))
      // Remove @mention from content
      setEditedContent(editedContent.replace(`@${person.name} `, ''))
    }
  }

  const filteredConnections = MOCK_CONNECTIONS.filter(
    person => 
      person.name.toLowerCase().includes(tagSearch.toLowerCase()) ||
      person.title.toLowerCase().includes(tagSearch.toLowerCase())
  )

  const handlePost = async () => {
    if (!selectedVariation) return
    setIsPosting(true)
    try {
      await onPost(selectedVariation.id, editedContent, selectedImage || undefined)
      setPostedIds(prev => [...prev, selectedVariation.id])
      setSelectedVariation(null)
    } catch (err) {
      console.error('Failed to post:', err)
    } finally {
      setIsPosting(false)
    }
  }

  const handleSchedule = async () => {
    if (!selectedVariation || !scheduleDate || !scheduleTime) return
    setIsScheduling(true)
    try {
      const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`)
      await onSchedule(selectedVariation.id, editedContent, scheduledFor, selectedImage || undefined)
      setPostedIds(prev => [...prev, selectedVariation.id])
      setSelectedVariation(null)
      setShowScheduler(false)
    } catch (err) {
      console.error('Failed to schedule:', err)
    } finally {
      setIsScheduling(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!selectedVariation) return
    try {
      await onSaveDraft(selectedVariation.id, editedContent, selectedImage || undefined)
    } catch (err) {
      console.error('Failed to save draft:', err)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="flex gap-6 h-full">
      {/* Left Panel - Variation Cards */}
      <div className="w-80 flex-shrink-0 space-y-3 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Select a variation to edit</h3>
        
        {variations.map((variation) => {
          const config = VARIATION_CONFIG[variation.variation_type]
          const Icon = config.icon
          const isSelected = selectedVariation?.id === variation.id
          const isPosted = postedIds.includes(variation.id)
          
          return (
            <button
              key={variation.id}
              onClick={() => !isPosted && handleSelectVariation(variation)}
              disabled={isPosted}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                isSelected 
                  ? 'border-orange-500 bg-orange-50' 
                  : isPosted
                  ? 'border-green-200 bg-green-50 cursor-default'
                  : 'border-gray-200 hover:border-orange-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                  {isPosted ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Icon className={`w-5 h-5 ${config.textColor}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 text-sm">{config.label}</h4>
                    {isPosted && (
                      <span className="text-xs text-green-600 font-medium">Posted</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                    {variation.content.slice(0, 100)}...
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Right Panel - LinkedIn Post Creator Style */}
      <div className="flex-1 min-w-0">
        {selectedVariation ? (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg max-w-xl mx-auto">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 overflow-hidden">
                  {userAvatar ? (
                    <Image src={userAvatar} alt={userName} width={48} height={48} className="rounded-full" />
                  ) : (
                    userName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900">{userName}</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-500">Post to Anyone</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVariation(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Tagged People */}
            {taggedPeople.length > 0 && (
              <div className="px-4 pt-3 flex flex-wrap gap-2">
                {taggedPeople.map((person) => (
                  <span
                    key={person.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                  >
                    @{person.name}
                    <button
                      onClick={() => handleRemoveTag(person.id)}
                      className="hover:bg-blue-100 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Post Content Area */}
            <div className="p-4 min-h-[200px]">
              <Textarea
                ref={textareaRef}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[150px] border-0 p-0 focus-visible:ring-0 resize-none text-gray-900 leading-relaxed text-lg placeholder:text-gray-400"
                placeholder="What do you want to talk about?"
              />
              
              {/* Image Preview with Edit Controls */}
              {selectedImage && (
                <div className="relative mt-4 rounded-lg overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={selectedImage} 
                    alt="Post image" 
                    className="w-full h-auto max-h-[300px] object-contain"
                    style={{ transform: `rotate(${imageRotation}deg)` }}
                  />
                  
                  {/* Image Edit Toolbar */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/70 rounded-full px-2 py-1">
                    <button
                      onClick={handleRotateImage}
                      className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white"
                      title="Rotate"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white"
                      title="Crop (coming soon)"
                    >
                      <Crop className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleRemoveImage}
                      className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div 
                ref={emojiPickerRef}
                className="mx-4 mb-2 border border-gray-200 rounded-xl bg-white shadow-lg overflow-hidden"
              >
                {/* Category Tabs */}
                <div className="flex border-b border-gray-100 px-2 pt-2 overflow-x-auto">
                  {Object.keys(EMOJI_CATEGORIES).map((category) => (
                    <button
                      key={category}
                      onClick={() => setEmojiCategory(category as keyof typeof EMOJI_CATEGORIES)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                        emojiCategory === category
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
                
                {/* Emoji Grid */}
                <div className="p-3 grid grid-cols-8 gap-1 max-h-[200px] overflow-y-auto">
                  {EMOJI_CATEGORIES[emojiCategory].map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => handleInsertEmoji(emoji)}
                      className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tag People Picker */}
            {showTagPicker && (
              <div 
                ref={tagPickerRef}
                className="mx-4 mb-2 border border-gray-200 rounded-xl bg-white shadow-lg overflow-hidden"
              >
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      placeholder="Type a name or names"
                      className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-gray-400"
                      autoFocus
                    />
                  </div>
                </div>
                
                {/* Connections List */}
                <div className="max-h-[250px] overflow-y-auto">
                  {filteredConnections.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => handleTagPerson(person)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-semibold text-sm">
                        {person.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{person.name}</p>
                        <p className="text-xs text-gray-500 truncate">{person.title}</p>
                      </div>
                    </button>
                  ))}
                  {filteredConnections.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-gray-500">
                      No connections found
                    </p>
                  )}
                </div>
                
                {/* Add Button */}
                {tagSearch && (
                  <div className="p-3 border-t border-gray-100">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        handleTagPerson({ id: Date.now().toString(), name: tagSearch, title: '', avatar: null })
                      }}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Toolbar */}
            <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {/* Emoji Button */}
              <button
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker)
                  setShowTagPicker(false)
                }}
                className={`p-2.5 rounded-full transition-colors ${
                  showEmojiPicker ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Add emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
              
              {/* Image Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                title="Add image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              
              {/* Schedule Button */}
              <button
                onClick={() => setShowScheduler(true)}
                className="p-2.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                title="Schedule"
              >
                <Calendar className="w-5 h-5" />
              </button>
              
              {/* Tag People Button */}
              <button
                onClick={() => {
                  setShowTagPicker(!showTagPicker)
                  setShowEmojiPicker(false)
                }}
                className={`p-2.5 rounded-full transition-colors ${
                  showTagPicker ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Tag people"
              >
                <AtSign className="w-5 h-5" />
              </button>
              
              {/* More Button */}
              <button className="p-2.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600" title="More">
                <span className="text-xl font-bold leading-none">+</span>
              </button>
              
              {/* Right side */}
              <div className="ml-auto flex items-center gap-2">
                <button 
                  onClick={handleSaveDraft}
                  className="p-2.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                  title="Save draft"
                >
                  <Clock className="w-5 h-5" />
                </button>
                <Button
                  onClick={handlePost}
                  disabled={isPosting || !editedContent.trim()}
                  className="bg-blue-600 hover:bg-blue-700 rounded-full px-4 py-1.5 text-sm font-semibold"
                >
                  {isPosting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>

            {/* Scheduler Panel */}
            {showScheduler && (
              <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedule Post
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Date</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={today}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Time</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowScheduler(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSchedule}
                    disabled={!scheduleDate || !scheduleTime || isScheduling}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isScheduling ? 'Scheduling...' : 'Schedule'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a variation</h3>
              <p className="text-gray-500 max-w-sm">
                Choose one of the generated post variations from the left to edit and preview it in LinkedIn format.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
