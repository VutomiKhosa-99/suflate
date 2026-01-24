'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SlidePreview, TemplateSelector, SlideEditor } from '@/components/features/carousel'
import { getTemplate, applyBrandingOverrides, CarouselTemplate } from '@/lib/carousel-templates'
import {
  ArrowLeft,
  Download,
  Save,
  Loader2,
  Check,
  Clock,
  Layout,
  Palette,
} from 'lucide-react'

interface SlideData {
  slide_number: number
  title: string
  body: string
  key_point: string
}

interface Carousel {
  id: string
  title: string
  slide_data: SlideData[]
  template_type: string
  custom_branding?: any
  status: string
  created_at: string
  updated_at: string
}

/**
 * Story 5.1-5.6: Carousel Editor Page
 * 
 * Full-featured carousel editor with:
 * - Slide preview and editing
 * - Template selection
 * - PDF export
 */
export default function CarouselEditorPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()

  const [carousel, setCarousel] = useState<Carousel | null>(null)
  const [slides, setSlides] = useState<SlideData[]>([])
  const [templateType, setTemplateType] = useState('minimal')
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number | null>(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'edit' | 'template'>('edit')
  const [exporting, setExporting] = useState(false)

  const template = getTemplate(templateType)

  // Fetch carousel data
  useEffect(() => {
    async function fetchCarousel() {
      try {
        const response = await fetch(`/api/suflate/carousels/${id}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Carousel not found')
          } else if (response.status === 401) {
            router.push('/login')
            return
          } else {
            throw new Error('Failed to fetch carousel')
          }
          return
        }
        const data = await response.json()
        setCarousel(data.carousel)
        setSlides(data.carousel.slide_data || [])
        setTemplateType(data.carousel.template_type || 'minimal')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load carousel')
      } finally {
        setLoading(false)
      }
    }

    fetchCarousel()
  }, [id, router])

  // Auto-save function
  const saveChanges = useCallback(async () => {
    if (!carousel) return

    setSaving(true)
    setSaveStatus('saving')

    try {
      const response = await fetch(`/api/suflate/carousels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slide_data: slides,
          template_type: templateType,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save')
      }

      setSaveStatus('saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      setSaveStatus('unsaved')
    } finally {
      setSaving(false)
    }
  }, [carousel, id, slides, templateType])

  // Handle slides change with debounced save
  const handleSlidesChange = (newSlides: SlideData[]) => {
    setSlides(newSlides)
    setSaveStatus('unsaved')
  }

  // Handle template change
  const handleTemplateChange = (newTemplate: string) => {
    setTemplateType(newTemplate)
    setSaveStatus('unsaved')
  }

  // Export as PDF
  const handleExportPDF = async () => {
    setExporting(true)
    try {
      // Save first
      await saveChanges()

      const response = await fetch(`/api/suflate/carousels/${id}/export`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to export PDF')
      }

      // Get the PDF blob from the response
      const blob = await response.blob()
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      let fileName = 'carousel.pdf'
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) {
          fileName = match[1]
        }
      }

      // Create download link and trigger download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export PDF')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  if (error && !carousel) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layout className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error === 'Carousel not found' ? 'Carousel not found' : 'Error loading carousel'}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/drafts')}>Back to Drafts</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/drafts')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {carousel?.title || 'Untitled Carousel'}
              </h1>
              <p className="text-sm text-gray-500">{slides.length} slides</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Save status */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mr-2">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Saved</span>
                </>
              )}
              {saveStatus === 'unsaved' && (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Unsaved</span>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={saveChanges}
              disabled={saving || saveStatus === 'saved'}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>

            <Button
              size="sm"
              onClick={handleExportPDF}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export PDF
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'edit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('edit')}
          >
            <Layout className="w-4 h-4 mr-2" />
            Edit Slides
          </Button>
          <Button
            variant={activeTab === 'template' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('template')}
          >
            <Palette className="w-4 h-4 mr-2" />
            Template
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left panel - Editor or Template selector */}
          <Card className="p-6">
            {activeTab === 'edit' ? (
              <SlideEditor
                slides={slides}
                selectedSlideIndex={selectedSlideIndex}
                onSlidesChange={handleSlidesChange}
                onSelectSlide={setSelectedSlideIndex}
              />
            ) : (
              <TemplateSelector
                selectedTemplate={templateType}
                onSelect={handleTemplateChange}
              />
            )}
          </Card>

          {/* Right panel - Preview */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Preview</h3>
            
            {/* Main preview */}
            <div className="flex justify-center mb-6">
              {selectedSlideIndex !== null && slides[selectedSlideIndex] ? (
                <SlidePreview
                  slide={slides[selectedSlideIndex]}
                  template={template}
                  size="large"
                />
              ) : slides.length > 0 ? (
                <SlidePreview
                  slide={slides[0]}
                  template={template}
                  size="large"
                />
              ) : (
                <div className="w-96 h-96 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                  No slides yet
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {slides.map((slide, index) => (
                <SlidePreview
                  key={index}
                  slide={slide}
                  template={template}
                  size="small"
                  isSelected={selectedSlideIndex === index}
                  onClick={() => setSelectedSlideIndex(index)}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
