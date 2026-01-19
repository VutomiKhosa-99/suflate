---
stepsCompleted: [validate-prerequisites, design-epics, create-stories, final-validation]
inputDocuments: [product-brief.md, prd.md, architecture.md, ftux.md, prompt-system.md, homepage-copy.md]
workflowType: 'epics-and-stories'
project_name: 'suflate'
user_name: 'Vutomi'
date: '2026-01-19'
---

# Suflate - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Suflate MVP, decomposing the requirements from the PRD, Architecture, FTUX, and other planning documents into implementable stories.

The Suflate MVP focuses on validating the core value proposition: **voice-first creation reduces friction and increases publishing consistency** while preserving the creator's authentic voice.

---

## Requirements Inventory

### Functional Requirements (from PRD)

**Phase 1 - MVP:**
- Voice recording (up to 3 minutes)
- Transcription (AssemblyAI)
- Post generation (3-5 variations via Suflate amplification)
- Editing & AI assistance (opt-in)
- Draft management
- Scheduling & posting (personal profiles via share flow, company pages via API)
- Basic analytics (views, likes, comments)

**Phase 2 - Creator Growth:**
- Carousel creator (5 templates)
- Content repurposing (blog, tweet → LinkedIn posts)
- Enhanced analytics

**Phase 3 - Agencies & Teams:**
- Multi-workspace management
- Role-based access
- Client review & approval

### Non-Functional Requirements

- Mobile-optimized UI
- Fast load times (<2s initial load)
- Secure authentication (Supabase Auth)
- GDPR-compliant data handling
- Zero infrastructure costs (free tiers only)
- Solo founder maintainability

### Additional Requirements

- FTUX: Complete first post in under 10 minutes
- Voice preservation: Output must sound like the user
- Credit system: Track usage per workspace
- Workspace isolation: RLS enforcement

---

## Epic List

### Epic 1: Voice-to-Post Core - Suflate Amplification
**Priority:** HIGHEST  
**Goal:** Enable users to record voice notes and get multiple LinkedIn post variations via Suflate amplification  
**FRs covered:** Voice recording, Transcription, Post generation, Voice preservation  
**Story Points:** 89

### Epic 2: Authentication & Workspace Management
**Priority:** HIGH  
**Goal:** Secure user accounts with workspace organization for solo creators and agencies  
**FRs covered:** Authentication, Workspace creation, LinkedIn OAuth  
**Story Points:** 34

### Epic 3: Draft Management
**Priority:** MEDIUM  
**Goal:** Organize and refine amplified posts before publishing  
**FRs covered:** Draft management, Editing, Content organization  
**Story Points:** 21

### Epic 4: Post Scheduling
**Priority:** MEDIUM  
**Goal:** Schedule posts for consistent publishing without manual intervention  
**FRs covered:** Scheduling, LinkedIn integration, Notifications  
**Story Points:** 34

### Epic 5: Carousel Amplification
**Priority:** MEDIUM  
**Goal:** Convert voice notes into LinkedIn carousel content  
**FRs covered:** Carousel creator, PDF generation  
**Story Points:** 55

### Epic 6: Content Repurposing
**Priority:** LOW  
**Goal:** Repurpose existing content into LinkedIn posts via Suflate  
**FRs covered:** Content repurposing, Blog/tweet conversion  
**Story Points:** 34

### Epic 7: Agency Workspace Features
**Priority:** LOW (Post-MVP)  
**Goal:** Multi-client workspace management for agencies  
**FRs covered:** Multi-workspace, Role-based access, Workspace isolation  
**Story Points:** 55

### Epic 8: Credit & Subscription Management
**Priority:** HIGH  
**Goal:** Track usage, manage credits, and handle subscriptions  
**FRs covered:** Credit system, Subscription management, Usage tracking  
**Story Points:** 34

### Epic 9: Analytics (Post-MVP)
**Priority:** LOW  
**Goal:** Track post performance and optimize content strategy  
**FRs covered:** Analytics, Performance tracking  
**Story Points:** 34

**Total MVP Story Points:** 336 (Epics 1-8, excluding Epic 9)

---

## Epic 1: Voice-to-Post Core - Suflate Amplification

**Priority:** HIGHEST  
**Goal:** As a creator, I want to record voice notes and get multiple LinkedIn post variations via Suflate amplification, so I can overcome writer's block and post consistently.

**Dependencies:** Epic 2 (Authentication) must be completed first  
**Technical Notes:** Core Suflate amplification engine, AssemblyAI integration, OpenRouter integration, voice preservation prompts

### Story 1.1: Record Voice Note (Up to 3 Minutes)

As a user,  
I want to record a voice note up to 3 minutes,  
So that I can capture my thoughts naturally without typing.

**Acceptance Criteria:**

**Given** I am logged in and on the recording screen  
**When** I tap the record button  
**Then** recording starts immediately  
**And** I see a timer counting up to 3:00 maximum  
**And** I can see a waveform visualization while recording  
**And** I can pause and resume recording  
**And** I can stop recording at any time  
**And** I can play back the recording before submitting

**Given** I have recorded a voice note  
**When** the recording exceeds 3 minutes  
**Then** recording automatically stops at 3:00  
**And** I see a notification that the maximum duration was reached

**Story Points:** 8  
**Dependencies:** None  
**Technical Notes:**
- Use browser MediaRecorder API for client-side recording
- Store audio as blob, upload to Supabase Storage after recording stops
- Create `voice_recordings` record with status 'uploaded'
- File path: `workspaces/{workspace_id}/voice-recordings/{user_id}/{timestamp}-{recording_id}.mp3`
- Validate file size (max 10MB) and format (MP3, WAV, M4A, OGG)

### Story 1.2: Upload Existing Audio File

As a user,  
I want to upload an existing audio file,  
So that I can use recordings from other devices or apps.

**Acceptance Criteria:**

**Given** I am on the recording screen  
**When** I tap "Upload audio file"  
**Then** I can select an audio file from my device  
**And** the file is validated (format, size, duration)  
**And** the file is uploaded to Supabase Storage  
**And** a `voice_recordings` record is created  
**And** I can see the file duration and playback controls

**Given** I upload an invalid file  
**When** the file exceeds 10MB or is not a supported format  
**Then** I see an error message  
**And** I can try uploading again

**Story Points:** 5  
**Dependencies:** Story 1.1  
**Technical Notes:**
- File input with accept="audio/*"
- Client-side validation before upload
- Upload to Supabase Storage via `/api/suflate/voice/upload`
- Validate duration (1 second to 3 minutes)

### Story 1.3: Transcribe Voice Note via AssemblyAI

As a user,  
I want my voice note transcribed automatically,  
So that I can review what was captured before amplification.

**Acceptance Criteria:**

**Given** I have uploaded a voice note  
**When** transcription starts automatically  
**Then** I see a processing state with "Transcribing your voice…"  
**And** the `voice_recordings` status updates to 'transcribing'  
**And** AssemblyAI API is called with the audio file  
**And** transcription result is stored in `transcriptions` table  
**And** the `voice_recordings` status updates to 'transcribed'  
**And** I can see the raw transcript text  
**And** I can see detected language and content type

**Given** transcription fails  
**When** AssemblyAI API returns an error  
**Then** I see an error message  
**And** I can retry transcription  
**And** credits are not deducted on failure

**Story Points:** 13  
**Dependencies:** Story 1.1  
**Technical Notes:**
- API route: `/api/suflate/voice/transcribe`
- Call AssemblyAI async transcription API
- Store transcript in `transcriptions` table with:
  - `raw_text` (full transcript)
  - `processed_text` (cleaned, with punctuation)
  - `detected_language`
  - `detected_content_type` (story, lesson, opinion, tactic)
- Deduct 1 credit per minute (rounded up)
- Update `credits` table with usage record
- Cache transcription result for similar audio

### Story 1.4: Edit Transcription Before Amplification

As a user,  
I want to edit the transcription before amplification,  
So that I can correct any errors or clarify my thoughts.

**Acceptance Criteria:**

**Given** I have a transcribed voice note  
**When** I view the transcript  
**Then** I see an editable text field with the transcript  
**And** I can edit any part of the text  
**And** changes are saved automatically  
**And** I can see word count and character count  
**And** I can proceed to amplification when ready

