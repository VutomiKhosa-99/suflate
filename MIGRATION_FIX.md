# Migration Fix - Placeholder Workspace Error

## The Error

When running the first migration, you're seeing:
```
ERROR: 22P02: invalid input syntax for type uuid: "placeholder-workspace-id"
LINE 88: VALUES ('placeholder-workspace-id', 'Placeholder Workspace')
```

## The Fix

I've removed the placeholder workspace insertion from the first migration since:
1. We're using real authentication now (Epic 2)
2. Workspaces are automatically created via database trigger when users sign up
3. The placeholder is no longer needed

## Updated Migration

The first migration (`20240101000000_create_initial_tables.sql`) no longer tries to insert a placeholder workspace.

Workspaces will be automatically created when users sign up via the trigger in the second migration (`20240102000000_add_auth_tables.sql`).

## Migration Order

Run migrations in this order:

1. **First**: `supabase/migrations/20240101000000_create_initial_tables.sql`
   - Creates tables: workspaces, voice_recordings, transcriptions, posts, amplification_jobs
   - Sets up basic RLS (temporary policies)
   - ✅ Fixed: No more placeholder workspace insertion

2. **Second**: `supabase/migrations/20240102000000_add_auth_tables.sql`
   - Adds: users, workspace_members tables
   - Updates workspaces with owner_id and credits
   - Creates trigger to auto-create workspace on user signup
   - Replaces temporary RLS policies with proper auth-based policies

## Try Again

The migration should now run successfully! ✅
