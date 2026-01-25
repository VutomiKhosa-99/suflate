import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { postCarouselToLinkedIn } from '@/lib/integrations/linkedin'
import { getTemplate } from '@/lib/carousel-templates'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { jsPDF } from 'jspdf'

/**
 * POST /api/suflate/carousels/[id]/publish
 * Publish a carousel directly to LinkedIn
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { caption, title } = body

    // Get authenticated user
    const { user, error: authError } = await getAuthUser(request)
    
    console.log('[Publish] Auth result:', { userId: user?.id, authError })
    
    if (authError || !user) {
      console.log('[Publish] Auth failed:', authError)
      return NextResponse.json(
        { error: 'Unauthorized', details: authError },
        { status: 401 }
      )
    }

    // Service client for database operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get user's LinkedIn credentials
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('linkedin_access_token, linkedin_profile_id')
      .eq('id', user.id)
      .single()

    console.log('[Publish] User lookup:', { 
      found: !!userData, 
      hasToken: !!userData?.linkedin_access_token,
      hasProfileId: !!userData?.linkedin_profile_id,
      error: userError 
    })

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found', details: userError?.message },
        { status: 404 }
      )
    }

    if (!userData.linkedin_access_token || !userData.linkedin_profile_id) {
      return NextResponse.json(
        { error: 'LinkedIn not connected. Please connect your LinkedIn account in Settings.' },
        { status: 400 }
      )
    }

    // Get the carousel
    const { data: carousel, error: carouselError } = await supabase
      .from('carousels')
      .select('*')
      .eq('id', id)
      .single()

    if (carouselError || !carousel) {
      return NextResponse.json(
        { error: 'Carousel not found' },
        { status: 404 }
      )
    }

    // Generate the PDF
    const pdfBuffer = await generateCarouselPDF(carousel)

    // Post to LinkedIn
    const personUrn = `urn:li:person:${userData.linkedin_profile_id}`
    const result = await postCarouselToLinkedIn(
      userData.linkedin_access_token,
      personUrn,
      pdfBuffer,
      title || carousel.title || 'My Carousel',
      caption || ''
    )

    if (!result.success) {
      // Check if it's an auth error
      if (result.error?.includes('401') || result.error?.includes('403')) {
        return NextResponse.json(
          { error: 'LinkedIn authentication expired. Please reconnect your LinkedIn account in Settings.' },
          { status: 401 }
        )
      }
      return NextResponse.json(
        { error: result.error || 'Failed to publish to LinkedIn' },
        { status: 500 }
      )
    }

    // Update carousel status
    await supabase
      .from('carousels')
      .update({
        status: 'published',
        linkedin_post_id: result.postId,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json({
      success: true,
      postId: result.postId,
      postUrl: result.postUrl,
    })
  } catch (error) {
    console.error('[Publish Carousel] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish carousel' },
      { status: 500 }
    )
  }
}

/**
 * Generate PDF from carousel data
 */
async function generateCarouselPDF(carousel: any): Promise<Buffer> {
  const template = getTemplate(carousel.template_type || 'minimal')
  const slides = carousel.slide_data || []
  
  // LinkedIn carousel dimensions (1080x1350 for portrait)
  const width = 1080
  const height = 1350
  
  // Create PDF with custom dimensions
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [width, height],
  })

  slides.forEach((slide: any, index: number) => {
    if (index > 0) {
      pdf.addPage([width, height], 'portrait')
    }

    // Background
    const bgColor = hexToRgb(template.colors.background)
    pdf.setFillColor(bgColor.r, bgColor.g, bgColor.b)
    pdf.rect(0, 0, width, height, 'F')

    // Slide number
    const secondaryColor = hexToRgb(template.colors.secondary)
    pdf.setTextColor(secondaryColor.r, secondaryColor.g, secondaryColor.b)
    pdf.setFontSize(48)
    pdf.text(`${slide.slide_number || index + 1}`, 80, 120)

    // Title
    const primaryColor = hexToRgb(template.colors.primary)
    pdf.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b)
    pdf.setFontSize(64)
    pdf.setFont('helvetica', 'bold')
    
    const titleLines = pdf.splitTextToSize(slide.title || '', width - 160)
    pdf.text(titleLines, 80, 250)

    // Body
    const textColor = hexToRgb(template.colors.text)
    pdf.setTextColor(textColor.r, textColor.g, textColor.b)
    pdf.setFontSize(36)
    pdf.setFont('helvetica', 'normal')
    
    const bodyY = 250 + titleLines.length * 70 + 60
    const bodyLines = pdf.splitTextToSize(slide.body || '', width - 160)
    pdf.text(bodyLines, 80, bodyY)

    // Key point (if exists)
    if (slide.key_point) {
      const accentColor = hexToRgb(template.colors.accent)
      
      // Background bar
      pdf.setFillColor(accentColor.r, accentColor.g, accentColor.b, 0.1)
      pdf.rect(60, height - 200, width - 120, 100, 'F')
      
      // Accent line
      pdf.setFillColor(accentColor.r, accentColor.g, accentColor.b)
      pdf.rect(60, height - 200, 6, 100, 'F')
      
      // Key point text
      pdf.setTextColor(accentColor.r, accentColor.g, accentColor.b)
      pdf.setFontSize(32)
      pdf.setFont('helvetica', 'bold')
      const keyPointLines = pdf.splitTextToSize(slide.key_point, width - 200)
      pdf.text(keyPointLines, 90, height - 155)
    }
  })

  // Return as Buffer
  const pdfOutput = pdf.output('arraybuffer')
  return Buffer.from(pdfOutput)
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}