**Given** I edit the transcript  
**When** I save changes  
**Then** the `transcriptions.processed_text` is updated  
**And** my edited version is used for amplification

**Story Points:** 5  
**Dependencies:** Story 1.3  
**Technical Notes:**
- Inline text editor component
- Auto-save on blur or after 2 seconds of inactivity
- Update `transcriptions.processed_text` field
- Preserve `raw_text` for reference

### Story 1.5: Amplify Voice Note into 5 Post Variations

As a user,  
I want to amplify my voice note into 5 post variations,  
So that I can choose the best format for my LinkedIn post.

**Acceptance Criteria:**

**Given** I have a transcribed voice note  
**When** I click "Amplify into posts"  
**Then** I see processing state "Structuring your thoughts…"  
**And** Suflate amplification engine processes the transcript  
**And** OpenRouter API is called with voice preservation prompts  
**And** 5 post variations are generated with different angles:
  - Professional thought leadership
  - Personal story
  - Actionable tips
  - Discussion starter
  - Bold opinion  
**And** each variation preserves my original voice and vocabulary  
**And** each variation is stored in `posts` table  
**And** an `amplification_jobs` record tracks the process  
**And** I see all 5 variations displayed with labels  
**And** 5 credits are deducted from my workspace balance

**Given** amplification fails  
**When** OpenRouter API returns an error  
**Then** I see an error message  
**And** I can retry amplification  
**And** credits are not deducted on failure

**Story Points:** 21  
**Dependencies:** Story 1.3, Story 1.4  
**Technical Notes:**
- API route: `/api/suflate/amplify/post`
- Use prompt system from `prompt-system.md`:
  - Layer 1: System prompt (voice preservation rules)
  - Layer 2: Context injection (transcript, content type)
  - Layer 3: Structure prompt (LinkedIn format)
  - Layer 4: Variation engine (5 different angles)
- Call OpenRouter API with model `anthropic/claude-3.5-sonnet`
- Generate 5 variations in single API call (or 5 separate calls)
- Store each variation in `posts` table with:
  - `variation_type` (professional, personal, actionable, discussion, bold)
  - `status` = 'draft'
  - `transcription_id` reference
- Create `amplification_jobs` record to track processing
- Cache results for similar transcriptions
- Implement voice drift safeguards (reject generic hooks, buzzwords)

### Story 1.6: View Post Variations with Labels

As a user,  
I want to see all generated post variations with clear labels,  
So that I can easily identify and compare different angles.

**Acceptance Criteria:**

**Given** I have amplified a voice note  
**When** I view the results screen  
**Then** I see all 5 variations displayed  
**And** each variation has a clear label (Story / Lesson / Opinion / Tips / Discussion)  
**And** each variation shows a preview of the first few lines  
**And** I can expand each variation to see full content  
**And** I can see which variation type each post represents  
**And** I can select a variation to edit or publish

**Story Points:** 5  
**Dependencies:** Story 1.5  
**Technical Notes:**
- Component: `PostVariations` in `/src/components/features/post-variations/`
- Display variations in card layout
- Show `variation_type` as badge/label
- Preview first 150 characters, expand on click
- Link to edit screen for each variation

### Story 1.7: Regenerate Post Variations

As a user,  
I want to regenerate variations if I don't like them,  
So that I can get different angles or structures.

**Acceptance Criteria:**

**Given** I have generated post variations  
**When** I click "Regenerate variations"  
**Then** I see a confirmation dialog  
**And** when I confirm, new variations are generated  
**And** old variations are archived (not deleted)  
**And** new variations replace the displayed set  
**And** 5 credits are deducted again  
**And** I can see both old and new variations in my drafts

**Story Points:** 8  
**Dependencies:** Story 1.5  
**Technical Notes:**
- Archive old variations by updating `posts.status` to 'archived'
- Generate new variations using same transcript
- Optionally use different temperature or variation prompts
- Track regeneration count in `amplification_jobs`

### Story 1.8: View Credit Usage During Process

As a user,  
I want to see my credit usage during the amplification process,  
So that I understand the cost of each operation.

**Acceptance Criteria:**

**Given** I am using Suflate features  
**When** I transcribe a voice note  
**Then** I see "1 credit per minute" displayed  
**And** I see my remaining credits update after transcription

**Given** I amplify a voice note  
**When** I generate post variations  
**Then** I see "5 credits per amplification" displayed  
**And** I see my remaining credits update after amplification  
**And** I see a credit usage breakdown in my workspace settings

**Story Points:** 5  
**Dependencies:** Epic 8 (Credit System)  
**Technical Notes:**
- Display credit cost before operation
- Show remaining credits from `workspaces.credits_remaining`
- Update display in real-time after operations
- Show credit history in workspace dashboard

### Story 1.9: Save Variations as Drafts

As a user,  
I want variations automatically saved as drafts,  
So that I can access them later for editing or publishing.

**Acceptance Criteria:**

**Given** I have generated post variations  
**When** variations are created  
**Then** each variation is automatically saved as a draft  
**And** drafts appear in my drafts list  
**And** I can access drafts from any screen  
**And** drafts are associated with the original voice note

**Story Points:** 3  
**Dependencies:** Story 1.5, Epic 3 (Draft Management)  
**Technical Notes:**
- Set `posts.status` = 'draft' on creation
- Link drafts to `voice_recordings` via `transcription_id`
- Display in drafts list with creation timestamp

### Story 1.10: Waveform Visualization During Recording

As a user,  
I want to see a waveform visualization while recording,  
So that I can see audio levels and know recording is working.

**Acceptance Criteria:**

**Given** I am recording a voice note  
**When** I speak into the microphone  
**Then** I see a real-time waveform visualization  
**And** the waveform responds to my voice levels  
**And** the visualization helps me know recording is active  
**And** the waveform is displayed prominently on the recording screen

**Story Points:** 8  
**Dependencies:** Story 1.1  
**Technical Notes:**
- Use Web Audio API to analyze audio levels
- Display waveform using canvas or SVG
- Update visualization in real-time (60fps)
- Component: `WaveformVisualizer` in voice recorder

### Story 1.11: Pause and Resume Recording

As a user,  
I want to pause and resume recording,  
So that I can take breaks or think between segments.

**Acceptance Criteria:**

**Given** I am recording a voice note  
**When** I tap the pause button  
**Then** recording pauses  
**And** timer stops counting  
**And** I see a paused state indicator  
**And** I can tap resume to continue recording  
**And** the total duration includes both segments  
**And** the waveform visualization pauses

**Story Points:** 5  
**Dependencies:** Story 1.1  
**Technical Notes:**
- Pause MediaRecorder API
- Maintain timer state across pause/resume
- Combine audio segments on stop
- Update UI to show paused state

---

## Epic 2: Authentication & Workspace Management

**Priority:** HIGH  
**Goal:** As a user, I want to create an account with workspace management, so I can organize my content (or client content for agencies).

**Dependencies:** None (foundational)  
**Technical Notes:** Supabase Auth, RLS policies, workspace isolation

### Story 2.1: Sign Up with Email/Password

As a new user,  
I want to sign up with email and password,  
So that I can create my Suflate account.

**Acceptance Criteria:**

**Given** I am on the signup page  
**When** I enter my email and password  
**And** I confirm my password  
**And** I click "Create account"  
**Then** my account is created via Supabase Auth  
**And** I receive an email verification link  
**And** I am redirected to email verification screen  
**And** a default workspace is created for me  
**And** I am assigned as workspace owner

**Given** I enter an invalid email or weak password  
**When** I try to sign up  
**Then** I see validation errors  
**And** I cannot create an account until errors are fixed

**Story Points:** 5  
**Dependencies:** None  
**Technical Notes:**
- Use Supabase Auth `signUp()` method
- Email verification required before full access
- Create default workspace in `workspaces` table
- Set `workspace_members` role to 'owner'
- RLS policies enforce workspace access

### Story 2.2: Sign Up with Google OAuth

As a new user,  
I want to sign up with Google OAuth,  
So that I can create an account quickly without a password.

**Acceptance Criteria:**

**Given** I am on the signup page  
**When** I click "Sign up with Google"  
**Then** Google OAuth flow initiates  
**And** I authenticate with Google  
**And** my account is created with Google email  
**And** a default workspace is created  
**And** I am logged in automatically  
**And** email verification is skipped (OAuth verified)

