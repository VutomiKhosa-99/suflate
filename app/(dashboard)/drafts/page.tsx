'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DraftCard, DraftFiltersComponent, type Draft, type DraftFilters } from '@/components/features/drafts'
import { DeleteDialog } from '@/components/features/drafts/delete-dialog'
import { Mic, FileText, Loader2, AlertCircle, Plus } from 'lucide-react'
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
  
  // Filters state
  const [filters, setFilters] = useState<DraftFilters>({
    search: '',
    sourceType: null,
    variationType: null,
    tags: [],
  })

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  
  // New draft creation state
  const [creatingDraft, setCreatingDraft] = useState(false)

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

  // Story 3.9: Create Draft Manually
  const createNewDraft = async () => {
    setCreatingDraft(true)
    try {
      const response = await fetch('/api/suflate/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '',
          title: '',
          variationType: 'professional',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create draft')
      }

      const data = await response.json()
      
      // Redirect to editor with the new draft
      router.push(`/editor/${data.post.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create draft')
      setCreatingDraft(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Drafts</h1>
          <p className="text-gray-600 mt-1">
            {totalCount} draft{totalCount !== 1 ? 's' : ''} in your workspace
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Story 3.9: Create Draft Manually */}
          <Button
            variant="outline"
            onClick={createNewDraft}
            disabled={creatingDraft}
          >
            {creatingDraft ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            New Draft
          </Button>
          <Link href="/record">
            <Button>
              <Mic className="w-4 h-4 mr-2" />
              New Recording
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters (Story 3.5) */}
      <div className="mb-6">
        <DraftFiltersComponent
          filters={filters}
          availableTags={availableTags}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-4/5" />
                <div className="h-4 bg-gray-200 rounded w-3/5" />
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-5 w-16 bg-gray-200 rounded" />
                <div className="h-5 w-16 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        // Error state - show this instead of empty state when there's an error
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Unable to load drafts
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Something went wrong while fetching your drafts. Please try again.
          </p>
          <Button onClick={fetchDrafts}>
            Try Again
          </Button>
        </div>
      ) : drafts.length === 0 ? (
        // Empty state - only show when there's no error
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filters.search || filters.sourceType || filters.variationType || filters.tags.length > 0
              ? 'No drafts match your filters'
              : 'No drafts yet'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {filters.search || filters.sourceType || filters.variationType || filters.tags.length > 0
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Record your first voice note and let Suflate turn it into polished LinkedIn content.'}
          </p>
          {(filters.search || filters.sourceType || filters.variationType || filters.tags.length > 0) ? (
            <Button
              variant="outline"
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
            <Link href="/record">
              <Button>
                <Mic className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            </Link>
          )}
        </div>
      ) : (
        // Drafts grid
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
