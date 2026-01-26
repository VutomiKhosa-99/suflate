'use client'

import { useState, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface PublicLinkModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (link: string, questions: string) => void
}

export function PublicLinkModal({
  open,
  onOpenChange,
  onSave,
}: PublicLinkModalProps) {
  const [link, setLink] = useState('')
  const [linkId, setLinkId] = useState('')
  const [questions, setQuestions] = useState('')
  const [copied, setCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create a new link when modal opens
  useEffect(() => {
    if (open && !link) {
      createNewLink()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const createNewLink = async () => {
    setIsCreating(true)
    setError(null)
    
    try {
      const response = await fetch('/api/suflate/voice/public-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: '' }),
      })

      if (!response.ok) {
        throw new Error('Failed to create public link')
      }

      const data = await response.json()
      setLink(data.url)
      setLinkId(data.linkId)
    } catch (err) {
      setError('Failed to create public link. Please try again.')
      console.error('Error creating link:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Update the questions for the existing link
      if (linkId && questions) {
        const response = await fetch(`/api/suflate/voice/public-link/${linkId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions }),
        })
        
        if (!response.ok) {
          console.error('Failed to update questions')
        }
      }
      
      await onSave(link, questions)
      handleClose()
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setLink('')
    setLinkId('')
    setQuestions('')
    setCopied(false)
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-6">
        <DialogTitle className="text-xl font-semibold text-gray-900 mb-6">
          Create Public Link
        </DialogTitle>

        {isCreating ? (
          <div className="flex flex-col items-center py-8">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500">Creating your link...</p>
          </div>
        ) : error ? (
          <div className="py-4">
            <div className="p-4 bg-red-50 rounded-lg mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <Button onClick={createNewLink} className="w-full">
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-5">
              {/* Link Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 truncate">
                    {link || 'Generating link...'}
                  </div>
                  <button
                    onClick={handleCopy}
                    disabled={!link}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Questions Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Questions
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Adding a few questions can help the speaker deliver a clear and engaging voice note.
                </p>
                <Textarea
                  value={questions}
                  onChange={(e) => setQuestions(e.target.value)}
                  placeholder="Add some questions here"
                  className="min-h-[100px] resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={handleClose}>
                Discard
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !link}
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                {isSaving ? 'Saving...' : 'Save Link'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
