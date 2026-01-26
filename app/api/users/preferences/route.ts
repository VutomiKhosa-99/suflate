import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/utils/supabase/auth-helper'

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * GET /api/users/preferences
 * Get user's notification and other preferences
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()

    const { data: userData, error } = await supabase
      .from('users')
      .select('notification_preferences')
      .eq('id', user.id)
      .single()

    if (error) {
      // User may not have preferences column yet, return defaults
      return NextResponse.json({
        notifications: { email: true, push: false },
      })
    }

    return NextResponse.json({
      notifications: userData?.notification_preferences || { email: true, push: false },
    })
  } catch (error) {
    console.error('Get preferences error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/users/preferences
 * Update user's notification and other preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notifications } = body

    const supabase = getServiceClient()

    const { error: updateError } = await supabase
      .from('users')
      .update({
        notification_preferences: notifications,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update preferences:', updateError)
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notifications,
    })
  } catch (error) {
    console.error('Update preferences error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/users/preferences
 * Update user's profile fields including LinkedIn headline
 */
export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { linkedin_headline, name } = body

    const supabase = getServiceClient()
    
    // Build update object with only provided fields
    const updateData: Record<string, string> = {
      updated_at: new Date().toISOString(),
    }
    
    if (linkedin_headline !== undefined) {
      updateData.linkedin_headline = linkedin_headline
    }
    
    if (name !== undefined) {
      updateData.name = name
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update user profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
