'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Plus, Trash2, GripVertical } from 'lucide-react'

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

  return (
    <div className="flex gap-4 h-full">
      {/* Slide list */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200 pr-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Slides</h3>
          <Button variant="outline" size="sm" onClick={handleAddSlide}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                selectedSlideIndex === index
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 border border-transparent hover:bg-gray-100'
              }`}
              onClick={() => onSelectSlide(index)}
            >
              <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMoveSlide(index, 'up')
                  }}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMoveSlide(index, 'down')
                  }}
                  disabled={index === slides.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  ▼
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500">Slide {slide.slide_number}</div>
                <div className="text-sm font-medium text-gray-900 truncate">
                  {slide.title || 'Untitled'}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteSlide(index)
                }}
                disabled={slides.length <= 1}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 disabled:opacity-30 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Slide detail editor */}
      <div className="flex-1">
        {selectedSlide ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Edit Slide {selectedSlide.slide_number}
              </h3>
              <button
                onClick={() => onSelectSlide(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <Input
                value={selectedSlide.title}
                onChange={(e) => handleSlideUpdate('title', e.target.value)}
                placeholder="Slide title..."
                className="text-lg font-semibold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body Text
              </label>
              <textarea
                value={selectedSlide.body}
                onChange={(e) => handleSlideUpdate('body', e.target.value)}
                placeholder="Main content for this slide..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key Point / Insight
              </label>
              <Input
                value={selectedSlide.key_point}
                onChange={(e) => handleSlideUpdate('key_point', e.target.value)}
                placeholder="The main takeaway from this slide..."
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be highlighted at the bottom of the slide
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>Select a slide to edit</p>
          </div>
        )}
      </div>
    </div>
  )
}
