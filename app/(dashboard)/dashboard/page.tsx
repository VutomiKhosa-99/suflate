'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Mic, FileText, Calendar, Settings, X } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const [notification, setNotification] = useState<string | null>(null)

  useEffect(() => {
    // Check for LinkedIn connection status
    if (searchParams.get('linkedin') === 'connected') {
      setNotification('LinkedIn connected successfully! You can now post directly to LinkedIn.')
    }
    if (searchParams.get('error')?.startsWith('linkedin')) {
      setNotification('Failed to connect LinkedIn. Please try again.')
    }
  }, [searchParams])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
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

      {/* Main Content */}
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome{user?.user_metadata?.name ? `, ${user.user_metadata.name}` : ''}!
          </h1>
          <p className="text-gray-600 mt-2">
            Ready to create your next LinkedIn post?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/record" className="block">
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Mic className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Record New</h3>
              <p className="text-sm text-gray-600 mt-1">
                Capture your thoughts with voice
              </p>
            </div>
          </Link>

          <Link href="/drafts" className="block">
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">My Drafts</h3>
              <p className="text-sm text-gray-600 mt-1">
                View and edit your drafts
              </p>
            </div>
          </Link>

          <div className="bg-white p-6 rounded-xl border border-gray-200 opacity-60 cursor-not-allowed">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900">Scheduled</h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage scheduled posts
            </p>
          </div>

          <Link href="/settings" className="block">
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Settings</h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage your account
              </p>
            </div>
          </Link>
        </div>

        {/* Getting Started */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">
            Ready to create your first post?
          </h2>
          <p className="text-blue-100 mb-6">
            Record your thoughts and let Suflate turn them into polished LinkedIn content.
          </p>
          <Link href="/record">
            <Button className="bg-white text-blue-600 hover:bg-blue-50">
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
