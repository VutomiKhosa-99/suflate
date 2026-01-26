'use client'

import { Mic, Upload, Link2 } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

interface AddVoiceNoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectRecord: () => void
  onSelectUpload: () => void
  onSelectShareLink: () => void
}

export function AddVoiceNoteModal({
  open,
  onOpenChange,
  onSelectRecord,
  onSelectUpload,
  onSelectShareLink,
}: AddVoiceNoteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6">
        <DialogTitle className="text-xl font-semibold text-gray-900 mb-6">
          Add Voice Note
        </DialogTitle>

        <div className="grid grid-cols-3 gap-4">
          {/* Record Voice Option */}
          <button
            onClick={() => {
              onOpenChange(false)
              onSelectRecord()
            }}
            className="group flex flex-col items-center p-6 rounded-xl border-2 border-gray-200 hover:border-cyan-400 hover:bg-cyan-50/50 transition-all"
          >
            <div className="w-14 h-14 rounded-full bg-cyan-100 flex items-center justify-center mb-4 group-hover:bg-cyan-200 transition-colors">
              <Mic className="w-7 h-7 text-cyan-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Record your Voice</h3>
            <p className="text-sm text-gray-500 text-center">
              Tap to begin capturing your thoughts—speak freely!
            </p>
          </button>

          {/* Upload Audio Option */}
          <button
            onClick={() => {
              onOpenChange(false)
              onSelectUpload()
            }}
            className="group flex flex-col items-center p-6 rounded-xl border-2 border-gray-200 hover:border-cyan-400 hover:bg-cyan-50/50 transition-all"
          >
            <div className="w-14 h-14 rounded-full bg-cyan-100 flex items-center justify-center mb-4 group-hover:bg-cyan-200 transition-colors">
              <Upload className="w-7 h-7 text-cyan-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Upload Audio File</h3>
            <p className="text-sm text-gray-500 text-center">
              Select an audio file from your device to share your message.
            </p>
          </button>

          {/* Share Link Option */}
          <button
            onClick={() => {
              onOpenChange(false)
              onSelectShareLink()
            }}
            className="group flex flex-col items-center p-6 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50/50 transition-all"
          >
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
              <Link2 className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Share a Link</h3>
            <p className="text-sm text-gray-500 text-center">
              Create public links for recording the audio.
            </p>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
