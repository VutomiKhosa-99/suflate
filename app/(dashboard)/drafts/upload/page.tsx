'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { 
  Upload, 
  FileText, 
  X, 
  Check, 
  Loader2, 
  ArrowLeft,
  AlertCircle 
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UploadedFile {
  id: string
  name: string
  content: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export default function UploadDraftsPage() {
  const router = useRouter()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = []
    
    for (const file of acceptedFiles) {
      const text = await file.text()
      newFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        content: text,
        status: 'pending',
      })
    }
    
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/csv': ['.csv'],
    },
    multiple: true,
  })

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const uploadAll = async () => {
    setUploading(true)
    
    for (const file of files) {
      if (file.status !== 'pending') continue
      
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'uploading' } : f
      ))

      try {
        // Parse content - if CSV, split by lines
        let contents: string[] = []
        
        if (file.name.endsWith('.csv')) {
          // Simple CSV parsing - each line is a draft
          contents = file.content
            .split('\n')
            .filter(line => line.trim())
            .slice(1) // Skip header row
        } else {
          // Single content file
          contents = [file.content]
        }

        // Create drafts for each content
        for (const content of contents) {
          if (!content.trim()) continue
          
          await fetch('/api/suflate/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: content.trim(),
              title: file.name.replace(/\.(txt|md|csv)$/, ''),
              tags: ['imported'],
              source_type: 'manual',
              variation_type: 'manual',
              status: 'draft',
            }),
          })
        }

        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'success' } : f
        ))
      } catch (e) {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'error', error: 'Failed to upload' } : f
        ))
      }
    }
    
    setUploading(false)
  }

  const pendingCount = files.filter(f => f.status === 'pending').length
  const successCount = files.filter(f => f.status === 'success').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Upload Drafts in Bulk</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Upload .txt, .md, or .csv files to create multiple drafts at once
                </p>
              </div>
            </div>

            {files.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {pendingCount} pending · {successCount} uploaded
                </span>
                <Button
                  onClick={uploadAll}
                  disabled={uploading || pendingCount === 0}
                  className="gap-2"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Upload All
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto p-6">
        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-orange-400 bg-orange-50'
              : 'border-gray-300 hover:border-gray-400 bg-white'
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
          {isDragActive ? (
            <p className="text-lg font-medium text-orange-600">Drop files here...</p>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports .txt, .md, and .csv files
              </p>
            </>
          )}
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="font-medium text-gray-900">Files to upload</h3>
            
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-gray-500" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {file.content.length} characters
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {file.status === 'pending' && (
                    <span className="text-sm text-gray-500">Pending</span>
                  )}
                  {file.status === 'uploading' && (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  )}
                  {file.status === 'success' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="w-5 h-5" />
                      <span className="text-sm">Uploaded</span>
                    </div>
                  )}
                  {file.status === 'error' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm">{file.error}</span>
                    </div>
                  )}

                  {file.status === 'pending' && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
          <h3 className="font-semibold text-gray-900 mb-3">📋 How to format your files</h3>
          
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-800">.txt or .md files</p>
              <p>Each file will be created as a single draft post.</p>
            </div>
            
            <div>
              <p className="font-medium text-gray-800">.csv files</p>
              <p>Each row (after the header) will be created as a separate draft.</p>
              <p className="mt-1 text-gray-500">Example format: <code className="bg-blue-100 px-1 rounded">content</code> column with your post text.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
