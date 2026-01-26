import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { randomUUID } from 'crypto'

/**
 * POST /api/suflate/voice/public-link
 * Create a new public voice recording link
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { questions } = body

    // Use service client to bypass RLS
    const serviceClient = createServiceClient()

    // Get user's workspace
    const { data: membership, error: membershipError } = await serviceClient
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .single() as { data: { workspace_id: string } | null; error: any }

    if (membershipError) {
      console.error('Failed to get workspace membership:', membershipError)
    }

    if (!membership) {
      return NextResponse.json(
        { error: 'No workspace found. Please ensure you have a workspace.' },
        { status: 400 }
      )
    }

    // Generate unique link ID
    const linkId = randomUUID()
    
    // Create public link record (using 'as any' since public_voice_links may not be in types yet)
    const { error: insertError } = await (serviceClient
      .from('public_voice_links') as any)
      .insert({
        id: linkId,
        user_id: user.id,
        workspace_id: membership.workspace_id,
        questions: questions || null,
        status: 'active',
      })

    if (insertError) {
      console.error('Failed to create public link:', insertError)
      return NextResponse.json(
        { error: 'Failed to create public link: ' + insertError.message },
        { status: 500 }
      )
    }

    // Generate the public URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const publicUrl = `${baseUrl}/public/voice-recording/${linkId}`

    return NextResponse.json({
      linkId,
      url: publicUrl,
      questions,
    })
  } catch (error) {
    console.error('Public link creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create public link' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/suflate/voice/public-link
 * List all public links for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = createServiceClient()

    // Get user's workspace
    const { data: membership } = await serviceClient
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .single() as { data: { workspace_id: string } | null }

    if (!membership) {
      return NextResponse.json({ links: [] })
    }

    // Fetch public links
    const { data: links, error } = await serviceClient
      .from('public_voice_links')
      .select('*')
      .eq('workspace_id', membership.workspace_id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }) as { data: any[] | null; error: any }

    if (error) {
      console.error('Error fetching public links:', error)
      return NextResponse.json(
        { error: 'Failed to fetch public links' },
        { status: 500 }
      )
    }

    // Generate URLs for each link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const linksWithUrls = (links || []).map(link => ({
      ...link,
      url: `${baseUrl}/public/voice-recording/${link.id}`,
    }))

    return NextResponse.json({ links: linksWithUrls })
  } catch (error) {
    console.error('Public links fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch public links' },
      { status: 500 }
    )
  }
}
