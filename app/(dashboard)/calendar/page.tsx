'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TimeSlotSettingsModal, TimeSlot } from '@/components/features/scheduler/time-slot-settings-modal'
import { Button } from '@/components/ui/button'
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
  Plus,
  X,
  Settings,
  MoreHorizontal,
  FileText,
  PenLine,
} from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { formatDistanceToNow, format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from 'date-fns'

interface ScheduledPost {
  id: string
  post_id: string | null
  carousel_id: string | null
  content_type: 'post' | 'carousel'
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
  } | null
  carousels: {
    id: string
    title: string
    slide_data: any[]
    template_type: string
    status: string
    slide_count: number
  } | null
}

type ViewType = 'week' | 'month'

/**
 * Story 4.4: View Content Calendar
 * Supergrow-style design with week view
 */
export default function CalendarPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState<ViewType>('week')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null)
  // Timezone and time slots state for schedule settings modal
  const [timezone, setTimezone] = useState('Africa/Johannesburg')
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { time: '09:00 AM', days: [true, true, true, true, true, true, true] },
  ])
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false)
  const [activeSlotMenu, setActiveSlotMenu] = useState<string | null>(null)

  // Get week boundaries
  const getWeekBoundaries = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 0 })
    const end = addDays(start, 6)
    end.setHours(23, 59, 59, 999)
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    }
  }

  // Get month boundaries
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
      const boundaries = viewType === 'week' 
        ? getWeekBoundaries(currentDate)
        : getMonthBoundaries(currentDate)
      
      const params = new URLSearchParams({
        startDate: boundaries.startDate,
        endDate: boundaries.endDate,
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
  }, [authLoading, currentDate, viewType, router])

  useEffect(() => {
    fetchScheduledPosts()
  }, [fetchScheduledPosts])

  const navigatePeriod = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      if (viewType === 'week') {
        return direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1)
      } else {
        const newDate = new Date(prev)
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
        return newDate
      }
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Generate week days
  const generateWeekDays = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
    const days: Array<{ date: Date; posts: ScheduledPost[] }> = []
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i)
      const dateStr = formatLocalDate(date)
      const postsOnDay = scheduledPosts.filter(p => {
        const postDate = new Date(p.scheduled_for)
        return formatLocalDate(postDate) === dateStr
      })
      days.push({ date, posts: postsOnDay })
    }
    
    return days
  }

  // Generate month calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay()
    const totalDays = lastDay.getDate()
    
    const days: Array<{ date: Date | null; posts: ScheduledPost[] }> = []
    
    for (let i = 0; i < startPadding; i++) {
      days.push({ date: null, posts: [] })
    }
    
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day)
      const dateStr = formatLocalDate(date)
      const postsOnDay = scheduledPosts.filter(p => {
        const postDate = new Date(p.scheduled_for)
        return formatLocalDate(postDate) === dateStr
      })
      days.push({ date, posts: postsOnDay })
    }
    
    return days
  }

  const getPostStatusColor = (post: ScheduledPost) => {
    if (post.error_message) return 'bg-red-500'
    if (post.posted) return 'bg-green-500'
    return 'bg-orange-500'
  }

  const getPostStatusLabel = (post: ScheduledPost) => {
    if (post.error_message) return 'Failed'
    if (post.posted) return 'Published'
    return 'Scheduled'
  }

  const handleCancelSchedule = async (contentId: string | null, contentType: 'post' | 'carousel' = 'post') => {
    if (!contentId) return
    if (!confirm(`Are you sure you want to cancel this scheduled ${contentType}?`)) return

    try {
      const endpoint = contentType === 'carousel'
        ? `/api/suflate/carousels/${contentId}/schedule`
        : `/api/suflate/posts/${contentId}/schedule`
        
      const response = await fetch(endpoint, { method: 'DELETE' })

      if (!response.ok) {
        throw new Error(`Failed to cancel scheduled ${contentType}`)
      }

      fetchScheduledPosts()
      setSelectedPost(null)
      setSelectedDate(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel')
    }
  }

  const getPostsForSelectedDate = () => {
    if (!selectedDate) return []
    const dateStr = formatLocalDate(selectedDate)
    return scheduledPosts.filter(p => {
      const postDate = new Date(p.scheduled_for)
      return formatLocalDate(postDate) === dateStr
    })
  }

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Get week number
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  const weekDays = generateWeekDays()
  const calendarDays = generateCalendarDays()
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  // Use timeSlots state for week view

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-500 mt-1">
            Manage your content calendar from here.
          </p>
        </div>
        <Button
          variant="outline"
          className="border-gray-200 hover:border-gray-300 text-gray-700"
          onClick={() => setShowTimeSlotModal(true)}
        >
          <Settings className="w-4 h-4 mr-2" />
          Time Slot Settings
        </Button>
        <TimeSlotSettingsModal
          open={showTimeSlotModal}
          onClose={() => setShowTimeSlotModal(false)}
          timezone={timezone}
          setTimezone={setTimezone}
          timeSlots={timeSlots}
          setTimeSlots={setTimeSlots}
        />
      </div>

      {/* Calendar Navigation - Supergrow style */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <span className="text-gray-400 text-sm">
            Week {getWeekNumber(currentDate)} • {timezone.replace('_', '/')}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Navigation arrows */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            <button 
              onClick={() => navigatePeriod('prev')}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button 
              onClick={() => navigatePeriod('next')}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          {/* Today button */}
          <Button 
            variant="outline" 
            onClick={goToToday}
            className="border-gray-200 hover:border-gray-300 text-gray-700 font-medium"
          >
            Today
          </Button>
          
          {/* View toggle */}
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewType('week')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewType === 'week' 
                  ? 'bg-orange-50 text-orange-600 border border-orange-200' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Week
            </button>
            <button
              onClick={() => setViewType('month')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewType === 'month' 
                  ? 'bg-orange-50 text-orange-600 border border-orange-200' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-600">
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : viewType === 'week' ? (
        /* Week View - Supergrow style */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {weekDays.map((day, index) => {
              const isToday = isSameDay(day.date, new Date())
              return (
                <div key={index} className="text-center py-4 border-r border-gray-100 last:border-r-0">
                  <div className="text-xs font-medium text-gray-500 mb-1">
                    {dayNames[index]}
                  </div>
                  <div className={`text-sm font-semibold ${
                    isToday 
                      ? 'w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto' 
                      : 'text-gray-900'
                  }`}>
                    {day.date.getDate()}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Time slots */}
          {timeSlots.map((slot, timeIndex) => (
            <div key={timeIndex} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
              {weekDays.map((day, dayIndex) => {
                // Only show time if slot.days[dayIndex] is true
                if (!slot.days[dayIndex]) {
                  return <div key={dayIndex} className="min-h-[200px] p-3 border-r border-gray-100 last:border-r-0" />
                }
                const postsAtTime = day.posts
                const slotId = `${timeIndex}-${dayIndex}`
                const isMenuOpen = activeSlotMenu === slotId
                return (
                  <div 
                    key={dayIndex} 
                    className="min-h-[200px] p-3 border-r border-gray-100 last:border-r-0 hover:bg-gray-50/50 transition-colors relative"
                  >
                    {/* Time label */}
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                      <span>{slot.time}</span>
                      <div className="relative">
                        <button 
                          onClick={() => setActiveSlotMenu(isMenuOpen ? null : slotId)}
                          className="hover:bg-gray-100 rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                          aria-label="Open slot menu"
                        >
                          <MoreHorizontal className="w-5 h-5 text-gray-400" />
                        </button>
                        {/* Dropdown menu */}
                        {isMenuOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setActiveSlotMenu(null)}
                            />
                            <div
                              className={`absolute ${dayIndex === 6 ? 'right-0' : 'left-0'} top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-md z-50 py-1 overflow-hidden`}
                              style={{ boxShadow: '0 4px 16px 0 rgba(16,24,40,0.08)' }}
                            >
                              <Link
                                href="/drafts"
                                onClick={() => setActiveSlotMenu(null)}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors font-normal"
                              >
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span>Pick a saved post</span>
                              </Link>
                              <Link
                                href="/editor"
                                onClick={() => setActiveSlotMenu(null)}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors font-normal"
                              >
                                <PenLine className="w-4 h-4 text-gray-400" />
                                <span>Write new post</span>
                              </Link>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Posts or Empty state */}
                    {postsAtTime.length > 0 ? (
                      <div className="space-y-2">
                        {postsAtTime.map(post => (
                          <button
                            key={post.id}
                            onClick={() => {
                              setSelectedDate(day.date)
                              setSelectedPost(post)
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs text-white ${
                              getPostStatusColor(post)
                            } hover:opacity-90 transition-opacity shadow-sm`}
                          >
                            <div className="font-medium truncate">
                              {post.content_type === 'carousel' 
                                ? post.carousels?.title || 'Carousel'
                                : post.posts?.content?.slice(0, 50) || 'Post'
                              }
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-20 text-xs text-gray-400">
                        Empty
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      ) : (
        /* Month View */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-3">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const isToday = day.date && 
                day.date.toDateString() === new Date().toDateString()
              const isSelected = day.date && selectedDate &&
                day.date.toDateString() === selectedDate.toDateString()
              
              return (
                <button
                  key={index}
                  onClick={() => day.date && setSelectedDate(day.date)}
                  disabled={!day.date}
                  className={`min-h-[100px] p-2 border-b border-r border-gray-100 text-left transition-all ${
                    day.date ? 'bg-white hover:bg-orange-50/50 cursor-pointer' : 'bg-gray-50/50 cursor-default'
                  } ${isToday ? 'ring-2 ring-inset ring-orange-500' : ''} ${isSelected ? 'bg-orange-50' : ''}`}
                >
                  {day.date && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${
                        isToday ? 'w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs' : 'text-gray-700'
                      }`}>
                        {day.date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {day.posts.slice(0, 2).map(post => (
                          <div
                            key={post.id}
                            className={`w-full px-1.5 py-0.5 rounded text-xs text-white truncate ${
                              getPostStatusColor(post)
                            }`}
                          >
                            {format(new Date(post.scheduled_for), 'HH:mm')}
                          </div>
                        ))}
                        {day.posts.length > 2 && (
                          <div className="text-xs text-orange-600 font-medium">
                            +{day.posts.length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-gray-600">Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600">Published</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-600">Failed</span>
        </div>
      </div>

      {/* Date Posts List Modal */}
      {selectedDate && !selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedDate(null)}
          />
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {formatDateDisplay(selectedDate)}
                </h3>
                <p className="text-sm text-gray-500">
                  {getPostsForSelectedDate().length} item{getPostsForSelectedDate().length !== 1 ? 's' : ''} scheduled
                </p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {getPostsForSelectedDate().length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="w-8 h-8 text-orange-500" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">No posts scheduled</h4>
                  <p className="text-gray-500 mb-6">Start by scheduling a post for this date</p>
                  <Link href="/drafts">
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Schedule Post
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {getPostsForSelectedDate().map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedPost(item)}
                      className="w-full text-left p-4 bg-gray-50 hover:bg-orange-50 rounded-xl transition-colors border border-gray-200 hover:border-orange-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${getPostStatusColor(item)}`} />
                          <span className="text-sm font-medium text-gray-900">{getPostStatusLabel(item)}</span>
                          {item.content_type === 'carousel' && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              Carousel
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {format(new Date(item.scheduled_for), 'HH:mm')}
                        </div>
                      </div>
                      {item.content_type === 'carousel' && item.carousels ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.carousels.title || 'Untitled Carousel'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {item.carousels.slide_count || item.carousels.slide_data?.length || 0} slides
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {item.posts?.content?.slice(0, 150)}
                            {(item.posts?.content?.length || 0) > 150 && '...'}
                          </p>
                          {item.posts?.tags && item.posts.tags.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {item.posts.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setSelectedPost(null)
              if (!selectedDate) setSelectedDate(null)
            }}
          />
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-xl">
            <div className="p-6 border-b border-gray-200">
              {selectedDate && (
                <button
                  onClick={() => setSelectedPost(null)}
                  className="text-sm text-orange-600 hover:text-orange-700 mb-3 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to list
                </button>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getPostStatusColor(selectedPost)}`} />
                  <span className="font-semibold text-gray-900">{getPostStatusLabel(selectedPost)}</span>
                  {selectedPost.content_type === 'carousel' && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      Carousel
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedPost(null)
                    setSelectedDate(null)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                <Clock className="w-4 h-4" />
                {format(new Date(selectedPost.scheduled_for), 'PPpp')}
              </div>
            </div>

            <div className="p-6">
              {/* Content preview */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4 max-h-[200px] overflow-y-auto">
                {selectedPost.content_type === 'carousel' && selectedPost.carousels ? (
                  <div>
                    <p className="font-medium text-gray-900 mb-1">
                      {selectedPost.carousels.title || 'Untitled Carousel'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedPost.carousels.slide_count || selectedPost.carousels.slide_data?.length || 0} slides
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedPost.posts?.content?.slice(0, 500)}
                    {(selectedPost.posts?.content?.length || 0) > 500 && '...'}
                  </p>
                )}
              </div>

              {/* Error message */}
              {selectedPost.error_message && (
                <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  <strong>Error:</strong> {selectedPost.error_message}
                </div>
              )}

              {/* Status info */}
              <div className="text-sm text-gray-500 mb-6">
                {selectedPost.posted ? (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Published {selectedPost.posted_at && formatDistanceToNow(new Date(selectedPost.posted_at), { addSuffix: true })}
                  </div>
                ) : selectedPost.notification_sent ? (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-orange-600" />
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
              <div className="flex gap-3">
                <Link 
                  href={selectedPost.content_type === 'carousel' 
                    ? `/carousel/${selectedPost.carousel_id}` 
                    : `/editor/${selectedPost.post_id}`
                  } 
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full border-gray-200 hover:border-orange-300">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit {selectedPost.content_type === 'carousel' ? 'Carousel' : 'Post'}
                  </Button>
                </Link>
                {!selectedPost.posted && (
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => handleCancelSchedule(
                      selectedPost.content_type === 'carousel' 
                        ? selectedPost.carousel_id 
                        : selectedPost.post_id,
                      selectedPost.content_type
                    )}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
                {(selectedPost.posts?.status === 'published' || selectedPost.carousels?.status === 'published') && (
                  <a 
                    href="#" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