**Story Points:** 5  
**Dependencies:** Story 2.1  
**Technical Notes:**
- Configure Google OAuth in Supabase Auth
- Use Supabase Auth `signInWithOAuth({ provider: 'google' })`
- Extract email from OAuth response
- Create workspace same as email/password flow

### Story 2.3: Log In Securely

As a user,  
I want to log in securely,  
So that I can access my Suflate account.

**Acceptance Criteria:**

**Given** I have an account  
**When** I enter my email and password  
**And** I click "Log in"  
**Then** I authenticate via Supabase Auth  
**And** a session is created  
**And** I am redirected to my dashboard  
**And** I see my default workspace  
**And** I can access all my content

**Given** I enter incorrect credentials  
**When** I try to log in  
**Then** I see an error message  
**And** I cannot access my account

**Story Points:** 3  
**Dependencies:** Story 2.1  
**Technical Notes:**
- Use Supabase Auth `signInWithPassword()`
- Session stored in secure HTTP-only cookies
- Redirect based on authentication state
- Middleware validates session on protected routes

### Story 2.4: Reset Password

As a user,  
I want to reset my password,  
So that I can regain access if I forget it.

**Acceptance Criteria:**

**Given** I am on the login page  
**When** I click "Forgot password"  
**And** I enter my email  
**And** I click "Send reset link"  
**Then** I receive a password reset email  
**And** I can click the link to reset my password  
**And** I can set a new password  
**And** I am logged in with the new password

**Story Points:** 3  
**Dependencies:** Story 2.1  
**Technical Notes:**
- Use Supabase Auth `resetPasswordForEmail()`
- Email template configured in Supabase
- Reset link expires after 1 hour
- Update password via `updateUser()` method

### Story 2.5: Onboarding Tutorial Explaining Suflate Amplification

As a new user,  
I want to see an onboarding tutorial,  
So that I understand how Suflate amplification works.

**Acceptance Criteria:**

**Given** I have just signed up  
**When** I complete email verification  
**Then** I see the FTUX welcome screen  
**And** I see the tutorial explaining:
  - What Suflate does (voice → posts)
  - How amplification works
  - Why it preserves my voice
  - How to get started  
**And** I can skip the tutorial  
**And** I can proceed to record my first post

**Story Points:** 8  
**Dependencies:** Story 2.1  
**Technical Notes:**
- Implement FTUX flow from `ftux.md`
- Welcome screen: "Say it. We'll help you post it."
- 3-step explanation: Speak → Shape → Post
- Store onboarding completion in user profile
- Don't show tutorial again if completed

### Story 2.6: Create Default Workspace

As a new user,  
I want a default workspace created automatically,  
So that I can start using Suflate immediately.

**Acceptance Criteria:**

**Given** I have signed up  
**When** my account is created  
**Then** a default workspace is created  
**And** workspace name is "{My Name}'s Workspace"  
**And** I am assigned as owner  
**And** workspace has starter plan credits (100/month)  
**And** I can see my workspace in the dashboard

**Story Points:** 3  
**Dependencies:** Story 2.1  
**Technical Notes:**
- Auto-create workspace on user signup
- Set `workspaces.owner_id` to user ID
- Set `workspaces.plan` to 'starter'
- Set `workspaces.credits_total` and `credits_remaining` to 100
- Create `workspace_members` record with role 'owner'

### Story 2.7: Create Multiple Workspaces (Agency Feature)

As an agency user,  
I want to create multiple workspaces,  
So that I can manage content for different clients.

**Acceptance Criteria:**

**Given** I am an agency user with appropriate plan  
**When** I click "Create workspace"  
**And** I enter a workspace name (client name)  
**And** I click "Create"  
**Then** a new workspace is created  
**And** I am assigned as owner  
**And** workspace has isolated data (RLS)  
**And** I can switch between workspaces  
**And** I can see workspace in my workspace list

**Given** I have reached my plan's workspace limit  
**When** I try to create a new workspace  
**Then** I see a message to upgrade my plan  
**And** I cannot create additional workspaces

**Story Points:** 8  
**Dependencies:** Story 2.6, Epic 8 (Subscription Management)  
**Technical Notes:**
- Check plan limits before allowing creation
- Starter plan: 1 workspace
- Creator plan: 1 workspace
- Agency plan: 5 workspaces
- Enterprise plan: Unlimited
- RLS policies enforce workspace isolation
- Each workspace has separate credit pool

### Story 2.8: Switch Between Workspaces

As an agency user,  
I want to switch between workspaces,  
So that I can manage different clients' content.

**Acceptance Criteria:**

**Given** I have multiple workspaces  
**When** I click the workspace selector  
**Then** I see a list of all my workspaces  
**And** I can select a workspace  
**And** the UI updates to show that workspace's content  
**And** all data is filtered by selected workspace  
**And** I see the workspace name in the header  
**And** I see the workspace credit balance

**Story Points:** 5  
**Dependencies:** Story 2.7  
**Technical Notes:**
- Workspace selector component in header
- Store selected workspace in session/localStorage
- Filter all queries by `workspace_id`
- Update RLS context based on selected workspace
- Show workspace-specific credit balance

### Story 2.9: Connect LinkedIn Account via OAuth

As a user,  
I want to connect my LinkedIn account,  
So that I can post content directly to LinkedIn.

**Acceptance Criteria:**

**Given** I am in my workspace settings  
**When** I click "Connect LinkedIn"  
**Then** LinkedIn OAuth flow initiates  
**And** I authenticate with LinkedIn  
**And** my LinkedIn access token is stored securely  
**And** my LinkedIn profile ID is saved  
**And** I see "LinkedIn Connected" status  
**And** I can disconnect LinkedIn if needed

**Given** I have connected LinkedIn  
**When** I want to post content  
**Then** I can use the LinkedIn posting features  
**And** for personal profiles, I get share URL  
**And** for company pages, I can post via API

**Story Points:** 8  
**Dependencies:** Story 2.6  
**Technical Notes:**
- LinkedIn OAuth 2.0 flow
- Store `linkedin_access_token` encrypted in `users` table
- Store `linkedin_profile_id` for reference
- Request scopes: `w_member_social`, `r_liteprofile` (personal), `w_organization_social` (company pages)
- Handle token refresh automatically
- API route: `/api/linkedin/oauth`

### Story 2.10: View Subscription Plan and Credit Balance

As a user,  
I want to see my subscription plan and credit balance,  
So that I know my usage limits and can upgrade if needed.

**Acceptance Criteria:**

**Given** I am logged in  
**When** I view my workspace settings  
**Then** I see my current subscription plan  
**And** I see my credit balance (remaining/total)  
**And** I see when credits reset (monthly)  
**And** I can see credit usage history  
**And** I can upgrade my plan if needed

**Story Points:** 5  
**Dependencies:** Epic 8 (Credit & Subscription Management)  
**Technical Notes:**
- Display `workspaces.plan` (starter, creator, agency, enterprise)
- Display `workspaces.credits_remaining` and `credits_total`
- Show `subscriptions.current_period_end` for reset date
- Link to upgrade flow

---

## Epic 3: Draft Management

**Priority:** MEDIUM  
**Goal:** As a creator, I want to manage my amplified posts, so I can organize and refine content before publishing.

**Dependencies:** Epic 1 (Voice-to-Post), Epic 2 (Authentication)  
**Technical Notes:** Draft CRUD operations, search/filter, tagging system

### Story 3.1: View All Drafts in Workspace

As a user,  
I want to view all my drafts in one place,  
So that I can see all my work in progress.

**Acceptance Criteria:**

**Given** I have created drafts  
**When** I navigate to the drafts page  
**Then** I see all drafts from my current workspace  
**And** drafts are displayed in a list or grid  
**And** each draft shows:
  - Preview text (first 150 characters)
  - Creation date
  - Source (voice, repurpose, manual)
  - Status (draft, ready, scheduled)
  - Tags  
**And** drafts are sorted by most recent first  
**And** I can click a draft to view/edit it

**Story Points:** 5  
**Dependencies:** Epic 1  
**Technical Notes:**
- Query `posts` table filtered by `workspace_id` and `status = 'draft'`
- Display in `DraftsList` component
- Pagination for large lists (20 per page)
- RLS ensures workspace isolation

