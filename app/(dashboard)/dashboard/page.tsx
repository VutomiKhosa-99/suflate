'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { Mic, FileText, Calendar, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
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

          <div className="bg-white p-6 rounded-xl border border-gray-200 opacity-60 cursor-not-allowed">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900">My Drafts</h3>
            <p className="text-sm text-gray-600 mt-1">
              View and edit your drafts
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 opacity-60 cursor-not-allowed">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900">Scheduled</h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage scheduled posts
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 opacity-60 cursor-not-allowed">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900">Settings</h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage your account
            </p>
          </div>
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
      </main>
    </div>
  )
}
