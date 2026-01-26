'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check, Plus, Search, Settings } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadWorkspaces()
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function loadWorkspaces() {
    try {
      const res = await fetch('/api/workspaces/list')
      if (res.ok) {
        const data = await res.json()
        setWorkspaces(data.workspaces || [])
        
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

  useEffect(() => {
    if (selectedWorkspaceId && workspaces.length > 0) {
      const workspace = workspaces.find(w => w.id === selectedWorkspaceId)
      if (workspace) {
        setSelectedWorkspace(workspace)
      }
    }
  }, [selectedWorkspaceId, workspaces])

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
        setSearchQuery('')
        onWorkspaceChange?.(workspace.id)
        window.location.reload()
      }
    } catch (e) {
      console.error('Failed to switch workspace:', e)
    }
  }

  async function createWorkspace() {
    setIsOpen(false)
    router.push('/settings/workspaces?action=create')
  }

  const filteredWorkspaces = workspaces.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="h-10 w-48 bg-gray-100 animate-pulse rounded-lg" />
    )
  }

  if (!selectedWorkspace) {
    return (
      <button
        onClick={createWorkspace}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 shadow-sm"
      >
        <Plus className="w-4 h-4" />
        Create Workspace
      </button>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button - Supergrow style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
          {selectedWorkspace.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedWorkspace.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
          ) : (
            selectedWorkspace.name.charAt(0).toUpperCase()
          )}
        </div>
        <span className="text-sm font-medium text-gray-900 max-w-[150px] truncate">
          {selectedWorkspace.name}
        </span>
        <span className="text-xs text-gray-500 px-1.5 py-0.5 bg-gray-100 rounded capitalize">
          {selectedWorkspace.role}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown - Supergrow style */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">
                Workspaces ({workspaces.length})
              </span>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search workspaces"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-gray-50"
              />
            </div>
          </div>

          {/* Workspace List */}
          <div className="max-h-64 overflow-y-auto py-2">
            {filteredWorkspaces.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No workspaces found
              </div>
            ) : (
              filteredWorkspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => switchWorkspace(workspace)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                    workspace.id === selectedWorkspace.id ? 'bg-orange-50' : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                    {workspace.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={workspace.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      workspace.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {workspace.name}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {workspace.role}
                    </div>
                  </div>
                  {workspace.id === selectedWorkspace.id && (
                    <Check className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Actions - Supergrow style */}
          <div className="border-t border-gray-100 p-3">
            <button
              onClick={createWorkspace}
              className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white transition-all shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm font-medium">Create a new workspace</span>
            </button>
            
            <Link
              href="/settings/workspaces"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-3 py-3 mt-2 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">Manage All Workspaces</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
