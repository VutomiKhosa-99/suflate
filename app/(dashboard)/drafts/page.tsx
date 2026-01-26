'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DraftCard, DraftFiltersComponent, type Draft, type DraftFilters } from '@/components/features/drafts'
import { DeleteDialog } from '@/components/features/drafts/delete-dialog'
import { Mic, FileText, Loader2, AlertCircle, Plus, Search, Filter, Grid, List } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'

interface DraftsResponse {
  drafts: Draft[]
  count: number
  page: number
  limit: number
  totalPages: number
  filters: {
    availableTags: string[]
    sourceTypes: string[]
    variationTypes: string[]
  }
}

/**
 * Story 3.1: View All Drafts in Workspace
 * Story 3.2: See Draft Source (Voice Amplification)
 * Story 3.5: Search and Filter Drafts
 * Story 3.7: View Draft Creation Date
 */
export default function DraftsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Filters state
  const [filters, setFilters] = useState<DraftFilters>({
    search: '',
    sourceType: null,
    variationType: null,
    tags: [],
  })

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 300)
    return () => clearTimeout(timer)
  }, [filters.search])

  const fetchDrafts = useCallback(async () => {
    if (authLoading) return
    
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        status: 'draft',
      })

      if (debouncedSearch) {
        params.append('search', debouncedSearch)
      }
      if (filters.sourceType) {
        params.append('sourceType', filters.sourceType)
      }
      if (filters.variationType) {
        params.append('variationType', filters.variationType)
      }
      if (filters.tags.length > 0) {
        params.append('tags', filters.tags.join(','))
      }

      const response = await fetch(`/api/suflate/drafts?${params.toString()}`)
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch drafts')
      }

      const data: DraftsResponse = await response.json()
      setDrafts(data.drafts)
      setTotalCount(data.count)
      setTotalPages(data.totalPages)
      setAvailableTags(data.filters?.availableTags || [])
      setError(null) // Clear any previous error on success
    } catch (err) {
      console.error('Failed to fetch drafts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load drafts')
    } finally {
      setLoading(false)
    }
  }, [authLoading, currentPage, debouncedSearch, filters.sourceType, filters.variationType, filters.tags, router])

  useEffect(() => {
    fetchDrafts()
  }, [fetchDrafts])

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/suflate/posts/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete draft')
      }

      // Remove from local state
      setDrafts((prev) => prev.filter((d) => d.id !== id))
      setTotalCount((prev) => prev - 1)
      setDeleteTarget(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete draft')
    }
  }

  const handleTagClick = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      setFilters((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }))
    }
  }

  // Story 3.8: Move Drafts Between Workspaces
  const handleMove = async (draftId: string, targetWorkspaceId: string) => {
    const response = await fetch(`/api/suflate/posts/${draftId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetWorkspaceId }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to move draft')
    }

    // Remove from current list since it's now in a different workspace
    setDrafts((prev) => prev.filter((d) => d.id !== draftId))
    setTotalCount((prev) => prev - 1)
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Supergrow-style Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drafts</h1>
          <p className="text-gray-500 mt-1">
            {totalCount} draft{totalCount !== 1 ? 's' : ''} waiting to be published
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/editor">
            <Button variant="outline" className="border-gray-200 hover:border-orange-300 hover:bg-orange-50">
              <Plus className="w-4 h-4 mr-2" />
              New Draft
            </Button>
          </Link>
          <Link href="/record">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Mic className="w-4 h-4 mr-2" />
              Voice to Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Supergrow-style Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search drafts..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
              />
            </div>
            <DraftFiltersComponent
              filters={filters}
              availableTags={availableTags}
              onFiltersChange={setFilters}
            />
          </div>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-4/5" />
                <div className="h-4 bg-gray-200 rounded w-3/5" />
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        // Error state - Supergrow style
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to load drafts
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Something went wrong while fetching your drafts. Please try again.
          </p>
          <Button onClick={fetchDrafts} className="bg-orange-500 hover:bg-orange-600 text-white">
            Try Again
          </Button>
        </div>
      ) : drafts.length === 0 ? (
        // Empty state - Supergrow style
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-orange-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {filters.search || filters.sourceType || filters.variationType || filters.tags.length > 0
              ? 'No drafts match your filters'
              : 'No drafts yet'}
          </h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            {filters.search || filters.sourceType || filters.variationType || filters.tags.length > 0
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Record your first voice note and let Suflate turn it into polished LinkedIn content.'}
          </p>
          {(filters.search || filters.sourceType || filters.variationType || filters.tags.length > 0) ? (
            <Button
              variant="outline"
              className="border-gray-200"
              onClick={() => setFilters({
                search: '',
                sourceType: null,
                variationType: null,
                tags: [],
              })}
            >
              Clear filters
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <Link href="/editor">
                <Button variant="outline" className="border-gray-200 hover:border-orange-300">
                  <Plus className="w-4 h-4 mr-2" />
                  Write a Post
                </Button>
              </Link>
              <Link href="/record">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Mic className="w-4 h-4 mr-2" />
                  Record Voice Note
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        // Drafts grid - Supergrow style
        <>
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-3"
          }>
            {drafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onDelete={(id) => setDeleteTarget(id)}
                onTagClick={handleTagClick}
                onMove={handleMove}
              />
            ))}
          </div>

          {/* Pagination - Supergrow style */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="border-gray-200"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-orange-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                {totalPages > 5 && (
                  <>
                    <span className="px-2 text-gray-400">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === totalPages
                          ? 'bg-orange-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="border-gray-200"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation dialog (Story 3.4) */}
      <DeleteDialog
        isOpen={!!deleteTarget}
        title="Delete Draft"
        message="Are you sure you want to delete this draft? This action cannot be undone."
        confirmLabel="Delete Draft"
        undoTimeout={5}
        onConfirm={async () => { if (deleteTarget) await handleDelete(deleteTarget) }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
