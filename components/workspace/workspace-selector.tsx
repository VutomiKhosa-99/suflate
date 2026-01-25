'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Check, Plus, Building2 } from 'lucide-react'

interface Workspace {
  id: string
  name: string
  plan: string
  credits_remaining: number
  credits_total: number
  role: string
  logo_url: string | null
}

interface WorkspaceSelectorProps {
  selectedWorkspaceId?: string
  onWorkspaceChange?: (workspaceId: string) => void
}

export function WorkspaceSelector({ selectedWorkspaceId, onWorkspaceChange }: WorkspaceSelectorProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkspaces()
  }, [])

  async function loadWorkspaces() {
    try {
      const res = await fetch('/api/workspaces/list')
      if (res.ok) {
        const data = await res.json()
        setWorkspaces(data.workspaces || [])
        
        // Use prop if provided, otherwise check cookie, otherwise use first
        const cookieMatch = document.cookie.match(/selected_workspace_id=([^;]+)/)
        const selectedId = selectedWorkspaceId || cookieMatch?.[1]
        
        const selected = data.workspaces?.find((w: Workspace) => w.id === selectedId) 
          || data.workspaces?.[0]
        setSelectedWorkspace(selected || null)
      }
    } catch (e) {
      console.error('Failed to load workspaces:', e)
    } finally {
      setLoading(false)
    }
  }

  // Update selection when prop changes
  useEffect(() => {
    if (selectedWorkspaceId && workspaces.length > 0) {
      const workspace = workspaces.find(w => w.id === selectedWorkspaceId)
      if (workspace) {
        setSelectedWorkspace(workspace)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkspaceId])

  async function switchWorkspace(workspace: Workspace) {
    try {
      const res = await fetch('/api/workspaces/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: workspace.id }),
      })
      if (res.ok) {
        setSelectedWorkspace(workspace)
        setIsOpen(false)
        onWorkspaceChange?.(workspace.id)
        // Refresh page to update data
        window.location.reload()
      }
    } catch (e) {
      console.error('Failed to switch workspace:', e)
    }
  }

  async function createWorkspace() {
    const name = prompt('Enter workspace name:')
    if (!name) return
    
    try {
      const res = await fetch('/api/workspaces/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        const data = await res.json()
        await loadWorkspaces()
        if (data.workspace) {
          switchWorkspace({ ...data.workspace, role: 'owner', logo_url: null })
        }
      }
    } catch (e) {
      console.error('Failed to create workspace:', e)
    }
  }

  if (loading) {
    return (
      <div className="h-10 w-48 bg-gray-100 animate-pulse rounded-lg" />
    )
  }

  if (!selectedWorkspace) {
    return (
      <button
        onClick={createWorkspace}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <Plus className="w-4 h-4" />
        Create Workspace
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 min-w-[200px]"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
          {selectedWorkspace.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedWorkspace.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
          ) : (
            selectedWorkspace.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
            {selectedWorkspace.name}
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {selectedWorkspace.role}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-2">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
              Your Workspaces
            </div>
            
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => switchWorkspace(workspace)}
                className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 ${
                  workspace.id === selectedWorkspace.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                  {workspace.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={workspace.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    workspace.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {workspace.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {workspace.credits_remaining}/{workspace.credits_total} credits • {workspace.role}
                  </div>
                </div>
                {workspace.id === selectedWorkspace.id && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}

            <div className="border-t border-gray-100 mt-2 pt-2">
              <button
                onClick={createWorkspace}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-blue-600"
              >
                <div className="w-8 h-8 rounded-lg border-2 border-dashed border-blue-300 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Create New Workspace</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
