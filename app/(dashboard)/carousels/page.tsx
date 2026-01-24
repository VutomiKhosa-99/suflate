'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Layout,
  Loader2,
  FileText,
  Calendar,
  Download,
  Edit,
  Trash2,
  MoreVertical,
  Plus,
} from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { formatDistanceToNow } from 'date-fns'

interface Carousel {
  id: string
  title: string
  slide_data: any[]
  template_type: string
  status: string
  pdf_path: string | null
  created_at: string
  updated_at: string
}

/**
 * Carousels List Page
 * Shows all carousels created by the user
 */
export default function CarouselsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [carousels, setCarousels] = useState<Carousel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCarousels() {
      if (authLoading) return

      try {
        const response = await fetch('/api/suflate/amplify/carousel')
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch carousels')
        }

        const data = await response.json()
        setCarousels(data.carousels || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load carousels')
      } finally {
        setLoading(false)
      }
    }

    fetchCarousels()
  }, [authLoading, router])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this carousel?')) return

    try {
      const response = await fetch(`/api/suflate/carousels/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete carousel')
      }

      setCarousels((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      ready: 'bg-green-100 text-green-700',
      scheduled: 'bg-blue-100 text-blue-700',
      published: 'bg-purple-100 text-purple-700',
    }
    return styles[status] || styles.draft
  }

  if (authLoading || loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">My Carousels</h1>
          <p className="text-gray-600 mt-1">
            {carousels.length} carousel{carousels.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/record">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create from Recording
          </Button>
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Empty state */}
      {carousels.length === 0 && !error ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layout className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No carousels yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first carousel by recording a voice note and selecting "Create Carousel" from the transcription.
          </p>
          <Link href="/record">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          </Link>
        </Card>
      ) : (
        /* Carousels grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {carousels.map((carousel) => (
            <Card key={carousel.id} className="p-4 hover:shadow-md transition-shadow">
              {/* Preview */}
              <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                {carousel.slide_data && carousel.slide_data.length > 0 ? (
                  <div className="h-full p-4 flex flex-col">
                    <div className="text-xs text-gray-500 mb-2">
                      {carousel.slide_data.length} slides
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2">
                      {carousel.slide_data[0]?.title || 'Untitled'}
                    </h3>
                    <p className="text-xs text-gray-600 mt-2 line-clamp-3">
                      {carousel.slide_data[0]?.body}
                    </p>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <Layout className="w-12 h-12" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {carousel.title || 'Untitled Carousel'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(carousel.created_at), { addSuffix: true })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(carousel.status)}`}>
                  {carousel.status}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link href={`/carousel/${carousel.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </Link>
                {carousel.pdf_path && (
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(carousel.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
