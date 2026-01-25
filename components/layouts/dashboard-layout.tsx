'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { WorkspaceSelector } from '@/components/workspace/workspace-selector'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Record', href: '/record', icon: '🎤' },
  { name: 'Repurpose', href: '/repurpose', icon: '♻️', enabled: true },
  { name: 'Drafts', href: '/drafts', icon: '📝', enabled: true },
  { name: 'Carousels', href: '/carousels', icon: '🎠', enabled: true },
  { name: 'Calendar', href: '/calendar', icon: '📅', enabled: true },
  { name: 'Analytics', href: '/analytics', icon: '📈', enabled: false },
  { name: 'Settings', href: '/settings', icon: '⚙️', enabled: true },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) {
      setSidebarCollapsed(saved === 'true')
    }
  }, [])

  // Save sidebar state to localStorage
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
  }

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)
      setLoading(false)
      
      // Load workspace after user is loaded
      loadWorkspace()
    }

    async function loadWorkspace() {
      try {
        const res = await fetch('/api/workspaces/list')
        if (res.ok) {
          const data = await res.json()
          if (data.workspaces?.length > 0) {
            // Check for cookie-stored workspace
            const cookieMatch = document.cookie.match(/selected_workspace_id=([^;]+)/)
            const cookieWorkspaceId = cookieMatch ? cookieMatch[1] : null
            
            // Validate cookie workspace exists in user's workspaces
            const validWorkspace = data.workspaces.find((w: any) => w.id === cookieWorkspaceId)
            setSelectedWorkspaceId(validWorkspace?.id || data.workspaces[0].id)
          }
        }
      } catch (e) {
        console.error('Failed to load workspaces:', e)
      }
    }

    loadUser()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-50 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        {/* Logo - links to dashboard */}
        <Link href="/dashboard" className="block p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          {sidebarCollapsed ? (
            <div className="w-10 h-10 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              S
            </div>
          ) : (
            <Logo size="lg" asLink={false} />
          )}
        </Link>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            const isEnabled = item.enabled !== false
            
            if (!isEnabled) {
              return (
                <div
                  key={item.name}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 cursor-not-allowed opacity-60 ${
                    sidebarCollapsed ? 'justify-center' : ''
                  }`}
                  title={sidebarCollapsed ? item.name + ' (Coming soon)' : 'Coming soon'}
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </div>
              )
            }
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  sidebarCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Collapse toggle button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* User Section */}
        <div className="p-3 border-t border-gray-200">
          <div className={`flex items-center gap-3 mb-3 px-2 py-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user.user_metadata?.name || user.email}
                </div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
              </div>
            )}
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className={`w-full text-gray-700 hover:bg-gray-100 ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start'}`}
            title={sidebarCollapsed ? 'Log out' : undefined}
          >
            <span className={sidebarCollapsed ? '' : 'mr-2'}>🚪</span>
            {!sidebarCollapsed && 'Log out'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                {navigation.find((item) => pathname === item.href || pathname?.startsWith(item.href + '/'))?.name || 'Dashboard'}
              </h1>
              <div className="flex items-center gap-4">
                {/* Workspace Selector */}
                {selectedWorkspaceId && (
                  <WorkspaceSelector
                    selectedWorkspaceId={selectedWorkspaceId}
                    onWorkspaceChange={setSelectedWorkspaceId}
                  />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
