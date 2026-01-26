'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Copy,
  Trash2,
  Image as ImageIcon,
  Type,
  Settings2,
  Save,
  Loader2,
  GripVertical,
  X
} from 'lucide-react'

export interface Slide {
  id: string
  title: string
  description: string
  image?: string
}

export interface BrandKit {
  name: string
  handle: string
  profilePic: string
  backgroundColor: string
  primaryColor: string
  secondaryColor: string
  primaryFont: string
  secondaryFont: string
  backgroundType: 'solid' | 'image'
  backgroundImage?: string
}

const DEFAULT_BRAND_KIT: BrandKit = {
  name: 'Jon Snow',
  handle: '@jon-snow',
  profilePic: '',
  backgroundColor: '#37474F',
  primaryColor: '#1ACD8A',
  secondaryColor: '#FFFFFF',
  primaryFont: 'Inter',
  secondaryFont: 'Inter',
  backgroundType: 'solid',
}

const COLOR_PRESETS = [
  '#1ACD8A', '#00BCD4', '#FFC107', '#FF5722', 
  '#4CAF50', '#2196F3', '#E91E63', '#9C27B0'
]

const FONT_OPTIONS = [
  'Inter',
  'Instrument Serif',
  'Instrument Sans',
  'Playfair Display',
  'Roboto',
  'Open Sans',
  'Montserrat',
  'Poppins',
]

interface SupergrowCarouselEditorProps {
  initialSlides?: Slide[]
  initialBrandKit?: BrandKit
  carouselId?: string
  carouselName?: string
  onSave?: (slides: Slide[], brandKit: BrandKit) => Promise<void>
  onContinue?: () => void
}

