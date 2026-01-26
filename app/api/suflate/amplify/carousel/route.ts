import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { generateCarouselContent } from '@/lib/integrations/openrouter'
import { randomUUID } from 'crypto'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { getWorkspaceId } from '@/lib/suflate/workspaces/service'

// Service client to bypass RLS
function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

interface CarouselSlide {
  slide_number: number
  title: string
  body: string
  key_point: string
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getServiceClient()
    const body = await request.json()
    const { transcriptionId, templateType = 'minimal', slideCount = 7 } = body

    if (!transcriptionId) return NextResponse.json({ error: 'transcriptionId is required' }, { status: 400 })

    // Resolve selected workspace (do NOT create)
    const workspaceId = await getWorkspaceId(request, { id: user.id, email: user.email })
    if (!workspaceId) return NextResponse.json({ error: 'No workspace selected' }, { status: 400 })

    // Fetch transcription
    const { data: transcription, error: transcriptionError } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('id', transcriptionId)
      .single()

    if (transcriptionError || !transcription) {
      console.error('Transcription fetch error:', transcriptionError)
      return NextResponse.json({ error: 'Transcription not found' }, { status: 404 })
    }

    // Ensure transcription is in selected workspace
    if (transcription.workspace_id !== workspaceId) {
      return NextResponse.json({ error: 'Transcription does not belong to selected workspace' }, { status: 403 })
    }

    const validSlideCount = Math.min(Math.max(slideCount, 5), 10)
    const transcriptText = transcription.processed_text || transcription.raw_text
    if (!transcriptText || transcriptText.trim().length === 0) {
      return NextResponse.json({ error: 'Transcription text is empty' }, { status: 400 })
    }

    // Generate carousel content via OpenRouter
    let slideData: CarouselSlide[]
    try {
      const result = await generateCarouselContent(transcriptText, { slideCount: validSlideCount })
      if (Array.isArray(result)) {
        slideData = result.map((slide: any, index: number) => ({
          slide_number: slide.slide_number || index + 1,
          title: slide.title || `Slide ${index + 1}`,
          body: slide.body || '',
          key_point: slide.key_point || '',
        }))
      } else {
        console.error('Invalid carousel content format:', result)
        return NextResponse.json({ error: 'Failed to generate carousel content - invalid format' }, { status: 500 })
      }
    } catch (error) {
      console.error('OpenRouter carousel generation error:', error)
      return NextResponse.json({ error: 'Failed to generate carousel content' }, { status: 500 })
    }

    const carouselTitle = slideData[0]?.title || 'Untitled Carousel'

    // Create carousel record scoped to workspace
    const carouselId = randomUUID()
    const { data: carousel, error: carouselError } = await supabase
      .from('carousels')
      .insert({
        id: carouselId,
        workspace_id: workspaceId,
        user_id: user.id,
        transcription_id: transcriptionId,
        title: carouselTitle,
        slide_data: slideData,
        template_type: templateType,
        status: 'draft',
        credits_used: 10,
      })
      .select()
      .single()

    if (carouselError) {
      console.error('Error creating carousel:', carouselError)
      return NextResponse.json({ error: 'Failed to save carousel' }, { status: 500 })
    }

    return NextResponse.json({ success: true, carousel, slideCount: slideData.length })
  } catch (error) {
    console.error('Carousel amplification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getServiceClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Resolve selected workspace (do NOT create)
    const workspaceId = await getWorkspaceId(request, { id: user.id, email: user.email })
    if (!workspaceId) return NextResponse.json({ error: 'No workspace selected' }, { status: 400 })

    // Fetch carousels for the workspace
    let query = supabase
      .from('carousels')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data: carousels, error } = await query
    if (error) {
      console.error('Error fetching carousels:', error)
      return NextResponse.json({ error: 'Failed to fetch carousels' }, { status: 500 })
    }

    return NextResponse.json({ carousels: carousels || [], count: carousels?.length || 0 })
  } catch (error) {
    console.error('Carousel list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

