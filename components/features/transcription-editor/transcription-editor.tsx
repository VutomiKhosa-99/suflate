'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Transcription {
  id: string
  recording_id: string
  raw_text: string
  processed_text?: string
  detected_language?: string
}

interface TranscriptionEditorProps {
  transcription: Transcription
  onSave: (data: { id: string; processed_text: string }) => Promise<{ success: boolean }>
}

/**
 * TranscriptionEditor Component - Story 1.4
 * Allows users to edit transcription before amplification
 */
export function TranscriptionEditor({
  transcription,
  onSave,
}: TranscriptionEditorProps) {
  const [editedText, setEditedText] = useState(
    transcription.processed_text || transcription.raw_text
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [originalText] = useState(
    transcription.processed_text || transcription.raw_text
  )

  // Auto-save after 2 seconds of inactivity (Story 1.4 requirement)
  useEffect(() => {
    if (editedText === originalText) {
      setSaveStatus('idle')
      return
    }

    const timer = setTimeout(() => {
      handleSave()
    }, 2000) // Auto-save after 2 seconds

    return () => clearTimeout(timer)
  }, [editedText, originalText])

  const handleSave = async () => {
    if (editedText === originalText || isSaving) {
      return
    }

    setIsSaving(true)
    setSaveStatus('idle')

    try {
      await onSave({
        id: transcription.id,
        processed_text: editedText,
      })
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000) // Clear success message after 3s
    } catch (error) {
      console.error('Failed to save transcription:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedText(originalText)
    setSaveStatus('idle')
  }

  const hasChanges = editedText !== originalText
  const characterCount = editedText.length
  const wordCount = editedText.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Edit Transcription</h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{wordCount} words</span>
          <span>{characterCount} characters</span>
        </div>
      </div>

      <Textarea
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
        className="min-h-[200px] font-mono text-sm"
        placeholder="Edit your transcription..."
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {saveStatus === 'success' && (
            <span className="text-sm text-green-600">✓ Saved</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm text-red-600">✗ Error saving</span>
          )}
          {isSaving && (
            <span className="text-sm text-muted-foreground">Saving...</span>
          )}
        </div>

        <div className="flex gap-2">
          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {transcription.detected_language && (
        <p className="text-xs text-muted-foreground">
          Detected language: {transcription.detected_language}
        </p>
      )}
    </div>
  )
}
