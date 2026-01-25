# Copilot Instructions for Suflate

## Project Overview
- **Suflate** is a voice-first LinkedIn content creation platform. Users record/upload audio, which is transcribed, analyzed, and amplified into multiple LinkedIn-ready post variations.
- **Tech stack:** Next.js 14 (App Router), TypeScript, Supabase (PostgreSQL, Auth, Storage), Tailwind CSS, OpenRouter API (LLM), AssemblyAI (transcription), Vercel (hosting).

## Architecture & Key Patterns
- **Voice Amplification Pipeline:**
  - Audio → Supabase Storage → AssemblyAI transcription → Suflate processing → Multiple post variations (OpenRouter API).
  - See: `lib/suflate/amplification/`, `lib/suflate/variation-engine/`.
- **Caching:**
  - Multi-layer: transcription, generation, and API response caches (Supabase + in-memory). See: `lib/suflate/cache/`.
- **Workspace Isolation:**
  - All data is workspace-scoped. Row Level Security (RLS) on all tables. See: `core/config.yaml`, `lib/suflate/workspaces/`.
- **Credit System:**
  - Usage tracked per workspace. Credits deducted for transcription, post generation, etc. See: `lib/suflate/credits/`.
- **API Routes:**
  - All backend logic in `app/api/`. Core flows: `/api/suflate/voice/upload`, `/api/suflate/voice/transcribe`, `/api/suflate/amplify/post`, `/api/suflate/amplify/carousel`.
- **Integrations:**
  - OpenRouter (LLM): `lib/integrations/openrouter.ts`
  - AssemblyAI: `lib/integrations/assemblyai.ts`
  - LinkedIn: `lib/integrations/linkedin.ts`
  - Stripe: `lib/integrations/stripe.ts`

## Developer Workflows
- **Setup:**
  - Copy `.env.local` from template and fill in API keys (see `README.md` and `SETUP.md`).
  - `npm install` to install dependencies.
- **Run:**
  - `npm run dev` (dev server), `npm run build` (production), `npm run lint`, `npm run type-check`.
- **Testing:**
  - `npm test` (all tests), `npm run test:watch`, `npm run test:coverage`.
  - Test files: `tests/unit/`, `tests/integration/`, `tests/e2e/`.
- **Debugging:**
  - Use `/test` page for manual feature testing. See `TEST_NOW.md` for quick test checklist.

## Project Conventions
- **App structure:**
  - Next.js App Router: `app/` (with (auth), (dashboard), api/ subfolders).
  - Components: `components/ui/` (reusable), `components/features/` (feature-specific).
  - Utilities: `lib/` (logic), `utils/` (helpers).
- **Validation:**
  - All API routes use Zod for schema validation. See: `lib/validation/`.
- **Security:**
  - RLS on all tables, workspace ID enforced everywhere. Middleware in `middleware.ts` and `lib/auth/permissions.ts`.
- **Storage:**
  - Supabase Storage, organized by workspace/user. See: `lib/storage/validation.ts`.

## References
- [README.md](../README.md) — Quick start, structure, and commands
- [`_bmad-output/planning-artifacts/architecture.md`](../_bmad-output/planning-artifacts/architecture.md) — Full architecture
- [HOW_TO_TEST.md](../HOW_TO_TEST.md), [TEST_NOW.md](../TEST_NOW.md) — Testing guides

---
**For AI agents:**
- Always scope data and actions to the current workspace.
- Use provided API routes and utility layers—do not bypass validation or RLS.
- Follow the credit system and cache strategies to minimize costs.
- Reference the architecture doc for deeper context on flows and decisions.
