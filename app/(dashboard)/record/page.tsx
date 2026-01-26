'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AddVoiceNoteModal,
  RecordVoiceModal,
  UploadVoiceModal,
  PublicLinkModal,
  EditLinkModal,
  VoiceNotesList,
  EmptyVoiceNotes,
  type VoiceNote,
} from '@/components/features/voice-notes'

/**
 * Voice Notes Page - Supergrow-style design
 * List of voice notes with options to record, upload, or share links
 */
export default function RecordPage() {
  const router = useRouter()
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showEditLinkModal, setShowEditLinkModal] = useState(false)
  const [editingLink, setEditingLink] = useState<{ id: string; url: string; questions?: string } | null>(null)

  // Fetch voice notes
  const fetchVoiceNotes = useCallback(async () => {
    try {
      const response = await fetch('/api/suflate/voice/list')
      if (response.ok) {
        const data = await response.json()
        setVoiceNotes(data.voiceNotes || [])
      }
    } catch (err) {
      console.error('Error fetching voice notes:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVoiceNotes()
  }, [fetchVoiceNotes])

  // Handle recording complete
  const handleRecordingComplete = async (blob: Blob) => {
    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')

      const response = await fetch('/api/suflate/voice/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload recording')
      }

      const data = await response.json()
      router.push(`/record/${data.recordingId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload recording')
      setIsUploading(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('audio', file)

      const response = await fetch('/api/suflate/voice/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload file')
      }

      const data = await response.json()
      router.push(`/record/${data.recordingId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
      setIsUploading(false)
    }
  }

  // Handle public link save
  const handleSaveLink = async (link: string, questions: string) => {
    // Refresh the list to show the new link
    fetchVoiceNotes()
  }

  // Handle edit link
  const handleEditLink = (id: string, questions?: string) => {
    // Find the link URL from voiceNotes
    const link = voiceNotes.find(note => note.id === id && note.type === 'public_link')
    if (link?.public_link) {
      setEditingLink({ id, url: link.public_link, questions })
      setShowEditLinkModal(true)
    }
  }

  // Handle delete link
  const handleDeleteLink = async (id: string) => {
    try {
      const response = await fetch(`/api/suflate/voice/public-link/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete link')
      }

      // Refresh the list
      fetchVoiceNotes()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete link')
    }
  }

  // Handle delete voice note
  const handleDeleteNote = async (id: string) => {
    try {
      const response = await fetch(`/api/suflate/voice/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete voice note')
      }

      // Refresh the list
      fetchVoiceNotes()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete voice note')
    }
  }

  // Handle voice note click
  const handleNoteClick = (id: string) => {
    router.push(`/record/${id}`)
  }

  const hasVoiceNotes = voiceNotes.length > 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Mic className="w-6 h-6 text-orange-500" />
            Voice Notes
          </h1>
          <p className="text-gray-500 mt-1">
            Turn your voice notes into engaging LinkedIn content
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Voice Note
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-sm text-red-700 underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Uploading State */}
      {isUploading && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-orange-700">Uploading your voice note...</p>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <VoiceNotesList voiceNotes={[]} onNoteClick={handleNoteClick} isLoading />
      ) : hasVoiceNotes ? (
        <VoiceNotesList 
          voiceNotes={voiceNotes} 
          onNoteClick={handleNoteClick}
          onEditLink={handleEditLink}
          onDeleteLink={handleDeleteLink}
          onDeleteNote={handleDeleteNote}
        />
      ) : (
        <EmptyVoiceNotes onAddVoiceNote={() => setShowAddModal(true)} />
      )}

      {/* Modals */}
      <AddVoiceNoteModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSelectRecord={() => setShowRecordModal(true)}
        onSelectUpload={() => setShowUploadModal(true)}
        onSelectShareLink={() => setShowLinkModal(true)}
      />

      <RecordVoiceModal
        open={showRecordModal}
        onOpenChange={setShowRecordModal}
        onRecordingComplete={handleRecordingComplete}
      />

      <UploadVoiceModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onUploadComplete={handleFileUpload}
      />

      <PublicLinkModal
        open={showLinkModal}
        onOpenChange={setShowLinkModal}
        onSave={handleSaveLink}
      />

      <EditLinkModal
        open={showEditLinkModal}
        onOpenChange={setShowEditLinkModal}
        linkId={editingLink?.id || null}
        linkUrl={editingLink?.url || ''}
        initialQuestions={editingLink?.questions}
        onSave={() => {
          fetchVoiceNotes()
          setEditingLink(null)
        }}
      />
    </div>
  )
}
