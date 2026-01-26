import { notFound } from 'next/navigation'
import { createServiceClient } from '@/utils/supabase/service'
import { PublicVoiceRecorder } from '@/components/features/voice-notes/public-voice-recorder'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Public Voice Recording Page
 * Accessible without authentication - allows anyone with the link to record a voice note
 */
export default async function PublicVoiceRecordingPage({ params }: PageProps) {
  const { id } = await params
  
  // Use service client to bypass RLS for public page
  const serviceClient = createServiceClient()
  
  const { data: linkData, error } = await serviceClient
    .from('public_voice_links')
    .select(`
      id,
      questions,
      status,
      created_at,
      users (
        email
      )
    `)
    .eq('id', id)
    .single() as { data: { id: string; questions?: string; status: string; created_at: string; users?: { email?: string } } | null; error: any }

  // If link not found or expired, show 404
  if (error || !linkData) {
    // For now, show the page anyway with default values
    // In production, you'd want to properly handle this
    return (
      <PublicVoiceRecorder 
        linkId={id}
        requesterEmail={undefined}
        questions={undefined}
      />
    )
  }

  // Check if link is still active
  if (linkData.status === 'completed' || linkData.status === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Link Expired
          </h1>
          <p className="text-gray-500">
            This voice recording link is no longer active.
          </p>
        </div>
      </div>
    )
  }

  return (
    <PublicVoiceRecorder 
      linkId={id}
      requesterEmail={linkData.users?.email}
      questions={linkData.questions}
    />
  )
}

// Allow this page to be accessed without authentication
export const dynamic = 'force-dynamic'
