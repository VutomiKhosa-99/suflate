import { AssemblyAI } from 'assemblyai'

const assemblyai = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
})

interface TranscriptionResult {
  text: string
  words?: Array<{ text: string; start: number; end: number; confidence: number }>
  language_code?: string
}

/**
 * Transcribe audio file from URL (Supabase Storage URL) via AssemblyAI
 * Story 1.3: Transcribe Voice Note via AssemblyAI
 */
export async function transcribeAudioFromUrl(audioUrl: string): Promise<TranscriptionResult> {
  try {
    const transcript = await assemblyai.transcripts.submit({
      audio: audioUrl,
      sentiment_analysis: false,
      auto_chapters: false,
      auto_highlights: false,
      entity_detection: false,
      iab_categories: false,
      speaker_diarization: false, // Can be enabled for future features
      summarization: false,
      content_safety: false,
      auto_punctuation: true,
      format_text: true,
    })

    // Wait for transcription to complete if it's queued/processing
    let finalTranscript = transcript
    if (transcript.status === 'queued' || transcript.status === 'processing') {
      // Poll for completion (in production, use webhooks for better UX)
      finalTranscript = await assemblyai.transcripts.get(transcript.id)
    }

    if (finalTranscript.status === 'completed') {
      return {
        text: finalTranscript.text || '',
        words: finalTranscript.words,
        language_code: finalTranscript.language_code,
      }
    } else if (finalTranscript.status === 'failed') {
      throw new Error(`AssemblyAI transcription failed: ${finalTranscript.error}`)
    } else {
      // Still processing
      throw new Error(`AssemblyAI transcription is still ${finalTranscript.status}. This function expects a completed transcript.`)
    }
  } catch (error) {
    console.error('Error transcribing audio with AssemblyAI:', error)
    throw error
  }
}

// Legacy function names for backward compatibility
export async function transcribeAudio(audioUrl: string, options?: {
  language?: string
  autoPunctuation?: boolean
  formatText?: boolean
}) {
  const result = await transcribeAudioFromUrl(audioUrl)
  return {
    text: result.text,
    words: result.words,
    confidence: undefined, // Not available in current API
    language: result.language_code,
  }
}

export default assemblyai
