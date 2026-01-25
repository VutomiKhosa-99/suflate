'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Building2, Loader2, Check, Plus, Trash2, ExternalLink } from 'lucide-react'

interface CompanyPage {
  id: string
  urn: string
  name: string
  logoUrl?: string
  isConnected: boolean
}

/**
 * LinkedIn Company Pages Manager
 * Allows users to connect their company pages for auto-posting
 */
export function LinkedInCompanyPages() {
  const [companyPages, setCompanyPages] = useState<CompanyPage[]>([])
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCompanyPages()
  }, [])

  const loadCompanyPages = async () => {
    try {
      const response = await fetch('/api/linkedin/company-pages')
      const data = await response.json()
      
      setConnected(data.connected)
      setCompanyPages(data.companyPages || [])
      setMessage(data.message || null)
    } catch (err) {
      console.error('Failed to load company pages:', err)
      setError('Failed to load company pages')
    } finally {
      setLoading(false)
    }
  }

  const connectPage = async (page: CompanyPage) => {
    setConnecting(page.id)
    setError(null)
    
    try {
      const response = await fetch('/api/linkedin/company-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyPageId: page.id,
          companyName: page.name,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to connect page')
      }

      setCompanyPages(prev =>
        prev.map(p => (p.id === page.id ? { ...p, isConnected: true } : p))
      )
    } catch (err) {
      setError('Failed to connect company page')
    } finally {
      setConnecting(null)
    }
  }

  const disconnectPage = async (pageId: string) => {
    if (!confirm('Are you sure you want to disconnect this company page?')) return
    
    setConnecting(pageId)
    setError(null)

    try {
      const response = await fetch(`/api/linkedin/company-pages?companyPageId=${pageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect page')
      }

      setCompanyPages(prev =>
        prev.map(p => (p.id === pageId ? { ...p, isConnected: false } : p))
      )
    } catch (err) {
      setError('Failed to disconnect company page')
    } finally {
      setConnecting(null)
    }
  }

  const connectLinkedIn = () => {
    window.location.href = '/api/linkedin/oauth'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">LinkedIn Company Pages</h3>
          <p className="text-sm text-gray-600">
            Connect your company pages to enable automatic posting
          </p>
        </div>
        {!connected && (
          <Button onClick={connectLinkedIn}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Connect LinkedIn
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {message && !error && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
          {message}
        </div>
      )}

      {connected && companyPages.length === 0 && (
        <Card className="p-6 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="font-medium text-gray-900 mb-1">No Company Pages Found</h4>
          <p className="text-sm text-gray-500">
            You need to be an admin of a LinkedIn Company Page to connect it.
          </p>
        </Card>
      )}

      {companyPages.length > 0 && (
        <div className="space-y-3">
          {companyPages.map(page => (
            <Card key={page.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {page.logoUrl ? (
                    <img
                      src={page.logoUrl}
                      alt={page.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900">{page.name}</h4>
                    <p className="text-xs text-gray-500">ID: {page.id}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {page.isConnected ? (
                    <>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <Check className="w-3 h-3 mr-1" /> Connected
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => disconnectPage(page.id)}
                        disabled={connecting === page.id}
                      >
                        {connecting === page.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-500" />
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => connectPage(page)}
                      disabled={connecting === page.id}
                    >
                      {connecting === page.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Plus className="w-4 h-4 mr-1" />
                      )}
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {connected && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="font-medium text-amber-800 mb-1">ℹ️ How Company Page Posting Works</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Connected pages can receive automatic scheduled posts</li>
            <li>• You must be an admin of the page on LinkedIn</li>
            <li>• Posts will be published directly to the page&apos;s feed</li>
            <li>• Personal profiles still use copy-and-paste workflow</li>
          </ul>
        </div>
      )}
    </div>
  )
}
