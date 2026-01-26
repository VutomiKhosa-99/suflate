import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/utils/supabase/auth-helper'
import { getWorkspaceId } from '@/lib/suflate/workspaces/service'
import { randomUUID } from 'crypto'

// Service client to bypass RLS for uploads
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Media type configurations
const MEDIA_CONFIG = {
  image: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    bucket: 'post-media',
    folder: 'images',
  },
  video: {
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    maxSize: 50 * 1024 * 1024, // 50MB
    bucket: 'post-media',
    folder: 'videos',
  },
  document: {
    mimeTypes: ['application/pdf'],
    maxSize: 10 * 1024 * 1024, // 10MB
    bucket: 'post-media',
    folder: 'documents',
  },
}

/**
 * POST /api/suflate/media/upload
 * 
 * Uploads media files (images, videos, PDFs) to Supabase storage
 * for use in LinkedIn posts
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { user, error: authError } = await getAuthUser(request)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as 'image' | 'video' | 'document' | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!type || !MEDIA_CONFIG[type]) {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 })
    }

    const config = MEDIA_CONFIG[type]

    // Validate file type
    if (!config.mimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${config.mimeTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > config.maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${config.maxSize / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Resolve selected workspace (do NOT create)
    const workspaceId = await getWorkspaceId(request, { id: user.id, email: user.email })
    if (!workspaceId) return NextResponse.json({ error: 'No workspace selected' }, { status: 400 })

    // Generate unique file path (scoped by workspace)
    const fileId = randomUUID()
    const ext = file.name.split('.').pop() || getExtension(file.type)
    const fileName = `${fileId}.${ext}`
    const filePath = `${workspaceId}/${user.id}/${config.folder}/${fileName}`

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to Supabase Storage
    const supabase = getServiceClient()

    // Ensure bucket exists (create if not)
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === config.bucket)
    
    if (!bucketExists) {
      const { error: createBucketError } = await supabase.storage.createBucket(config.bucket, {
        public: true,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB max
        allowedMimeTypes: [
          ...MEDIA_CONFIG.image.mimeTypes,
          ...MEDIA_CONFIG.video.mimeTypes,
          ...MEDIA_CONFIG.document.mimeTypes,
        ],
      })
      
      if (createBucketError && !createBucketError.message.includes('already exists')) {
        console.error('Failed to create bucket:', createBucketError)
        return NextResponse.json(
          { error: 'Storage configuration error' },
          { status: 500 }
        )
      }
    }

    // Upload file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(config.bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(config.bucket)
      .getPublicUrl(filePath)

    // Return success response
    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      type,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    })
  } catch (error) {
    console.error('Media upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper to get file extension from MIME type
function getExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'application/pdf': 'pdf',
  }
  return extensions[mimeType] || 'bin'
}
