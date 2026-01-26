'use client'

import { useState, useRef, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { AIAssistToolbar } from './ai-assist-toolbar'
import { MediaToolbar } from './media-toolbar'
import { Card } from '@/components/ui/card'

interface UploadedMedia {
  type: 'image' | 'video' | 'document'
  url: string
  fileName?: string
}

interface RichTextEditorProps {
  initialContent?: string
  onChange?: (content: string) => void
  onFixGrammar?: () => Promise<string>
  onMakeClearer?: () => Promise<string>
  onShorten?: () => Promise<string>
  onMediaChange?: (media: UploadedMedia[]) => void
  showMediaToolbar?: boolean
}

export function RichTextEditor({
  initialContent = '',
  onChange,
  onFixGrammar,
  onMakeClearer,
  onShorten,
  onMediaChange,
  showMediaToolbar = true,
}: RichTextEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleChange = (value: string) => {
    setContent(value)
    onChange?.(value)
  }

  // Insert text at cursor position
  const insertTextAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      // If no ref, just append
      const newContent = content + text
      setContent(newContent)
      onChange?.(newContent)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = content.substring(0, start) + text + content.substring(end)
    
    setContent(newContent)
    onChange?.(newContent)

    // Move cursor after inserted text
    setTimeout(() => {
      textarea.selectionStart = start + text.length
      textarea.selectionEnd = start + text.length
      textarea.focus()
    }, 0)
  }, [content, onChange])

  // Handle media upload
  const handleMediaUpload = useCallback((url: string, type: 'image' | 'video' | 'document') => {
    const newMedia: UploadedMedia = { type, url }
    const updatedMedia = [...uploadedMedia, newMedia]
    setUploadedMedia(updatedMedia)
    onMediaChange?.(updatedMedia)
  }, [uploadedMedia, onMediaChange])

  const handleFixGrammar = async () => {
    if (onFixGrammar) {
      const fixed = await onFixGrammar()
      setContent(fixed)
      onChange?.(fixed)
    }
  }

  const handleMakeClearer = async () => {
    if (onMakeClearer) {
      const clearer = await onMakeClearer()
      setContent(clearer)
      onChange?.(clearer)
    }
  }

  const handleShorten = async () => {
    if (onShorten) {
      const shortened = await onShorten()
      setContent(shortened)
      onChange?.(shortened)
    }
  }

  return (
    <Card className="flex flex-col h-full">
      {/* Media toolbar at the top */}
      {showMediaToolbar && (
        <div className="border-b border-gray-100 p-2">
          <MediaToolbar
            onInsertText={insertTextAtCursor}
            onMediaUpload={handleMediaUpload}
          />
        </div>
      )}
      
      <div className="flex-1 p-4">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Write your post here..."
          className="min-h-[400px] resize-none border-0 focus-visible:ring-0 text-base"
        />
      </div>
      {(onFixGrammar || onMakeClearer || onShorten) && (
        <AIAssistToolbar
          onFixGrammar={handleFixGrammar}
          onMakeClearer={handleMakeClearer}
          onShorten={handleShorten}
        />
      )}
    </Card>
  )
}
