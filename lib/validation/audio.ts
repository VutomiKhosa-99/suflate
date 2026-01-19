// Audio file validation utilities

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_DURATION_SECONDS = 180 // 3 minutes
const MIN_DURATION_SECONDS = 1 // 1 second

export const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/m4a',
  'audio/mp4',
]

export interface AudioValidationResult {
  valid: boolean
  error?: string
  duration?: number
}

/**
 * Validate audio file before upload
 */
export async function validateAudioFile(file: File): Promise<AudioValidationResult> {
  // Validate file type
  if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Allowed: MP3, WAV, WebM, OGG, M4A',
    }
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
    }
  }

  // Try to get duration (browser API)
  let duration: number | undefined
  try {
    duration = await getAudioDuration(file)
    
    if (duration && duration < MIN_DURATION_SECONDS) {
      return {
        valid: false,
        error: `Audio file is too short. Minimum duration: ${MIN_DURATION_SECONDS} second`,
      }
    }

    if (duration && duration > MAX_DURATION_SECONDS) {
      return {
        valid: false,
        error: `Audio file exceeds maximum duration of ${MAX_DURATION_SECONDS} seconds (3 minutes)`,
      }
    }
  } catch (error) {
    // Duration detection may fail, but we'll still allow upload
    // Duration will be validated during transcription
    console.warn('Could not determine audio duration:', error)
  }

  return {
    valid: true,
    duration,
  }
}

/**
 * Get audio file duration using HTML5 Audio API
 */
async function getAudioDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const audio = document.createElement('audio')
    const url = URL.createObjectURL(file)

    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url)
      const duration = Math.ceil(audio.duration)
      resolve(duration)
    })

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url)
      resolve(undefined) // Duration detection failed
    })

    audio.src = url
  })
}

export { MAX_FILE_SIZE, MAX_DURATION_SECONDS, MIN_DURATION_SECONDS }
