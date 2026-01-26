'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { MoveToWorkspaceDialog } from './move-to-workspace-dialog'
import {
  Mic,
  FileText,
  Twitter,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Check,
  FolderInput,
  Sparkles,
} from 'lucide-react'

// Variation type labels and colors - Updated to match Supergrow style
const VARIATION_LABELS: Record<string, { label: string; bgColor: string; textColor: string }> = {
  professional: { label: 'Professional', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  personal: { label: 'Personal', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
  actionable: { label: 'Actionable', bgColor: 'bg-green-50', textColor: 'text-green-600' },
  discussion: { label: 'Discussion', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
  bold: { label: 'Bold', bgColor: 'bg-red-50', textColor: 'text-red-600' },
}

// Source type icons
const SOURCE_ICONS: Record<string, { icon: React.ReactNode; bgColor: string }> = {
  voice: { icon: <Mic className="w-4 h-4 text-orange-600" />, bgColor: 'bg-orange-100' },
  repurpose_blog: { icon: <FileText className="w-4 h-4 text-blue-600" />, bgColor: 'bg-blue-100' },
  repurpose_tweet: { icon: <Twitter className="w-4 h-4 text-sky-600" />, bgColor: 'bg-sky-100' },
  manual: { icon: <Sparkles className="w-4 h-4 text-purple-600" />, bgColor: 'bg-purple-100' },
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
    label: draft.variation_type || 'Draft',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-600',
  }

  const sourceInfo = SOURCE_ICONS[draft.source_type] || { 
    icon: <FileText className="w-4 h-4 text-gray-600" />, 
    bgColor: 'bg-gray-100' 
  }

  // Get preview text (first 120 characters for cleaner look)
  const previewText = draft.content.length > 120
    ? draft.content.slice(0, 120).trim() + '...'
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
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-orange-200 hover:shadow-sm transition-all relative group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Source indicator */}
          <div
            className={`w-9 h-9 rounded-lg ${sourceInfo.bgColor} flex items-center justify-center flex-shrink-0`}
            title={`Source: ${draft.source_type}`}
          >
            {sourceInfo.icon}
          </div>
          <div>
            {/* Variation type badge */}
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${variationInfo.bgColor} ${variationInfo.textColor}`}>
              {variationInfo.label}
            </span>
            {/* Creation date */}
            <p className="text-xs text-gray-400 mt-1" title={new Date(draft.created_at).toLocaleString()}>
              {timeAgo}
            </p>
          </div>
        </div>

        {/* Actions menu */}
        <div className="relative">
          <button
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                <Link
                  href={`/editor/${draft.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Link>
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy content'}
                </button>
                {showMoveOption && onMove && (
                  <button
                    onClick={openMoveDialog}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FolderInput className="w-4 h-4" />
                    Move to workspace
                  </button>
                )}
                <hr className="my-2 border-gray-100" />
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
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
      <Link href={`/editor/${draft.id}`} className="block">
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
          {previewText}
        </p>
      </Link>

      {/* Footer with word count */}
      <div className="mt-4 flex items-center justify-end">
        <span className="text-xs text-gray-400">
          {draft.word_count || 0} words
        </span>
      </div>

      {/* Move to workspace dialog */}
      {showMoveOption && onMove && (
        <MoveToWorkspaceDialog
          isOpen={showMoveDialog}
          postId={draft.id}
          currentWorkspaceId={draft.workspace_id}
          onMove={handleMove}
          onClose={() => setShowMoveDialog(false)}
        />
      )}
    </div>
  )
}
