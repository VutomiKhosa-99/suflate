'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  X,
  Building2,
  Check,
  AlertCircle,
} from 'lucide-react'

interface Workspace {
  id: string
  name: string
  plan: string
  role: string
  credits_remaining?: number
  credits_total?: number
}

interface MoveToWorkspaceDialogProps {
  isOpen: boolean
  postId: string
  currentWorkspaceId: string
  onMove: (targetWorkspaceId: string) => Promise<void>
  onClose: () => void
}

/**
 * Story 3.8: Move Drafts Between Workspaces (Agency Feature)
 * 
 * Dialog component that allows users to move a draft to another workspace
 * they have access to. Displays list of available workspaces and handles
 * the move operation with proper feedback.
 */
export function MoveToWorkspaceDialog({
  isOpen,
  postId,
  currentWorkspaceId,
  onMove,
  onClose,
}: MoveToWorkspaceDialogProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [moving, setMoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)

  // Fetch user's workspaces when dialog opens
  useEffect(() => {
    if (!isOpen) return

    async function fetchWorkspaces() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/suflate/workspaces')
        if (!response.ok) {
          throw new Error('Failed to fetch workspaces')
        }
        const data = await response.json()
        // Filter out the current workspace
        const availableWorkspaces = (data.workspaces || []).filter(
          (w: Workspace) => w.id !== currentWorkspaceId
        )
        setWorkspaces(availableWorkspaces)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workspaces')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspaces()
  }, [isOpen, currentWorkspaceId])

  const handleMove = async () => {
    if (!selectedWorkspaceId) return

    setMoving(true)
    setError(null)
    try {
      await onMove(selectedWorkspaceId)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move draft')
    } finally {
      setMoving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden"
        role="dialog"
        aria-labelledby="move-dialog-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 id="move-dialog-title" className="text-lg font-semibold text-gray-900">
            Move to Workspace
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading workspaces...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : workspaces.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No other workspaces available.</p>
              <p className="text-sm text-gray-500 mt-1">
                Create additional workspaces to move drafts between them.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-4">
                Select a workspace to move this draft to:
              </p>
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => setSelectedWorkspaceId(workspace.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                    selectedWorkspaceId === workspace.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{workspace.name}</p>
                      <p className="text-xs text-gray-500">
                        {workspace.plan} plan • {workspace.role}
                      </p>
                    </div>
                  </div>
                  {selectedWorkspaceId === workspace.id && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={moving}>
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={!selectedWorkspaceId || moving || loading}
          >
            {moving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Moving...
              </>
            ) : (
              'Move Draft'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
