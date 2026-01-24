import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1] || ''

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  
  // Clear all Supabase auth cookies
  const cookieName = `sb-${projectRef}-auth-token`
  
  // Clear main cookie
  response.cookies.set(cookieName, '', {
    path: '/',
    maxAge: 0,
  })
  
  // Clear chunked cookies (up to 10 chunks)
  for (let i = 0; i < 10; i++) {
    response.cookies.set(`${cookieName}.${i}`, '', {
      path: '/',
      maxAge: 0,
    })
  }
  
  // Clear code verifier cookie
  response.cookies.set(`${cookieName}-code-verifier`, '', {
    path: '/',
    maxAge: 0,
  })
  
  console.log('[Logout API] Cleared auth cookies')
  
  return response
}
