// Role-based permission checks
export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer'

export const permissions = {
  canCreateWorkspace: (role: WorkspaceRole) => role === 'owner',
  
  canEditWorkspace: (role: WorkspaceRole) => ['owner', 'admin'].includes(role),
  
  canDeleteWorkspace: (role: WorkspaceRole) => role === 'owner',
  
  canInviteMembers: (role: WorkspaceRole) => ['owner', 'admin'].includes(role),
  
  canCreateContent: (role: WorkspaceRole) => ['owner', 'admin', 'editor'].includes(role),
  
  canEditContent: (role: WorkspaceRole) => ['owner', 'admin', 'editor'].includes(role),
  
  canDeleteContent: (role: WorkspaceRole) => ['owner', 'admin', 'editor'].includes(role),
  
  canViewContent: (role: WorkspaceRole) => true, // All roles can view
  
  canSchedulePosts: (role: WorkspaceRole) => ['owner', 'admin', 'editor'].includes(role),
  
  canViewAnalytics: (role: WorkspaceRole) => ['owner', 'admin'].includes(role),
}

export function hasPermission(role: WorkspaceRole, permission: keyof typeof permissions): boolean {
  return permissions[permission](role)
}
