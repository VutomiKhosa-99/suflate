const ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2'

interface TranscriptionResult {
  text: string
  words?: Array<{ text: string; start: number; end: number; confidence: number }>
  language_code?: string
}

interface AssemblyAITranscript {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'error'
  text?: string
  words?: Array<{ text: string; start: number; end: number; confidence: number }>
  language_code?: string
  error?: string
}

/**
 * Transcribe audio file from URL (Supabase Storage URL) via AssemblyAI
 * Story 1.3: Transcribe Voice Note via AssemblyAI
 * 
 * Using REST API directly for better control and debugging
 */
export async function transcribeAudioFromUrl(audioUrl: string): Promise<TranscriptionResult> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY
  if (!apiKey) {
    throw new Error('ASSEMBLYAI_API_KEY environment variable is not set')
  }
  
  console.log('Transcribing audio from URL:', audioUrl)
  console.log('API Key (first 8 chars):', apiKey.substring(0, 8) + '...')
  
  try {
    // Submit transcription request
    const submitResponse = await fetch(`${ASSEMBLYAI_API_URL}/transcript`, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        punctuate: true,
        format_text: true,
      }),
    })
    
    if (!submitResponse.ok) {
      const errorText = await submitResponse.text()
      console.error('AssemblyAI submit error:', submitResponse.status, errorText)
      throw new Error(`AssemblyAI API error: ${submitResponse.status} - ${errorText}`)
    }
    
    const transcript: AssemblyAITranscript = await submitResponse.json()
    console.log('Transcription submitted, ID:', transcript.id, 'Status:', transcript.status)
    
    // Poll for completion (wait up to 5 minutes)
    const maxAttempts = 60
    const pollInterval = 5000 // 5 seconds
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const pollResponse = await fetch(`${ASSEMBLYAI_API_URL}/transcript/${transcript.id}`, {
        headers: {
          'Authorization': apiKey,
        },
      })
      
      if (!pollResponse.ok) {
        const errorText = await pollResponse.text()
        throw new Error(`AssemblyAI polling error: ${pollResponse.status} - ${errorText}`)
      }
      
      const result: AssemblyAITranscript = await pollResponse.json()
      console.log(`Transcription status: ${result.status} (attempt ${attempt + 1}/${maxAttempts})`)
      
      if (result.status === 'completed') {
        console.log('Transcription completed successfully')
        return {
          text: result.text || '',
          words: result.words,
          language_code: result.language_code,
        }
      } else if (result.status === 'error') {
        throw new Error(`AssemblyAI transcription failed: ${result.error}`)
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }
    
    throw new Error('Transcription timed out after 5 minutes')
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
