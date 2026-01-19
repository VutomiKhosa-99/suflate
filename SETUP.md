# Suflate Project Setup

## ✅ Setup Complete

Your Suflate project structure has been initialized with:

### Core Configuration Files
- ✅ `package.json` - Dependencies and scripts
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `next.config.js` - Next.js configuration
- ✅ `tailwind.config.ts` - Tailwind CSS configuration
- ✅ `postcss.config.js` - PostCSS configuration
- ✅ `.eslintrc.json` - ESLint configuration
- ✅ `.gitignore` - Git ignore rules
- ✅ `vercel.json` - Vercel cron jobs configuration

### Project Structure

```
suflate/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── dashboard/
│   │   ├── record/
│   │   ├── drafts/
│   │   ├── scheduled/
│   │   └── analytics/
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   ├── suflate/
│   │   │   ├── voice/
│   │   │   └── amplify/
│   │   ├── schedule/
│   │   ├── linkedin/
│   │   ├── repurpose/
│   │   ├── webhooks/
│   │   ├── analytics/
│   │   └── health/               # Health check endpoint
│   ├── api/cron/
│   │   └── scheduled-posts/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                       # Reusable UI components
│   │   └── button.tsx
│   └── features/                 # Feature-specific components
│       ├── voice-recorder/
│       ├── post-editor/
│       ├── post-variations/
│       ├── scheduler/
│       └── analytics/
├── lib/
│   ├── suflate/                  # Suflate core engine
│   │   ├── amplification/
│   │   ├── variation-engine/
│   │   ├── cache/
│   │   ├── credits/
│   │   └── workspaces/
│   ├── integrations/             # Third-party integrations
│   │   ├── openrouter.ts         # OpenRouter API (content generation)
│   │   ├── assemblyai.ts         # AssemblyAI API (voice transcription)
│   │   ├── linkedin.ts           # LinkedIn API
│   │   └── stripe.ts             # Stripe API
│   ├── auth/
│   │   └── permissions.ts
│   ├── validation/
│   │   └── schemas.ts
│   └── utils.ts
├── types/
│   └── database.types.ts         # Supabase generated types
├── utils/
│   └── supabase/
│       ├── client.ts             # Browser Supabase client
│       └── server.ts             # Server Supabase client
├── middleware.ts                 # Next.js middleware for auth
└── supabase/
    └── migrations/               # Database migrations
```

## Next Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create `.env.local` file (copy from `.env.example` when available):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenRouter API (content generation)
OPENROUTER_API_KEY=your_openrouter_api_key

# AssemblyAI API (voice transcription)
ASSEMBLYAI_API_KEY=your_assemblyai_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Get your project URL and API keys
3. **Create database tables** (REQUIRED):
   - Go to **SQL Editor** in Supabase
   - Run the migration: `supabase/migrations/20240101000000_create_initial_tables.sql`
   - See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions
4. Set up Supabase Storage bucket `voice-recordings`:
   - See [SUPABASE_STORAGE_SETUP.md](./SUPABASE_STORAGE_SETUP.md) for detailed instructions
   - Quick: Go to Supabase → Storage → New bucket → Name: `voice-recordings` → Create

5. Set up Supabase Storage buckets:
   - `voice-recordings`
   - `carousels`
   - `assets`

### 4. Generate Supabase Types

After setting up your database schema, generate TypeScript types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Important Notes

### API Integration

The project uses:
- **OpenRouter API** for content generation (access to Claude, GPT-4, Gemini, etc.)
- **AssemblyAI API** for voice transcription

The integration layer is abstracted in `lib/integrations/` for easy swapping if needed in the future.

## Architecture Alignment

The project structure aligns with the architecture defined in:
- `_bmad-output/planning-artifacts/architecture.md`

All core components, API routes, and integration patterns are in place and ready for implementation.

## Development Guidelines

1. **Feature-Based Structure**: Group related components, API routes, and services together
2. **Type Safety**: Use TypeScript strict mode, generate types from Supabase schema
3. **Validation**: Use Zod schemas for input validation (see `lib/validation/schemas.ts`)
4. **Permissions**: Use role-based permission checks (see `lib/auth/permissions.ts`)
5. **RLS**: All database queries must respect Row Level Security policies

## Resources

- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- PRD: `_bmad-output/planning-artifacts/prd.md`
- Epics & Stories: `_bmad-output/planning-artifacts/epics.md`
- FTUX: `_bmad-output/planning-artifacts/ftux.md`