export function SupergrowCarouselEditor({
  initialSlides,
  initialBrandKit,
  carouselId,
  carouselName: initialName = 'Untitled Carousel',
  onSave,
  onContinue,
}: SupergrowCarouselEditorProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [carouselName, setCarouselName] = useState(initialName)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [slides, setSlides] = useState<Slide[]>(initialSlides || [
    { id: '1', title: 'HOW TO WRITE HOOKS THAT DON\'T SUCK', description: '' },
    { id: '2', title: 'KEEP IT SHORT', description: 'Your hook should fit on one line and get a point across quickly.' },
    { id: '3', title: 'USE POWER WORDS', description: 'Words like "secret", "proven", "instant" grab attention.' },
    { id: '4', title: 'CREATE CURIOSITY', description: 'Make people want to know more. Tease the value inside.' },
    { id: '5', title: 'FOLLOW FOR MORE', description: 'Like and share if you found this helpful!' },
  ])
  
  const [currentSlide, setCurrentSlide] = useState(0)
  const [brandKit, setBrandKit] = useState<BrandKit>(initialBrandKit || DEFAULT_BRAND_KIT)
  const [draggedSlide, setDraggedSlide] = useState<number | null>(null)

  const handleSlideChange = (field: keyof Slide, value: string) => {
    setSlides(prev => prev.map((slide, i) => 
      i === currentSlide ? { ...slide, [field]: value } : slide
    ))
  }

  const addSlide = () => {
    const newSlide: Slide = {
      id: Date.now().toString(),
      title: 'NEW SLIDE',
      description: 'Add your content here.',
    }
    setSlides(prev => [...prev.slice(0, currentSlide + 1), newSlide, ...prev.slice(currentSlide + 1)])
    setCurrentSlide(currentSlide + 1)
  }

  const duplicateSlide = () => {
    const slideToDuplicate = slides[currentSlide]
    const newSlide: Slide = {
      ...slideToDuplicate,
      id: Date.now().toString(),
    }
    setSlides(prev => [...prev.slice(0, currentSlide + 1), newSlide, ...prev.slice(currentSlide + 1)])
    setCurrentSlide(currentSlide + 1)
  }

  const deleteSlide = () => {
    if (slides.length <= 1) return
    setSlides(prev => prev.filter((_, i) => i !== currentSlide))
    setCurrentSlide(Math.max(0, currentSlide - 1))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        handleSlideChange('image', imageUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setBrandKit(prev => ({ ...prev, profilePic: event.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (onSave) {
        await onSave(slides, brandKit)
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      setLastSaved(new Date())
    } catch (e) {
      console.error('Failed to save:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleContinue = () => {
    if (onContinue) {
      onContinue()
    } else if (carouselId) {
      router.push(`/carousel/${carouselId}/export`)
    }
  }

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedSlide(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedSlide === null || draggedSlide === index) return
    
    const newSlides = [...slides]
    const draggedItem = newSlides[draggedSlide]
    newSlides.splice(draggedSlide, 1)
    newSlides.splice(index, 0, draggedItem)
    setSlides(newSlides)
    setDraggedSlide(index)
    if (currentSlide === draggedSlide) {
      setCurrentSlide(index)
    }
  }

  const handleDragEnd = () => {
    setDraggedSlide(null)
  }

  const currentSlideData = slides[currentSlide]

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-emerald-500 rounded" />
            </div>
            <div>
              <input
                type="text"
                value={carouselName}
                onChange={(e) => setCarouselName(e.target.value)}
                className="font-semibold text-gray-900 bg-transparent border-none outline-none"
              />
              <p className="text-xs text-gray-500">
                {lastSaved 
                  ? `Last saved on ${lastSaved.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${lastSaved.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                  : 'Not saved yet'
                }
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
          <button
            onClick={handleContinue}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            Continue
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Brand Kit */}
        <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="p-4 space-y-6">
            {/* Brand Kit Section */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Brand Kit</h3>
              <p className="text-xs text-gray-500 mb-4">
                Select brand kit to get your brand details automatically applied to the carousel.
              </p>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-3 relative">
                  <svg viewBox="0 0 64 64" className="w-full h-full text-blue-200">
                    <rect x="8" y="16" width="48" height="40" rx="4" fill="currentColor"/>
                    <rect x="12" y="20" width="16" height="12" rx="2" fill="white" fillOpacity="0.5"/>
                    <rect x="32" y="20" width="20" height="4" rx="1" fill="white" fillOpacity="0.5"/>
                    <rect x="32" y="28" width="16" height="4" rx="1" fill="white" fillOpacity="0.5"/>
                  </svg>
                </div>
                <p className="text-sm text-gray-500 mb-3">No brand kit found</p>
                <button className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" />
                  Create Brand Kit
                </button>
              </div>
            </div>

            {/* Your Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
              <input
                type="text"
                value={brandKit.name}
                onChange={(e) => setBrandKit(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Profile Pic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Pic</label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-emerald-300 transition-all">
                    {brandKit.profilePic ? (
                      <img src={brandKit.profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-emerald-600 font-medium">{brandKit.name.charAt(0)}</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicUpload}
                    className="hidden"
                  />
                </label>
                {brandKit.profilePic && (
                  <button 
                    onClick={() => setBrandKit(prev => ({ ...prev, profilePic: '' }))}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Handle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Handle</label>
              <input
                type="text"
                value={brandKit.handle}
                onChange={(e) => setBrandKit(prev => ({ ...prev, handle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Background */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Background</label>
              <div className="flex bg-gray-100 rounded-lg p-1 mb-3">
                <button
                  onClick={() => setBrandKit(prev => ({ ...prev, backgroundType: 'solid' }))}
                  className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
                    brandKit.backgroundType === 'solid' ? 'bg-white shadow-sm font-medium' : 'text-gray-600'
                  }`}
                >
                  Solid
                </button>
                <button
                  onClick={() => setBrandKit(prev => ({ ...prev, backgroundType: 'image' }))}
                  className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
                    brandKit.backgroundType === 'image' ? 'bg-white shadow-sm font-medium' : 'text-gray-600'
                  }`}
                >
                  Image
                </button>
              </div>
              
              {brandKit.backgroundType === 'solid' && (
                <>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setBrandKit(prev => ({ ...prev, backgroundColor: color }))}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          brandKit.backgroundColor === color ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={brandKit.backgroundColor}
                      onChange={(e) => setBrandKit(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      type="color"
                      value={brandKit.backgroundColor}
                      onChange={(e) => setBrandKit(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                  </div>
                </>
              )}

              {brandKit.backgroundType === 'image' && (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                  <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Drop an image or click to upload</p>
                </div>
              )}
            </div>

            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={brandKit.primaryColor}
                  onChange={(e) => setBrandKit(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="color"
                  value={brandKit.primaryColor}
                  onChange={(e) => setBrandKit(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={brandKit.secondaryColor}
                  onChange={(e) => setBrandKit(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="color"
                  value={brandKit.secondaryColor}
                  onChange={(e) => setBrandKit(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                />
              </div>
            </div>

            {/* Primary Font */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Font</label>
              <select
                value={brandKit.primaryFont}
                onChange={(e) => setBrandKit(prev => ({ ...prev, primaryFont: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>

            {/* Secondary Font */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Font</label>
              <select
                value={brandKit.secondaryFont}
                onChange={(e) => setBrandKit(prev => ({ ...prev, secondaryFont: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Center - Slide Editor */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-xl mx-auto">
              {/* Slide Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Slide {currentSlide + 1}</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={addSlide}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Add slide"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={duplicateSlide}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Duplicate slide"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={deleteSlide}
                    disabled={slides.length <= 1}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete slide"
                  >
                    <Trash2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={currentSlideData.title}
                    onChange={(e) => handleSlideChange('title', e.target.value)}
                    placeholder="Enter slide title..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                  <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Settings2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Description Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <div className="flex items-start gap-2">
                  <textarea
                    value={currentSlideData.description}
                    onChange={(e) => handleSlideChange('description', e.target.value)}
                    placeholder="Enter slide description..."
                    rows={4}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-gray-900"
                  />
                  <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Settings2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image <span className="font-normal text-gray-400">(Recommended size 400 x 500)</span>
                </label>
                <div className="flex items-center gap-3">
                  {currentSlideData.image ? (
                    <>
                      <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden">
                        <img src={currentSlideData.image} alt="Slide" className="w-full h-full object-cover" />
                      </div>
                      <button 
                        onClick={() => handleSlideChange('image', '')}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        ref={fileInputRef}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Elements Section - Drag and Drop */}
              <div className="mt-8">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Elements</h4>
                <div className="grid grid-cols-2 gap-3">
                  <label className="cursor-pointer">
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-colors">
                      <ImageIcon className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Add Image</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <button className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-colors">
                    <Type className="w-6 h-6 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Add Textbox</span>
                  </button>
                </div>
              </div>

              {/* Slide Thumbnails - Drag and Drop */}
              <div className="mt-8">
                <h4 className="text-sm font-medium text-gray-700 mb-3">All Slides</h4>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {slides.map((slide, index) => (
                    <div
                      key={slide.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setCurrentSlide(index)}
                      className={`flex-shrink-0 w-20 cursor-pointer transition-all ${
                        draggedSlide === index ? 'opacity-50' : ''
                      }`}
                    >
                      <div 
                        className={`aspect-[4/5] rounded-lg border-2 overflow-hidden relative ${
                          currentSlide === index 
                            ? 'border-orange-500 shadow-md' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: brandKit.backgroundColor }}
                      >
                        <div className="absolute inset-0 p-2 flex flex-col justify-center">
                          <p 
                            className="text-[6px] font-bold leading-tight truncate"
                            style={{ color: brandKit.secondaryColor }}
                          >
                            {slide.title}
                          </p>
                        </div>
                        <div className="absolute top-1 left-1 cursor-grab">
                          <GripVertical className="w-3 h-3 text-white/50" />
                        </div>
                      </div>
                      <p className="text-xs text-center text-gray-500 mt-1">{index + 1}</p>
                    </div>
                  ))}
                  <button
                    onClick={addSlide}
                    className="flex-shrink-0 w-20 aspect-[4/5] rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-orange-400 hover:bg-orange-50 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Slide Navigation */}
          <div className="border-t border-gray-200 bg-white px-6 py-4 flex items-center justify-center gap-4 flex-shrink-0">
            <button
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-sm text-gray-600 min-w-[100px] text-center">
              Slides {currentSlide + 1} / {slides.length}
            </span>
            <button
              onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
              disabled={currentSlide === slides.length - 1}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="w-[400px] bg-gray-100 border-l border-gray-200 flex flex-col flex-shrink-0">
          <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
            {/* Carousel Preview */}
            <div 
              className="w-full max-w-[320px] aspect-[4/5] rounded-xl overflow-hidden shadow-2xl relative"
              style={{ backgroundColor: brandKit.backgroundColor }}
            >
              {/* Profile Header */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-white/20"
                    style={{ backgroundColor: brandKit.primaryColor + '40' }}
                  >
                    {brandKit.profilePic ? (
                      <img src={brandKit.profilePic} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span style={{ color: brandKit.primaryColor }} className="text-sm font-bold">
                        {brandKit.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span style={{ color: brandKit.secondaryColor }} className="text-sm font-medium">
                    {brandKit.name}
                  </span>
                </div>
                <span style={{ color: brandKit.secondaryColor + '80' }} className="text-xs">
                  {currentSlide + 1}/{slides.length}
                </span>
              </div>

              {/* Slide Image */}
              {currentSlideData.image && (
                <div className="absolute inset-0">
                  <img 
                    src={currentSlideData.image} 
                    alt="" 
                    className="w-full h-full object-cover opacity-30"
                  />
                </div>
              )}

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-center px-6 pt-16 pb-8">
                <h2 
                  className="text-xl font-bold leading-tight mb-3"
                  style={{ 
                    color: brandKit.secondaryColor,
                    fontFamily: brandKit.primaryFont 
                  }}
                >
                  {currentSlideData.title}
                </h2>
                {currentSlideData.description && (
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ 
                      color: brandKit.secondaryColor + 'CC',
                      fontFamily: brandKit.secondaryFont 
                    }}
                  >
                    {currentSlideData.description}
                  </p>
                )}
              </div>

              {/* Bottom Bar */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-2"
                style={{ backgroundColor: brandKit.primaryColor }}
              />

              {/* Slide indicator dots */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1">
                {slides.map((_, index) => (
                  <div 
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === currentSlide ? 'w-4' : ''
                    }`}
                    style={{ 
                      backgroundColor: index === currentSlide 
                        ? brandKit.primaryColor 
                        : brandKit.secondaryColor + '40'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Preview Navigation */}
          <div className="border-t border-gray-200 bg-white px-6 py-4 flex items-center justify-center gap-4 flex-shrink-0">
            <button
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-sm text-gray-600 min-w-[100px] text-center">
              Slides {currentSlide + 1} / {slides.length}
            </span>
            <button
              onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
              disabled={currentSlide === slides.length - 1}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupergrowCarouselEditor
