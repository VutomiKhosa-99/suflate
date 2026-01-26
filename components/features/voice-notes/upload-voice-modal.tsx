'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileAudio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { validateAudioFile } from '@/lib/validation/audio'

interface UploadVoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete: (file: File) => void
}

export function UploadVoiceModal({
  open,
  onOpenChange,
  onUploadComplete,
}: UploadVoiceModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    setError(null)
    
    const validation = await validateAudioFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid audio file')
      return
    }

    setSelectedFile(file)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      await handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleSave = () => {
    if (selectedFile) {
      onUploadComplete(selectedFile)
      handleClose()
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setError(null)
    onOpenChange(false)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-6">
        <DialogTitle className="text-xl font-semibold text-gray-900 mb-6">
          Upload Voice Note
        </DialogTitle>

        <div className="flex flex-col items-center py-4">
          {!selectedFile ? (
            <>
              {/* Drop Zone */}
              <div
                className={`w-full p-8 border-2 border-dashed rounded-xl flex flex-col items-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-50'
                    : 'border-gray-300 hover:border-cyan-400 hover:bg-gray-50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-full bg-cyan-500 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-900 font-medium mb-1">Upload voice note</p>
                <p className="text-sm text-gray-500 text-center">
                  Drag and drop or click to select
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  MP3, WAV, WebM, OGG, M4A (max 10MB)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />
            </>
          ) : (
            <>
              {/* Selected File Preview */}
              <div className="w-full p-4 bg-gray-50 rounded-xl flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <FileAudio className="w-6 h-6 text-cyan-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="w-full mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={handleClose}>
            Discard
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedFile}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            Save Note
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
