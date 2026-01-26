import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { getWorkspaceId } from '@/lib/suflate/workspaces/service'
import { getTemplate } from '@/lib/carousel-templates'
import { jsPDF } from 'jspdf'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Service client to bypass RLS
function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * POST /api/suflate/carousels/[id]/export
 * Story 5.6: Export Carousel as PDF
 * 
 * Generates a PDF from the carousel slides and returns it as a download
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()

    // Resolve selected workspace (do NOT create)
    const workspaceId = await getWorkspaceId(request, { id: user.id, email: user.email })
    if (!workspaceId) return NextResponse.json({ error: 'No workspace selected' }, { status: 400 })

    // Fetch carousel
    const { data: carousel, error: fetchError } = await supabase
      .from('carousels')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !carousel) {
      return NextResponse.json({ error: 'Carousel not found' }, { status: 404 })
    }

    if (carousel.workspace_id !== workspaceId) {
      return NextResponse.json({ error: 'Carousel does not belong to selected workspace' }, { status: 403 })
    }

    const template = getTemplate(carousel.template_type)
    const slides = carousel.slide_data || []

    if (slides.length === 0) {
      return NextResponse.json(
        { error: 'Carousel has no slides' },
        { status: 400 }
      )
    }

    // Generate PDF
    const pdfBuffer = generateCarouselPDF(slides, template, carousel.title)
    
    // Create filename
    const safeTitle = (carousel.title || 'carousel')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase()
      .slice(0, 50)
    const fileName = `${safeTitle}-${id.slice(0, 8)}.pdf`

    // Update carousel status (ensure workspace match)
    await supabase
      .from('carousels')
      .update({
        pdf_generated_at: new Date().toISOString(),
        status: 'ready',
      })
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('Carousel export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Generate PDF from carousel slides using jsPDF
 */
function generateCarouselPDF(
  slides: any[],
  template: any,
  title: string
): ArrayBuffer {
  // Create PDF with square pages (1080x1080 points = 381mm x 381mm)
  // Using a more standard size that works well for LinkedIn carousels
  const pageWidth = 297 // A4 width in mm but square
  const pageHeight = 297 // Square format
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageWidth, pageHeight],
  })

  // Convert hex color to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [0, 0, 0]
  }

  const padding = 20
  const contentWidth = pageWidth - padding * 2
  
  slides.forEach((slide, index) => {
    if (index > 0) {
      doc.addPage([pageWidth, pageHeight])
    }

    // Background
    const bgColor = hexToRgb(template.colors.background)
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2])
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    let yPos = padding

    // Slide number
    const secondaryColor = hexToRgb(template.colors.secondary)
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.setFontSize(14)
    doc.text(`${slide.slide_number}`, padding, yPos + 5)
    yPos += 15

    // Title
    const primaryColor = hexToRgb(template.colors.primary)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    
    const titleLines = doc.splitTextToSize(slide.title || '', contentWidth)
    doc.text(titleLines, padding, yPos + 8)
    yPos += titleLines.length * 10 + 15

    // Body
    const textColor = hexToRgb(template.colors.text)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    
    const bodyLines = doc.splitTextToSize(slide.body || '', contentWidth)
    const maxBodyLines = Math.min(bodyLines.length, 12) // Limit lines to fit
    doc.text(bodyLines.slice(0, maxBodyLines), padding, yPos + 5)
    yPos += maxBodyLines * 6 + 20

    // Key point (at bottom)
    if (slide.key_point) {
      const keyPointY = pageHeight - padding - 25
      
      // Background box for key point
      const accentColor = hexToRgb(template.colors.accent)
      
      const keyPointLines = doc.splitTextToSize(slide.key_point, contentWidth - 15)
      const boxHeight = keyPointLines.length * 6 + 12
      
      // Draw accent line on left
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2])
      doc.rect(padding, keyPointY - 5, 3, boxHeight, 'F')
      
      // Light background (use a lighter version of accent color)
      doc.setFillColor(
        Math.min(255, accentColor[0] + 180),
        Math.min(255, accentColor[1] + 180),
        Math.min(255, accentColor[2] + 180)
      )
      doc.rect(padding + 3, keyPointY - 5, contentWidth - 3, boxHeight, 'F')
      
      // Key point text
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.setFontSize(12)
      doc.text(keyPointLines, padding + 10, keyPointY + 4)
    }
  })

  // Return as ArrayBuffer
  return doc.output('arraybuffer')
}
