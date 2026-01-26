'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
  Sparkles,
  Zap,
  X,
} from 'lucide-react'

type RepurposeType = 'blog' | 'tweet' | 'youtube' | 'pdf' | null

interface RepurposeResult {
  success: boolean
  posts?: any[]
  error?: string
}

/**
 * Epic 6: Content Repurposing Page
 * Supergrow-style design
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
      gradient: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      id: 'tweet' as RepurposeType,
      name: 'Tweet / Thread',
      description: 'Expand a tweet into longer LinkedIn content',
      icon: Twitter,
      credits: 3,
      color: 'sky',
      gradient: 'from-sky-500 to-blue-500',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200',
    },
    {
      id: 'youtube' as RepurposeType,
      name: 'YouTube Video',
      description: 'Turn video insights into LinkedIn posts',
      icon: Youtube,
      credits: 5,
      color: 'red',
      gradient: 'from-red-500 to-rose-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    {
      id: 'pdf' as RepurposeType,
      name: 'PDF Document',
      description: 'Extract key points from documents',
      icon: FileText,
      credits: 5,
      color: 'orange',
      gradient: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
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
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Supergrow-style Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl mb-6 shadow-lg shadow-orange-500/30">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Repurpose Content
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Transform your existing content into engaging LinkedIn posts in seconds
        </p>
      </div>

      {/* Success state - Supergrow style */}
      {result?.success && result.posts && (
        <div className="bg-white rounded-2xl border border-green-200 p-8 mb-8">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {result.posts.length} posts created!
              </h3>
              <p className="text-gray-500 mt-1">
                Your content has been repurposed into LinkedIn post drafts.
              </p>
              <div className="flex gap-3 mt-6">
                <Button 
                  onClick={() => router.push('/drafts')}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  View Drafts
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={resetForm} className="border-gray-200">
                  Repurpose More
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error state - Supergrow style */}
      {result && !result.success && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{result.error}</p>
          </div>
          <button onClick={() => setResult(null)} className="p-1 hover:bg-red-100 rounded">
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}

      {/* Content type selection - Supergrow style */}
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
                  className={`p-5 rounded-xl border-2 text-left transition-all group hover:shadow-lg ${
                    isSelected
                      ? `border-orange-500 ${type.bgColor}`
                      : 'border-gray-200 hover:border-orange-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      isSelected 
                        ? `bg-gradient-to-br ${type.gradient} shadow-lg` 
                        : 'bg-gray-100 group-hover:bg-orange-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600 group-hover:text-orange-600'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{type.name}</h3>
                        {isSelected && (
                          <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-medium rounded-full">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Zap className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-xs text-orange-600 font-medium">{type.credits} credits</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Input based on selected type - Supergrow style */}
          {selectedType && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              {selectedType === 'blog' && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700">Blog URL</span>
                    <Input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/blog-post"
                      className="mt-2 h-12 rounded-xl border-gray-200 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </label>
                  <p className="text-sm text-gray-500">
                    Paste the URL of any blog post or article. We&apos;ll extract the content and create 3 LinkedIn post variations.
                  </p>
                </div>
              )}

              {selectedType === 'tweet' && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700">Tweet Text</span>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Paste your tweet or thread text here..."
                      rows={4}
                      maxLength={1000}
                      className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none transition-all"
                    />
                    <div className="text-xs text-gray-400 text-right mt-1">
                      {text.length}/1000
                    </div>
                  </label>
                  <p className="text-sm text-gray-500">
                    Paste tweet text and we&apos;ll expand it into longer-form LinkedIn content.
                  </p>
                </div>
              )}

              {selectedType === 'youtube' && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700">YouTube URL</span>
                    <Input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="mt-2 h-12 rounded-xl border-gray-200 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </label>
                  <p className="text-sm text-gray-500">
                    We&apos;ll extract the video&apos;s title, description, and available metadata to create LinkedIn posts.
                  </p>
                </div>
              )}

              {selectedType === 'pdf' && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700">PDF Document</span>
                    <div className="mt-2">
                      <label className={`flex items-center justify-center w-full h-40 px-4 transition-all bg-gray-50 border-2 border-dashed rounded-xl cursor-pointer ${
                        file ? 'border-orange-300 bg-orange-50' : 'border-gray-300 hover:border-orange-300 hover:bg-orange-50/50'
                      }`}>
                        <div className="flex flex-col items-center space-y-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            file ? 'bg-orange-100' : 'bg-white'
                          }`}>
                            <Upload className={`w-6 h-6 ${file ? 'text-orange-600' : 'text-gray-400'}`} />
                          </div>
                          {file ? (
                            <div className="text-center">
                              <span className="font-medium text-gray-900">{file.name}</span>
                              <p className="text-xs text-gray-500 mt-1">Click to change file</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <span className="font-medium text-gray-700">Click to upload PDF</span>
                              <p className="text-xs text-gray-500 mt-1">Max 10MB</p>
                            </div>
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
                  <p className="text-sm text-gray-500">
                    We&apos;ll extract text from your PDF and identify key points for LinkedIn posts.
                  </p>
                </div>
              )}

              <div className="mt-6">
                <Button
                  onClick={handleRepurpose}
                  disabled={loading}
                  className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-base font-medium"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Repurpose Content
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
