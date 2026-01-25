import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { getServiceClient } from '@/lib/suflate/workspaces/service'

/**
 * GET /api/workspaces/credits?workspaceId=<id>
 * Story 7.5: See Credit Usage Per Workspace
 * Returns credit balance and usage breakdown for a workspace
 */
export async function GET(request: NextRequest) {
  const { user, error } = await getAuthUser(request)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = request.nextUrl.searchParams.get('workspaceId')
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })

  const supabase = getServiceClient()

  // Verify user is a member
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()
  if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  // Get workspace credit balance
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('credits_remaining, credits_total, plan')
    .eq('id', workspaceId)
    .single()

  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  // Get usage breakdown from credits table (if it exists)
  // Group by feature_type for current month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: usageData } = await supabase
    .from('credits')
    .select('feature_type, credits_used, created_at')
    .eq('workspace_id', workspaceId)
    .gte('created_at', startOfMonth.toISOString())
    .order('created_at', { ascending: false })

  // Aggregate by feature type
  const usageByFeature: Record<string, number> = {}
  let totalUsed = 0
  for (const record of usageData || []) {
    const feature = record.feature_type || 'other'
    usageByFeature[feature] = (usageByFeature[feature] || 0) + (record.credits_used || 0)
    totalUsed += record.credits_used || 0
  }

  // Calculate usage percentage
  const usagePercentage = workspace.credits_total > 0 
    ? Math.round((totalUsed / workspace.credits_total) * 100)
    : 0

  return NextResponse.json({
    workspace_id: workspaceId,
    plan: workspace.plan,
    credits_remaining: workspace.credits_remaining,
    credits_total: workspace.credits_total,
    credits_used_this_month: totalUsed,
    usage_percentage: usagePercentage,
    usage_by_feature: usageByFeature,
    recent_usage: (usageData || []).slice(0, 20).map((r: any) => ({
      feature_type: r.feature_type,
      credits_used: r.credits_used,
      created_at: r.created_at,
    })),
  })
}
