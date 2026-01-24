'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MoveToWorkspaceDialog } from './move-to-workspace-dialog'
import {
  Mic,
  FileText,
  Twitter,
  MoreVertical,
  Edit,
  Trash2,
  Tag,
  Copy,
  Check,
  FolderInput,
} from 'lucide-react'

// Variation type labels and colors
const VARIATION_LABELS: Record<string, { label: string; color: string }> = {
  professional: { label: 'Professional', color: 'bg-blue-100 text-blue-800' },
  personal: { label: 'Personal', color: 'bg-purple-100 text-purple-800' },
  actionable: { label: 'Actionable', color: 'bg-green-100 text-green-800' },
  discussion: { label: 'Discussion', color: 'bg-yellow-100 text-yellow-800' },
  bold: { label: 'Bold', color: 'bg-red-100 text-red-800' },
}

// Source type icons
const SOURCE_ICONS: Record<string, React.ReactNode> = {
  voice: <Mic className="w-4 h-4" />,
  repurpose_blog: <FileText className="w-4 h-4" />,
  repurpose_tweet: <Twitter className="w-4 h-4" />,
}

export interface Draft {
  id: string
  content: string
  title?: string
  tags?: string[]
  source_type: string
  variation_type: string
  word_count?: number
  character_count?: number
  created_at: string
  updated_at: string
  workspace_id: string
  transcriptions?: {
    id: string
    voice_recordings?: {
      id: string
      duration_seconds?: number
    }
  }
}

interface DraftCardProps {
  draft: Draft
  onDelete?: (id: string) => void
  onTagClick?: (tag: string) => void
  onMove?: (id: string, targetWorkspaceId: string) => Promise<void>
  showMoveOption?: boolean
}

export function DraftCard({ draft, onDelete, onTagClick, onMove, showMoveOption = true }: DraftCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showMoveDialog, setShowMoveDialog] = useState(false)

  const variationInfo = VARIATION_LABELS[draft.variation_type] || {
    label: draft.variation_type,
    color: 'bg-gray-100 text-gray-800',
  }

  const sourceIcon = SOURCE_ICONS[draft.source_type] || <FileText className="w-4 h-4" />

  // Get preview text (first 150 characters)
  const previewText = draft.content.length > 150
    ? draft.content.slice(0, 150).trim() + '...'
    : draft.content

  // Format relative time
  const timeAgo = formatDistanceToNow(new Date(draft.created_at), { addSuffix: true })

  const handleCopy = async () => {
    await navigator.clipboard.writeText(draft.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(draft.id)
    } finally {
      setIsDeleting(false)
      setShowMenu(false)
    }
  }

  const handleMove = async (targetWorkspaceId: string) => {
    if (!onMove) return
    await onMove(draft.id, targetWorkspaceId)
  }

  const openMoveDialog = () => {
    setShowMenu(false)
    setShowMoveDialog(true)
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Source indicator (Story 3.2) */}
          <div
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
            title={`Source: ${draft.source_type}`}
          >
            {sourceIcon}
          </div>
          <div>
            {/* Variation type badge */}
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${variationInfo.color}`}>
              {variationInfo.label}
            </span>
            {/* Creation date (Story 3.7) */}
            <p className="text-xs text-gray-500 mt-0.5" title={new Date(draft.created_at).toLocaleString()}>
              {timeAgo}
            </p>
          </div>
        </div>

        {/* Actions menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <Link
                  href={`/editor/${draft.id}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Link>
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy content'}
                </button>
                {showMoveOption && onMove && (
                  <button
                    onClick={openMoveDialog}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FolderInput className="w-4 h-4" />
                    Move to workspace
                  </button>
                )}
                <hr className="my-1" />
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content preview */}
      <Link href={`/editor/${draft.id}`} className="block group">
        {draft.title && (
          <h3 className="font-medium text-gray-900 mb-1 group-hover:text-blue-600">
            {draft.title}
          </h3>
        )}
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
          {previewText}
        </p>
      </Link>

      {/* Footer with tags and stats */}
      <div className="mt-4 flex items-center justify-between">
        {/* Tags (Story 3.6) */}
        <div className="flex flex-wrap gap-1">
          {draft.tags?.slice(0, 3).map((tag) => (
            <button
              key={tag}
              onClick={() => onTagClick?.(tag)}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-600 transition-colors"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </button>
          ))}
          {draft.tags && draft.tags.length > 3 && (
            <span className="text-xs text-gray-400">
              +{draft.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Word count */}
        <span className="text-xs text-gray-400">
          {draft.word_count || 0} words
        </span>
      </div>

      {/* Move to workspace dialog (Story 3.8) */}
      {showMoveOption && onMove && (
        <MoveToWorkspaceDialog
          isOpen={showMoveDialog}
          postId={draft.id}
          currentWorkspaceId={draft.workspace_id}
          onMove={handleMove}
          onClose={() => setShowMoveDialog(false)}
        />
      )}
    </Card>
  )
}
