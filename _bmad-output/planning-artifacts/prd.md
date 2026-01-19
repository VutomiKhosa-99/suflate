---
stepsCompleted: [init, discovery, success, journeys, domain, innovation, project-type, scoping, functional, nonfunctional, polish, complete]
inputDocuments: [product-brief.md]
workflowType: 'prd'
---

# Suflate – Product Requirements Document (PRD)

**Author:** Vutomi
**Date:** 2026-01-19

## 1. Purpose

This PRD defines the functional and non-functional requirements for the **Suflate MVP** — a voice-first LinkedIn content creation platform.

The goal of the MVP is to validate that **voice-first creation reduces friction and increases publishing consistency**, while preserving the creator's authentic voice.

---

## 2. Objectives

### Primary Objective

Enable users to go from **spoken thought → publish-ready LinkedIn content in under 10 minutes**.

### Secondary Objectives

* Preserve the user's authentic voice
* Reduce writer's block and cognitive friction
* Enable consistent publishing without burnout
* Support solo creators first, then agencies

---

## 3. Product Scope by Phase

This PRD defines the full product vision, grouped into delivery phases to ensure focus, speed, and solo-founder feasibility.

---

## Phase 1 – MVP (Validation & Activation)

### 3.1 Voice Recording

**Requirements:**

* Record voice notes up to **3 minutes**
* Mobile-first UX (one-tap record)
* Playback before submission

---

### 3.2 Transcription

**Requirements:**

* Transcribe audio using OpenAI Whisper
* Display editable transcript
* Handle accents and natural speech patterns

---

### 3.3 Post Generation

**Requirements:**

* Generate **3–5 LinkedIn post variations** per voice note
* Preserve original tone, phrasing, and intent
* Detect content type automatically (story, lesson, opinion, tactic)

---

### 3.4 Editing & AI Assistance

**Manual Editing:**

* Inline text editor for all generated posts
* Full user control over final content

**AI Assistance (Opt-in):**

* Grammar correction
* Clarity improvements
* Shorten or expand content
* Tighten hook

**Explicit Rule:** AI must never rewrite content without user intent.

---

### 3.5 Draft Management

**Requirements:**

* Save drafts automatically
* Tag drafts (idea, ready, scheduled)
* Archive drafts

---

### 3.6 Scheduling & Posting

**Posting Model (Locked Decision):**

**Personal LinkedIn Profiles (Phase 1 – MVP):**

* Users connect their LinkedIn personal account via LinkedIn OAuth
* When user clicks **"Post on LinkedIn"**, Suflate redirects them to LinkedIn's native post composer using an intent-based share flow
* Post content is pre-filled (text, line breaks, hashtags)
* User manually clicks **Post** inside LinkedIn
* No background automation or ToS-violating behavior

This provides a near one-click experience while remaining fully compliant with LinkedIn policies.

**LinkedIn Pages (Phase 2+):**

* Direct posting via official LinkedIn Pages API
* Available for agencies and corporate plans

**Scheduling:**

* Users can schedule posts inside Suflate
* At scheduled time:

  * Automatic redirect link opens LinkedIn with pre-filled content, OR
  * Push/email reminder with one-click post link

---

## Phase 2 – Creator Growth

### 3.7 Carousel Creator

**Requirements:**

* Convert voice-generated posts into carousels
* 5 predefined templates
* Editable slide text

---

### 3.8 Content Repurposing

**Requirements:**

* Convert existing text (blogs, tweets, notes) into LinkedIn posts
* Maintain creator voice
* Optional voice overlay for refinement

---

### 3.9 Analytics

**Requirements:**

* Track likes, comments, impressions
* Post-level performance comparison
* Basic trend insights

---

## Phase 3 – Agencies & Teams

### 3.10 Multi-Workspace Management

**Requirements:**

* Multiple client workspaces
* Workspace-level isolation
* Usage limits per plan

---

### 3.11 Role-Based Access

**Roles:**

* Owner
* Admin
* Editor
* Viewer

---

### 3.12 Client Review & Approval

**Requirements:**

* Draft approval workflows
* Commenting and feedback
* Approval status tracking

---

## Phase 4 – Intelligence & Scale

### 3.13 Voice Fingerprinting

**Requirements:**

* Learn vocabulary, cadence, tone over time
* Improve personalization across generations

---

### 3.14 Smart Suggestions

**Requirements:**

* Suggest hooks, angles, and follow-ups
* Surface content gaps

---

### 3.15 Advanced Analytics

**Requirements:**

* Content performance by theme
* Posting cadence insights
* Engagement quality metrics

---

## 4. User Roles

* **Creator:** Creates and publishes content
* **Agency Admin:** Manages multiple workspaces
* **Client Viewer:** Read-only access

---

## 5. User Flows

### Primary Flow

1. Record voice
2. Review transcript
3. Generate posts
4. Edit post
5. Schedule or copy for posting

---

## 6. Non-Functional Requirements

* Mobile-optimized UI
* Fast load times (<2s initial load)
* Secure authentication (Supabase Auth)
* GDPR-compliant data handling

---

## 7. Out of Scope (MVP)

* Auto-posting to personal LinkedIn profiles
* Advanced analytics dashboards
* Team collaboration comments
* Prompt engineering features

---

## 8. Success Metrics

* % of users who publish within 10 minutes of signup
* Weekly active users
* Draft → publish conversion rate

---

## 9. Risks & Mitigations

| Risk                | Mitigation                 |
| ------------------- | -------------------------- |
| AI sounds generic   | Voice-preservation prompts |
| User distrust of AI | Manual editing required    |
| API cost overrun    | Rate limiting & caps       |

---

## 10. Future Enhancements (Post-MVP)

* Voice fingerprinting
* Smart content suggestions
* Advanced analytics
* Team collaboration

---

## 11. Acceptance Criteria (MVP)

* User can publish a LinkedIn post from voice in <10 minutes
* Generated content sounds recognizably like the user
* User retains full editorial control

---

**Status:** Ready for UX specification and architecture design
