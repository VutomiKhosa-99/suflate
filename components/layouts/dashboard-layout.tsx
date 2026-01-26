'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import Link from 'next/link'
import { WorkspaceSelector } from '@/components/workspace/workspace-selector'
import { WritePostModal } from '@/components/features/write-post/write-post-modal'
import { AiAssistantModal } from '@/components/features/ai-assistant/ai-assistant-modal'
import { UserProfileDropdown } from '@/components/features/user-profile/user-profile-dropdown'
import { 
  ChevronLeft, 
  ChevronRight, 
  PenLine, 
  Sparkles,
  LayoutDashboard,
  Settings,
  BarChart3,
  Mic,
  FileEdit,
  LayoutGrid,
  MessageSquare,
  Kanban,
  CalendarDays,
  TrendingUp,
  Users,
  FolderOpen
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  badge?: string
  enabled?: boolean
  hidden?: boolean
}

interface NavSection {
  title?: string
  items: NavItem[]
}

const navigationSections: NavSection[] = [
  {
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      { name: 'Settings', href: '/settings', icon: <Settings className="w-5 h-5" /> },
      { name: 'Analytics', href: '/analytics', icon: <BarChart3 className="w-5 h-5" />, enabled: false },
    ]
  },
  {
    title: 'Content Creation',
    items: [
      { name: 'Voice Notes', href: '/record', icon: <Mic className="w-5 h-5" />, badge: 'BETA' },
      { name: 'Post Generator', href: '/repurpose', icon: <FileEdit className="w-5 h-5" /> },
      { name: 'Carousel Maker', href: '/carousels', icon: <LayoutGrid className="w-5 h-5" /> },
    ]
  },
  {
    title: 'Drafts & Scheduling',
    items: [
      { name: 'Drafts', href: '/drafts', icon: <Kanban className="w-5 h-5" /> },
      { name: 'Calendar', href: '/calendar', icon: <CalendarDays className="w-5 h-5" /> },
    ]
  },
  {
    title: 'Content Inspiration',
    items: [
      { name: 'Viral Posts', href: '/inspiration/viral', icon: <TrendingUp className="w-5 h-5" />, enabled: false },
      { name: 'Influencers', href: '/inspiration/influencers', icon: <Users className="w-5 h-5" />, enabled: false },
      { name: 'Swipe Files', href: '/inspiration/swipe', icon: <FolderOpen className="w-5 h-5" />, enabled: false },
    ]
  },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showWritePostModal, setShowWritePostModal] = useState(false)
  const [showAiAssistant, setShowAiAssistant] = useState(false)
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

        {/* Write Post Button */}
        <div className="p-3">
          <button
            onClick={() => setShowWritePostModal(true)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-200 transition-all ${
              sidebarCollapsed ? 'px-3' : ''
            }`}
            title={sidebarCollapsed ? 'Write Post' : undefined}
          >
            <PenLine className="w-5 h-5" />
            {!sidebarCollapsed && <span>Write Post</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigationSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className={sectionIndex > 0 ? 'mt-6' : ''}>
              {/* Section Title */}
              {section.title && !sidebarCollapsed && (
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              {section.title && sidebarCollapsed && (
                <div className="my-2 mx-3 border-t border-gray-200" />
              )}
              
              {/* Section Items */}
              <div className="space-y-1">
                {section.items.filter(item => !item.hidden).map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                  const isEnabled = item.enabled !== false
                  
                  if (!isEnabled) {
                    return (
                      <div
                        key={item.name}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 cursor-not-allowed opacity-60 ${
                          sidebarCollapsed ? 'justify-center' : ''
                        }`}
                        title={sidebarCollapsed ? item.name + ' (Coming soon)' : 'Coming soon'}
                      >
                        <span className="flex-shrink-0 text-gray-400">{item.icon}</span>
                        {!sidebarCollapsed && (
                          <>
                            <span className="flex-1">{item.name}</span>
                            {item.badge && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gray-200 text-gray-500 rounded">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    )
                  }
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        sidebarCollapsed ? 'justify-center' : ''
                      } ${
                        isActive
                          ? 'bg-orange-50 text-orange-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      <span className={`flex-shrink-0 ${isActive ? 'text-orange-500' : 'text-gray-500'}`}>
                        {item.icon}
                      </span>
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1">{item.name}</span>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-orange-100 text-orange-600 rounded">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
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
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                {navigationSections.flatMap(s => s.items).find((item) => pathname === item.href || pathname?.startsWith(item.href + '/'))?.name || 'Dashboard'}
              </h1>
              <div className="flex items-center gap-3">
                {/* Workspace Selector */}
                {selectedWorkspaceId && (
                  <WorkspaceSelector
                    selectedWorkspaceId={selectedWorkspaceId}
                    onWorkspaceChange={setSelectedWorkspaceId}
                  />
                )}

                {/* AI Assistant Button */}
                <button
                  onClick={() => setShowAiAssistant(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  AI Assistant
                </button>

                {/* User Profile Dropdown */}
                <UserProfileDropdown user={user} onLogout={handleLogout} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>

      {/* Write Post Modal */}
      <WritePostModal 
        isOpen={showWritePostModal} 
        onClose={() => setShowWritePostModal(false)} 
      />

      {/* AI Assistant Modal */}
      <AiAssistantModal
        isOpen={showAiAssistant}
        onClose={() => setShowAiAssistant(false)}
      />
    </div>
  )
}
