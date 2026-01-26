#!/usr/bin/env node
/*
  Script: merge_workspaces.js
  Purpose: For each email in the list, keep a single workspace and migrate
  most DB records from other workspaces into the kept workspace, then delete
  the old workspace rows.

  WARNING: This script updates the production database. Run only with
  SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL set in environment.
*/

const { createClient } = require('@supabase/supabase-js')

const EMAILS = [
  'khosavutomi99@gmail.com',
  'vutomiluigi99@gmail.com',
]

const TABLES_TO_MIGRATE = [
  'posts',
  'voice_recordings',
  'transcriptions',
  'drafts',
  'scheduled_posts',
  'carousels',
  'amplification_jobs',
  'credits',
  'analytics',
  'cache'
]

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
    process.exit(1)
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false }
  })

  for (const email of EMAILS) {
    console.log('\n=== Processing', email, '===')

    // Find user
    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)

    if (usersErr) {
      console.error('Error fetching user for', email, usersErr)
      continue
    }
    if (!users || users.length === 0) {
      console.warn('No user found for', email)
      continue
    }

    const user = users[0]

    // Get workspaces where user is a member
    const { data: memberships, error: memErr } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)

    if (memErr) {
      console.error('Error fetching memberships for', email, memErr)
      continue
    }

    const workspaceIds = (memberships || []).map(m => m.workspace_id)
    if (workspaceIds.length === 0) {
      console.warn('User has no workspaces:', email)
      continue
    }

    // Fetch workspace details to pick one to keep
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('*')
      .in('id', workspaceIds)
      .order('created_at', { ascending: true })

    if (!workspaces || workspaces.length === 0) {
      console.warn('No workspace rows found for', email)
      continue
    }

    // Prefer a workspace where the user is owner
    let keep = workspaces.find(w => w.owner_id === user.id) || workspaces[0]
    console.log('Keeping workspace id:', keep.id)

    const toDelete = workspaces.filter(w => w.id !== keep.id)
    if (toDelete.length === 0) {
      console.log('No extra workspaces to delete for', email)
      continue
    }

    for (const old of toDelete) {
      console.log('\n-- Migrating workspace', old.id, '->', keep.id)

      // For each table, update rows to new workspace_id where they match old.id
      for (const table of TABLES_TO_MIGRATE) {
        try {
          const { error } = await supabase
            .from(table)
            .update({ workspace_id: keep.id })
            .eq('workspace_id', old.id)

          if (error) {
            console.error(`Error migrating table ${table}:`, error.message || error)
          } else {
            console.log(`Migrated table ${table}`)
          }
        } catch (err) {
          console.error(`Exception migrating ${table}:`, err)
        }
      }

      // Move workspace_linkedin_accounts if present
      try {
        const { data: linked, error: linkErr } = await supabase
          .from('workspace_linkedin_accounts')
          .select('*')
          .eq('workspace_id', old.id)

        if (linkErr) {
          console.error('Error fetching workspace_linkedin_accounts:', linkErr)
        } else if (linked && linked.length > 0) {
          for (const la of linked) {
            // If keep already has a linkedin account, skip moving this one
            const { data: exist } = await supabase
              .from('workspace_linkedin_accounts')
              .select('*')
              .eq('workspace_id', keep.id)

            if (exist && exist.length > 0) {
              console.warn('Keep workspace already has a linkedin account; skipping move for', la.id)
            } else {
              const { error: upErr } = await supabase
                .from('workspace_linkedin_accounts')
                .update({ workspace_id: keep.id })
                .eq('id', la.id)
              if (upErr) console.error('Error moving linkedin account:', upErr)
              else console.log('Moved linkedin account', la.id)
            }
          }
        }
      } catch (err) {
        console.error('Exception moving linkedin accounts:', err)
      }

      // Delete workspace members for old workspace
      try {
        const { error: delMemErr } = await supabase
          .from('workspace_members')
          .delete()
          .eq('workspace_id', old.id)
        if (delMemErr) console.error('Error deleting members for', old.id, delMemErr)
        else console.log('Deleted workspace_members for', old.id)
      } catch (err) {
        console.error('Exception deleting members:', err)
      }

      // Finally delete the workspace row
      try {
        const { error: delWsErr } = await supabase
          .from('workspaces')
          .delete()
          .eq('id', old.id)
        if (delWsErr) console.error('Error deleting workspace', old.id, delWsErr)
        else console.log('Deleted workspace', old.id)
      } catch (err) {
        console.error('Exception deleting workspace:', err)
      }
    }

    console.log('\nCompleted processing', email)
  }

  console.log('\nAll done')
  process.exit(0)
}

main().catch(err => {
  console.error('Script error', err)
  process.exit(1)
})
