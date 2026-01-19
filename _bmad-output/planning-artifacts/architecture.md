---
stepsCompleted: [init, context, starter, decisions, patterns, structure, validation, complete]
inputDocuments: [product-brief.md, prd.md]
workflowType: 'architecture'
project_name: 'suflate'
user_name: 'Vutomi'
date: '2026-01-19'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## System Overview

**Project:** Suflate - Voice-First LinkedIn Content Creation Platform

**Architecture:** Suflate (Supabase + Custom Amplification Architecture)

**Core Philosophy:** Zero infrastructure costs on free tiers, solo-founder maintainability, bootstrap-friendly architecture that competes with funded competitors.

---

## Infrastructure Decisions

### Hosting & Platform

**Decision:** Vercel (Free Tier)
- **Rationale:** Zero monthly costs, seamless Next.js integration, automatic HTTPS, edge network
- **Limits:** 100GB bandwidth, 100GB-hours compute per month
- **Upgrade Trigger:** When approaching 90% of bandwidth limit

### Database & Backend Services

**Decision:** Supabase (Free Tier)
- **Components Used:**
  - PostgreSQL Database (500MB limit)
  - Authentication (Supabase Auth)
  - Storage (1GB limit)
  - Row Level Security (RLS)
- **Limits:** 500MB database, 1GB storage, 50k API calls/month
- **Upgrade Trigger:** When approaching 90% of database/storage/API limits

### Cost Model

**Zero Fixed Costs:**
- Vercel: Free tier
- Supabase: Free tier
- Variable Costs Only: AI API usage (OpenRouter, AssemblyAI)

**Cost Calculation:**
- Voice transcription: ~$0.015 per minute (AssemblyAI)
- Post generation: ~$0.02-0.05 per job (OpenRouter - 3-5 variations, varies by model)
- Carousel generation: ~$0.08-0.12 per job (OpenRouter + PDF generation)

---

## Suflate Architecture Layer

The **Suflate Layer** sits on top of Supabase and handles voice amplification, content variation, and intelligent processing.

### Core Components

#### 1. Voice Amplification Pipeline

**Flow:**
```
Voice Input → Storage → Transcription → Suflate Processing → Multiple Post Variations
```

**Processing Steps:**
1. Voice input received and stored in Supabase Storage
2. Audio sent to AssemblyAI API for transcription
3. Suflate processor analyzes content for:
   - Content type detection (story, lesson, opinion, tactic)
   - Key themes and messaging
   - Tone and voice characteristics
   - Engagement optimization points
4. Generates 3-5 variations with different angles:
   - **Professional thought leadership** - Executive tone, industry insights
   - **Personal story** - Narrative format, emotional connection
   - **Actionable tips** - List-based, practical value
   - **Discussion starter** - Question-driven, engagement-focused
   - **Bold opinion** - Controversial stance, conversation-driving
5. Each variation optimized for LinkedIn engagement patterns
6. Results cached to minimize API costs

**Implementation Location:** `/src/lib/suflate/amplification/`

#### 2. Content Variation Engine

**Purpose:** Transform single voice input into multiple post variations that preserve user voice while optimizing for different engagement strategies.

**Algorithm:**
- Analyze transcription for core message
- Extract key points and themes
- Generate variation prompts for OpenRouter API:
  - Maintain original tone
  - Preserve key phrases and idioms
  - Apply different structural approaches
- Post-process to ensure authenticity markers remain

**Caching Strategy:**
- Similar transcriptions cached (fuzzy matching on core message)
- API responses cached for 24 hours
- Cache key: hash(content_length, core_themes, user_id)

**Implementation Location:** `/src/lib/suflate/variation-engine/`

#### 3. Intelligent Caching System

**Multi-Layer Caching:**
1. **Transcription Cache:** Similar audio → cached transcription
   - Match on audio hash and duration similarity
   - Cache TTL: 7 days
2. **Generation Cache:** Similar transcriptions → cached variations
   - Match on content themes and structure
   - Cache TTL: 24 hours
