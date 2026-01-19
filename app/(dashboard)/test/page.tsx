'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/**
 * Test Page - Quick testing interface before Epic 2 is complete
 * Helps verify all features are working
 */
export default function TestPage() {
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/test-auth')
        const data = await response.json()
        setAuthStatus(data)
      } catch (error) {
        console.error('Failed to check auth:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Suflate Test Page</h1>
        <p className="text-muted-foreground mb-8">
          Test all features before Epic 2 (Auth & Workspace) is complete
        </p>

        <div className="space-y-6">
          {/* Auth Status */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
            {loading ? (
              <p>Loading...</p>
            ) : authStatus ? (
              <div className="space-y-2">
                <p><strong>Supabase Connected:</strong> {authStatus.supabaseConnected ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Auth Available:</strong> {authStatus.authAvailable ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Has User:</strong> {authStatus.hasUser ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Test Mode:</strong> {authStatus.testMode ? '✅ Enabled' : '❌ Disabled'}</p>
                <p className="text-sm text-muted-foreground mt-4">{authStatus.message}</p>
              </div>
            ) : (
              <p className="text-red-500">Failed to check auth status</p>
            )}
          </Card>

          {/* Test Features */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Test Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => window.location.href = '/record'}
                className="w-full"
              >
                Test Voice Recording (Story 1.1)
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.href = '/api/test-auth'}
                className="w-full"
              >
                Check API Status
              </Button>

              <Button
                variant="outline"
                onClick={() => window.location.href = '/api/health'}
                className="w-full"
              >
                Health Check
              </Button>

              <Button
                variant="outline"
                onClick={() => window.location.href = '/dashboard'}
                className="w-full"
              >
                Dashboard (Placeholder)
              </Button>
            </div>
          </Card>

          {/* Epic 1 Status */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Epic 1 Status</h2>
            <div className="space-y-2 text-sm">
              <p>✅ Story 1.1: Record Voice Note</p>
              <p>✅ Story 1.2: Upload Existing Audio File</p>
              <p>✅ Story 1.3: Transcribe Voice Note via AssemblyAI</p>
              <p>✅ Story 1.4: Edit Transcription Before Amplification</p>
              <p>✅ Story 1.5: Amplify Voice Note into 5 Post Variations</p>
              <p>✅ Story 1.6: View Post Variations with Labels</p>
            </div>
            <p className="text-muted-foreground mt-4">
              <strong>Note:</strong> Using placeholder authentication until Epic 2 is complete.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
