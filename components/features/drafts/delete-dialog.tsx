'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface DeleteDialogProps {
  isOpen: boolean
  title?: string
  message?: string
  confirmLabel?: string
  onConfirm: () => Promise<void> | void
  onCancel: () => void
  /** Time in seconds for undo capability */
  undoTimeout?: number
}

export function DeleteDialog({
  isOpen,
  title = 'Delete Draft',
  message = 'Are you sure you want to delete this draft? This action cannot be undone.',
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  undoTimeout = 0,
}: DeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showUndo, setShowUndo] = useState(false)
  const [undoCountdown, setUndoCountdown] = useState(undoTimeout)

  useEffect(() => {
    if (showUndo && undoCountdown > 0) {
      const timer = setTimeout(() => {
        setUndoCountdown((c) => c - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (showUndo && undoCountdown === 0) {
      // Actually delete after undo timeout
      handleConfirm(true)
    }
  }, [showUndo, undoCountdown])

  const handleConfirm = async (skipUndo = false) => {
    if (undoTimeout > 0 && !skipUndo && !showUndo) {
      // Show undo option instead of immediately deleting
      setShowUndo(true)
      setUndoCountdown(undoTimeout)
      return
    }

    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
      setShowUndo(false)
      setUndoCountdown(undoTimeout)
    }
  }

  const handleUndo = () => {
    setShowUndo(false)
    setUndoCountdown(undoTimeout)
    onCancel()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={showUndo ? handleUndo : onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {showUndo ? (
          // Undo state
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Draft will be deleted in {undoCountdown}s
            </h3>
            <p className="text-gray-600 mb-6">
              Click undo to restore your draft.
            </p>
            <Button onClick={handleUndo} variant="default" className="w-full">
              Undo Delete
            </Button>
          </div>
        ) : (
          // Confirmation state
          <>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="text-gray-600 mt-1">{message}</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={() => handleConfirm()}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Deleting...' : confirmLabel}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
