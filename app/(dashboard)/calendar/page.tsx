'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  Check,
  ExternalLink,
  Edit,
  Trash2,
} from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { formatDistanceToNow } from 'date-fns'

interface ScheduledPost {
  id: string
  post_id: string
  scheduled_for: string
  posted: boolean
  posted_at: string | null
  notification_sent: boolean
  is_company_page: boolean
  error_message: string | null
  posts: {
    id: string
    content: string
    title: string | null
    tags: string[]
    source_type: string
    variation_type: string
    status: string
  }
}

/**
 * Story 4.4: View Content Calendar
 * 
 * Calendar view showing all scheduled posts with:
 * - Month/week navigation
 * - Color-coded status (scheduled, published, failed)
 * - Post previews
 * - Click to edit/reschedule
 */
export default function CalendarPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null)

  // Calculate month boundaries for API query
  const getMonthBoundaries = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    }
  }

  const fetchScheduledPosts = useCallback(async () => {
    if (authLoading) return
    
    setLoading(true)
    setError(null)

    try {
      const { startDate, endDate } = getMonthBoundaries(currentMonth)
      const params = new URLSearchParams({
        startDate,
        endDate,
        includePosted: 'true',
      })

      const response = await fetch(`/api/suflate/scheduled-posts?${params.toString()}`)
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch scheduled posts')
      }

      const data = await response.json()
      setScheduledPosts(data.scheduledPosts || [])
    } catch (err) {
      console.error('Failed to fetch scheduled posts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }, [authLoading, currentMonth, router])

  useEffect(() => {
    fetchScheduledPosts()
  }, [fetchScheduledPosts])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  // Generate calendar days for the month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay() // 0 = Sunday
    const totalDays = lastDay.getDate()
    
    const days: Array<{ date: Date | null; posts: ScheduledPost[] }> = []
    
    // Add padding for days before month starts
    for (let i = 0; i < startPadding; i++) {
      days.push({ date: null, posts: [] })
    }
    
    // Add actual days
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day)
      const dateStr = date.toISOString().split('T')[0]
      const postsOnDay = scheduledPosts.filter(p => 
        new Date(p.scheduled_for).toISOString().split('T')[0] === dateStr
      )
      days.push({ date, posts: postsOnDay })
    }
    
    return days
  }

  const getPostStatusColor = (post: ScheduledPost) => {
    if (post.error_message) return 'bg-red-500' // Failed
    if (post.posted) return 'bg-green-500' // Published
    return 'bg-blue-500' // Scheduled
  }

  const getPostStatusLabel = (post: ScheduledPost) => {
    if (post.error_message) return 'Failed'
    if (post.posted) return 'Published'
    return 'Scheduled'
  }

  const handleCancelSchedule = async (postId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled post?')) return

    try {
      const response = await fetch(`/api/suflate/posts/${postId}/schedule`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to cancel scheduled post')
      }

      // Refresh the calendar
      fetchScheduledPosts()
      setSelectedPost(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel')
    }
  }

  const calendarDays = generateCalendarDays()
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
          <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
          <p className="text-gray-600 mt-1">
            Manage your scheduled posts
          </p>
        </div>
        <Link href="/drafts">
          <Button>
            <CalendarIcon className="w-4 h-4 mr-2" />
            Schedule a Post
          </Button>
        </Link>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Published</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Failed</span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <Card className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const isToday = day.date && 
                day.date.toDateString() === new Date().toDateString()
              
              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border border-gray-100 rounded-lg ${
                    day.date ? 'bg-white' : 'bg-gray-50'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {day.date && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${
                        isToday ? 'text-blue-600' : 'text-gray-700'
                      }`}>
                        {day.date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {day.posts.slice(0, 3).map(post => (
                          <button
                            key={post.id}
                            onClick={() => setSelectedPost(post)}
                            className={`w-full text-left px-2 py-1 rounded text-xs text-white truncate ${
                              getPostStatusColor(post)
                            } hover:opacity-80 transition-opacity`}
                            title={post.posts?.content?.slice(0, 100)}
                          >
                            {new Date(post.scheduled_for).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </button>
                        ))}
                        {day.posts.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{day.posts.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedPost(null)}
          />
          <Card className="relative z-10 w-full max-w-lg mx-4 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-3 h-3 rounded-full ${getPostStatusColor(selectedPost)}`} />
                  <span className="text-sm font-medium">{getPostStatusLabel(selectedPost)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  {new Date(selectedPost.scheduled_for).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Post content preview */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-[200px] overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {selectedPost.posts?.content?.slice(0, 500)}
                {(selectedPost.posts?.content?.length || 0) > 500 && '...'}
              </p>
            </div>

            {/* Error message */}
            {selectedPost.error_message && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                <strong>Error:</strong> {selectedPost.error_message}
              </div>
            )}

            {/* Status info */}
            <div className="text-sm text-gray-500 mb-4">
              {selectedPost.posted ? (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  Published {selectedPost.posted_at && formatDistanceToNow(new Date(selectedPost.posted_at), { addSuffix: true })}
                </div>
              ) : selectedPost.notification_sent ? (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600" />
                  Notification sent
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {selectedPost.is_company_page ? 'Will auto-post' : 'Will send reminder'}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Link href={`/editor/${selectedPost.post_id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Post
                </Button>
              </Link>
              {!selectedPost.posted && (
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleCancelSchedule(selectedPost.post_id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              )}
              {selectedPost.posts?.status === 'published' && (
                <Button variant="outline" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View
                  </a>
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
