import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { repurposeContent } from '@/lib/integrations/openrouter'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { randomUUID } from 'crypto'
import { extractText } from 'unpdf'

// Use unpdf for PDF text extraction (better Next.js compatibility)
async function parsePdf(buffer: Buffer): Promise<{ text: string; numpages: number }> {
  // Convert Buffer to Uint8Array as required by unpdf
  const uint8Array = new Uint8Array(buffer)
  // Use mergePages: true to get text as a single string
  const result = await extractText(uint8Array, { mergePages: true })
  return {
    text: result.text,
    numpages: result.totalPages,
  }
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
 * POST /api/suflate/repurpose/pdf
 * Story 6.4: Upload PDF and Extract Key Points
 * 
 * Extracts text from PDF and generates 3 LinkedIn post variations
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'PDF file is required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Resolve selected or default workspace
    const workspaceId = await (await import('@/lib/suflate/workspaces/service')).getOrCreateWorkspaceId(request, { id: user.id, email: user.email })

    // Convert file to buffer and extract text
    let extractedText: string
    let pageCount: number

    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const pdfData = await parsePdf(buffer)
      
      extractedText = pdfData.text
      pageCount = pdfData.numpages
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError)
      return NextResponse.json(
        { error: 'Failed to parse PDF. The file may be corrupted or password-protected.' },
        { status: 400 }
      )
    }

    // Clean up extracted text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (extractedText.length < 100) {
      return NextResponse.json(
        { error: 'Could not extract enough text from the PDF. It may be scanned or image-based.' },
        { status: 400 }
      )
    }

    // Limit text length for API
    const maxTextLength = 15000
    if (extractedText.length > maxTextLength) {
      extractedText = extractedText.slice(0, maxTextLength) + '...'
    }

    // Extract title from filename
    const title = file.name.replace('.pdf', '').replace(/[-_]/g, ' ')

    // Upload PDF to storage (optional, for reference)
    const pdfId = randomUUID()
    const storagePath = `workspaces/${workspaceId}/repurpose/${pdfId}.pdf`
    
    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      await supabase.storage
        .from('documents')
        .upload(storagePath, buffer, {
          contentType: 'application/pdf',
          upsert: true,
        })
    } catch (storageError) {
      // Storage is optional, continue without it
      console.error('PDF storage error (non-fatal):', storageError)
    }

    // Generate LinkedIn post variations
    let repurposeResult
    try {
      repurposeResult = await repurposeContent(extractedText, {
        sourceType: 'pdf',
        title,
      })
    } catch (error) {
      console.error('OpenRouter error:', error)
      return NextResponse.json(
        { error: 'Failed to generate posts: ' + (error instanceof Error ? error.message : 'Unknown error') },
        { status: 500 }
      )
    }

    const variations = repurposeResult.variations || []

    if (variations.length === 0) {
      return NextResponse.json(
        { error: 'No variations generated' },
        { status: 500 }
      )
    }

    // Create post records
    const posts: any[] = []
    // Use valid variation_type values from database constraint
    const variationTypes = ['professional', 'personal', 'actionable']

    for (let i = 0; i < Math.min(variations.length, 3); i++) {
      const postId = randomUUID()
      const content = variations[i]
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          id: postId,
          workspace_id: workspaceId,
          user_id: user.id,
          source_type: 'repurpose_pdf',
          content: content,
          title: `${title} - Variation ${i + 1}`,
          variation_type: variationTypes[i] || 'professional',
          status: 'draft',
          word_count: content.split(/\s+/).length,
          character_count: content.length,
          tags: ['pdf', 'repurposed'],
        })
        .select()
        .single()

      if (postError) {
        console.error('Error creating post:', postError)
      } else if (post) {
        posts.push(post)
      }
    }

    if (posts.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create posts' },
        { status: 500 }
      )
    }

    // TODO: Deduct 5 credits

    return NextResponse.json({
      success: true,
      posts,
      pdfInfo: {
        filename: file.name,
        pageCount,
        textLength: extractedText.length,
      },
      usage: repurposeResult.usage,
    })
  } catch (error) {
    console.error('PDF repurpose error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
