'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Filter, X, Mic, FileText, Twitter, Tag } from 'lucide-react'

// Filter options
const SOURCE_TYPES = [
  { value: 'voice', label: 'Voice', icon: <Mic className="w-4 h-4" /> },
  { value: 'repurpose_blog', label: 'Blog', icon: <FileText className="w-4 h-4" /> },
  { value: 'repurpose_tweet', label: 'Tweet', icon: <Twitter className="w-4 h-4" /> },
]

const VARIATION_TYPES = [
  { value: 'professional', label: 'Professional', color: 'text-blue-600 bg-blue-50' },
  { value: 'personal', label: 'Personal', color: 'text-purple-600 bg-purple-50' },
  { value: 'actionable', label: 'Actionable', color: 'text-green-600 bg-green-50' },
  { value: 'discussion', label: 'Discussion', color: 'text-yellow-600 bg-yellow-50' },
  { value: 'bold', label: 'Bold', color: 'text-red-600 bg-red-50' },
]

export interface DraftFilters {
  search: string
  sourceType: string | null
  variationType: string | null
  tags: string[]
}

interface DraftFiltersProps {
  filters: DraftFilters
  availableTags: string[]
  onFiltersChange: (filters: DraftFilters) => void
}

export function DraftFiltersComponent({
  filters,
  availableTags,
  onFiltersChange,
}: DraftFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)

  const hasActiveFilters =
    filters.sourceType ||
    filters.variationType ||
    filters.tags.length > 0

  const activeFilterCount = 
    (filters.sourceType ? 1 : 0) +
    (filters.variationType ? 1 : 0) +
    filters.tags.length

  const handleSourceTypeChange = (sourceType: string | null) => {
    onFiltersChange({
      ...filters,
      sourceType: filters.sourceType === sourceType ? null : sourceType,
    })
  }

  const handleVariationTypeChange = (variationType: string | null) => {
    onFiltersChange({
      ...filters,
      variationType: filters.variationType === variationType ? null : variationType,
    })
  }

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag]
    onFiltersChange({ ...filters, tags: newTags })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: filters.search,
      sourceType: null,
      variationType: null,
      tags: [],
    })
  }

  return (
    <div className="relative">
      {/* Filter button only */}
      <Button
        variant="outline"
        onClick={() => setShowFilters(!showFilters)}
        className={`flex items-center gap-2 border-gray-200 ${hasActiveFilters ? 'border-orange-300 bg-orange-50 text-orange-600' : ''}`}
      >
        <Filter className="w-4 h-4" />
        Filters
        {hasActiveFilters && (
          <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {/* Filter dropdown panel */}
      {showFilters && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowFilters(false)}
          />
          <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-4 space-y-4 z-20">
          {/* Active filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <span className="text-sm text-gray-500">Active:</span>
              {filters.sourceType && (
                <button
                  onClick={() => handleSourceTypeChange(null)}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded-lg text-sm hover:bg-orange-100 transition-colors"
                >
                  {SOURCE_TYPES.find((s) => s.value === filters.sourceType)?.label}
                  <X className="w-3 h-3" />
                </button>
              )}
              {filters.variationType && (
                <button
                  onClick={() => handleVariationTypeChange(null)}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded-lg text-sm hover:bg-orange-100 transition-colors"
                >
                  {VARIATION_TYPES.find((v) => v.value === filters.variationType)?.label}
                  <X className="w-3 h-3" />
                </button>
              )}
              {filters.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded-lg text-sm hover:bg-orange-100 transition-colors"
                >
                  {tag}
                  <X className="w-3 h-3" />
                </button>
              ))}
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 ml-auto"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Source type filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Source</h4>
            <div className="flex flex-wrap gap-2">
              {SOURCE_TYPES.map((source) => (
                <button
                  key={source.value}
                  onClick={() => handleSourceTypeChange(source.value)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    filters.sourceType === source.value
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {source.icon}
                  {source.label}
                </button>
              ))}
            </div>
          </div>

          {/* Variation type filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Style</h4>
            <div className="flex flex-wrap gap-2">
              {VARIATION_TYPES.map((variation) => (
                <button
                  key={variation.value}
                  onClick={() => handleVariationTypeChange(variation.value)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    filters.variationType === variation.value
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : `border-gray-200 hover:border-gray-300 ${variation.color}`
                  }`}
                >
                  {variation.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags filter */}
          {availableTags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                      filters.tags.includes(tag)
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
          </div>
        </>
      )}
    </div>
  )
}