### Story 3.2: See Draft Source (Voice Amplification)

As a user,  
I want to see which drafts came from voice amplification,  
So that I can track the source of my content.

**Acceptance Criteria:**

**Given** I have drafts from voice amplification  
**When** I view my drafts list  
**Then** I see an indicator showing "From voice note"  
**And** I can click to see the original voice recording  
**And** I can see the original transcript  
**And** I can see which variation type it is

**Story Points:** 3  
**Dependencies:** Story 3.1  
**Technical Notes:**
- Display `posts.source_type` (voice, repurpose_blog, repurpose_tweet)
- Link to `voice_recordings` via `transcription_id`
- Show `variation_type` badge

### Story 3.3: Edit Draft Content

As a user,  
I want to edit draft content,  
So that I can refine posts before publishing.

**Acceptance Criteria:**

**Given** I have a draft  
**When** I click to edit it  
**Then** I see an inline text editor  
**And** I can edit the post content  
**And** changes are saved automatically  
**And** I can see character count  
**And** I can use AI assist buttons (Fix grammar, Make clearer, Shorten)  
**And** I can preview how it will look on LinkedIn

**Story Points:** 8  
**Dependencies:** Story 3.1  
**Technical Notes:**
- Inline text editor component
- Auto-save on blur or after 2 seconds inactivity
- Update `posts.content` field
- Character count with LinkedIn limit (3000 chars)
- AI assist buttons call micro-prompts from prompt system
- Preview component shows LinkedIn-style formatting

### Story 3.4: Delete Drafts

As a user,  
I want to delete drafts,  
So that I can remove content I don't need.

**Acceptance Criteria:**

**Given** I have a draft  
**When** I click delete  
**Then** I see a confirmation dialog  
**And** when I confirm, the draft is deleted  
**And** the draft is removed from my list  
**And** I can undo deletion within 30 seconds (optional)

**Story Points:** 3  
**Dependencies:** Story 3.1  
**Technical Notes:**
- Soft delete: Update `posts.status` to 'deleted'
- Or hard delete: Remove from database
- Confirmation dialog prevents accidental deletion
- Optional: Trash/archive system for recovery

### Story 3.5: Search and Filter Drafts

As a user,  
I want to search and filter drafts,  
So that I can find specific content quickly.

**Acceptance Criteria:**

**Given** I have many drafts  
**When** I use the search bar  
**Then** I can search by content text  
**And** results update in real-time  
**And** I can filter by:
  - Source type (voice, repurpose)
  - Variation type
  - Date range
  - Tags
  - Status  
**And** filters can be combined  
**And** I can clear filters

**Story Points:** 8  
**Dependencies:** Story 3.1  
**Technical Notes:**
- Full-text search on `posts.content`
- Filter by `source_type`, `variation_type`, `status`
- Date range filter on `created_at`
- Tag filter via `drafts.tags` array
- Use Supabase Postgres full-text search or client-side filtering

### Story 3.6: Tag Drafts for Organization

As a user,  
I want to tag drafts,  
So that I can organize content by topic or theme.

**Acceptance Criteria:**

**Given** I have a draft  
**When** I add tags  
**Then** I can create new tags or select existing tags  
**And** tags are saved to the draft  
**And** I can see tags on the draft card  
**And** I can filter drafts by tag  
**And** I can remove tags from drafts

**Story Points:** 5  
**Dependencies:** Story 3.1  
**Technical Notes:**
- Store tags in `drafts.tags` array (TEXT[])
- Tag input component with autocomplete
- Show existing tags from workspace
- Filter by tag in search/filter UI

### Story 3.7: View Draft Creation Date

As a user,  
I want to see when each draft was created,  
So that I can track content age and freshness.

**Acceptance Criteria:**

**Given** I have drafts  
**When** I view my drafts list  
**Then** I see creation date for each draft  
**And** dates are displayed in relative format ("2 days ago")  
**And** I can see exact timestamp on hover  
**And** drafts are sorted by creation date (newest first)

**Story Points:** 2  
**Dependencies:** Story 3.1  
**Technical Notes:**
- Display `posts.created_at` timestamp
- Format with date-fns or similar library
- Relative time: "2 hours ago", "3 days ago"
- Absolute time on hover/tooltip

### Story 3.8: Move Drafts Between Workspaces (Agency Feature)

As an agency user,  
I want to move drafts between workspaces,  
So that I can organize content for different clients.

**Acceptance Criteria:**

**Given** I have multiple workspaces  
**When** I view a draft  
**And** I click "Move to workspace"  
**Then** I see a list of my workspaces  
**And** I can select a target workspace  
**And** the draft is moved to that workspace  
**And** the draft is removed from the current workspace  
**And** I see a confirmation message

**Story Points:** 5  
**Dependencies:** Story 2.7, Story 3.1  
**Technical Notes:**
- Update `posts.workspace_id` to new workspace
- Verify user has access to target workspace
- RLS ensures user can only move to accessible workspaces
- Update all related records (drafts, scheduled_posts)

---

## Epic 4: Post Scheduling

**Priority:** MEDIUM  
**Goal:** As a creator, I want to schedule my amplified posts, so I can maintain consistent posting without being online.

**Dependencies:** Epic 1 (Voice-to-Post), Epic 2 (Authentication), Epic 3 (Drafts)  
**Technical Notes:** Vercel Cron jobs, LinkedIn API integration, notification system

### Story 4.1: Auto-Schedule Posts for Company Pages via LinkedIn API

As a user with a LinkedIn company page,  
I want to auto-schedule posts via LinkedIn API,  
So that posts are published automatically at the scheduled time.

**Acceptance Criteria:**

**Given** I have a LinkedIn company page connected  
**And** I have a draft post ready  
**When** I schedule the post for a future date/time  
**Then** a `scheduled_posts` record is created  
**And** the post is scheduled via LinkedIn API  
**And** I see the post in my content calendar  
**And** at the scheduled time, Vercel Cron triggers  
**And** the post is published to LinkedIn automatically  
**And** the `scheduled_posts.posted` flag is set to true  
**And** the post status updates to 'published'

**Given** LinkedIn API fails  
**When** the scheduled time arrives  
**Then** I receive a notification about the failure  
**And** I can retry posting manually

**Story Points:** 13  
**Dependencies:** Story 2.9, Story 3.3  
**Technical Notes:**
- LinkedIn Pages API for company pages only
- API route: `/api/linkedin/company-page` (POST)
- Create `scheduled_posts` record with `scheduled_for` timestamp
- Vercel Cron job: `/api/cron/scheduled-posts` runs every minute
- Cron checks for due posts and calls LinkedIn API
- Store `linkedin_post_id` after successful posting
- Update `posts.status` to 'published'
- Error handling and retry logic

### Story 4.2: Receive Notification for Personal Profile Posts

As a user with a personal LinkedIn profile,  
I want to receive a notification when it's time to post,  
So that I can post manually via LinkedIn's share flow.

**Acceptance Criteria:**

**Given** I have scheduled a post for my personal profile  
**When** the scheduled time arrives  
**Then** I receive an email notification  
**And** I receive a push notification (if enabled)  
**And** the notification includes a one-click link  
**And** clicking the link opens LinkedIn with pre-filled content  
**And** I can click "Post" in LinkedIn to publish  
**And** after posting, I can mark the scheduled post as complete

**Story Points:** 8  
**Dependencies:** Story 2.9, Story 3.3  
**Technical Notes:**
- Personal profiles cannot use LinkedIn API (ToS)
- Use intent-based share flow: `https://www.linkedin.com/sharing/share-offsite/?url=...`
- Generate share URL with pre-filled text
- Email notification via Resend/SendGrid
- Push notification via Web Push API
- Notification includes share URL
- User manually marks as posted

### Story 4.3: Set Posting Schedule Per Workspace

As a user,  
I want to set a posting schedule per workspace,  
So that I can maintain consistent posting cadence.

**Acceptance Criteria:**

**Given** I am in workspace settings  
**When** I set a posting schedule  
**Then** I can specify:
  - Days of week (Mon-Fri, etc.)
  - Times of day (9 AM, 5 PM, etc.)
  - Timezone  
**And** the schedule is saved per workspace  
**And** I can see suggested optimal posting times  
**And** when scheduling posts, suggested times are pre-filled  
**And** I can override the schedule for individual posts

