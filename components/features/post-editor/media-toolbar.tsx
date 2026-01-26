'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Smile,
  Loader2,
  X,
  Upload,
} from 'lucide-react'
import { EmojiPicker } from './emoji-picker'

interface MediaToolbarProps {
  onInsertText: (text: string) => void
  onMediaUpload?: (mediaUrl: string, mediaType: 'image' | 'video' | 'document') => void
  disabled?: boolean
  className?: string
}

// Supported media types
const MEDIA_CONFIG = {
  image: {
    accept: 'image/jpeg,image/png,image/gif,image/webp',
    maxSize: 10 * 1024 * 1024, // 10MB
    label: 'Image',
    icon: ImageIcon,
  },
  video: {
    accept: 'video/mp4,video/webm,video/quicktime',
    maxSize: 50 * 1024 * 1024, // 50MB
    label: 'Video',
    icon: Video,
  },
  document: {
    accept: 'application/pdf',
    maxSize: 10 * 1024 * 1024, // 10MB
    label: 'PDF',
    icon: FileText,
  },
}

interface UploadedMedia {
  type: 'image' | 'video' | 'document'
  url: string
  fileName: string
}

export function MediaToolbar({ 
  onInsertText, 
  onMediaUpload,
  disabled = false,
  className = '',
}: MediaToolbarProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [uploading, setUploading] = useState<'image' | 'video' | 'document' | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([])
  
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)

  const handleEmojiSelect = (emoji: string) => {
    onInsertText(emoji)
    setShowEmojiPicker(false)
  }

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'image' | 'video' | 'document'
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size
    const config = MEDIA_CONFIG[type]
    if (file.size > config.maxSize) {
      setUploadError(`File too large. Maximum size is ${config.maxSize / 1024 / 1024}MB`)
      event.target.value = ''
      return
    }

    setUploadError(null)
    setUploading(type)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/suflate/media/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()
      
      // Add to uploaded media list
      const newMedia: UploadedMedia = {
        type,
        url: data.url,
        fileName: file.name,
      }
      setUploadedMedia(prev => [...prev, newMedia])
      
      // Notify parent
      onMediaUpload?.(data.url, type)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(null)
      event.target.value = ''
    }
  }

  const removeMedia = (index: number) => {
    setUploadedMedia(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200">
        {/* Image Upload */}
        <input
          ref={imageInputRef}
          type="file"
          accept={MEDIA_CONFIG.image.accept}
          onChange={(e) => handleFileSelect(e, 'image')}
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => imageInputRef.current?.click()}
          disabled={disabled || uploading !== null}
          className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          title="Add image"
        >
          {uploading === 'image' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Image</span>
        </Button>

        {/* Video Upload */}
        <input
          ref={videoInputRef}
          type="file"
          accept={MEDIA_CONFIG.video.accept}
          onChange={(e) => handleFileSelect(e, 'video')}
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => videoInputRef.current?.click()}
          disabled={disabled || uploading !== null}
          className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          title="Add video"
        >
          {uploading === 'video' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Video className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Video</span>
        </Button>

        {/* Document Upload */}
        <input
          ref={documentInputRef}
          type="file"
          accept={MEDIA_CONFIG.document.accept}
          onChange={(e) => handleFileSelect(e, 'document')}
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => documentInputRef.current?.click()}
          disabled={disabled || uploading !== null}
          className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          title="Add PDF document"
        >
          {uploading === 'document' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">PDF</span>
        </Button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Emoji Picker */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            title="Add emoji"
          >
            <Smile className="w-4 h-4" />
            <span className="hidden sm:inline">Emoji</span>
          </Button>
          
          {showEmojiPicker && (
            <div className="absolute left-0 top-full mt-2 z-50">
              <EmojiPicker 
                onSelect={handleEmojiSelect} 
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {uploadError && (
        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg text-sm text-red-600">
          <span>{uploadError}</span>
          <button 
            onClick={() => setUploadError(null)}
            className="ml-auto hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Uploaded media preview */}
      {uploadedMedia.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Attached Media</p>
          <div className="flex flex-wrap gap-2">
            {uploadedMedia.map((media, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm"
              >
                {media.type === 'image' && <ImageIcon className="w-4 h-4 text-blue-600" />}
                {media.type === 'video' && <Video className="w-4 h-4 text-purple-600" />}
                {media.type === 'document' && <FileText className="w-4 h-4 text-red-600" />}
                <span className="max-w-[150px] truncate">{media.fileName}</span>
                <button 
                  onClick={() => removeMedia(index)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
