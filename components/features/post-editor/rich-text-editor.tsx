'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { AIAssistToolbar } from './ai-assist-toolbar'
import { Card } from '@/components/ui/card'

interface RichTextEditorProps {
  initialContent?: string
  onChange?: (content: string) => void
  onFixGrammar?: () => Promise<string>
  onMakeClearer?: () => Promise<string>
  onShorten?: () => Promise<string>
}

export function RichTextEditor({
  initialContent = '',
  onChange,
  onFixGrammar,
  onMakeClearer,
  onShorten,
}: RichTextEditorProps) {
  const [content, setContent] = useState(initialContent)

  const handleChange = (value: string) => {
    setContent(value)
    onChange?.(value)
  }

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
      <div className="flex-1 p-4">
        <Textarea
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