**Story Points:** 8  
**Dependencies:** Story 2.6  
**Technical Notes:**
- Store schedule in `workspaces` table (JSONB field)
- Schedule format: `{days: [1,2,3,4,5], times: ["09:00", "17:00"], timezone: "America/New_York"}`
- Suggest optimal times based on LinkedIn best practices
- Pre-fill schedule when creating scheduled posts
- Allow per-post override

### Story 4.4: View Content Calendar

As a user,  
I want to view my content calendar,  
So that I can see all scheduled posts at a glance.

**Acceptance Criteria:**

**Given** I have scheduled posts  
**When** I view my content calendar  
**Then** I see a calendar view (month/week/day)  
**And** scheduled posts are displayed on their dates  
**And** I can see post previews on hover  
**And** I can click posts to edit or reschedule  
**And** I can see which posts are published vs scheduled  
**And** I can see gaps in my posting schedule

**Story Points:** 13  
**Dependencies:** Story 4.1, Story 4.2  
**Technical Notes:**
- Calendar component (react-big-calendar or custom)
- Query `scheduled_posts` filtered by workspace
- Display posts on calendar by `scheduled_for` date
- Color code: scheduled (blue), published (green), failed (red)
- Show post preview in tooltip/modal on hover
- Link to edit/reschedule flow

### Story 4.5: Reschedule or Cancel Scheduled Posts

As a user,  
I want to reschedule or cancel scheduled posts,  
So that I can adjust my posting plan.

**Acceptance Criteria:**

**Given** I have a scheduled post  
**When** I click to reschedule  
**Then** I can select a new date and time  
**And** the `scheduled_posts.scheduled_for` is updated  
**And** if using LinkedIn API, the schedule is updated  
**And** I see the updated time in my calendar

**Given** I want to cancel a scheduled post  
**When** I click cancel  
**Then** I see a confirmation dialog  
**And** when I confirm, the scheduled post is deleted  
**And** the post returns to draft status  
**And** it's removed from the calendar

**Story Points:** 5  
**Dependencies:** Story 4.1, Story 4.4  
**Technical Notes:**
- Update `scheduled_posts.scheduled_for` timestamp
- For LinkedIn API posts, update via API if supported
- Cancel: Delete `scheduled_posts` record
- Set `posts.status` back to 'draft'

### Story 4.6: One-Click Copy for Manual Posting (Personal Profiles)

As a user with a personal profile,  
I want a one-click copy option,  
So that I can quickly paste content into LinkedIn.

**Acceptance Criteria:**

**Given** I have a draft or scheduled post  
**When** I click "Copy for LinkedIn"  
**Then** the post content is copied to clipboard  
**And** I see a confirmation "Copied!" message  
**And** I can paste the content into LinkedIn's composer  
**And** formatting (line breaks, hashtags) is preserved

**Story Points:** 3  
**Dependencies:** Story 3.3  
**Technical Notes:**
- Use Clipboard API to copy text
- Format content for LinkedIn (preserve line breaks)
- Show toast notification on copy
- Include hashtags if present in post

### Story 4.7: See Optimal Posting Times Based on Audience

As a user,  
I want to see optimal posting times,  
So that I can schedule posts when my audience is most active.

**Acceptance Criteria:**

**Given** I am scheduling a post  
**When** I view the scheduling interface  
**Then** I see suggested optimal posting times  
**And** suggestions are based on:
  - LinkedIn best practices (9 AM, 12 PM, 5 PM)
  - My timezone
  - My workspace schedule  
**And** I can select a suggested time with one click  
**And** I can override with custom time

**Story Points:** 5  
**Dependencies:** Story 4.3  
**Technical Notes:**
- Default suggestions: 9 AM, 12 PM, 5 PM (local time)
- Consider workspace timezone setting
- Future: Use analytics to suggest based on past engagement
- Display as clickable time slots

---

## Epic 5: Carousel Amplification

**Priority:** MEDIUM  
**Goal:** As a creator, I want to amplify voice notes into LinkedIn carousels, so I can create engaging visual content easily.

**Dependencies:** Epic 1 (Voice-to-Post), Epic 2 (Authentication)  
**Technical Notes:** PDF generation, carousel templates, OpenRouter for structured content

### Story 5.1: Amplify Voice Notes into Carousel Content

As a user,  
I want to amplify voice notes into carousel content,  
So that I can create visual LinkedIn posts from my voice.

**Acceptance Criteria:**

**Given** I have a transcribed voice note  
**When** I select "Create carousel"  
**Then** Suflate processes the transcript  
**And** OpenRouter generates structured carousel content  
**And** content is organized into 5-10 slides  
**And** each slide has:
  - Title text
  - Body text
  - Key point or insight  
**And** slides are stored in `carousels` table  
**And** I can preview the carousel  
**And** 10 credits are deducted

**Story Points:** 13  
**Dependencies:** Story 1.3  
**Technical Notes:**
- API route: `/api/suflate/amplify/carousel`
- Use OpenRouter with carousel-specific prompts
- Structure: Extract 5-10 key points from transcript
- Store slide data in `carousels.slide_data` (JSONB)
- Format: `[{slide_number, title, body, key_point}, ...]`
- Deduct 10 credits per carousel generation

### Story 5.2: Choose from 5 Pre-Built Carousel Templates

As a user,  
I want to choose from pre-built carousel templates,  
So that I can create visually consistent carousels.

**Acceptance Criteria:**

**Given** I have generated carousel content  
**When** I view template options  
**Then** I see 5 template options:
  - Minimal (clean, text-focused)
  - Bold (high contrast, impactful)
  - Professional (corporate, polished)
  - Creative (colorful, engaging)
  - Story (narrative flow)  
**And** I can preview each template  
**And** I can select a template  
**And** the carousel is rendered with that template

**Story Points:** 8  
**Dependencies:** Story 5.1  
**Technical Notes:**
- Template definitions stored in code/config
- Each template has:
  - Color scheme
  - Font choices
  - Layout style
  - Background patterns
- Render preview using template engine
- Store selected template in `carousels.template_type`

### Story 5.3: Customize Carousel Colors and Fonts Per Workspace

As a user,  
I want to customize carousel colors and fonts,  
So that carousels match my brand.

**Acceptance Criteria:**

**Given** I am in workspace settings  
**When** I set carousel branding  
**Then** I can choose:
  - Primary color
  - Secondary color
  - Font family
  - Font sizes  
**And** settings are saved per workspace  
**And** all carousels in that workspace use these settings  
**And** I can override for individual carousels

**Story Points:** 8  
**Dependencies:** Story 2.6, Story 5.2  
**Technical Notes:**
- Store branding in `workspaces` table (JSONB)
- Format: `{carousel_branding: {primary_color, secondary_color, font_family, font_sizes}}`
- Apply branding when rendering carousels
- Allow per-carousel override in `carousels` table

### Story 5.4: Edit Text on Each Slide

As a user,  
I want to edit text on each slide,  
So that I can refine carousel content.

**Acceptance Criteria:**

**Given** I have a generated carousel  
**When** I view the carousel editor  
**Then** I can see all slides  
**And** I can click a slide to edit  
**And** I can edit:
  - Title text
  - Body text
  - Key point  
**And** changes are saved automatically  
**And** I can preview the updated slide

**Story Points:** 8  
**Dependencies:** Story 5.1  
**Technical Notes:**
- Carousel editor component
- Edit `carousels.slide_data` JSONB array
- Update individual slide fields
- Auto-save on blur
- Preview updates in real-time

### Story 5.5: Add or Remove Slides

As a user,  
I want to add or remove slides,  
So that I can customize carousel length.

**Acceptance Criteria:**

**Given** I have a carousel  
**When** I want to add a slide  
**Then** I can click "Add slide"  
**And** a new blank slide is created  
**And** I can edit the slide content  
**And** slides are renumbered automatically

**Given** I want to remove a slide  
**When** I click delete on a slide  
**Then** I see a confirmation  
**And** when confirmed, the slide is removed  
**And** remaining slides are renumbered

**Story Points:** 5  
**Dependencies:** Story 5.4  
**Technical Notes:**
- Add slide: Append to `slide_data` array
- Remove slide: Filter out from array
- Renumber `slide_number` field
- Update array in database

