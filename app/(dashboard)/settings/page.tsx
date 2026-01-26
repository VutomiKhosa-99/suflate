'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useSearchParams } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { LinkedInSettings } from '@/components/features/linkedin/linkedin-settings'
import { LinkedInCompanyPages } from '@/components/features/linkedin/company-pages'
import { NotificationSettings } from '@/components/features/notifications/notification-settings'
import { WorkspaceSelector } from '@/components/workspace/workspace-selector'
import { WorkspaceMembers } from '@/components/workspace/workspace-members'
import { WorkspaceBranding } from '@/components/workspace/workspace-branding'
import { WorkspaceCredits } from '@/components/workspace/workspace-credits'
import Link from 'next/link'
import { ArrowLeft, Building2, Users, Palette, CreditCard, Link2, User, Bell, Settings, ChevronRight, AlertCircle } from 'lucide-react'

type TabId = 'account' | 'workspace' | 'team' | 'branding' | 'credits' | 'connections' | 'notifications'

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('account')
  const [showHeadlinePrompt, setShowHeadlinePrompt] = useState(false)

  // Check if we need to prompt for headline
  useEffect(() => {
    if (searchParams?.get('needs_headline') === 'true') {
      setActiveTab('connections')
      setShowHeadlinePrompt(true)
    }
  }, [searchParams])

  // Load selected workspace from cookie or first workspace
  useEffect(() => {
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
    if (user) {
      loadWorkspace()
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  const tabs = [
    { id: 'account' as const, label: 'Account', icon: User, description: 'Manage your profile and subscription' },
    { id: 'workspace' as const, label: 'Workspace', icon: Building2, description: 'Configure workspace settings' },
    { id: 'team' as const, label: 'Team', icon: Users, description: 'Invite and manage team members' },
    { id: 'branding' as const, label: 'Branding', icon: Palette, description: 'Customize your brand appearance' },
    { id: 'credits' as const, label: 'Credits', icon: CreditCard, description: 'View usage and purchase credits' },
    { id: 'connections' as const, label: 'Connections', icon: Link2, description: 'Connect your LinkedIn account' },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell, description: 'Configure notification preferences' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Supergrow-style Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-500">Manage your account, workspace, and preferences</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="border-gray-200 hover:border-orange-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex gap-6">
        {/* Supergrow-style Sidebar Tabs */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all group
                    ${activeTab === tab.id
                      ? 'bg-orange-50 text-orange-600 border border-orange-200'
                      : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  <span className="flex-1 text-left">{tab.label}</span>
                  {activeTab === tab.id && (
                    <ChevronRight className="w-4 h-4 text-orange-400" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Workspace Selector */}
          {selectedWorkspaceId && (
            <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Current Workspace</p>
              <WorkspaceSelector
                selectedWorkspaceId={selectedWorkspaceId}
                onWorkspaceChange={setSelectedWorkspaceId}
              />
            </div>
          )}
        </div>

        {/* Content Area - Supergrow style */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-gray-200">
            {/* Tab Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {(() => {
                  const currentTab = tabs.find(t => t.id === activeTab)
                  if (currentTab) {
                    return (
                      <>
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <currentTab.icon className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">{currentTab.label}</h2>
                          <p className="text-sm text-gray-500">{currentTab.description}</p>
                        </div>
                      </>
                    )
                  }
                  return null
                })()}
              </div>
            </div>

            <div className="p-6">
              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <span className="text-white font-bold text-2xl">
                          {user?.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">
                          {user?.user_metadata?.name || user?.email?.split('@')[0]}
                        </p>
                        <p className="text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Subscription Plan</h3>
                    <div className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">Starter Plan</p>
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-medium rounded-full">Active</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">100 credits per month</p>
                        </div>
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                          Upgrade Plan
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Workspace Tab */}
              {activeTab === 'workspace' && selectedWorkspaceId && (
                <div className="space-y-6">
                  {/* Current Workspace Management */}
                  <ManageWorkspaceForm 
                    workspaceId={selectedWorkspaceId} 
                    onDeleted={() => {
                      setSelectedWorkspaceId(null)
                      window.location.reload()
                    }}
                  />
                  
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900 mb-1">Agency Tip</h3>
                        <p className="text-blue-700 text-sm">
                          Create a separate workspace for each client to keep their content, branding, and team access isolated.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Create New Workspace</h3>
                    <CreateWorkspaceForm onCreated={(id) => setSelectedWorkspaceId(id)} />
                  </div>
                </div>
              )}

              {/* Team Tab */}
              {activeTab === 'team' && selectedWorkspaceId && (
                <WorkspaceMembers workspaceId={selectedWorkspaceId} />
              )}

              {/* Branding Tab */}
              {activeTab === 'branding' && selectedWorkspaceId && (
                <WorkspaceBranding workspaceId={selectedWorkspaceId} />
              )}

              {/* Credits Tab */}
              {activeTab === 'credits' && selectedWorkspaceId && (
                <WorkspaceCredits workspaceId={selectedWorkspaceId} />
              )}

              {/* Connections Tab */}
              {activeTab === 'connections' && (
                <div className="space-y-8">
                  {/* Headline prompt when redirected from OAuth */}
                  {showHeadlinePrompt && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-orange-900">LinkedIn connected successfully!</h4>
                          <p className="text-sm text-orange-700 mt-1">
                            We couldn&apos;t fetch your headline automatically. Please enter it below so it appears in your post previews.
                          </p>
                        </div>
                        <button 
                          onClick={() => setShowHeadlinePrompt(false)}
                          className="text-orange-400 hover:text-orange-600"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">LinkedIn Personal Profile</h3>
                    {user && <LinkedInSettings userId={user.id} />}
                  </div>
                  
                  <hr className="border-gray-200" />
                  
                  <LinkedInCompanyPages />
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <NotificationSettings />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateWorkspaceForm({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setCreating(true)
    setError(null)

    try {
      const res = await fetch('/api/workspaces/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create workspace')
      }

      const data = await res.json()
      setName('')
      onCreated(data.workspace.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create workspace')
    } finally {
      setCreating(false)
    }
  }

  return (
    <form onSubmit={handleCreate} className="flex gap-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Client or project name"
        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
      />
      <Button 
        type="submit" 
        disabled={creating || !name.trim()}
        className="bg-orange-500 hover:bg-orange-600 text-white"
      >
        {creating ? 'Creating...' : 'Create Workspace'}
      </Button>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </form>
  )
}

function ManageWorkspaceForm({ workspaceId, onDeleted }: { workspaceId: string; onDeleted: () => void }) {
  const [name, setName] = useState('')
  const [originalName, setOriginalName] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadWorkspace()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  async function loadWorkspace() {
    setLoading(true)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`)
      if (res.ok) {
        const data = await res.json()
        setName(data.workspace.name)
        setOriginalName(data.workspace.name)
        setRole(data.role)
      }
    } catch (e) {
      console.error('Failed to load workspace:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || name === originalName) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update workspace')
      }

      setOriginalName(name.trim())
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update workspace')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setError(null)

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete workspace')
      }

      onDeleted()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete workspace')
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded-xl" />
  }

  const canEdit = ['owner', 'admin'].includes(role)
  const canDelete = role === 'owner'

  return (
    <div className="p-5 bg-white border border-gray-200 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Current Workspace</h3>
        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full capitalize">
          {role}
        </span>
      </div>
      
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Workspace Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
            Workspace updated successfully!
          </div>
        )}

        {canEdit && (
          <Button
            type="submit"
            disabled={saving || !name.trim() || name === originalName}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </form>

      {/* Delete Section */}
      {canDelete && (
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-red-600 mb-3">Danger Zone</h4>
          {!showDeleteConfirm ? (
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Delete Workspace
            </Button>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
              <p className="text-sm text-red-700">
                Are you sure you want to delete this workspace? This action cannot be undone.
                All content, members, and settings will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete Workspace'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="border-gray-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
