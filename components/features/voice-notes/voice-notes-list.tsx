'use client'

import { useState } from 'react'
import { Search, ArrowDownUp, MoreHorizontal, Clock, Link2, Copy, Check, AlertTriangle, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface VoiceNote {
  id: string
  title?: string
  summary?: string
  duration_seconds?: number
  status: 'uploaded' | 'transcribing' | 'transcribed' | 'processing' | 'complete' | 'error' | 'pending'
  created_at: string
  storage_path?: string
  type: 'recording' | 'public_link'
  public_link?: string
  questions?: string
}

interface VoiceNotesListProps {
  voiceNotes: VoiceNote[]
  onNoteClick: (id: string) => void
  onEditLink?: (id: string, questions?: string) => void
  onDeleteLink?: (id: string) => void
  onDeleteNote?: (id: string) => void
  isLoading?: boolean
}

export function VoiceNotesList({ voiceNotes, onNoteClick, onEditLink, onDeleteLink, onDeleteNote, isLoading }: VoiceNotesListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' • ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const filteredNotes = voiceNotes
    .filter(note => {
      if (!searchQuery) return true
      const searchLower = searchQuery.toLowerCase()
      return (
        note.title?.toLowerCase().includes(searchLower) ||
        note.summary?.toLowerCase().includes(searchLower) ||
        note.public_link?.toLowerCase().includes(searchLower)
      )
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB
    })

  // Group notes by type
  const recordings = filteredNotes.filter(note => note.type === 'recording')
  const publicLinks = filteredNotes.filter(note => note.type === 'public_link')

  // Further group recordings by status
  const readyToGenerate = recordings.filter(note => 
    note.status === 'transcribed' || note.status === 'complete'
  )
  const processing = recordings.filter(note => 
    note.status === 'uploaded' || note.status === 'transcribing' || note.status === 'processing'
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-full mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Sort */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
        >
          <ArrowDownUp className="w-4 h-4" />
          {sortBy === 'newest' ? 'Newest' : 'Oldest'}
        </Button>
        
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search voice notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Public Links Section (Pending Recording) */}
      {publicLinks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Pending Recording</h3>
          {publicLinks.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-orange-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-gray-900">Public Link</h4>
                <div className="flex items-center gap-2">
                  <button
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
                    onClick={() => note.public_link && copyToClipboard(note.public_link, note.id)}
                  >
                    {copiedId === note.id ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-green-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  {onEditLink && (
                    <button
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={() => onEditLink(note.id, note.questions)}
                      title="Edit link"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  {onDeleteLink && (
                    <button
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      onClick={async () => {
                        if (confirm('Are you sure you want to delete this link?')) {
                          setDeletingId(note.id)
                          await onDeleteLink(note.id)
                          setDeletingId(null)
                        }
                      }}
                      disabled={deletingId === note.id}
                      title="Delete link"
                    >
                      {deletingId === note.id ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-gray-500 truncate mb-2">
                {note.public_link || 'No link available'}
              </p>

              {note.questions && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2 italic">
                  &quot;{note.questions}&quot;
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {formatDate(note.created_at)}
                </p>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-orange-600 bg-orange-50 rounded-full">
                  <AlertTriangle className="w-3 h-3" />
                  Pending Recording
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ready to Generate Posts Section */}
      {readyToGenerate.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Ready to Generate Posts</h3>
          {readyToGenerate.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-orange-200 hover:shadow-sm transition-all cursor-pointer group"
              onClick={() => onNoteClick(note.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                    {note.title || 'Voice Note'}
                  </h4>
                  {note.summary && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {note.summary}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    {formatDate(note.created_at)}
                  </p>
                </div>
                {onDeleteNote && (
                  <button
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Delete this voice note? This will also delete any generated posts.')) {
                        onDeleteNote(note.id)
                      }
                    }}
                    title="Delete voice note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Processing Section */}
      {processing.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Processing</h3>
          {processing.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-orange-200 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => onNoteClick(note.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900">
                    {note.title || 'Processing voice note...'}
                  </h4>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    {note.duration_seconds && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {Math.floor(note.duration_seconds / 60)}:{(note.duration_seconds % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                    <span>{formatDate(note.created_at)}</span>
                  </div>
                </div>
                <button
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State for Search */}
      {filteredNotes.length === 0 && searchQuery && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No voice notes found for &quot;{searchQuery}&quot;</p>
        </div>
      )}
    </div>
  )
}
