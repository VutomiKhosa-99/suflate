'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  X, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  GripVertical,
  FileText,
  Lightbulb,
  Type,
  AlignLeft,
  Sparkles
} from 'lucide-react'

interface SlideData {
  slide_number: number
  title: string
  body: string
  key_point: string
}

interface SlideEditorProps {
  slides: SlideData[]
  selectedSlideIndex: number | null
  onSlidesChange: (slides: SlideData[]) => void
  onSelectSlide: (index: number | null) => void
}

/**
 * Story 5.4: Slide Editor Component
 * Story 5.5: Add or Remove Slides
 * 
 * Allows editing slide content and managing slide order
 */
export function SlideEditor({
  slides,
  selectedSlideIndex,
  onSlidesChange,
  onSelectSlide,
}: SlideEditorProps) {
  const selectedSlide = selectedSlideIndex !== null ? slides[selectedSlideIndex] : null
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleSlideUpdate = (field: keyof SlideData, value: string) => {
    if (selectedSlideIndex === null) return

    const updatedSlides = [...slides]
    updatedSlides[selectedSlideIndex] = {
      ...updatedSlides[selectedSlideIndex],
      [field]: value,
    }
    onSlidesChange(updatedSlides)
  }

  const handleAddSlide = () => {
    const newSlide: SlideData = {
      slide_number: slides.length + 1,
      title: '',
      body: '',
      key_point: '',
    }
    const updatedSlides = [...slides, newSlide]
    onSlidesChange(updatedSlides)
    onSelectSlide(updatedSlides.length - 1)
  }

  const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) return // Keep at least one slide

    const updatedSlides = slides
      .filter((_, i) => i !== index)
      .map((slide, i) => ({ ...slide, slide_number: i + 1 }))

    onSlidesChange(updatedSlides)

    // Adjust selection
    if (selectedSlideIndex === index) {
      onSelectSlide(index > 0 ? index - 1 : 0)
    } else if (selectedSlideIndex !== null && selectedSlideIndex > index) {
      onSelectSlide(selectedSlideIndex - 1)
    }
  }

  const handleMoveSlide = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
    if (toIndex < 0 || toIndex >= slides.length) return

    const updatedSlides = [...slides]
    const [moved] = updatedSlides.splice(fromIndex, 1)
    updatedSlides.splice(toIndex, 0, moved)

    // Renumber slides
    const renumbered = updatedSlides.map((slide, i) => ({
      ...slide,
      slide_number: i + 1,
    }))

    onSlidesChange(renumbered)

    // Update selection to follow the moved slide
    if (selectedSlideIndex === fromIndex) {
      onSelectSlide(toIndex)
    } else if (selectedSlideIndex === toIndex) {
      onSelectSlide(fromIndex)
    }
  }

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const updatedSlides = [...slides]
      const [moved] = updatedSlides.splice(draggedIndex, 1)
      updatedSlides.splice(dragOverIndex, 0, moved)

      const renumbered = updatedSlides.map((slide, i) => ({
        ...slide,
        slide_number: i + 1,
      }))

      onSlidesChange(renumbered)

      if (selectedSlideIndex === draggedIndex) {
        onSelectSlide(dragOverIndex)
      }
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Calculate completion percentage for a slide
  const getSlideCompletion = (slide: SlideData) => {
    let filled = 0
    if (slide.title.trim()) filled++
    if (slide.body.trim()) filled++
    if (slide.key_point.trim()) filled++
    return Math.round((filled / 3) * 100)
  }

  return (
    <div className="flex gap-6 h-full min-h-[500px]">
      {/* Slide list */}
      <div className="w-56 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Slides</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddSlide}
            className="h-8 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>

        <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
          {slides.map((slide, index) => {
            const completion = getSlideCompletion(slide)
            const isSelected = selectedSlideIndex === index
            const isDragging = draggedIndex === index
            const isDragOver = dragOverIndex === index && draggedIndex !== index

            return (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`group relative rounded-xl cursor-pointer transition-all duration-200 ${
                  isDragging ? 'opacity-50 scale-95' : ''
                } ${isDragOver ? 'ring-2 ring-blue-400 ring-offset-2' : ''} ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
                onClick={() => onSelectSlide(index)}
              >
                {/* Drag handle */}
                <div className={`absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing ${
                  isSelected ? 'text-white/60 hover:text-white' : 'text-gray-300 hover:text-gray-500'
                }`}>
                  <GripVertical className="w-4 h-4" />
                </div>

                <div className="pl-5 pr-2 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className={`text-[10px] font-medium uppercase tracking-wide mb-0.5 ${
                        isSelected ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        Slide {slide.slide_number}
                      </div>
                      <div className={`text-sm font-medium truncate ${
                        isSelected ? 'text-white' : 'text-gray-900'
                      }`}>
                        {slide.title || 'Untitled slide'}
                      </div>
                      
                      {/* Progress indicator */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`flex-1 h-1 rounded-full overflow-hidden ${
                          isSelected ? 'bg-white/20' : 'bg-gray-100'
                        }`}>
                          <div 
                            className={`h-full rounded-full transition-all ${
                              isSelected 
                                ? 'bg-white' 
                                : completion === 100 
                                  ? 'bg-green-500' 
                                  : 'bg-blue-500'
                            }`}
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                        <span className={`text-[10px] ${
                          isSelected ? 'text-blue-100' : 'text-gray-400'
                        }`}>
                          {completion}%
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className={`flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                      isSelected ? '' : ''
                    }`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveSlide(index, 'up')
                        }}
                        disabled={index === 0}
                        className={`p-0.5 rounded transition-colors disabled:opacity-20 ${
                          isSelected 
                            ? 'text-white/60 hover:text-white hover:bg-white/10' 
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveSlide(index, 'down')
                        }}
                        disabled={index === slides.length - 1}
                        className={`p-0.5 rounded transition-colors disabled:opacity-20 ${
                          isSelected 
                            ? 'text-white/60 hover:text-white hover:bg-white/10' 
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Delete button - appears on hover */}
                {slides.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteSlide(index)
                    }}
                    className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 ${
                      isSelected 
                        ? 'bg-red-500 text-white shadow-lg' 
                        : 'bg-red-100 text-red-600 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )
          })}

          {/* Add slide card */}
          <button
            onClick={handleAddSlide}
            className="w-full p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
          >
            <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-blue-500">
              <Plus className="w-5 h-5" />
              <span className="text-xs font-medium">Add Slide</span>
            </div>
          </button>
        </div>
      </div>

      {/* Slide detail editor */}
      <div className="flex-1 min-w-0">
        {selectedSlide ? (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200">
                  {selectedSlide.slide_number}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Edit Slide {selectedSlide.slide_number}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {getSlideCompletion(selectedSlide)}% complete
                  </p>
                </div>
              </div>
              <button
                onClick={() => onSelectSlide(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title field */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Type className="w-4 h-4 text-blue-500" />
                Title
                <span className="ml-auto text-xs font-normal text-gray-400">
                  {selectedSlide.title.length} / 60
                </span>
              </label>
              <Input
                value={selectedSlide.title}
                onChange={(e) => handleSlideUpdate('title', e.target.value)}
                placeholder="Enter a compelling title..."
                maxLength={60}
                className="text-lg font-semibold h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Body field */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <AlignLeft className="w-4 h-4 text-green-500" />
                Body Text
                <span className="ml-auto text-xs font-normal text-gray-400">
                  {selectedSlide.body.length} / 300
                </span>
              </label>
              <textarea
                value={selectedSlide.body}
                onChange={(e) => handleSlideUpdate('body', e.target.value)}
                placeholder="Write your main content here. Keep it concise and impactful..."
                rows={5}
                maxLength={300}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-shadow"
              />
            </div>

            {/* Key point field */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Key Point / Insight
                <span className="ml-auto text-xs font-normal text-gray-400">
                  {selectedSlide.key_point.length} / 100
                </span>
              </label>
              <Input
                value={selectedSlide.key_point}
                onChange={(e) => handleSlideUpdate('key_point', e.target.value)}
                placeholder="The main takeaway readers should remember..."
                maxLength={100}
                className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="flex items-center gap-1.5 text-xs text-gray-500">
                <Sparkles className="w-3 h-3" />
                This will be highlighted at the bottom of your slide
              </p>
            </div>

            {/* Quick tips */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Pro Tips for Great Carousels
              </h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Keep titles short and punchy (5-7 words max)</li>
                <li>• Use one key idea per slide</li>
                <li>• End with a clear call-to-action</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Select a slide to edit</h3>
            <p className="text-sm text-gray-500 max-w-[200px]">
              Click on any slide from the list to start editing its content
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