3. **API Response Cache:** Full OpenRouter responses cached
   - Prevents redundant API calls
   - Cache TTL: 24 hours

**Storage:** Supabase database (cache table) + in-memory cache for hot paths

**Implementation Location:** `/src/lib/suflate/cache/`

#### 4. Usage Tracking & Credit Management

**Credit System:**
- Track API usage per user/workspace
- Credits allocated per subscription plan:
  - Starter ($29/mo): 100 credits/month
  - Creator ($59/mo): 250 credits/month
  - Agency ($149/mo): 750 credits/month
  - Enterprise ($499/mo): Unlimited
- Credit costs:
  - Voice transcription: 1 credit per minute
  - Post generation: 5 credits per job (3-5 variations)
  - Carousel: 10 credits per generation
  - Repurpose blog: 3 credits
  - Repurpose tweet: 2 credits

**Usage Tracking:**
- Real-time credit deduction
- Daily usage reports per workspace
- Credit top-up system for overages

**Implementation Location:** `/src/lib/suflate/credits/`

#### 5. Multi-Workspace Isolation

**Purpose:** Agencies managing multiple client accounts

**Isolation Strategy:**
- Row Level Security (RLS) policies on all Supabase tables
- Workspace ID enforced at database level
- API route middleware validates workspace access
- Workspace-level credit pools and limits

**Data Isolation:**
- All queries filtered by `workspace_id`
- Storage organized by `workspace_id/user_id/timestamp`
- Analytics aggregated per workspace

**Implementation Location:** `/src/lib/suflate/workspaces/`

---

## Database Schema (Supabase PostgreSQL)

### Core Tables

#### 1. users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  linkedin_profile_id TEXT,
  linkedin_access_token TEXT ENCRYPTED,
  subscription_tier TEXT DEFAULT 'starter',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. workspaces
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'starter',
  credits_remaining INTEGER DEFAULT 0,
  credits_total INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. workspace_members
```sql
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'editor', -- owner, admin, editor, viewer
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);
```

