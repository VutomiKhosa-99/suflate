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
  Calendar,
  X,
  Linkedin,
  Copy,
  Plus,
  ChevronLeft,
  ChevronRight,
  Type,
  AlignLeft,
  Lightbulb,
  Sparkles,
  FileText,
  Send,
  ExternalLink,
  CheckCircle,
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
  const id = params?.id as string
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
  
  // Scheduling state (Story 5.7)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('09:00')
  const [scheduling, setScheduling] = useState(false)
  const [existingSchedule, setExistingSchedule] = useState<any>(null)
  
  // Post to LinkedIn state
  const [posting, setPosting] = useState(false)
  const [showPostModal, setShowPostModal] = useState(false)
  const [postCaption, setPostCaption] = useState('')
  const [downloadedFileName, setDownloadedFileName] = useState('')
  const [captionCopied, setCaptionCopied] = useState(false)
  const [linkedInConnected, setLinkedInConnected] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishSuccess, setPublishSuccess] = useState<{ postUrl: string } | null>(null)

  const template = getTemplate(templateType)

  // Fetch carousel data and check LinkedIn status
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
        
        // Also fetch existing schedule
        const scheduleResponse = await fetch(`/api/suflate/carousels/${id}/schedule`)
        if (scheduleResponse.ok) {
          const scheduleData = await scheduleResponse.json()
          if (scheduleData.scheduled && scheduleData.schedule) {
            setExistingSchedule(scheduleData.schedule)
            // Pre-fill the date/time inputs
            const scheduledDate = new Date(scheduleData.schedule.scheduled_for)
            setScheduleDate(scheduledDate.toISOString().split('T')[0])
            setScheduleTime(scheduledDate.toTimeString().slice(0, 5))
          }
        }

        // Check LinkedIn connection status
        const linkedInResponse = await fetch('/api/linkedin/status')
        if (linkedInResponse.ok) {
          const linkedInData = await linkedInResponse.json()
          setLinkedInConnected(linkedInData.connected)
        }
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

  // Story 5.7: Schedule carousel
  const handleSchedule = async () => {
    if (!scheduleDate || !scheduleTime) {
      setError('Please select a date and time')
      return
    }

    setScheduling(true)
    try {
      // Save changes first
      await saveChanges()

      const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}:00`)
      
      const response = await fetch(`/api/suflate/carousels/${id}/schedule`, {
        method: existingSchedule ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledFor: scheduledFor.toISOString(),
          notificationMethod: 'email',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to schedule')
      }

      const data = await response.json()
      setExistingSchedule(data.schedule || data.scheduledPost)
      setShowScheduleModal(false)
      
      // Update carousel status
      if (carousel) {
        setCarousel({ ...carousel, status: 'scheduled' })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule')
    } finally {
      setScheduling(false)
    }
  }

  // Cancel schedule
  const handleCancelSchedule = async () => {
    if (!confirm('Are you sure you want to cancel this scheduled post?')) return

    setScheduling(true)
    try {
      const response = await fetch(`/api/suflate/carousels/${id}/schedule`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to cancel schedule')
      }

      setExistingSchedule(null)
      setShowScheduleModal(false)
      
      // Update carousel status
      if (carousel) {
        setCarousel({ ...carousel, status: 'ready' })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel schedule')
    } finally {
      setScheduling(false)
    }
  }

  // Format local date for input min value
  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
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

  // Post to LinkedIn (downloads PDF + copies caption + shows modal)
  const handlePostToLinkedIn = async () => {
    setPosting(true)
    try {
      // Save first
      await saveChanges()

      // Generate a caption from the slides
      const caption = slides.length > 0 
        ? `${slides[0].title || 'Check out my carousel!'}\n\n${slides[0].body || ''}\n\n👉 Swipe through for more insights!`
        : 'Check out my new carousel post! 👇'

      // Export and download the PDF
      const response = await fetch(`/api/suflate/carousels/${id}/export`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to export PDF')
      }

      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition')
      let fileName = 'carousel.pdf'
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) {
          fileName = match[1]
        }
      }

      // Download the PDF
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Store caption and filename for modal
      setPostCaption(caption)
      setDownloadedFileName(fileName)
      
      // Show the modal with instructions
      setShowPostModal(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to prepare post')
    } finally {
      setPosting(false)
    }
  }

  // Publish directly to LinkedIn
  const handlePublishToLinkedIn = async () => {
    if (!linkedInConnected) {
      // Redirect to settings to connect LinkedIn
      router.push('/settings?tab=integrations')
      return
    }

    setPublishing(true)
    setPublishSuccess(null)
    try {
      // Save first
      await saveChanges()

      // Generate caption
      const caption = slides.length > 0 
        ? `${slides[0].title || 'Check out my carousel!'}\n\n${slides[0].body || ''}\n\n👉 Swipe through for more insights!`
        : 'Check out my new carousel post! 👇'

      const response = await fetch(`/api/suflate/carousels/${id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caption,
          title: carousel?.title || 'My Carousel',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401 || data.error?.includes('reconnect')) {
          setError('LinkedIn connection expired. Please reconnect in Settings.')
          return
        }
        throw new Error(data.error || 'Failed to publish')
      }

      setPublishSuccess({ postUrl: data.postUrl })
      
      // Update carousel status
      if (carousel) {
        setCarousel({ ...carousel, status: 'published' })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish to LinkedIn')
    } finally {
      setPublishing(false)
    }
  }

  // Copy caption to clipboard
  const handleCopyCaption = async () => {
    await navigator.clipboard.writeText(postCaption)
    setCaptionCopied(true)
    setTimeout(() => setCaptionCopied(false), 2000)
  }

  // Open LinkedIn
  const handleOpenLinkedIn = () => {
    window.open('https://www.linkedin.com/feed/', '_blank')
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
          <Button onClick={() => router.push('/carousels')}>Back to Carousels</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="max-w-[1800px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left - Back & Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/carousels')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <input
                  type="text"
                  value={carousel?.title || ''}
                  onChange={(e) => setCarousel(carousel ? { ...carousel, title: e.target.value } : null)}
                  className="text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                  placeholder="Untitled Carousel"
                />
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{slides.length} slides</span>
                  <span>•</span>
                  {saveStatus === 'saving' && (
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Saving...
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="flex items-center gap-1 text-green-600">
                      <Check className="w-3 h-3" />
                      Saved
                    </span>
                  )}
                  {saveStatus === 'unsaved' && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Clock className="w-3 h-3" />
                      Unsaved changes
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={exporting}
                className="gap-2"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export PDF
              </Button>
              
              {/* Direct Publish to LinkedIn */}
              <Button
                size="sm"
                onClick={handlePublishToLinkedIn}
                disabled={publishing || exporting || carousel?.status === 'published'}
                className="gap-2 bg-[#0077B5] hover:bg-[#006097]"
              >
                {publishing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : carousel?.status === 'published' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : linkedInConnected ? (
                  <Send className="w-4 h-4" />
                ) : (
                  <Linkedin className="w-4 h-4" />
                )}
                {publishing 
                  ? 'Publishing...' 
                  : carousel?.status === 'published' 
                    ? 'Published' 
                    : linkedInConnected 
                      ? 'Publish to LinkedIn' 
                      : 'Connect LinkedIn'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowScheduleModal(true)}
                className={`gap-2 ${existingSchedule ? 'bg-green-50 border-green-200 text-green-700' : ''}`}
              >
                <Calendar className="w-4 h-4" />
                {existingSchedule ? 'Scheduled' : 'Schedule'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="max-w-[1800px] mx-auto px-4 py-6">
        <div className="flex gap-6 h-[calc(100vh-140px)]">
          
          {/* Left Sidebar - Slide Thumbnails */}
          <div className="w-48 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 h-full overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Slides</h3>
                <button
                  onClick={() => {
                    const newSlide: SlideData = {
                      slide_number: slides.length + 1,
                      title: '',
                      body: '',
                      key_point: '',
                    }
                    handleSlidesChange([...slides, newSlide])
                    setSelectedSlideIndex(slides.length)
                  }}
                  className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                  title="Add slide"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {slides.map((slide, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedSlideIndex(index)}
                    className={`relative group cursor-pointer rounded-xl overflow-hidden transition-all ${
                      selectedSlideIndex === index
                        ? 'ring-2 ring-blue-500 ring-offset-2'
                        : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'
                    }`}
                  >
                    {/* Mini preview */}
                    <div
                      className="aspect-square p-3"
                      style={{
                        backgroundColor: template.colors.background,
                        backgroundImage: template.layout.backgroundPattern === 'gradient' 
                          ? `linear-gradient(135deg, ${template.colors.background} 0%, ${template.colors.secondary}20 100%)`
                          : undefined,
                      }}
                    >
                      <div className="text-[8px] text-gray-400 mb-0.5">{slide.slide_number}</div>
                      <div 
                        className="text-[9px] font-semibold line-clamp-2 mb-1"
                        style={{ color: template.colors.primary }}
                      >
                        {slide.title || 'Untitled'}
                      </div>
                      <div 
                        className="text-[7px] line-clamp-2"
                        style={{ color: template.colors.text }}
                      >
                        {slide.body}
                      </div>
                    </div>
                    
                    {/* Delete button */}
                    {slides.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const updatedSlides = slides
                            .filter((_, i) => i !== index)
                            .map((s, i) => ({ ...s, slide_number: i + 1 }))
                          handleSlidesChange(updatedSlides)
                          if (selectedSlideIndex === index) {
                            setSelectedSlideIndex(Math.max(0, index - 1))
                          } else if (selectedSlideIndex !== null && selectedSlideIndex > index) {
                            setSelectedSlideIndex(selectedSlideIndex - 1)
                          }
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    
                    {/* Slide number badge */}
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[9px] rounded font-medium">
                      {index + 1}
                    </div>
                  </div>
                ))}
                
                {/* Add slide button */}
                <button
                  onClick={() => {
                    const newSlide: SlideData = {
                      slide_number: slides.length + 1,
                      title: '',
                      body: '',
                      key_point: '',
                    }
                    handleSlidesChange([...slides, newSlide])
                    setSelectedSlideIndex(slides.length)
                  }}
                  className="w-full aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-blue-500"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-[10px] font-medium">Add Slide</span>
                </button>
              </div>
            </div>
          </div>

          {/* Center - Live Preview */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 w-full max-w-xl">
              {selectedSlideIndex !== null && slides[selectedSlideIndex] ? (
                <div
                  className="aspect-square rounded-xl overflow-hidden shadow-inner"
                  style={{
                    backgroundColor: template.colors.background,
                    backgroundImage: template.layout.backgroundPattern === 'gradient' 
                      ? `linear-gradient(135deg, ${template.colors.background} 0%, ${template.colors.secondary}20 100%)`
                      : template.layout.backgroundPattern === 'dots'
                        ? `radial-gradient(circle, ${template.colors.secondary}20 1px, transparent 1px)`
                        : undefined,
                    backgroundSize: template.layout.backgroundPattern === 'dots' ? '20px 20px' : undefined,
                  }}
                >
                  <div className="h-full flex flex-col p-8">
                    {/* Slide number */}
                    <div
                      className="text-sm mb-2"
                      style={{ color: template.colors.secondary, fontFamily: template.fonts.body }}
                    >
                      {slides[selectedSlideIndex].slide_number}
                    </div>

                    {/* Title */}
                    <h2
                      className="text-3xl font-bold mb-4 leading-tight"
                      style={{ color: template.colors.primary, fontFamily: template.fonts.title }}
                    >
                      {slides[selectedSlideIndex].title || 'Add a title...'}
                    </h2>

                    {/* Body */}
                    <p
                      className="text-base flex-1 leading-relaxed"
                      style={{ color: template.colors.text, fontFamily: template.fonts.body }}
                    >
                      {slides[selectedSlideIndex].body || 'Add your content here...'}
                    </p>

                    {/* Key point */}
                    {slides[selectedSlideIndex].key_point && (
                      <div
                        className="mt-auto pt-4"
                        style={{
                          color: template.colors.accent,
                          fontFamily: template.fonts.keyPoint,
                          borderTop: `1px solid ${template.colors.accent}30`,
                        }}
                      >
                        <div className="text-sm font-medium">
                          💡 {slides[selectedSlideIndex].key_point}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="aspect-square rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                  Select a slide to preview
                </div>
              )}
            </div>
            
            {/* Slide navigation */}
            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={() => setSelectedSlideIndex(prev => prev !== null ? Math.max(0, prev - 1) : 0)}
                disabled={selectedSlideIndex === 0}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600 font-medium">
                {(selectedSlideIndex ?? 0) + 1} / {slides.length}
              </span>
              <button
                onClick={() => setSelectedSlideIndex(prev => prev !== null ? Math.min(slides.length - 1, prev + 1) : 0)}
                disabled={selectedSlideIndex === slides.length - 1}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right Sidebar - Editor Panel */}
          <div className="w-96 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full overflow-hidden flex flex-col">
              {/* Tabs */}
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'edit'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Layout className="w-4 h-4 inline mr-2" />
                  Edit Content
                </button>
                <button
                  onClick={() => setActiveTab('template')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'template'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Palette className="w-4 h-4 inline mr-2" />
                  Style
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5">
                {activeTab === 'edit' ? (
                  selectedSlideIndex !== null && slides[selectedSlideIndex] ? (
                    <div className="space-y-5">
                      {/* Slide indicator */}
                      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                          {slides[selectedSlideIndex].slide_number}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Slide {slides[selectedSlideIndex].slide_number}</h3>
                          <p className="text-xs text-gray-500">Edit content below</p>
                        </div>
                      </div>

                      {/* Title */}
                      <div className="space-y-2">
                        <label className="flex items-center justify-between text-sm font-medium text-gray-700">
                          <span className="flex items-center gap-2">
                            <Type className="w-4 h-4 text-blue-500" />
                            Title
                          </span>
                          <span className="text-xs font-normal text-gray-400">
                            {slides[selectedSlideIndex].title.length}/60
                          </span>
                        </label>
                        <input
                          type="text"
                          value={slides[selectedSlideIndex].title}
                          onChange={(e) => {
                            const updated = [...slides]
                            updated[selectedSlideIndex] = { ...updated[selectedSlideIndex], title: e.target.value }
                            handleSlidesChange(updated)
                          }}
                          maxLength={60}
                          placeholder="Enter a compelling title..."
                          className="w-full px-4 py-3 text-base font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                        />
                      </div>

                      {/* Body */}
                      <div className="space-y-2">
                        <label className="flex items-center justify-between text-sm font-medium text-gray-700">
                          <span className="flex items-center gap-2">
                            <AlignLeft className="w-4 h-4 text-green-500" />
                            Content
                          </span>
                          <span className="text-xs font-normal text-gray-400">
                            {slides[selectedSlideIndex].body.length}/300
                          </span>
                        </label>
                        <textarea
                          value={slides[selectedSlideIndex].body}
                          onChange={(e) => {
                            const updated = [...slides]
                            updated[selectedSlideIndex] = { ...updated[selectedSlideIndex], body: e.target.value }
                            handleSlidesChange(updated)
                          }}
                          maxLength={300}
                          rows={5}
                          placeholder="Write your main content here..."
                          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
                        />
                      </div>

                      {/* Key Point */}
                      <div className="space-y-2">
                        <label className="flex items-center justify-between text-sm font-medium text-gray-700">
                          <span className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-500" />
                            Key Insight
                          </span>
                          <span className="text-xs font-normal text-gray-400">
                            {slides[selectedSlideIndex].key_point.length}/100
                          </span>
                        </label>
                        <input
                          type="text"
                          value={slides[selectedSlideIndex].key_point}
                          onChange={(e) => {
                            const updated = [...slides]
                            updated[selectedSlideIndex] = { ...updated[selectedSlideIndex], key_point: e.target.value }
                            handleSlidesChange(updated)
                          }}
                          maxLength={100}
                          placeholder="The main takeaway..."
                          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                        />
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Highlighted at the bottom of your slide
                        </p>
                      </div>

                      {/* Tips */}
                      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Pro Tips
                        </h4>
                        <ul className="text-xs text-blue-700 space-y-1">
                          <li>• Keep titles short and punchy</li>
                          <li>• One key idea per slide</li>
                          <li>• End with a clear CTA</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <FileText className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 text-sm">Select a slide to edit</p>
                    </div>
                  )
                ) : (
                  <TemplateSelector
                    selectedTemplate={templateType}
                    onSelect={handleTemplateChange}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="fixed bottom-4 right-4 max-w-md p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 shadow-lg">
          {error}
          <button 
            onClick={() => setError(null)}
            className="absolute top-2 right-2 text-red-400 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Schedule Modal (Story 5.7) */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {existingSchedule ? 'Update Schedule' : 'Schedule Carousel'}
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {existingSchedule && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  Currently scheduled for:{' '}
                  <strong>
                    {new Date(existingSchedule.scheduled_for).toLocaleString()}
                  </strong>
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={formatLocalDate(new Date())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="text-xs text-gray-500">
                You&apos;ll receive an email notification when it&apos;s time to post your carousel to LinkedIn.
              </div>

              <div className="flex gap-2 pt-2">
                {existingSchedule && (
                  <Button
                    variant="outline"
                    onClick={handleCancelSchedule}
                    disabled={scheduling}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Cancel Schedule
                  </Button>
                )}
                <Button
                  onClick={handleSchedule}
                  disabled={scheduling || !scheduleDate || !scheduleTime}
                  className="flex-1"
                >
                  {scheduling ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Calendar className="w-4 h-4 mr-2" />
                  )}
                  {existingSchedule ? 'Update Schedule' : 'Schedule'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Post to LinkedIn Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg p-0 overflow-hidden">
            {/* Header */}
            <div className="bg-[#0077B5] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Ready to Post!</h3>
                  <p className="text-white/80 text-sm">Your carousel PDF has been downloaded</p>
                </div>
              </div>
              <button
                onClick={() => setShowPostModal(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Caption Section */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Suggested Caption
                </label>
                <div className="relative">
                  <textarea
                    value={postCaption}
                    onChange={(e) => setPostCaption(e.target.value)}
                    className="w-full h-28 p-3 pr-12 text-sm border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-[#0077B5] focus:border-transparent"
                  />
                  <button
                    onClick={handleCopyCaption}
                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-[#0077B5] hover:bg-blue-50 rounded-md transition-colors"
                    title="Copy caption"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Steps */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#0077B5] text-white rounded-full text-xs flex items-center justify-center">?</span>
                  How to post on LinkedIn
                </h4>
                <ol className="space-y-2.5 text-sm text-gray-600">
                  <li className="flex gap-3">
                    <span className="w-5 h-5 bg-gray-200 rounded-full text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    <span>Click <strong>&quot;Start a post&quot;</strong> on LinkedIn</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 bg-gray-200 rounded-full text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                    <span>Click the <strong>document icon 📄</strong> to upload</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 bg-gray-200 rounded-full text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                    <span>Select <strong className="text-[#0077B5]">{downloadedFileName}</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 bg-gray-200 rounded-full text-xs flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                    <span>Add a title and paste your caption</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 bg-gray-200 rounded-full text-xs flex items-center justify-center flex-shrink-0 mt-0.5">5</span>
                    <span>Hit <strong>&quot;Post&quot;</strong> and watch the engagement! 🚀</span>
                  </li>
                </ol>
              </div>

              {/* Tip */}
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <span className="text-lg">💡</span>
                <p className="text-sm text-amber-800">
                  <strong>Pro tip:</strong> LinkedIn carousels get 3x more engagement than regular posts!
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleCopyCaption}
                  className={`flex-1 ${captionCopied ? 'bg-green-50 border-green-300 text-green-700' : ''}`}
                >
                  {captionCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Caption
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleOpenLinkedIn}
                  className="flex-1 bg-[#0077B5] hover:bg-[#006097]"
                >
                  <Linkedin className="w-4 h-4 mr-2" />
                  Open LinkedIn
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Publish Success Modal */}
      {publishSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-0 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Published! 🎉</h3>
              <p className="text-white/90">Your carousel is now live on LinkedIn</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Post URL */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Your post is live at:</p>
                <a
                  href={publishSuccess.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0077B5] hover:underline font-medium flex items-center gap-2 break-all"
                >
                  {publishSuccess.postUrl}
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                </a>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Boost your engagement
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Reply to comments within the first hour</li>
                  <li>• Share with your network via DMs</li>
                  <li>• Engage with others&apos; posts to increase visibility</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setPublishSuccess(null)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => window.open(publishSuccess.postUrl, '_blank')}
                  className="flex-1 bg-[#0077B5] hover:bg-[#006097]"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Post
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
