// Database types for Suflate
// These types reflect the actual database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'archived' | 'deleted'
export type VariationType = 'professional' | 'personal' | 'actionable' | 'discussion' | 'bold'
export type SourceType = 'voice' | 'repurpose_blog' | 'repurpose_tweet' | 'repurpose_youtube' | 'repurpose_pdf' | 'manual'
export type WorkspacePlan = 'starter' | 'creator' | 'agency' | 'enterprise'
export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer'
export type RecordingStatus = 'uploaded' | 'transcribing' | 'transcribed' | 'failed'
export type AmplificationStatus = 'processing' | 'completed' | 'failed'
export type NotificationMethod = 'email' | 'push' | 'both' | 'none'

// Workspace posting schedule (Story 4.3)
export interface PostingSchedule {
  days: number[]  // 1-7 (Monday = 1, Sunday = 7)
  times: string[] // ["09:00", "12:00", "17:00"]
  timezone: string // e.g., "America/New_York"
}

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          name: string
          owner_id: string | null
          plan: WorkspacePlan
          credits_total: number
          credits_remaining: number
          carousel_branding: Json | null
          posting_schedule: PostingSchedule | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id?: string | null
          plan?: WorkspacePlan
          credits_total?: number
          credits_remaining?: number
          carousel_branding?: Json | null
          posting_schedule?: PostingSchedule | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string | null
          plan?: WorkspacePlan
          credits_total?: number
          credits_remaining?: number
          carousel_branding?: Json | null
          posting_schedule?: PostingSchedule | null
          created_at?: string
          updated_at?: string
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: WorkspaceRole
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: WorkspaceRole
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: WorkspaceRole
          created_at?: string
        }
      }
      voice_recordings: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          storage_path: string
          file_size_bytes: number
          duration_seconds: number | null
          status: RecordingStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          storage_path: string
          file_size_bytes: number
          duration_seconds?: number | null
          status?: RecordingStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          storage_path?: string
          file_size_bytes?: number
          duration_seconds?: number | null
          status?: RecordingStatus
          created_at?: string
          updated_at?: string
        }
      }
      transcriptions: {
        Row: {
          id: string
          recording_id: string
          workspace_id: string
          raw_text: string
          processed_text: string | null
          detected_language: string | null
          detected_content_type: string | null
          transcription_model: string
          confidence: number | null
          word_count: number | null
          character_count: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          recording_id: string
          workspace_id: string
          raw_text: string
          processed_text?: string | null
          detected_language?: string | null
          detected_content_type?: string | null
          transcription_model?: string
          confidence?: number | null
          word_count?: number | null
          character_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          recording_id?: string
          workspace_id?: string
          raw_text?: string
          processed_text?: string | null
          detected_language?: string | null
          detected_content_type?: string | null
          transcription_model?: string
          confidence?: number | null
          word_count?: number | null
          character_count?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      amplification_jobs: {
        Row: {
          id: string
          transcription_id: string
          workspace_id: string
          status: AmplificationStatus
          model_used: string | null
          usage_tokens: number | null
          error_message: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          transcription_id: string
          workspace_id: string
          status?: AmplificationStatus
          model_used?: string | null
          usage_tokens?: number | null
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          transcription_id?: string
          workspace_id?: string
          status?: AmplificationStatus
          model_used?: string | null
          usage_tokens?: number | null
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
      posts: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          transcription_id: string
          amplification_job_id: string | null
          source_type: SourceType
          variation_type: VariationType
          content: string
          title: string | null
          tags: string[]
          status: PostStatus
          word_count: number | null
          character_count: number | null
          scheduled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          transcription_id: string
          amplification_job_id?: string | null
          source_type?: SourceType
          variation_type: VariationType
          content: string
          title?: string | null
          tags?: string[]
          status?: PostStatus
          word_count?: number | null
          character_count?: number | null
          scheduled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          transcription_id?: string
          amplification_job_id?: string | null
          source_type?: SourceType
          variation_type?: VariationType
          content?: string
          title?: string | null
          tags?: string[]
          status?: PostStatus
          word_count?: number | null
          character_count?: number | null
          scheduled_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      scheduled_posts: {
        Row: {
          id: string
          post_id: string
          workspace_id: string
          user_id: string
          scheduled_for: string
          notification_method: NotificationMethod
          notification_sent: boolean
          notification_sent_at: string | null
          posted: boolean
          posted_at: string | null
          linkedin_post_id: string | null
          post_url: string | null
          is_company_page: boolean
          error_message: string | null
          retry_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          workspace_id: string
          user_id: string
          scheduled_for: string
          notification_method?: NotificationMethod
          notification_sent?: boolean
          notification_sent_at?: string | null
          posted?: boolean
          posted_at?: string | null
          linkedin_post_id?: string | null
          post_url?: string | null
          is_company_page?: boolean
          error_message?: string | null
          retry_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          workspace_id?: string
          user_id?: string
          scheduled_for?: string
          notification_method?: NotificationMethod
          notification_sent?: boolean
          notification_sent_at?: string | null
          posted?: boolean
          posted_at?: string | null
          linkedin_post_id?: string | null
          post_url?: string | null
          is_company_page?: boolean
          error_message?: string | null
          retry_count?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_posts: {
        Args: {
          p_workspace_id: string
          p_search_term?: string
          p_status?: string
          p_source_type?: string
          p_variation_type?: string
          p_tags?: string[]
          p_limit?: number
          p_offset?: number
        }
        Returns: Database['public']['Tables']['posts']['Row'][]
      }
    }
    Enums: {
      post_status: PostStatus
      variation_type: VariationType
      source_type: SourceType
      workspace_plan: WorkspacePlan
      workspace_role: WorkspaceRole
      recording_status: RecordingStatus
      amplification_status: AmplificationStatus
    }
  }
}

// Helper types for common use cases
export type Post = Database['public']['Tables']['posts']['Row']
export type PostInsert = Database['public']['Tables']['posts']['Insert']
export type PostUpdate = Database['public']['Tables']['posts']['Update']

export type Workspace = Database['public']['Tables']['workspaces']['Row']
export type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row']

export type VoiceRecording = Database['public']['Tables']['voice_recordings']['Row']
export type Transcription = Database['public']['Tables']['transcriptions']['Row']
export type AmplificationJob = Database['public']['Tables']['amplification_jobs']['Row']

// Draft type for the drafts list (with joined data)
export interface DraftWithSource extends Post {
  transcriptions?: Transcription & {
    voice_recordings?: VoiceRecording
  }
}

// Scheduled post types (Epic 4)
export type ScheduledPost = Database['public']['Tables']['scheduled_posts']['Row']
export type ScheduledPostInsert = Database['public']['Tables']['scheduled_posts']['Insert']
export type ScheduledPostUpdate = Database['public']['Tables']['scheduled_posts']['Update']

// Scheduled post with joined post data
export interface ScheduledPostWithDetails extends ScheduledPost {
  posts?: Post
}
