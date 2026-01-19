// Test data factories for creating mock entities

export const createMockRecording = (overrides: any = {}) => ({
  id: 'test-recording-id',
  workspace_id: 'test-workspace-id',
  user_id: 'test-user-id',
  storage_path: 'workspaces/test/voice-recordings/user/123-recording.webm',
  duration_seconds: 120,
  file_size_bytes: 1024000,
  status: 'uploaded',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createMockTranscription = (overrides: any = {}) => ({
  id: 'test-transcription-id',
  recording_id: 'test-recording-id',
  workspace_id: 'test-workspace-id',
  raw_text: 'This is a test transcription of the voice recording.',
  processed_text: 'This is a test transcription of the voice recording.',
  detected_language: 'en',
  detected_content_type: 'lesson',
  transcription_model: 'assemblyai',
  created_at: new Date().toISOString(),
  ...overrides,
})

export const createMockPost = (overrides: any = {}) => ({
  id: 'test-post-id',
  workspace_id: 'test-workspace-id',
  user_id: 'test-user-id',
  transcription_id: 'test-transcription-id',
  source_type: 'voice',
  content: 'This is a test LinkedIn post generated from voice.',
  variation_type: 'professional',
  status: 'draft',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})
