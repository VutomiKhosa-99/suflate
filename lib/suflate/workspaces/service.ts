import type { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Get selected workspace from cookie; fallback to first owned workspace,
 * or create a default one if none exists.
 */
export async function getOrCreateWorkspaceId(request: NextRequest, user: { id: string; email?: string | null }) {
  const supabase = getServiceClient()

  const cookie = request.cookies.get('selected_workspace_id')?.value
  if (cookie) {
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', cookie)
      .eq('user_id', user.id)
      .single()
    if (membership?.workspace_id) {
      return membership.workspace_id as string
    }
  }

  // Fallback to first owned workspace
  let { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!workspace) {
    // Ensure user row exists
    await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      name: user.email?.split('@')[0] || 'User',
    }, { onConflict: 'id' })

    const { data: newWorkspace, error: createError } = await supabase
      .from('workspaces')
      .insert({
        name: `${user.email?.split('@')[0] || 'User'}'s Workspace`,
        owner_id: user.id,
        plan: 'starter',
        credits_remaining: 100,
        credits_total: 100,
      })
      .select('id')
      .single()

    if (createError || !newWorkspace) {
      throw new Error('Failed to create workspace')
    }

    workspace = newWorkspace
    // Add membership
    await supabase.from('workspace_members').insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'owner',
    })
  }

  return workspace.id as string
}

/**
 * Get selected workspace from cookie or membership/ownership without creating one.
 * Returns `string | null`.
 */
export async function getWorkspaceId(request: NextRequest, user: { id: string; email?: string | null }) {
  const supabase = getServiceClient()

  const cookie = request.cookies.get('selected_workspace_id')?.value
  if (cookie) {
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', cookie)
      .eq('user_id', user.id)
      .single()
    if (membership?.workspace_id) {
      return membership.workspace_id as string
    }
  }

  // Try to find any workspace membership for the user
  const { data: anyMembership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (anyMembership?.workspace_id) return anyMembership.workspace_id as string

  // Fallback to first owned workspace, but do NOT create one
  const { data: ownedWorkspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (ownedWorkspace?.id) return ownedWorkspace.id as string

  return null
}

export async function listUserWorkspaces(userId: string) {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(id, name, plan, credits_remaining, credits_total, logo_url, branding)')
    .eq('user_id', userId)
  return (data || []).map((m: any) => ({
    id: m.workspaces?.id || m.workspace_id,
    name: m.workspaces?.name,
    plan: m.workspaces?.plan,
    credits_remaining: m.workspaces?.credits_remaining,
    credits_total: m.workspaces?.credits_total,
    role: m.role,
    logo_url: m.workspaces?.logo_url || null,
    branding: m.workspaces?.branding || {},
  }))
}

export async function createWorkspaceWithMembership(userId: string, name: string) {
  const supabase = getServiceClient()
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .insert({
      name,
      owner_id: userId,
      plan: 'starter',
      credits_remaining: 100,
      credits_total: 100,
    })
    .select('id, name, plan, credits_remaining, credits_total')
    .single()
  if (error || !workspace) throw new Error(error?.message || 'Failed to create workspace')
  await supabase.from('workspace_members').insert({ workspace_id: workspace.id, user_id: userId, role: 'owner' })
  return workspace
}
