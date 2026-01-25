'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Link2,
  Twitter,
  Youtube,
  FileText,
  Loader2,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Upload,
} from 'lucide-react'

type RepurposeType = 'blog' | 'tweet' | 'youtube' | 'pdf' | null

interface RepurposeResult {
  success: boolean
  posts?: any[]
  error?: string
}

/**
 * Epic 6: Content Repurposing Page
 * 
 * Allows users to repurpose content from:
 * - Blog URLs (Story 6.1)
 * - Tweet text (Story 6.2)
 * - YouTube URLs (Story 6.3)
 * - PDF uploads (Story 6.4)
 */
export default function RepurposePage() {
  const router = useRouter()
  
  const [selectedType, setSelectedType] = useState<RepurposeType>(null)
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RepurposeResult | null>(null)

  const repurposeTypes = [
    {
      id: 'blog' as RepurposeType,
      name: 'Blog Post',
      description: 'Paste a blog URL and get LinkedIn posts',
      icon: Link2,
      credits: 5,
      color: 'blue',
    },
    {
      id: 'tweet' as RepurposeType,
      name: 'Tweet / Thread',
      description: 'Expand a tweet into longer LinkedIn content',
      icon: Twitter,
      credits: 3,
      color: 'sky',
    },
    {
      id: 'youtube' as RepurposeType,
      name: 'YouTube Video',
      description: 'Turn video insights into LinkedIn posts',
      icon: Youtube,
      credits: 5,
      color: 'red',
    },
    {
      id: 'pdf' as RepurposeType,
      name: 'PDF Document',
      description: 'Extract key points from documents',
      icon: FileText,
      credits: 5,
      color: 'orange',
    },
  ]

  const handleRepurpose = async () => {
    if (!selectedType) return

    setLoading(true)
    setResult(null)

    try {
      let response: Response

      if (selectedType === 'blog') {
        if (!url.trim()) {
          setResult({ success: false, error: 'Please enter a blog URL' })
          setLoading(false)
          return
        }
        response = await fetch('/api/suflate/repurpose/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })
      } else if (selectedType === 'tweet') {
        if (!text.trim()) {
          setResult({ success: false, error: 'Please enter tweet text' })
          setLoading(false)
          return
        }
        response = await fetch('/api/suflate/repurpose/tweet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        })
      } else if (selectedType === 'youtube') {
        if (!url.trim()) {
          setResult({ success: false, error: 'Please enter a YouTube URL' })
          setLoading(false)
          return
        }
        response = await fetch('/api/suflate/repurpose/youtube', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })
      } else if (selectedType === 'pdf') {
        if (!file) {
          setResult({ success: false, error: 'Please select a PDF file' })
          setLoading(false)
          return
        }
        const formData = new FormData()
        formData.append('file', file)
        response = await fetch('/api/suflate/repurpose/pdf', {
          method: 'POST',
          body: formData,
        })
      } else {
        setResult({ success: false, error: 'Invalid repurpose type' })
        setLoading(false)
        return
      }

      const data = await response.json()

      if (!response.ok) {
        setResult({ success: false, error: data.error || 'Failed to repurpose content' })
      } else {
        setResult({ success: true, posts: data.posts })
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setResult({ success: false, error: 'Please select a PDF file' })
        return
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setResult({ success: false, error: 'File must be less than 10MB' })
        return
      }
      setFile(selectedFile)
      setResult(null)
    }
  }

  const resetForm = () => {
    setSelectedType(null)
    setUrl('')
    setText('')
    setFile(null)
    setResult(null)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Repurpose Content</h1>
        <p className="text-gray-600 mt-1">
          Transform existing content into LinkedIn posts
        </p>
      </div>

      {/* Success state */}
      {result?.success && result.posts && (
        <Card className="p-6 mb-6 border-green-200 bg-green-50">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">
                {result.posts.length} posts created!
              </h3>
              <p className="text-green-700 text-sm mt-1">
                Your content has been repurposed into LinkedIn post drafts.
              </p>
              <div className="flex gap-3 mt-4">
                <Button onClick={() => router.push('/drafts')}>
                  View Drafts
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Repurpose More
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Error state */}
      {result && !result.success && (
        <Card className="p-4 mb-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{result.error}</p>
          </div>
        </Card>
      )}

      {/* Content type selection */}
      {!result?.success && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {repurposeTypes.map((type) => {
              const Icon = type.icon
              const isSelected = selectedType === type.id
              
              return (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type.id)
                    setResult(null)
                  }}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{type.name}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{type.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{type.credits} credits</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Input based on selected type */}
          {selectedType && (
            <Card className="p-6">
              {selectedType === 'blog' && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Blog URL</span>
                    <Input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/blog-post"
                      className="mt-1"
                    />
                  </label>
                  <p className="text-xs text-gray-500">
                    Paste the URL of any blog post or article. We'll extract the content and create 3 LinkedIn post variations.
                  </p>
                </div>
              )}

              {selectedType === 'tweet' && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Tweet Text</span>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Paste your tweet or thread text here..."
                      rows={4}
                      maxLength={1000}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                    <div className="text-xs text-gray-400 text-right mt-1">
                      {text.length}/1000
                    </div>
                  </label>
                  <p className="text-xs text-gray-500">
                    Paste tweet text and we'll expand it into longer-form LinkedIn content.
                  </p>
                </div>
              )}

              {selectedType === 'youtube' && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">YouTube URL</span>
                    <Input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="mt-1"
                    />
                  </label>
                  <p className="text-xs text-gray-500">
                    We'll extract the video's title, description, and available metadata to create LinkedIn posts.
                  </p>
                </div>
              )}

              {selectedType === 'pdf' && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">PDF Document</span>
                    <div className="mt-1">
                      <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
                        <div className="flex flex-col items-center space-y-2">
                          <Upload className="w-8 h-8 text-gray-400" />
                          {file ? (
                            <span className="font-medium text-gray-600">{file.name}</span>
                          ) : (
                            <span className="text-sm text-gray-500">
                              Click to upload PDF (max 10MB)
                            </span>
                          )}
                        </div>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </label>
                  <p className="text-xs text-gray-500">
                    We'll extract text from your PDF and identify key points for LinkedIn posts.
                  </p>
                </div>
              )}

              <div className="mt-6">
                <Button
                  onClick={handleRepurpose}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Repurpose Content
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
