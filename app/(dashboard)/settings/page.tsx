'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
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
import { ArrowLeft, Building2, Users, Palette, CreditCard, Link2, User, Bell } from 'lucide-react'

type TabId = 'account' | 'workspace' | 'team' | 'branding' | 'credits' | 'connections' | 'notifications'

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('account')

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const tabs = [
    { id: 'account' as const, label: 'Account', icon: User },
    { id: 'workspace' as const, label: 'Workspace', icon: Building2 },
    { id: 'team' as const, label: 'Team', icon: Users },
    { id: 'branding' as const, label: 'Branding', icon: Palette },
    { id: 'credits' as const, label: 'Credits', icon: CreditCard },
    { id: 'connections' as const, label: 'Connections', icon: Link2 },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            {selectedWorkspaceId && (
              <WorkspaceSelector
                selectedWorkspaceId={selectedWorkspaceId}
                onWorkspaceChange={setSelectedWorkspaceId}
              />
            )}
          </div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account, workspace, and team</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Tabs */}
          <div className="w-48 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6">
            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-2xl">
                          {user?.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-lg">
                          {user?.user_metadata?.name || user?.email?.split('@')[0]}
                        </p>
                        <p className="text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-semibold text-gray-900 mb-3">Subscription</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Starter Plan</p>
                        <p className="text-sm text-gray-500">100 credits per month</p>
                      </div>
                      <Button variant="outline" disabled>
                        Upgrade (Coming Soon)
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Workspace Tab */}
            {activeTab === 'workspace' && selectedWorkspaceId && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Workspace Settings</h2>
                  <p className="text-gray-600 text-sm mb-4">
                    Manage your workspace name and settings. Create separate workspaces for different clients or projects.
                  </p>
                </div>

                {/* Current Workspace Management */}
                <ManageWorkspaceForm 
                  workspaceId={selectedWorkspaceId} 
                  onDeleted={() => {
                    // Reset to first available workspace after deletion
                    setSelectedWorkspaceId(null)
                    window.location.reload()
                  }}
                />
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-900 mb-2">Agency Tip</h3>
                  <p className="text-blue-700 text-sm">
                    Create a separate workspace for each client to keep their content, branding, and team access isolated.
                    Use the workspace selector in the header to quickly switch between clients.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Create New Workspace</h3>
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
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">LinkedIn Personal Profile</h2>
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
        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <Button type="submit" disabled={creating || !name.trim()}>
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
    return <div className="animate-pulse h-32 bg-gray-100 rounded-lg" />
  }

  const canEdit = ['owner', 'admin'].includes(role)
  const canDelete = role === 'owner'

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-4">
      <h3 className="font-medium text-gray-900">Current Workspace</h3>
      
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Workspace Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">Workspace updated successfully!</p>}

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Your role: <span className="font-medium capitalize">{role}</span>
          </div>
          
          <div className="flex gap-3">
            {canEdit && (
              <Button
                type="submit"
                disabled={saving || !name.trim() || name === originalName}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Delete Section */}
      {canDelete && (
        <div className="pt-4 border-t border-gray-200">
          <h4 className="font-medium text-red-600 mb-2">Danger Zone</h4>
          {!showDeleteConfirm ? (
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Delete Workspace
            </Button>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
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
