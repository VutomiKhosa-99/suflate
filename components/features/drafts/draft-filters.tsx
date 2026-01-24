'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Filter, X, Mic, FileText, Twitter, Tag } from 'lucide-react'

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, search: e.target.value })
  }

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
    <div className="space-y-4">
      {/* Search and filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search drafts..."
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
        <Button
          variant={showFilters || hasActiveFilters ? 'default' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="w-5 h-5 rounded-full bg-white text-blue-600 text-xs flex items-center justify-center">
              {(filters.sourceType ? 1 : 0) +
                (filters.variationType ? 1 : 0) +
                filters.tags.length}
            </span>
          )}
        </Button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          {/* Active filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <span className="text-sm text-gray-500">Active filters:</span>
              {filters.sourceType && (
                <button
                  onClick={() => handleSourceTypeChange(null)}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100"
                >
                  {SOURCE_TYPES.find((s) => s.value === filters.sourceType)?.label}
                  <X className="w-3 h-3" />
                </button>
              )}
              {filters.variationType && (
                <button
                  onClick={() => handleVariationTypeChange(null)}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100"
                >
                  {VARIATION_TYPES.find((v) => v.value === filters.variationType)?.label}
                  <X className="w-3 h-3" />
                </button>
              )}
              {filters.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100"
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
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
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
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
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
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
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
      )}
    </div>
  )
}
