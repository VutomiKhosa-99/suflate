import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { generateCarouselContent } from '@/lib/integrations/openrouter'
import { randomUUID } from 'crypto'
import { getAuthUser } from '@/utils/supabase/auth-helper'

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

/**
 * POST /api/suflate/amplify/carousel
 * Story 5.1: Amplify Voice Notes into Carousel Content
 * 
 * Generates carousel slides from a transcribed voice note
 * - Fetches transcription from database
 * - Calls OpenRouter API with carousel-specific prompts
 * - Creates carousel record with slide data
 * - Deducts 10 credits
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()
    const body = await request.json()
    const { transcriptionId, templateType = 'minimal', slideCount = 7 } = body

    if (!transcriptionId) {
      return NextResponse.json(
        { error: 'transcriptionId is required' },
        { status: 400 }
      )
    }

    // Validate slideCount (5-10 slides)
    const validSlideCount = Math.min(Math.max(slideCount, 5), 10)

    // Fetch transcription
    const { data: transcription, error: transcriptionError } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('id', transcriptionId)
      .single()

    if (transcriptionError || !transcription) {
      console.error('Transcription fetch error:', transcriptionError)
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this transcription's workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', transcription.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Unauthorized access to this transcription' },
        { status: 403 }
      )
    }

    // Use processed_text if available, otherwise raw_text
    const transcriptText = transcription.processed_text || transcription.raw_text

    if (!transcriptText || transcriptText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Transcription text is empty' },
        { status: 400 }
      )
    }

    const workspaceId = transcription.workspace_id
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Transcription has no workspace' },
        { status: 400 }
      )
    }

    // Generate carousel content via OpenRouter
    let slideData: CarouselSlide[]
    try {
      const result = await generateCarouselContent(transcriptText, {
        slideCount: validSlideCount,
      })

      // Validate and normalize slide data
      if (Array.isArray(result)) {
        slideData = result.map((slide, index) => ({
          slide_number: slide.slide_number || index + 1,
          title: slide.title || `Slide ${index + 1}`,
          body: slide.body || '',
          key_point: slide.key_point || '',
        }))
      } else {
        // If result is not an array, create default slides
        console.error('Invalid carousel content format:', result)
        return NextResponse.json(
          { error: 'Failed to generate carousel content - invalid format' },
          { status: 500 }
        )
      }
    } catch (error) {
      console.error('OpenRouter carousel generation error:', error)
      return NextResponse.json(
        { error: 'Failed to generate carousel content: ' + (error instanceof Error ? error.message : 'Unknown error') },
        { status: 500 }
      )
    }

    // Generate a title from the first slide or transcript
    const carouselTitle = slideData[0]?.title || 'Untitled Carousel'

    // Create carousel record
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
      return NextResponse.json(
        { error: 'Failed to save carousel' },
        { status: 500 }
      )
    }

    // TODO: Deduct 10 credits from user/workspace

    return NextResponse.json({
      success: true,
      carousel,
      slideCount: slideData.length,
    })
  } catch (error) {
    console.error('Carousel amplification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/suflate/amplify/carousel
 * List all carousels for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Fetch carousels for the user
    let query = supabase
      .from('carousels')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: carousels, error } = await query

    if (error) {
      console.error('Error fetching carousels:', error)
      return NextResponse.json(
        { error: 'Failed to fetch carousels' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      carousels: carousels || [],
      count: carousels?.length || 0,
    })
  } catch (error) {
    console.error('Carousel list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