### Story 5.6: Export Carousel as PDF

As a user,  
I want to export carousel as PDF,  
So that I can upload it to LinkedIn.

**Acceptance Criteria:**

**Given** I have a completed carousel  
**When** I click "Export PDF"  
**Then** PDF generation starts  
**And** each slide is rendered as a PDF page  
**And** PDF uses the selected template and branding  
**And** PDF is generated server-side  
**And** PDF is uploaded to Supabase Storage  
**And** download link is provided  
**And** PDF path is stored in `carousels.pdf_path`

**Story Points:** 13  
**Dependencies:** Story 5.2, Story 5.3  
**Technical Notes:**
- Use PDF generation library (pdfkit, puppeteer, or similar)
- Render each slide as a page
- Apply template styling and branding
- Generate PDF server-side via API route
- Upload to Supabase Storage: `workspaces/{workspace_id}/carousels/{carousel_id}.pdf`
- Store path in `carousels.pdf_path`
- Provide download URL

### Story 5.7: Schedule Carousel Posts

As a user,  
I want to schedule carousel posts,  
So that I can publish them at optimal times.

**Acceptance Criteria:**

**Given** I have a carousel ready  
**When** I schedule it for posting  
**Then** I can set date and time  
**And** carousel is added to content calendar  
**And** at scheduled time, notification is sent  
**And** I can post the carousel PDF to LinkedIn  
**And** scheduling works same as regular posts

**Story Points:** 5  
**Dependencies:** Story 5.6, Epic 4 (Scheduling)  
**Technical Notes:**
- Reuse scheduling system from Epic 4
- Link carousel to `scheduled_posts` via `post_id`
- For company pages: Upload PDF via LinkedIn API
- For personal profiles: Share PDF link via intent flow

---

## Epic 6: Content Repurposing

**Priority:** LOW  
**Goal:** As a creator, I want to repurpose existing content into LinkedIn posts via Suflate, so I can maximize my content's reach.

**Dependencies:** Epic 1 (Amplification Engine), Epic 2 (Authentication)  
**Technical Notes:** Content extraction, URL parsing, OpenRouter for repurposing

### Story 6.1: Repurpose Blog URL into LinkedIn Posts

As a user,  
I want to paste a blog URL and get LinkedIn post variations,  
So that I can repurpose my blog content.

**Acceptance Criteria:**

**Given** I have a blog URL  
**When** I paste it into the repurpose interface  
**And** I click "Amplify"  
**Then** Suflate fetches the blog content  
**And** content is extracted (title, body, key points)  
**And** OpenRouter generates 3 LinkedIn post variations  
**And** variations maintain the blog's core message  
**And** posts are created in `posts` table  
**And** source is marked as "repurpose_blog"  
**And** 5 credits are deducted

**Story Points:** 13  
**Dependencies:** Story 1.5  
**Technical Notes:**
- API route: `/api/repurpose/blog`
- Use web scraping or RSS feed to extract content
- Parse HTML to get title and main content
- Send to OpenRouter with repurposing prompts
- Generate 3 variations (not 5, for repurposed content)
- Store with `source_type = 'repurpose_blog'`
- Cache blog content to avoid re-fetching

### Story 6.2: Repurpose Tweet Text into LinkedIn Posts

As a user,  
I want to paste tweet text and amplify into LinkedIn posts,  
So that I can expand tweets into longer-form content.

**Acceptance Criteria:**

**Given** I have tweet text  
**When** I paste it into the repurpose interface  
**And** I click "Amplify"  
**Then** OpenRouter processes the tweet  
**And** content is expanded to LinkedIn format (longer, more detailed)  
**And** 3 LinkedIn post variations are generated  
**And** variations expand on the tweet's core idea  
**And** posts are created with source "repurpose_tweet"  
**And** 3 credits are deducted (less than voice, more focused)

**Story Points:** 8  
**Dependencies:** Story 1.5  
**Technical Notes:**
- API route: `/api/repurpose/tweet`
- Accept plain text input
- Use OpenRouter with expansion prompts
- Expand from 280 chars to LinkedIn format (300-3000 chars)
- Generate 3 variations
- Store with `source_type = 'repurpose_tweet'`
- Deduct 3 credits (tweet is shorter input)

### Story 6.3: Repurpose YouTube URL into Posts

As a user,  
I want to paste a YouTube URL and get LinkedIn posts,  
So that I can repurpose video content.

**Acceptance Criteria:**

**Given** I have a YouTube URL  
**When** I paste it and click "Amplify"  
**Then** Suflate extracts video metadata:
  - Title
  - Description
  - Transcript (if available)  
**And** OpenRouter generates 3 LinkedIn post variations  
**And** variations capture key insights from the video  
**And** posts reference the video  
**And** 5 credits are deducted

**Story Points:** 13  
**Dependencies:** Story 6.1  
**Technical Notes:**
- API route: `/api/repurpose/youtube`
- Use YouTube API or web scraping for metadata
- Extract transcript if available (YouTube provides transcripts)
- If no transcript, use description and title
- Generate variations similar to blog repurposing
- Store with `source_type = 'repurpose_youtube'`
- Include video link in post content

### Story 6.4: Upload PDF and Extract Key Points

As a user,  
I want to upload a PDF and extract key points,  
So that I can repurpose document content.

**Acceptance Criteria:**

**Given** I have a PDF document  
**When** I upload it  
**Then** PDF text is extracted  
**And** key points are identified  
**And** OpenRouter generates 3 LinkedIn post variations  
**And** variations highlight the document's main insights  
**And** posts are created  
**And** 5 credits are deducted

**Story Points:** 13  
**Dependencies:** Story 6.1  
**Technical Notes:**
- PDF text extraction library (pdf-parse or similar)
- Extract text from all pages
- Use OpenRouter to identify key points
- Generate variations from key points
- Store PDF in Supabase Storage
- Store with `source_type = 'repurpose_pdf'`

---

## Epic 7: Agency Workspace Features

**Priority:** LOW (Post-MVP, but included for completeness)  
**Goal:** As an agency, I want to manage multiple client workspaces with Suflate, so I can efficiently handle all clients' LinkedIn presence.

**Dependencies:** Epic 2 (Workspace Management)  
**Technical Notes:** Multi-workspace RLS, role-based access, workspace isolation

### Story 7.1: Create Separate Workspaces for Each Client

As an agency user,  
I want to create separate workspaces for each client,  
So that I can manage content in isolation.

**Acceptance Criteria:**

**Given** I am an agency user with appropriate plan  
**When** I create a workspace for a client  
**Then** workspace is created with client name  
**And** workspace has isolated data (RLS enforced)  
**And** I am assigned as owner  
**And** workspace has its own credit pool  
**And** I can switch to this workspace  
**And** all content is filtered by workspace

**Story Points:** 5  
**Dependencies:** Story 2.7  
**Technical Notes:**
- Reuse workspace creation from Epic 2
- RLS policies enforce isolation
- Each workspace has separate credit balance
- Workspace name = client name

### Story 7.2: Customize Branding Per Workspace

As an agency user,  
I want to customize branding per workspace,  
So that each client's content matches their brand.

**Acceptance Criteria:**

**Given** I am in a client workspace  
**When** I set branding  
**Then** I can customize:
  - Logo
  - Colors
  - Fonts
  - Carousel templates  
**And** branding is saved per workspace  
**And** all content in that workspace uses the branding  
**And** branding doesn't affect other workspaces

**Story Points:** 8  
**Dependencies:** Story 7.1, Story 5.3  
**Technical Notes:**
- Store branding in `workspaces` table (JSONB)
- Include logo URL (stored in Supabase Storage)
- Apply branding to carousels and exports
- Workspace-specific branding settings

### Story 7.3: Invite Team Members with Role-Based Access

As an agency user,  
I want to invite team members with different roles,  
So that I can delegate work appropriately.

**Acceptance Criteria:**

**Given** I am a workspace owner  
**When** I invite a team member  
**Then** I can assign a role:
  - Owner (full control)
  - Admin (all editor permissions + member management)
  - Editor (create/edit content, post, schedule)
  - Viewer (read-only)  
**And** invitation email is sent  
**And** when accepted, member is added to `workspace_members`  
**And** member has appropriate permissions  
**And** RLS enforces role-based access

