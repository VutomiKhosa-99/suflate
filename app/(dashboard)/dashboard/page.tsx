'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { 
  Mic, 
  PenLine, 
  MessageSquare, 
  Zap, 
  X, 
  Play,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const [notification, setNotification] = useState<string | null>(null)
  const [stats] = useState({
    postsToday: 0,
    postsGoal: 0,
    commentsToday: 0,
    commentsGoal: 0,
  })
  const [trialDays] = useState(7)

  useEffect(() => {
    // Check for LinkedIn connection status
    if (searchParams?.get('linkedin') === 'connected') {
      setNotification('LinkedIn connected successfully! You can now post directly to LinkedIn.')
    }
    if (searchParams?.get('error')?.startsWith('linkedin')) {
      setNotification('Failed to connect LinkedIn. Please try again.')
    }
  }, [searchParams])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Notification */}
      {notification && (
        <div className="bg-green-50 border border-green-200 rounded-lg mb-6">
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="text-green-800 text-sm">{notification}</p>
            <button onClick={() => setNotification(null)} className="text-green-600 hover:text-green-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Trial Banner */}
      <div className="flex items-center justify-center gap-4 mb-6 py-2">
        <div className="flex items-center gap-2 text-gray-600">
          <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-amber-600 text-xs">⏰</span>
          </div>
          <span className="text-sm">Your free trial ends in just {trialDays} days</span>
        </div>
        <Link
          href="/settings/billing"
          className="flex items-center gap-2 px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Zap className="w-4 h-4" />
          Upgrade Now
        </Link>
      </div>

      {/* Hero Card - Voice Notes Feature */}
      <div className="relative bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 mb-8 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="relative flex items-center justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full mb-4">
              <span className="text-yellow-300 text-sm font-medium">New✨</span>
              <span className="text-white text-sm">Introducing Voice Notes</span>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4">
              Turn Your Voice Into Insightful LinkedIn Posts
            </h2>
            
            <p className="text-white/90 text-lg mb-6">
              Skip the writer&apos;s block. Record your thoughts and let AI transform them into compelling LinkedIn content that sounds like you.
            </p>
            
            <Link
              href="/record"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Mic className="w-5 h-5" />
              Try Voice Notes Now
            </Link>
          </div>

          {/* Microphone Illustration */}
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center">
              <div className="w-24 h-24 bg-white/30 rounded-full flex items-center justify-center">
                <Mic className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Action Items */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Action Items</h3>
        
        <div className="space-y-3">
          {/* Publish a Post */}
          <Link href="/drafts" className="block">
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <PenLine className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Publish a Post</h4>
                    <p className="text-sm text-gray-500">Join the conversation and build connections with meaningful posts.</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-gray-900 font-medium">{stats.postsToday}/{stats.postsGoal}</span>
                  <span className="text-gray-500 text-sm ml-1">posts</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Comment on Posts */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 opacity-75">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Comment on Posts</h4>
                  <p className="text-sm text-gray-500">Join the conversation and build connections with meaningful comments.</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-gray-900 font-medium">{stats.commentsToday}/{stats.commentsGoal}</span>
                <span className="text-gray-500 text-sm ml-1">comments</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Watch & Learn */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Watch & Learn</h3>
          <Link href="/tutorials" className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
            View All Tutorials
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tutorial Card 1 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all group cursor-pointer">
            <div className="aspect-video bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center relative">
              <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 text-orange-500 ml-1" />
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-1">Getting Started with Voice Notes</h4>
              <p className="text-sm text-gray-500">3 min watch</p>
            </div>
          </div>

          {/* Tutorial Card 2 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all group cursor-pointer">
            <div className="aspect-video bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center relative">
              <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 text-blue-500 ml-1" />
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-1">Create Engaging Carousels</h4>
              <p className="text-sm text-gray-500">5 min watch</p>
            </div>
          </div>

          {/* Tutorial Card 3 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all group cursor-pointer">
            <div className="aspect-video bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center relative">
              <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 text-emerald-500 ml-1" />
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-1">Schedule Posts for Maximum Reach</h4>
              <p className="text-sm text-gray-500">4 min watch</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">0</div>
          <div className="text-sm text-gray-500">Posts This Week</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">0</div>
          <div className="text-sm text-gray-500">Voice Notes</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">0</div>
          <div className="text-sm text-gray-500">Drafts Ready</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">0</div>
          <div className="text-sm text-gray-500">Scheduled</div>
        </div>
      </div>
    </div>
  )
}
