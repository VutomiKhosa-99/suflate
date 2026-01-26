'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LinkedInConnectCard } from '@/components/features/linkedin/linkedin-connect-card'
import { SchedulePicker } from '@/components/features/scheduler/schedule-picker'
import { TagManager } from '@/components/features/drafts/tag-manager'
import { MediaToolbar } from '@/components/features/post-editor/media-toolbar'
import {
  ArrowLeft,
  Save,
  Check,
  Loader2,
  Clock,
  Sparkles,
  Lightbulb,
  Type,
  Hash,
  X,
} from 'lucide-react'

interface UploadedMedia {
  type: 'image' | 'video' | 'document'
  url: string
  fileName?: string
}

export default function NewPostEditorPage() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>(['idea'])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [linkedInConnected, setLinkedInConnected] = useState(false)
  const [showScheduler, setShowScheduler] = useState(false)
  const [showAiAssist, setShowAiAssist] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([])
  const contentRef = useRef(content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Keep ref in sync
  useEffect(() => {
    contentRef.current = content
  }, [content])

  // Insert text at cursor position
  const insertTextAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      setContent(prev => prev + text)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = content.substring(0, start) + text + content.substring(end)
    
    setContent(newContent)
    contentRef.current = newContent

    setTimeout(() => {
      textarea.selectionStart = start + text.length
      textarea.selectionEnd = start + text.length
      textarea.focus()
    }, 0)
  }, [content])

  // Handle media upload
  const handleMediaUpload = useCallback((url: string, type: 'image' | 'video' | 'document') => {
    setUploadedMedia(prev => [...prev, { type, url }])
  }, [])

  // Calculate stats
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const characterCount = content.length

  // Check LinkedIn connection
  useEffect(() => {
    async function checkLinkedIn() {
      try {
        const res = await fetch('/api/linkedin/status')
        if (res.ok) {
          const data = await res.json()
          setLinkedInConnected(data.connected)
        }
      } catch (e) {
        console.error('Failed to check LinkedIn status:', e)
      }
    }
    checkLinkedIn()
  }, [])

  // Auto-save draft
  const autoSave = useCallback(async () => {
    if (!contentRef.current.trim()) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/suflate/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contentRef.current,
          title: title || 'Untitled Draft',
          tags,
          source_type: 'manual',
          variation_type: 'manual',
          status: 'draft',
        }),
      })
      
      if (res.ok) {
        const data = await res.json()
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        // Redirect to the created post's editor
        if (data.post?.id) {
          router.push(`/editor/${data.post.id}`)
        }
      }
    } catch (e) {
      console.error('Failed to save draft:', e)
    } finally {
      setSaving(false)
    }
  }, [title, tags, router])

  // AI Enhancement
  const enhanceWithAI = async () => {
    if (!content.trim()) return
    
    setAiGenerating(true)
    try {
      const res = await fetch('/api/suflate/amplify/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.enhanced) {
          setContent(data.enhanced)
        }
      }
    } catch (e) {
      console.error('Failed to enhance with AI:', e)
    } finally {
      setAiGenerating(false)
    }
  }

  // Manual save
  const handleSave = async () => {
    if (!content.trim()) return
    await autoSave()
  }

  // Schedule post
  const handleSchedule = async (scheduledFor: Date) => {
    if (!content.trim()) return
    
    setSaving(true)
    try {
      // First create the post
      const res = await fetch('/api/suflate/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          title: title || 'Scheduled Post',
          tags,
          source_type: 'manual',
          variation_type: 'manual',
          status: 'scheduled',
        }),
      })
      
      if (res.ok) {
        const data = await res.json()
        
        // Then schedule it
        if (data.post?.id) {
          await fetch('/api/suflate/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              postId: data.post.id,
              scheduledFor: scheduledFor.toISOString(),
            }),
          })
          router.push('/calendar')
        }
      }
    } catch (e) {
      console.error('Failed to schedule post:', e)
    } finally {
      setSaving(false)
      setShowScheduler(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Supergrow-style Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled Draft"
                  className="text-xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder:text-gray-400"
                />
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Type className="w-3.5 h-3.5" />
                    {wordCount} words
                  </span>
                  <span className="flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5" />
                    {characterCount} chars
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Save Status */}
              {saving && (
                <span className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              )}
              {saved && !saving && (
                <span className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="w-4 h-4" />
                  Saved
                </span>
              )}

              {/* AI Enhance Button */}
              <Button
                variant="outline"
                onClick={enhanceWithAI}
                disabled={!content.trim() || aiGenerating}
                className="gap-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50"
              >
                {aiGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-purple-600" />
                )}
                <span className={aiGenerating ? '' : 'text-purple-600'}>Enhance</span>
              </Button>

              {/* Schedule Button */}
              <Button
                variant="outline"
                onClick={() => setShowScheduler(true)}
                disabled={!content.trim()}
                className="gap-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50"
              >
                <Clock className="w-4 h-4" />
                Schedule
              </Button>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={!content.trim() || saving}
                className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Media Toolbar */}
              <div className="border-b border-gray-100 p-4">
                <MediaToolbar
                  onInsertText={insertTextAtCursor}
                  onMediaUpload={handleMediaUpload}
                />
              </div>
              
              {/* Textarea */}
              <div className="p-8">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your LinkedIn post...

💡 Tips:
• Start with a hook that grabs attention
• Keep paragraphs short (1-2 lines)
• Use line breaks for readability
• End with a question or CTA"
                  className="w-full min-h-[400px] resize-none border-none outline-none text-gray-900 placeholder:text-gray-400 leading-relaxed text-base"
                />
              </div>
            </div>

            {/* Character Count Bar */}
            <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-500">Character count</span>
                <span className={characterCount > 3000 ? 'text-red-500' : characterCount > 2500 ? 'text-orange-500' : 'text-gray-700'}>
                  {characterCount} / 3,000
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    characterCount > 3000 ? 'bg-red-500' : characterCount > 2500 ? 'bg-orange-500' : 'bg-orange-400'
                  }`}
                  style={{ width: `${Math.min((characterCount / 3000) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tags */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Hash className="w-4 h-4 text-orange-500" />
                Tags
              </h3>
              <TagManager tags={tags} onChange={setTags} />
            </div>

            {/* LinkedIn Connection */}
            {!linkedInConnected && (
              <LinkedInConnectCard onConnect={() => setLinkedInConnected(true)} />
            )}

            {/* Writing Tips */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-orange-500" />
                Writing Tips
              </h3>
              <ul className="space-y-2.5 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  Start with a hook that grabs attention
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  Keep paragraphs short (1-2 lines)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  Use line breaks for readability
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  End with a question or CTA
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  Aim for 150-300 words
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal - Supergrow style */}
      {showScheduler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowScheduler(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Schedule Post</h3>
              <button 
                onClick={() => setShowScheduler(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <SchedulePicker
              onSchedule={handleSchedule}
              onPostNow={() => {
                setShowScheduler(false)
              }}
              onCancel={() => setShowScheduler(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
