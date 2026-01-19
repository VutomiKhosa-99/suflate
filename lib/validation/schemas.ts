import { z } from 'zod'

// Voice recording validation
export const voiceRecordingSchema = z.object({
  duration: z.number().min(1).max(180), // 1 second to 3 minutes
  fileSize: z.number().max(10 * 1024 * 1024), // 10MB max
  mimeType: z.enum(['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg']),
})

// Post content validation
export const postContentSchema = z.object({
  content: z.string().min(1).max(3000), // LinkedIn post limit
  variationType: z.enum(['professional', 'personal', 'actionable', 'discussion', 'bold']).optional(),
})

// Workspace validation
export const workspaceSchema = z.object({
  name: z.string().min(1).max(100),
  plan: z.enum(['starter', 'creator', 'agency', 'enterprise']),
})

export type VoiceRecording = z.infer<typeof voiceRecordingSchema>
export type PostContent = z.infer<typeof postContentSchema>
export type Workspace = z.infer<typeof workspaceSchema>
