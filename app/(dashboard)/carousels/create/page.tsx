'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, LayoutGrid, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const TEMPLATES = [
  { id: 'tips', name: 'Tips & Tricks', description: 'Share actionable advice', color: 'from-blue-500 to-cyan-500' },
  { id: 'story', name: 'Story', description: 'Tell a narrative', color: 'from-purple-500 to-pink-500' },
  { id: 'listicle', name: 'Listicle', description: 'Numbered list format', color: 'from-orange-500 to-red-500' },
  { id: 'howto', name: 'How-To Guide', description: 'Step-by-step tutorial', color: 'from-green-500 to-emerald-500' },
  { id: 'quote', name: 'Quote Cards', description: 'Inspirational quotes', color: 'from-indigo-500 to-violet-500' },
]

export default function CreateCarouselPage() {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!selectedTemplate || !content.trim()) return
    
    setGenerating(true)
    try {
      const res = await fetch('/api/suflate/amplify/carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          templateType: selectedTemplate,
        }),
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.carousel?.id) {
          router.push(`/carousel/${data.carousel.id}`)
        }
      }
    } catch (e) {
      console.error('Failed to generate carousel:', e)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Create Carousel</h1>
              <p className="text-sm text-gray-500 mt-1">
                Build a captivating multi-slide post
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Step 1: Choose Template */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            1. Choose a template
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center mb-3`}>
                  <LayoutGrid className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-medium text-gray-900 text-sm">{template.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{template.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Enter Content */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            2. Enter your content
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your content here, or write the main points you want to turn into a carousel...

For example:
- 5 tips for better LinkedIn posts
- The story of how I built my startup
- A step-by-step guide to landing your dream job"
              rows={8}
              className="w-full resize-none border-none outline-none text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            AI will transform your content into beautiful carousel slides
          </p>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleGenerate}
            disabled={!selectedTemplate || !content.trim() || generating}
            size="lg"
            className="gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Carousel
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