#### 4. voice_recordings
```sql
CREATE TABLE voice_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL, -- Supabase Storage path
  duration_seconds INTEGER,
  file_size_bytes INTEGER,
  status TEXT DEFAULT 'uploaded', -- uploaded, transcribing, transcribed, processing, complete, error
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. transcriptions
```sql
CREATE TABLE transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID REFERENCES voice_recordings(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  processed_text TEXT,
  detected_language TEXT,
  detected_content_type TEXT, -- story, lesson, opinion, tactic
  transcription_model TEXT, -- AssemblyAI model identifier
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. posts
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  transcription_id UUID REFERENCES transcriptions(id),
  source_type TEXT DEFAULT 'voice', -- voice, repurpose_blog, repurpose_tweet
  title TEXT,
  content TEXT NOT NULL,
  variation_type TEXT, -- professional, personal, actionable, discussion, bold
  status TEXT DEFAULT 'draft', -- draft, ready, scheduled, published, archived
  linkedin_post_id TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 7. drafts
```sql
CREATE TABLE drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  tags TEXT[], -- idea, ready, scheduled
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 8. scheduled_posts
```sql
CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  notification_method TEXT DEFAULT 'email', -- email, push, both
  notification_sent BOOLEAN DEFAULT FALSE,
  posted BOOLEAN DEFAULT FALSE,
  post_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 9. carousels
```sql
CREATE TABLE carousels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL, -- one of 5 predefined templates
  slide_data JSONB NOT NULL, -- array of slide content
  pdf_path TEXT, -- Supabase Storage path to generated PDF
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 10. analytics
```sql
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  linkedin_post_id TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 11. subscriptions
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- active, canceled, past_due
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 12. credits
```sql
CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  credits_used INTEGER NOT NULL,
  feature_type TEXT NOT NULL, -- transcription, post_generation, carousel, repurpose
  feature_id UUID, -- reference to posts, transcriptions, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 13. amplification_jobs
```sql
CREATE TABLE amplification_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  recording_id UUID REFERENCES voice_recordings(id),
  transcription_id UUID REFERENCES transcriptions(id),
  status TEXT DEFAULT 'queued', -- queued, processing, complete, failed
  variation_count INTEGER DEFAULT 5,
  completed_variations INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 14. cache
```sql
CREATE TABLE cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cache_expires ON cache(expires_at);
CREATE INDEX idx_cache_key ON cache(cache_key);
```

### Row Level Security (RLS) Policies

**All tables enforce workspace-based access:**

```sql
-- Example for posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view posts in their workspaces"
  ON posts FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create posts in their workspaces"
  ON posts FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'editor')
    )
  );
```

---

## API Routes

### Next.js App Router Structure

All API routes located in `/src/app/api/`

#### Authentication Routes

**`/api/auth/callback`** (Supabase Auth)
- Handle OAuth callbacks (Google, LinkedIn)
- Create user session
- Redirect to dashboard

**`/api/auth/session`** (GET)
- Get current user session
- Return user info and workspace access

**`/api/auth/logout`** (POST)
- Destroy session
- Clear cookies

#### Suflate Core Routes

**`/api/suflate/voice/upload`** (POST)
- Upload voice recording to Supabase Storage
- Create `voice_recordings` record
- Trigger transcription job
- Return recording ID

**`/api/suflate/voice/transcribe`** (POST)
- Process transcription via AssemblyAI API
- Create `transcriptions` record
- Trigger amplification job
- Return transcription ID

**`/api/suflate/amplify/post`** (POST)
- Generate 3-5 post variations via OpenRouter API
- Use Suflate variation engine
- Create `posts` records for each variation
- Cache results
- Return array of post IDs

**`/api/suflate/amplify/carousel`** (POST)
- Generate carousel from post via OpenRouter API
- Create PDF using template
- Upload PDF to Supabase Storage
- Create `carousels` record
- Return carousel ID

#### Scheduling Routes

**`/api/schedule/post`** (POST)
- Create scheduled post entry
- Set up Vercel Cron job or notification
- Return scheduled post ID

**`/api/schedule/[id]`** (GET, PUT, DELETE)
- Get/update/delete scheduled post
- Manage scheduling configuration

#### LinkedIn Integration Routes

**`/api/linkedin/oauth`** (GET)
- Initiate LinkedIn OAuth flow
- Store access token

**`/api/linkedin/company-page`** (POST)
- Post directly to LinkedIn Company Page (Phase 2+)
- Use LinkedIn Pages API
- Update post status

**`/api/linkedin/share-url`** (POST)
- Generate LinkedIn share URL with pre-filled content
- For personal profile posting (Phase 1)
- Returns shareable URL

#### Content Repurposing Routes

**`/api/repurpose/blog`** (POST)
- Accept blog URL or text
- Generate LinkedIn post variations
- Maintain creator voice
- Create `posts` records

**`/api/repurpose/tweet`** (POST)
- Accept tweet URL or text
- Generate LinkedIn post variations
- Expand to LinkedIn format
- Create `posts` records

#### Webhook Routes

**`/api/webhooks/stripe`** (POST)
- Handle Stripe payment events
- Update subscriptions
- Manage credit allocations
- Handle cancellations

**`/api/webhooks/linkedin`** (POST)
- Handle LinkedIn API callbacks (future)
- Update analytics
- Track post status

#### Analytics Routes

**`/api/analytics/[post_id]`** (GET)
- Get post analytics
- Sync with LinkedIn API (if available)
- Return engagement metrics

---

## External Integrations

### 1. OpenRouter API

**Purpose:** Content generation for post variations and carousels

**Usage:**
- Post generation: 5 variations per voice note
- Carousel generation: Structured content for slides
- Content repurposing: Transform blog/tweet to LinkedIn format

**Configuration:**
- Provider: OpenRouter (single API for multiple LLM models)
- Default Model: `anthropic/claude-3.5-sonnet` (via OpenRouter)
- Alternative Models Available:
  - `openai/gpt-4-turbo` (cost-effective alternative)
  - `anthropic/claude-3-opus` (higher quality)
  - `google/gemini-pro-1.5` (alternative option)
- Max tokens: 4096 per request
- Temperature: 0.7 for variation, 0.9 for creativity

**Benefits of OpenRouter:**
- Single API for multiple model providers
- Automatic fallback to alternative models if needed
- Competitive pricing across providers
- Unified rate limiting and error handling

**Rate Limiting:**
- 50 requests per minute per workspace
- Implement exponential backoff on rate limit errors
- Model-specific rate limits handled by OpenRouter

**Cost Management:**
- Track token usage per request
- Cache similar requests
- Batch operations where possible
- Model selection based on cost/quality trade-off

**Implementation:** `/src/lib/integrations/openrouter.ts`

### 2. AssemblyAI API

**Purpose:** Voice transcription

**Usage:**
- Transcribe voice recordings (async transcription)
- Support multiple languages and accents
- Handle natural speech patterns
- Auto-punctuation and formatting
- Speaker diarization (optional, for future multi-speaker support)

**Configuration:**
- Transcription type: Async transcription (for longer recordings)
- Language: Auto-detect (or specify language code)
- Features enabled:
  - Auto punctuation
  - Format text (paragraphs, capitalization)
  - Entity detection (optional)
- Response format: JSON with transcript, confidence, words, and timestamps

**Rate Limiting:**
- Standard tier: 1,000 hours/month
- Request rate: Based on subscription tier
- File size limit: No hard limit (recommended <2GB for async)

**Cost Management:**
- Pricing: ~$0.00025 per second (~$0.015 per minute)
- Cache transcriptions for similar audio
- Use async transcription for better cost efficiency
- Request only needed features to reduce cost

**Implementation:** `/src/lib/integrations/assemblyai.ts`

**Benefits over Whisper:**
- Better accuracy for natural speech patterns
- Auto-punctuation and formatting included
- Speaker diarization support for future features
- More detailed response data (word-level timestamps, confidence scores)
- Reliable async processing for longer recordings

### 3. LinkedIn Posts API

**Purpose:** Direct posting to LinkedIn Company Pages (Phase 2+)

**Usage:**
- Post to Company Pages only (not personal profiles in MVP)
- Retrieve post analytics
- Track engagement metrics

**Authentication:**
- OAuth 2.0 flow
- Store access tokens securely
- Refresh tokens as needed

**Rate Limiting:**
- Respect LinkedIn API rate limits
- Implement queue for bulk operations

**Implementation:** `/src/lib/integrations/linkedin.ts`

**Note:** Personal profiles use intent-based share flow (no API), Company Pages use official API.

### 4. Stripe API

**Purpose:** Payment processing and subscription management

**Usage:**
- Handle subscription creation
- Process payments
- Manage billing cycles
- Handle cancellations

**Webhooks:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Implementation:** `/src/lib/integrations/stripe.ts`

---

## Storage Strategy (Supabase Storage)

### Organization Structure

```
workspaces/
  {workspace_id}/
    voice-recordings/
      {user_id}/
        {timestamp}-{recording_id}.mp3
    carousels/
      {user_id}/
        {timestamp}-{carousel_id}.pdf
    assets/
      {user_id}/
        {filename}
```

### Storage Policies

**Row Level Security on Storage:**

```sql
-- Voice recordings policy
CREATE POLICY "Users can upload to their workspace"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'voice-recordings'
    AND (storage.foldername(name))[1] = auth.jwt() ->> 'workspace_id'::text
  );

CREATE POLICY "Users can view files in their workspace"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'voice-recordings'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );
```

### File Upload Validation

**Voice Recordings:**
- Allowed formats: MP3, WAV, M4A, OGG
- Max size: 10MB (compressed if needed)
- Duration validation: 1 second to 3 minutes
- Virus scanning: Implement basic validation

**Carousels (PDFs):**
- Format: PDF only
- Max size: 5MB
- Template validation: Must match one of 5 templates

**Implementation:** `/src/lib/storage/validation.ts`

---

## Authentication

### Supabase Auth Configuration

**Providers:**
1. **Email/Password** (default)
   - Email verification required
   - Password reset flow
   
2. **Google OAuth** (optional)
   - Single sign-on option
   - Profile data syncing

3. **LinkedIn OAuth** (required for posting)
   - OAuth 2.0 flow
   - Store access token for posting
   - Refresh token management

### Workspace-Based Permissions

**Role Hierarchy:**
- **Owner:** Full control, billing management, workspace deletion
- **Admin:** All editor permissions + member management
- **Editor:** Create/edit content, post, schedule
- **Viewer:** Read-only access to content and analytics

**Permission Checks:**
- Middleware validates workspace access on all API routes
- Database RLS enforces at data layer
- Frontend components conditionally render based on role

**Implementation:**
- Middleware: `/src/middleware.ts`
- Permissions: `/src/lib/auth/permissions.ts`

---

## Scheduling System

### Architecture

**Phase 1 (MVP) - Personal Profiles:**
- Email/push notifications at scheduled time
- Link opens LinkedIn with pre-filled content
- User manually posts

**Phase 2+ - Company Pages:**
- Vercel Cron Jobs trigger at scheduled time
- Direct API posting to LinkedIn Company Pages
- Automatic status updates

### Implementation

**Vercel Cron Jobs:**
```javascript
// vercel.json
{
  "crons": [{
    "path": "/api/cron/scheduled-posts",
    "schedule": "* * * * *" // Every minute
  }]
}
```

**Cron Handler:**
- Check `scheduled_posts` table for due posts
- Send notification or post via API
- Update status in database

**Notification Service:**
- Email via Resend/SendGrid (free tier)
- Push notifications via Web Push API
- In-app notifications via Supabase Realtime

**Implementation:**
- Cron: `/src/app/api/cron/scheduled-posts/route.ts`
- Notifications: `/src/lib/notifications/`

---

## Credit System

### Credit Allocation

**Subscription Plans:**
- **Starter ($29/mo):** 100 credits/month
- **Creator ($59/mo):** 250 credits/month
- **Agency ($149/mo):** 750 credits/month
- **Enterprise ($499/mo):** Unlimited credits

**Credit Costs:**
- Voice transcription: 1 credit per minute (rounded up)
- Post generation: 5 credits per job (3-5 variations)
- Carousel generation: 10 credits per generation
- Blog repurposing: 3 credits per job
- Tweet repurposing: 2 credits per job

### Credit Management

**Real-Time Tracking:**
- Deduct credits immediately on feature use
- Check balance before operation
- Return error if insufficient credits

**Monthly Reset:**
- Credits reset on subscription renewal date
- Unused credits don't roll over (MVP)
- Overage handling: Top-up credits available

**Top-Up System:**
- Purchase additional credits
- $0.10 per credit
- Immediate availability after payment

**Implementation:**
- Credit service: `/src/lib/credits/service.ts`
- Balance checks: Middleware on all feature routes

---

## Security

### Data Security

**Encryption:**
- At rest: Supabase encrypts all data
- In transit: HTTPS only (enforced by Vercel)
- Sensitive fields: LinkedIn tokens encrypted at column level

**Authentication:**
- JWT tokens via Supabase Auth
- Token expiration: 1 hour (refresh token: 30 days)
- Secure cookie storage

**Authorization:**
- Row Level Security on all tables
- Workspace isolation enforced at database level
- API route middleware validates access

### Input Validation

**All API Routes:**
- Validate request body schemas (Zod)
- Sanitize user inputs
- Rate limiting per workspace
- File upload validation (type, size, content)

**Voice Recording Security:**
- Validate file format and size
- Scan for malicious content (basic)
- Limit upload rate per user

**Content Security:**
- Sanitize generated content before storage
- Validate LinkedIn post content (character limits, etc.)
- Prevent injection attacks

### API Security

**Rate Limiting:**
- Per workspace: 100 requests/minute
- Per user: 50 requests/minute
- Exponential backoff on violations

**CORS:**
- Restrict to Suflate domains only
- Allow Vercel preview deployments in development

**Environment Variables:**
- All secrets in `.env.local`
- Never commit secrets to repository
- Use Vercel environment variables in production

**Implementation:**
- Validation: `/src/lib/validation/`
- Rate limiting: `/src/middleware.ts`
- Security utils: `/src/lib/security/`

---

## Caching Strategy

### Multi-Layer Caching

#### 1. Transcription Cache

**Purpose:** Avoid re-transcribing similar audio

**Key:** Hash of audio file + duration
**Storage:** Supabase `cache` table
**TTL:** 7 days
**Match Logic:** Fuzzy match on audio hash and ±2 second duration

#### 2. Generation Cache

**Purpose:** Avoid re-generating posts for similar transcriptions

**Key:** Hash of transcription content + user_id
**Storage:** Supabase `cache` table + in-memory for hot paths
**TTL:** 24 hours
**Match Logic:** Semantic similarity on core message and themes

#### 3. API Response Cache

**Purpose:** Cache OpenRouter API responses

**Key:** Hash of prompt + parameters + model
**Storage:** Supabase `cache` table
**TTL:** 24 hours
**Invalidation:** Manual on user request

#### 4. In-Memory Cache (Hot Paths)

**Purpose:** Fast access to frequently used data

**Storage:** Node.js in-memory Map
**Use Cases:**
- User sessions
- Workspace permissions
- Credit balances (with 5-minute refresh)

**TTL:** 5 minutes for credit balances, 1 hour for permissions

### Cache Implementation

**Cache Service:**
```typescript
// /src/lib/cache/service.ts
class CacheService {
  async get(key: string): Promise<any>
  async set(key: string, value: any, ttl: number): Promise<void>
  async invalidate(pattern: string): Promise<void>
}
```

**Cache Strategy:**
- Check cache before external API calls
- Update cache after successful API calls
- Invalidate on content updates
- Batch cache operations for efficiency

---

## Scalability Considerations

### Free Tier Limits

**Supabase:**
- Database: 500MB
- Storage: 1GB
- API Calls: 50k/month
- **Upgrade Trigger:** 90% utilization

**Vercel:**
- Bandwidth: 100GB/month
- Compute: 100GB-hours/month
- **Upgrade Trigger:** 90% utilization

### Scaling Strategy

**Database:**
- Index all foreign keys and frequently queried columns
- Use connection pooling (Supabase handles this)
- Archive old analytics data to separate table
- Pagination on all list queries

**Storage:**
- Compress audio files before storage
- Delete old recordings after processing (configurable retention)
- Use CDN for static assets (Vercel Edge Network)

**API Costs:**
- Aggressive caching to minimize AI API calls
- Batch operations where possible
- Credit system prevents overuse
- Model selection flexibility via OpenRouter for cost optimization

**Compute:**
- Optimize API routes for fast execution
- Use edge functions for simple operations
- Offload heavy processing to background jobs

### Upgrade Triggers

**Monitoring:**
- Track all resource usage daily
- Alert at 80% utilization
- Plan upgrade at 90% utilization

**Cost per User:**
- Calculate: AI API costs per active user
- Target: Keep under $5/user/month (MVP)
- Monitor: Track actual costs vs. subscription revenue

---

## Project Structure & Boundaries

### Complete Project Directory Structure

```
suflate/
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── .env.local
├── .env.example
├── .gitignore
├── vercel.json
├── .github/
│   └── workflows/
│       └── ci.yml
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── record/
│   │   │   ├── drafts/
│   │   │   ├── scheduled/
│   │   │   └── analytics/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── suflate/
│   │   │   │   ├── voice/
│   │   │   │   └── amplify/
│   │   │   ├── schedule/
│   │   │   ├── linkedin/
│   │   │   ├── repurpose/
│   │   │   ├── webhooks/
│   │   │   └── analytics/
│   │   ├── api/cron/
│   │   │   └── scheduled-posts/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/ (shadcn/ui components)
│   │   ├── features/
│   │   │   ├── voice-recorder/
│   │   │   ├── post-editor/
│   │   │   ├── post-variations/
│   │   │   ├── scheduler/
│   │   │   └── analytics/
│   │   └── workspace/
│   ├── lib/
│   │   ├── suflate/
│   │   │   ├── amplification/
│   │   │   ├── variation-engine/
│   │   │   ├── cache/
│   │   │   ├── credits/
│   │   │   └── workspaces/
│   │   ├── integrations/
│   │   │   ├── openrouter.ts
│   │   │   ├── assemblyai.ts
│   │   │   ├── linkedin.ts
│   │   │   └── stripe.ts
│   │   ├── storage/
│   │   │   └── validation.ts
│   │   ├── auth/
│   │   │   └── permissions.ts
│   │   ├── notifications/
│   │   ├── validation/
│   │   ├── security/
│   │   └── cache/
│   │       └── service.ts
│   ├── types/
│   │   └── database.types.ts (generated from Supabase)
│   ├── middleware.ts
│   └── utils/
│       └── supabase/
│           ├── client.ts
│           └── server.ts
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── tests/
│   ├── __mocks__/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── public/
    └── assets/
```

### Architectural Boundaries

**API Boundaries:**
- External APIs: All integrations abstracted in `/src/lib/integrations/`
- Internal APIs: Next.js App Router API routes
- Authentication: Supabase Auth + middleware validation
- Data Access: Supabase client with RLS enforcement

**Component Boundaries:**
- Frontend: React Server Components + Client Components
- State Management: React hooks + server state (Supabase Realtime)
- Service Communication: API routes for all data mutations
- Event-Driven: Supabase Realtime subscriptions for live updates

**Data Boundaries:**
- Database: Supabase PostgreSQL with RLS
- Storage: Supabase Storage with policies
- Cache: Multi-layer (in-memory + database)
- External Data: API integrations with error handling

**Service Boundaries:**
- Suflate Layer: Isolated in `/src/lib/suflate/`
- Workspace Isolation: Enforced at database and API level
- Credit System: Centralized service with workspace quotas
- Amplification: Async job processing with queue

### Requirements to Structure Mapping

**Voice Recording Feature:**
- Components: `src/components/features/voice-recorder/`
- API: `src/app/api/suflate/voice/`
- Services: `src/lib/suflate/amplification/`
- Database: `voice_recordings`, `transcriptions` tables
- Storage: Supabase Storage `voice-recordings` bucket

**Post Generation Feature:**
- Components: `src/components/features/post-variations/`
- API: `src/app/api/suflate/amplify/post`
- Services: `src/lib/suflate/variation-engine/`
- Database: `posts`, `amplification_jobs` tables
- Integration: OpenRouter API

**Scheduling Feature:**
- Components: `src/components/features/scheduler/`
- API: `src/app/api/schedule/`
- Cron: `src/app/api/cron/scheduled-posts/`
- Database: `scheduled_posts` table
- Notifications: `src/lib/notifications/`

**Workspace Management:**
- Components: `src/components/workspace/`
- API: Workspace validation in middleware
- Services: `src/lib/suflate/workspaces/`
- Database: `workspaces`, `workspace_members` tables
- Permissions: `src/lib/auth/permissions.ts`

### Integration Points

**Internal Communication:**
- API routes → Services → Integrations
- Components → API routes → Database
- Background jobs → Services → External APIs
- Real-time updates: Supabase Realtime → Components

**External Integrations:**
- OpenRouter API: Content generation (access to multiple LLM models)
- AssemblyAI API: Voice transcription
- LinkedIn API: Company page posting
- Stripe API: Payment processing
- All abstracted in `/src/lib/integrations/`

**Data Flow:**
1. User records voice → Upload to storage
2. Storage trigger → Transcribe via AssemblyAI API
3. Transcription complete → Trigger amplification job
4. Amplification → Generate variations via OpenRouter API
5. Variations saved → User edits and schedules
6. Scheduled time → Notification or API post
7. Post published → Analytics sync from LinkedIn

---

## Technology Stack Decisions

### Frontend

**Framework:** Next.js 14 (App Router)
- Server Components for performance
- Client Components for interactivity
- API Routes for backend logic

**Styling:** Tailwind CSS
- Utility-first approach
- Component library: shadcn/ui
- Responsive design (mobile-first)

**Language:** TypeScript (strict mode)
- Type safety across codebase
- Generated types from Supabase schema

### Backend

**Database:** Supabase (PostgreSQL)
- Row Level Security for multi-tenancy
- Real-time subscriptions
- REST API auto-generated

**Authentication:** Supabase Auth
- Email/password
- OAuth (Google, LinkedIn)
- Session management

**Storage:** Supabase Storage
- Object storage for files
- CDN integration
- Access control policies

### Infrastructure

**Hosting:** Vercel
- Next.js optimization
- Edge network
- Automatic deployments

**Background Jobs:** Vercel Cron
- Scheduled tasks
- Post scheduling
- Cleanup jobs

**Monitoring:** (Future)
- Vercel Analytics
- Sentry for error tracking
- Custom dashboards for usage

---

## Development Patterns

### Naming Conventions

**Database:**
- Tables: `snake_case` (users, workspace_members)
- Columns: `snake_case` (user_id, created_at)
- Indexes: `idx_table_column` (idx_posts_workspace_id)

**API Routes:**
- REST endpoints: `/api/resource` (plural)
- Route params: `[id]` format
- Query params: `camelCase` (userId, workspaceId)

**Code:**
- Components: `PascalCase` (VoiceRecorder.tsx)
- Functions: `camelCase` (generatePosts)
- Variables: `camelCase` (userId, postContent)
- Constants: `UPPER_SNAKE_CASE` (MAX_RECORDING_DURATION)

**Files:**
- Components: `PascalCase.tsx` (PostEditor.tsx)
- Utilities: `camelCase.ts` (validation.ts)
- Types: `camelCase.ts` (database.types.ts)

### Code Organization

**Feature-Based Structure:**
- Group related components, API routes, and services
- Example: Voice recording feature has components + API + services together

**Shared Utilities:**
- Common functions in `/src/lib/`
- Reusable components in `/src/components/ui/`
- Type definitions in `/src/types/`

**Test Organization:**
- Unit tests: Co-located with source files (`*.test.ts`)
- Integration tests: `/tests/integration/`
- E2E tests: `/tests/e2e/`

---

## Implementation Guidelines

### Error Handling

**API Routes:**
- Consistent error response format: `{error: {message, code}}`
- HTTP status codes: 400 (validation), 401 (auth), 403 (permission), 404 (not found), 500 (server)
- Log errors to console (Sentry in production)

**Frontend:**
- Display user-friendly error messages
- Retry logic for network failures
- Loading states for async operations

**Services:**
- Try-catch blocks around external API calls
- Retry with exponential backoff
- Fallback strategies where possible

### Performance Optimization

**Database Queries:**
- Index frequently queried columns
- Use pagination for lists
- Select only needed columns
- Batch operations where possible

**API Optimization:**
- Cache expensive operations
- Use React Server Components
- Minimize client-side JavaScript
- Optimize bundle size

**Storage:**
- Compress files before upload
- Lazy load images
- Use appropriate file formats

### Security Best Practices

**Authentication:**
- Always validate user session
- Check workspace permissions
- Use RLS policies at database level

**Input Validation:**
- Validate all user inputs
- Sanitize content before storage
- Use TypeScript for type safety

**API Security:**
- Rate limit all endpoints
- Validate request schemas
- Handle errors without leaking information

---

**Status:** Architecture complete and ready for implementation

**Next Steps:**
1. Create epics and stories from PRD and Architecture
2. Begin implementation with voice recording MVP
3. Set up Supabase project with schema migrations
4. Configure Vercel deployment pipeline
