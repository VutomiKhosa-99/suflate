import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/utils/supabase/auth-helper'

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * GET /api/linkedin/company-pages
 * List all company pages the workspace LinkedIn account has admin access to
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()

    const selectedWorkspace = request.cookies.get('selected_workspace_id')?.value
    const { data: accountData, error: accountError } = await supabase
      .from('workspace_linkedin_accounts')
      .select('linkedin_access_token')
      .eq('workspace_id', selectedWorkspace)
      .single()

    if (accountError || !accountData?.linkedin_access_token) {
      return NextResponse.json({
        connected: false,
        companyPages: [],
        message: 'LinkedIn not connected. Please connect your LinkedIn account first.',
      })
    }

    const linkedInResponse = await fetch(
      'https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(localizedName,logoV2(original~:playableStreams))))',
      {
        headers: {
          'Authorization': `Bearer ${accountData.linkedin_access_token}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    )

    if (!linkedInResponse.ok) {
      const errorText = await linkedInResponse.text()
      console.error('[LinkedIn] Failed to fetch company pages:', linkedInResponse.status, errorText)

      if (linkedInResponse.status === 401) {
        return NextResponse.json({
          connected: false,
          companyPages: [],
          message: 'LinkedIn session expired. Please reconnect your account.',
        })
      }

      return NextResponse.json({
        connected: true,
        companyPages: [],
        message: 'Could not fetch company pages. You may not have admin access to any pages.',
      })
    }

    const linkedInData = await linkedInResponse.json()
    const elements = linkedInData.elements || []

    const companyPages = elements.map((el: any) => {
      const org = el['organization~'] || {}
      return {
        id: el.organization?.replace('urn:li:organization:', ''),
        urn: el.organization,
        name: org.localizedName,
        logoUrl: org.logoV2?.['original~']?.elements?.[0]?.identifiers?.[0]?.identifier,
      }
    })

    // Get saved company pages for this workspace
    const { data: savedPages } = await supabase
      .from('linkedin_company_pages')
      .select('company_page_id, is_active')
      .eq('workspace_id', selectedWorkspace)

    const pagesWithStatus = companyPages.map((page: any) => ({
      ...page,
      isConnected: savedPages?.some((s: any) => s.company_page_id === page.id && s.is_active) || false,
    }))

    return NextResponse.json({
      connected: true,
      companyPages: pagesWithStatus,
    })
  } catch (error) {
    console.error('Company pages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/linkedin/company-pages
 * Connect a company page for auto-posting (saves company page for the workspace)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { companyPageId, companyName } = body

    if (!companyPageId) {
      return NextResponse.json({ error: 'Company page ID required' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const selectedWorkspace = request.cookies.get('selected_workspace_id')?.value

    // Ensure workspace-level LinkedIn token exists
    const { data: accountData } = await supabase
      .from('workspace_linkedin_accounts')
      .select('linkedin_access_token')
      .eq('workspace_id', selectedWorkspace)
      .single()

    if (!accountData?.linkedin_access_token) {
      return NextResponse.json({ error: 'LinkedIn not connected' }, { status: 400 })
    }

    // Save company page connection for workspace
    const { data: companyPage, error: insertError } = await supabase
      .from('linkedin_company_pages')
      .upsert({
        user_id: user.id,
        workspace_id: selectedWorkspace,
        company_page_id: companyPageId,
        company_name: companyName,
        access_token: accountData.linkedin_access_token, // encrypt in production
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'workspace_id,company_page_id' })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to save company page:', insertError)
      return NextResponse.json({ error: 'Failed to connect company page' }, { status: 500 })
    }

    return NextResponse.json({ success: true, companyPage })
  } catch (error) {
    console.error('Connect company page error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/linkedin/company-pages
 * Disconnect a company page for the workspace
 */
export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyPageId = searchParams.get('companyPageId')
    if (!companyPageId) {
      return NextResponse.json({ error: 'Company page ID required' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const selectedWorkspace = request.cookies.get('selected_workspace_id')?.value

    const { error: deleteError } = await supabase
      .from('linkedin_company_pages')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('workspace_id', selectedWorkspace)
      .eq('company_page_id', companyPageId)

    if (deleteError) {
      console.error('Failed to disconnect company page:', deleteError)
      return NextResponse.json({ error: 'Failed to disconnect company page' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Disconnect company page error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
 
