'use client'

import { useState, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface EditLinkModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  linkId: string | null
  linkUrl: string
  initialQuestions?: string
  onSave: () => void
}

export function EditLinkModal({
  open,
  onOpenChange,
  linkId,
  linkUrl,
  initialQuestions = '',
  onSave,
}: EditLinkModalProps) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [copied, setCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset questions when modal opens with new data
  useEffect(() => {
    if (open) {
      setQuestions(initialQuestions)
      setError(null)
    }
  }, [open, initialQuestions])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(linkUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleSave = async () => {
    if (!linkId) return
    
    setIsSaving(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/suflate/voice/public-link/${linkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update link')
      }
      
      onSave()
      onOpenChange(false)
    } catch (err) {
      setError('Failed to update link. Please try again.')
      console.error('Error updating link:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setQuestions(initialQuestions)
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-6">
        <DialogTitle className="text-xl font-semibold text-gray-900 mb-6">
          Edit Public Link
        </DialogTitle>

        {error && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-5">
          {/* Link Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 truncate">
                {linkUrl}
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
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
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
