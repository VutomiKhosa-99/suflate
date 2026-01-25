'use client'

import { useState, useEffect } from 'react'
import { Users, Mail, Trash2, Shield, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Member {
  user_id: string
  email: string
  name: string
  role: string
  created_at: string
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  expires_at: string
}

interface WorkspaceMembersProps {
  workspaceId: string
  currentUserRole?: string
}

const roleColors: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  editor: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-700',
}

export function WorkspaceMembers({ workspaceId, currentUserRole = 'owner' }: WorkspaceMembersProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('editor')
  const [inviting, setInviting] = useState(false)

  const canManageMembers = ['owner', 'admin'].includes(currentUserRole)

  useEffect(() => {
    loadMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  async function loadMembers() {
    try {
      const res = await fetch(`/api/workspaces/members?workspaceId=${workspaceId}`)
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members || [])
      }
    } catch (e) {
      console.error('Failed to load members:', e)
    } finally {
      setLoading(false)
    }
  }

  async function inviteMember() {
    if (!inviteEmail) return
    setInviting(true)
    try {
      const res = await fetch('/api/workspaces/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, email: inviteEmail, role: inviteRole }),
      })
      if (res.ok) {
        alert('Invitation sent!')
        setShowInviteModal(false)
        setInviteEmail('')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to send invitation')
      }
    } catch (e) {
      console.error('Failed to invite:', e)
    } finally {
      setInviting(false)
    }
  }

  async function removeMember(userId: string) {
    if (!confirm('Remove this member from the workspace?')) return
    try {
      const res = await fetch('/api/workspaces/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, userId }),
      })
      if (res.ok) {
        setMembers(members.filter(m => m.user_id !== userId))
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to remove member')
      }
    } catch (e) {
      console.error('Failed to remove member:', e)
    }
  }

  async function updateRole(userId: string, newRole: string) {
    try {
      const res = await fetch('/api/workspaces/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, userId, role: newRole }),
      })
      if (res.ok) {
        setMembers(members.map(m => m.user_id === userId ? { ...m, role: newRole } : m))
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update role')
      }
    } catch (e) {
      console.error('Failed to update role:', e)
    }
  }

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded-lg" />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Members ({members.length})
        </h3>
        {canManageMembers && (
          <Button onClick={() => setShowInviteModal(true)} size="sm">
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.user_id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                {(member.name || member.email)?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {member.name || member.email?.split('@')[0]}
                </div>
                <div className="text-sm text-gray-500">{member.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canManageMembers && member.role !== 'owner' ? (
                <select
                  value={member.role}
                  onChange={(e) => updateRole(member.user_id, e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1"
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              ) : (
                <span className={`text-xs px-2 py-1 rounded-full ${roleColors[member.role]}`}>
                  {member.role}
                </span>
              )}
              {canManageMembers && member.role !== 'owner' && (
                <button
                  onClick={() => removeMember(member.user_id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Invite Team Member</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="admin">Admin - Can manage members</option>
                  <option value="editor">Editor - Can create & edit content</option>
                  <option value="viewer">Viewer - Read-only access</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </Button>
                <Button onClick={inviteMember} disabled={inviting || !inviteEmail}>
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
