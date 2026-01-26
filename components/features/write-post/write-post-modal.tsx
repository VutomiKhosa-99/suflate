'use client'

import { useState } from 'react'
import { X, PenLine, Mic, RefreshCw, LayoutGrid, Upload, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface WritePostModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WritePostModal({ isOpen, onClose }: WritePostModalProps) {
  const router = useRouter()
  const [creatingDraft, setCreatingDraft] = useState(false)

  if (!isOpen) return null

  const handleNavigate = (path: string) => {
    onClose()
    router.push(path)
  }

  // Create a new draft and navigate to editor (same as "New Draft" button)
  const handleWriteManually = async () => {
    setCreatingDraft(true)
    try {
      const response = await fetch('/api/suflate/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '',
          title: '',
          variationType: 'professional',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create draft')
      }

      const data = await response.json()
      onClose()
      router.push(`/editor/${data.post.id}`)
    } catch (err) {
      console.error('Failed to create draft:', err)
      setCreatingDraft(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
              <PenLine className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Create Your LinkedIn Post</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Main Options Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Write Manually */}
            <button
              onClick={handleWriteManually}
              disabled={creatingDraft}
              className="flex flex-col items-start p-5 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50/50 transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-orange-100 flex items-center justify-center mb-4 transition-colors">
                {creatingDraft ? (
                  <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
                ) : (
                  <PenLine className="w-6 h-6 text-gray-600 group-hover:text-orange-600" />
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {creatingDraft ? 'Creating...' : 'Write Manually'}
              </h3>
              <p className="text-sm text-gray-500">Compose your post by hand for a personal touch.</p>
            </button>

            {/* Voice Notes (PostCast equivalent) */}
            <button
              onClick={() => handleNavigate('/record')}
              className="flex flex-col items-start p-5 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50/50 transition-all group text-left relative"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 group-hover:bg-orange-100 flex items-center justify-center mb-4 transition-colors">
                <Mic className="w-6 h-6 text-blue-600 group-hover:text-orange-600" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">Record Voice Note</h3>
                <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-full">
                  New ✨
                </span>
              </div>
              <p className="text-sm text-gray-500">Speak your thoughts, get LinkedIn posts with ease.</p>
            </button>

            {/* Repurpose Content */}
            <button
              onClick={() => handleNavigate('/repurpose')}
              className="flex flex-col items-start p-5 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50/50 transition-all group text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-green-100 group-hover:bg-orange-100 flex items-center justify-center mb-4 transition-colors">
                <RefreshCw className="w-6 h-6 text-green-600 group-hover:text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Repurpose from YouTube, Blog, PDF</h3>
              <p className="text-sm text-gray-500">Transform existing content into new formats.</p>
            </button>

            {/* Create Carousel */}
            <button
              onClick={() => handleNavigate('/carousels/create')}
              className="flex flex-col items-start p-5 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50/50 transition-all group text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-100 group-hover:bg-orange-100 flex items-center justify-center mb-4 transition-colors">
                <LayoutGrid className="w-6 h-6 text-purple-600 group-hover:text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Create Carousel</h3>
              <p className="text-sm text-gray-500">Build a captivating multi-slide post to engage audience.</p>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm font-medium text-orange-500">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Upload Drafts */}
          <button
            onClick={() => handleNavigate('/drafts/upload')}
            className="w-full flex items-start gap-4 p-5 border border-dashed border-gray-300 rounded-xl hover:border-orange-300 hover:bg-orange-50/30 transition-all group text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-orange-100 flex items-center justify-center transition-colors">
              <Upload className="w-6 h-6 text-gray-500 group-hover:text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Upload Drafts in Bulk</h3>
              <p className="text-sm text-gray-500">Upload multiple draft files at once for efficient posting.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
