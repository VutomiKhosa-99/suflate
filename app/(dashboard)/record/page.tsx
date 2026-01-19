'use client'

import { VoiceRecorder } from '@/components/features/voice-recorder/voice-recorder'

/**
 * Screen 3: Voice Recording - Capture raw thought
 * Mobile-first, minimal chrome, maximum focus
 */
export default function RecordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900">
            Record Your Voice
          </h1>
          <p className="text-lg text-gray-600">
            Speak naturally for up to 3 minutes. We'll turn your thoughts into LinkedIn posts.
          </p>
        </div>
        <VoiceRecorder />
      </div>
    </div>
  )
}