**Story Points:** 13  
**Dependencies:** Story 7.1  
**Technical Notes:**
- Invitation system: Create invitation record
- Send email with invitation link
- On acceptance, create `workspace_members` record
- RLS policies check role for permissions
- API routes validate role before operations
- Permission checks in middleware

### Story 7.4: Switch Between Client Workspaces Easily

As an agency user,  
I want to switch between client workspaces easily,  
So that I can manage multiple clients efficiently.

**Acceptance Criteria:**

**Given** I have multiple client workspaces  
**When** I use the workspace selector  
**Then** I see all my workspaces  
**And** I can switch with one click  
**And** UI updates to show that workspace's content  
**And** all data is filtered correctly  
**And** workspace name is displayed prominently

**Story Points:** 3  
**Dependencies:** Story 2.8  
**Technical Notes:**
- Reuse workspace switching from Epic 2
- Store selected workspace in session
- Filter all queries by workspace_id
- Update UI context

### Story 7.5: See Credit Usage Per Workspace

As an agency user,  
I want to see credit usage per workspace,  
So that I can track costs per client.

**Acceptance Criteria:**

**Given** I have multiple workspaces  
**When** I view workspace settings  
**Then** I can see credit usage per workspace  
**And** I see:
  - Credits used this month
  - Credits remaining
  - Usage breakdown by feature  
**And** I can compare usage across workspaces  
**And** I can see which clients use the most credits

**Story Points:** 5  
**Dependencies:** Epic 8 (Credit System)  
**Technical Notes:**
- Query `credits` table grouped by `workspace_id`
- Aggregate usage by feature type
- Display in workspace dashboard
- Show usage trends over time

### Story 7.6: Workspace Data Isolation (RLS)

As an agency user,  
I want workspace data to be isolated,  
So that clients cannot access each other's content.

**Acceptance Criteria:**

**Given** I have multiple workspaces  
**When** I query data  
**Then** RLS policies enforce workspace isolation  
**And** I can only see data from workspaces I'm a member of  
**And** workspace members can only access their workspace  
**And** data cannot leak between workspaces  
**And** all API routes validate workspace access

**Story Points:** 8  
**Dependencies:** Story 7.1  
**Technical Notes:**
- RLS policies on all tables check `workspace_id`
- Policies verify user is in `workspace_members` table
- API middleware validates workspace access
- Storage policies enforce workspace isolation
- Test RLS policies thoroughly

### Story 7.7: Transfer Workspace Ownership

As an agency user,  
I want to transfer workspace ownership,  
So that I can reassign clients to different team members.

**Acceptance Criteria:**

**Given** I am a workspace owner  
**When** I transfer ownership to another member  
**Then** I select the new owner  
**And** ownership is transferred  
**And** `workspaces.owner_id` is updated  
**And** my role changes to admin  
**And** new owner receives notification  
**And** new owner has full control

**Story Points:** 5  
**Dependencies:** Story 7.3  
**Technical Notes:**
- Update `workspaces.owner_id`
- Update `workspace_members` role for both users
- Send notification to new owner
- Validate transfer permissions
- Prevent transferring to non-members

---

## Epic 8: Credit & Subscription Management

**Priority:** HIGH  
**Goal:** As a user, I want to manage my credits and subscription via Suflate, so I can track usage and upgrade as needed.

**Dependencies:** Epic 2 (Authentication)  
**Technical Notes:** Stripe integration, credit tracking, subscription management

### Story 8.1: View Current Credit Balance

As a user,  
I want to see my current credit balance,  
So that I know how many credits I have available.

**Acceptance Criteria:**

**Given** I am logged in  
**When** I view my workspace dashboard  
**Then** I see my credit balance:
  - Credits remaining
  - Total credits this month
  - Usage percentage  
**And** balance is displayed prominently  
**And** I can see when credits reset  
**And** I can see credit usage breakdown

**Story Points:** 3  
**Dependencies:** Story 2.6  
**Technical Notes:**
- Display `workspaces.credits_remaining` and `credits_total`
- Calculate usage percentage
- Show `subscriptions.current_period_end` for reset date
- Display in workspace header/dashboard

### Story 8.2: View Credit Usage History

As a user,  
I want to see my credit usage history,  
So that I can track how I'm using credits.

**Acceptance Criteria:**

**Given** I have used credits  
**When** I view usage history  
**Then** I see a list of credit transactions  
**And** each transaction shows:
  - Date/time
  - Feature used (transcription, amplification, carousel)
  - Credits deducted
  - Associated content (voice note, post, etc.)  
**And** transactions are sorted by most recent  
**And** I can filter by feature type  
**And** I can see total usage for current period

**Story Points:** 5  
**Dependencies:** Story 8.1  
**Technical Notes:**
- Query `credits` table filtered by `workspace_id`
- Join with related tables to show content
- Display in table/list format
- Filter by `feature_type`
- Aggregate totals by period

### Story 8.3: Receive Notifications When Credits Are Low

As a user,  
I want to receive notifications when credits are low,  
So that I can top up before running out.

**Acceptance Criteria:**

**Given** my credit balance is low  
**When** credits drop below 20% of monthly allocation  
**Then** I receive an email notification  
**And** I see an in-app notification  
**And** notification includes:
  - Current balance
  - Suggested top-up amount
  - Link to purchase credits  
**And** I receive another notification at 10%  
**And** I receive a final warning at 5%

**Story Points:** 5  
**Dependencies:** Story 8.1  
**Technical Notes:**
- Check credit balance on each operation
- Trigger notification when threshold reached
- Email via Resend/SendGrid
- In-app notification via Supabase Realtime
- Store notification preferences in user settings

### Story 8.4: Purchase Credit Top-Ups

As a user,  
I want to purchase credit top-ups,  
So that I can continue using Suflate when I run out.

**Acceptance Criteria:**

**Given** I need more credits  
**When** I click "Buy credits"  
**Then** I see credit packages:
  - 50 credits: $5
  - 100 credits: $9
  - 250 credits: $20  
**And** I can select a package  
**And** I can pay via Stripe  
**And** after payment, credits are added to my balance  
**And** I receive a receipt email  
**And** transaction is recorded

**Story Points:** 13  
**Dependencies:** Story 8.1  
**Technical Notes:**
- Stripe Checkout for one-time payments
- Create Stripe product for each credit package
- On payment success, update `workspaces.credits_remaining`
- Record transaction in `credits` table (positive amount)
- Webhook: `/api/webhooks/stripe` handles payment events
- Send receipt email

### Story 8.5: Upgrade or Downgrade Subscription Plan

As a user,  
I want to upgrade or downgrade my subscription,  
So that I can adjust my plan based on usage.

**Acceptance Criteria:**

**Given** I am on a subscription plan  
**When** I want to upgrade  
**Then** I can see available plans:
  - Starter: $29/mo (100 credits)
  - Creator: $59/mo (250 credits)
  - Agency: $149/mo (750 credits, 5 workspaces)
  - Enterprise: $499/mo (unlimited)  
**And** I can compare features  
**And** I can upgrade with one click  
**And** Stripe updates my subscription  
**And** credits are prorated  
**And** new plan takes effect immediately

**Given** I want to downgrade  
**When** I select a lower plan  
**Then** I see a confirmation  
**And** change takes effect at end of billing period  
**And** I keep current credits until period ends

**Story Points:** 13  
**Dependencies:** Story 8.1  
**Technical Notes:**
- Stripe subscription management
- Update `subscriptions` table on plan change
- Prorate credits: Calculate remaining credits for current period
- Add difference for upgrade, keep current for downgrade
- Update `workspaces.plan` and credit limits
- Handle Stripe webhook: `customer.subscription.updated`
- Show plan comparison UI

### Story 8.6: See Cost Breakdown (Transcription: 1 credit/min, Amplification: 5 credits)

As a user,  
I want to see a cost breakdown,  
So that I understand credit costs for each feature.

**Acceptance Criteria:**

**Given** I am viewing credit information  
**When** I see the cost breakdown  
**Then** I see:
  - Voice transcription: 1 credit per minute
  - Post amplification: 5 credits per job
  - Carousel generation: 10 credits per job
  - Blog repurposing: 5 credits
  - Tweet repurposing: 3 credits  
