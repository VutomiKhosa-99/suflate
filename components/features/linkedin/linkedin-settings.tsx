'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/utils/supabase/client'

interface LinkedInSettingsProps {
  userId: string
}

export function LinkedInSettings({ userId }: LinkedInSettingsProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [headline, setHeadline] = useState('')
  const [savingHeadline, setSavingHeadline] = useState(false)
  const [headlineSaved, setHeadlineSaved] = useState(false)

  useEffect(() => {
    checkConnection()
  }, [userId])

  const checkConnection = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('users')
        .select('linkedin_profile_id, linkedin_headline')
        .eq('id', userId)
        .single() as { data: { linkedin_profile_id?: string; linkedin_headline?: string } | null; error: unknown }

      if (!error && data?.linkedin_profile_id) {
        setIsConnected(true)
      }
      if (data?.linkedin_headline) {
        setHeadline(data.linkedin_headline)
      }
    } catch (e) {
      console.error('Failed to check LinkedIn connection:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = () => {
    // Redirect to LinkedIn OAuth
    window.location.href = '/api/linkedin/oauth'
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('users')
        .update({
          linkedin_access_token: null,
          linkedin_profile_id: null,
        } as never)
        .eq('id', userId)

      if (error) throw error
      setIsConnected(false)
    } catch (e) {
      console.error('Failed to disconnect LinkedIn:', e)
      alert('Failed to disconnect LinkedIn. Please try again.')
    } finally {
      setDisconnecting(false)
    }
  }
  
  const handleSaveHeadline = async () => {
    setSavingHeadline(true)
    setHeadlineSaved(false)
    try {
      const response = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedin_headline: headline }),
      })
      
      if (!response.ok) throw new Error('Failed to save headline')
      setHeadlineSaved(true)
      setTimeout(() => setHeadlineSaved(false), 3000)
    } catch (e) {
      console.error('Failed to save headline:', e)
      alert('Failed to save headline. Please try again.')
    } finally {
      setSavingHeadline(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-100 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0077B5] rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">LinkedIn</h3>
              <p className="text-sm text-gray-500">
                {isConnected 
                  ? 'Connected - You can post directly to LinkedIn' 
                  : 'Connect to post content directly to LinkedIn'}
              </p>
            </div>
          </div>
          
          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Connected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleConnect}
              className="bg-[#0077B5] hover:bg-[#006399] text-white"
            >
              Connect LinkedIn
            </Button>
          )}
        </div>
      </div>
      
      {/* LinkedIn Headline Setting */}
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-2">Profile Headline</h3>
        <p className="text-sm text-gray-500 mb-3">
          This appears in your LinkedIn post preview. Update it to match your current LinkedIn headline.
        </p>
        <div className="flex gap-2">
          <Input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g., Software Engineer at Company | Tech Enthusiast"
            className="flex-1"
          />
          <Button
            onClick={handleSaveHeadline}
            disabled={savingHeadline}
            variant="outline"
          >
            {savingHeadline ? 'Saving...' : headlineSaved ? '✓ Saved' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}
