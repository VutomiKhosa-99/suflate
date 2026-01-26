'use client'

import { useState, useEffect } from 'react'
import { Building2, Plus, Trash2, Users, Crown, Settings, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Workspace {
  id: string
  name: string
  plan: string
  credits_remaining: number
  credits_total: number
  role: string
  logo_url: string | null
  member_count?: number
}

export default function ManageWorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadWorkspaces()
  }, [])

  async function loadWorkspaces() {
    try {
      const res = await fetch('/api/workspaces/list')
      if (res.ok) {
        const data = await res.json()
        setWorkspaces(data.workspaces || [])
      }
    } catch (e) {
      console.error('Failed to load workspaces:', e)
    } finally {
      setLoading(false)
    }
  }

  async function createWorkspace(e: React.FormEvent) {
    e.preventDefault()
    if (!newWorkspaceName.trim()) return
    
    setCreating(true)
    try {
      const res = await fetch('/api/workspaces/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorkspaceName.trim() }),
      })
      if (res.ok) {
        await loadWorkspaces()
        setNewWorkspaceName('')
        setShowCreateModal(false)
      }
    } catch (e) {
      console.error('Failed to create workspace:', e)
    } finally {
      setCreating(false)
    }
  }

  async function deleteWorkspace(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }
    
    try {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await loadWorkspaces()
      }
    } catch (e) {
      console.error('Failed to delete workspace:', e)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded-xl" />
            <div className="h-32 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Workspaces</h1>
              <p className="text-gray-600 mt-1">Create and manage your workspaces</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            New Workspace
          </button>
        </div>

        {/* Workspace List */}
        <div className="space-y-4">
          {workspaces.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workspaces yet</h3>
              <p className="text-gray-600 mb-6">Create your first workspace to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Create Workspace
              </button>
            </div>
          ) : (
            workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Workspace Avatar */}
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {workspace.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={workspace.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      workspace.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Workspace Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {workspace.name}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        workspace.role === 'owner' 
                          ? 'bg-amber-100 text-amber-700' 
                          : workspace.role === 'admin'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {workspace.role === 'owner' && <Crown className="w-3 h-3 inline mr-1" />}
                        {workspace.role}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="capitalize">{workspace.plan} plan</span>
                      <span>•</span>
                      <span>{workspace.credits_remaining}/{workspace.credits_total} credits</span>
                      {workspace.member_count !== undefined && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {workspace.member_count} members
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/settings/workspaces/${workspace.id}`}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Workspace Settings"
                    >
                      <Settings className="w-5 h-5" />
                    </Link>
                    {workspace.role === 'owner' && (
                      <button
                        onClick={() => deleteWorkspace(workspace.id, workspace.name)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Workspace"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Create New Workspace</h2>
                <p className="text-gray-600 mt-1">A workspace helps you organize your content</p>
              </div>
              
              <form onSubmit={createWorkspace} className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="e.g., My Personal Brand"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setNewWorkspaceName('')
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newWorkspaceName.trim()}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating...' : 'Create Workspace'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