**And** breakdown is displayed clearly  
**And** I can see examples of usage  
**And** I can estimate costs before using features

**Story Points:** 3  
**Dependencies:** Story 8.1  
**Technical Notes:**
- Display cost breakdown in help/settings
- Show in tooltips when using features
- Include examples: "3-minute voice note = 3 credits"
- Link to pricing page

### Story 8.7: Monthly Credit Reset Based on Plan

As a user,  
I want my credits to reset monthly,  
So that I have a fresh allocation each billing period.

**Acceptance Criteria:**

**Given** I am on a subscription plan  
**When** my billing period renews  
**Then** credits reset to plan allocation  
**And** `workspaces.credits_remaining` is set to `credits_total`  
**And** `workspaces.credits_total` matches plan limits  
**And** I receive an email notification  
**And** usage history shows the reset  
**And** unused credits from previous period are lost (MVP)

**Story Points:** 8  
**Dependencies:** Story 8.5  
**Technical Notes:**
- Stripe webhook: `invoice.payment_succeeded` triggers reset
- Cron job checks for renewals daily
- Update `workspaces.credits_remaining` = `credits_total`
- Set `credits_total` based on plan:
  - Starter: 100
  - Creator: 250
  - Agency: 750
  - Enterprise: unlimited (no reset)
- Send renewal email
- MVP: No credit rollover (future enhancement)

---

## Epic 9: Analytics (Post-MVP)

**Priority:** LOW  
**Goal:** As a creator, I want to track performance of my amplified posts, so I can optimize my content strategy.

**Dependencies:** Epic 1 (Posts), Epic 2 (Authentication), Epic 4 (Scheduling)  
**Technical Notes:** LinkedIn API analytics, data aggregation, reporting

### Story 9.1: See Which Amplified Variations Performed Best

As a user,  
I want to see which variation types performed best,  
So that I can optimize my content strategy.

**Acceptance Criteria:**

**Given** I have published posts from voice amplification  
**When** I view analytics  
**Then** I see performance by variation type:
  - Professional thought leadership
  - Personal story
  - Actionable tips
  - Discussion starter
  - Bold opinion  
**And** I see average engagement per variation type  
**And** I can identify which angles resonate most  
**And** I can use this to inform future amplification

**Story Points:** 8  
**Dependencies:** Epic 1, Epic 4  
**Technical Notes:**
- Query `analytics` table joined with `posts`
- Group by `variation_type`
- Calculate average engagement (likes, comments, shares)
- Display in chart/table format
- Link variation type to performance metrics

### Story 9.2: See Post Impressions and Engagement

As a user,  
I want to see post impressions and engagement,  
So that I can measure reach and interaction.

**Acceptance Criteria:**

**Given** I have published posts  
**When** I view post analytics  
**Then** I see for each post:
  - Impressions
  - Likes
  - Comments
  - Shares
  - Clicks (if available)  
**And** metrics are synced from LinkedIn API  
**And** I can see trends over time  
**And** I can compare posts side-by-side

**Story Points:** 8  
**Dependencies:** Epic 4  
**Technical Notes:**
- LinkedIn API: Fetch post analytics
- Store in `analytics` table
- Sync daily via cron job
- Display in post detail view
- Show trends with charts

### Story 9.3: See Follower Growth Over Time

As a user,  
I want to see follower growth over time,  
So that I can track account growth.

**Acceptance Criteria:**

**Given** I have connected LinkedIn  
**When** I view analytics dashboard  
**Then** I see follower count  
**And** I see follower growth chart  
**And** I can see growth by time period  
**And** I can correlate growth with posting activity

**Story Points:** 8  
**Dependencies:** Story 2.9  
**Technical Notes:**
- LinkedIn API: Fetch follower count
- Store historical data in `analytics` table
- Track daily via cron job
- Display growth chart
- Correlate with posting dates

### Story 9.4: Compare Performance Across Workspaces

As an agency user,  
I want to compare performance across workspaces,  
So that I can see which clients perform best.

**Acceptance Criteria:**

**Given** I have multiple workspaces  
**When** I view analytics  
**Then** I can see performance metrics per workspace  
**And** I can compare:
  - Average engagement
  - Posting frequency
  - Follower growth  
**And** I can identify top-performing clients  
**And** I can see workspace-level insights

**Story Points:** 8  
**Dependencies:** Story 7.1, Story 9.2  
**Technical Notes:**
- Aggregate analytics by `workspace_id`
- Compare metrics across workspaces
- Display in comparison table/chart
- Show workspace-level summaries

### Story 9.5: Identify Which Voice Notes Led to Top Posts

As a user,  
I want to see which voice notes led to top posts,  
So that I can replicate successful content patterns.

**Acceptance Criteria:**

**Given** I have published posts from voice notes  
**When** I view analytics  
**Then** I can see which voice recordings led to top posts  
**And** I can see the original transcript  
**And** I can see which variation type performed best  
**And** I can identify patterns in successful content  
**And** I can use this to improve future voice notes

**Story Points:** 8  
**Dependencies:** Story 9.1, Story 9.2  
**Technical Notes:**
- Link `posts` to `voice_recordings` via `transcription_id`
- Join with `analytics` to find top posts
- Trace back to original voice note
- Display voice note → post → performance chain
- Identify content patterns

### Story 9.6: Export Analytics Reports

As a user,  
I want to export analytics reports,  
So that I can share insights with stakeholders.

**Acceptance Criteria:**

**Given** I have analytics data  
**When** I click "Export report"  
**Then** I can select date range  
**And** I can choose metrics to include  
**And** report is generated as PDF or CSV  
**And** report includes:
  - Summary statistics
  - Charts and graphs
  - Post-level details  
**And** report is downloadable  
**And** I can schedule regular reports

**Story Points:** 8  
**Dependencies:** Story 9.2  
**Technical Notes:**
- Generate PDF using PDF library
- Or export CSV for spreadsheet analysis
- Include selected metrics and date range
- Format with charts and tables
- Store reports in Supabase Storage
- Optional: Schedule via cron job

---

## Summary

### MVP Scope (Epics 1-8)

**Total Stories:** 89  
**Total Story Points:** 336  
**Priority Breakdown:**
- **HIGHEST:** Epic 1 (Voice-to-Post Core) - 89 points
- **HIGH:** Epic 2 (Authentication) - 34 points, Epic 8 (Credits) - 34 points
- **MEDIUM:** Epic 3 (Drafts) - 21 points, Epic 4 (Scheduling) - 34 points, Epic 5 (Carousels) - 55 points
- **LOW:** Epic 6 (Repurposing) - 34 points, Epic 7 (Agency Features) - 55 points

### Post-MVP (Epic 9)

**Total Stories:** 6  
**Total Story Points:** 48

### Key Dependencies

1. **Epic 2 (Authentication)** must be completed first - foundational for all other epics
2. **Epic 1 (Voice-to-Post)** is the core value proposition - highest priority
3. **Epic 8 (Credits)** needed early for usage tracking
4. **Epic 3 (Drafts)** depends on Epic 1
5. **Epic 4 (Scheduling)** depends on Epic 1 and Epic 3
6. **Epic 5 (Carousels)** depends on Epic 1
7. **Epic 6 (Repurposing)** depends on Epic 1
8. **Epic 7 (Agency)** depends on Epic 2
9. **Epic 9 (Analytics)** depends on Epic 1, Epic 2, Epic 4

### Implementation Recommendations

**Phase 1 - Core MVP (Weeks 1-4):**
- Epic 2: Authentication & Workspace (34 points)
- Epic 1: Voice-to-Post Core (89 points) - Focus on Stories 1.1-1.6 first
- Epic 8: Credit System (34 points) - Basic tracking

**Phase 2 - Content Management (Weeks 5-6):**
- Epic 3: Draft Management (21 points)
- Epic 1: Complete remaining stories (1.7-1.11)

**Phase 3 - Publishing (Weeks 7-8):**
- Epic 4: Post Scheduling (34 points)

**Phase 4 - Enhanced Features (Weeks 9-12):**
- Epic 5: Carousel Amplification (55 points)
- Epic 6: Content Repurposing (34 points)
- Epic 7: Agency Features (55 points) - If needed for MVP

**Post-MVP:**
- Epic 9: Analytics (48 points)

---

**Status:** Epics and stories complete, ready for implementation planning
