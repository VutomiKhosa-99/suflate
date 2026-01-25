'use client'

import { useState, useEffect } from 'react'
import { Palette, Upload, X, Check } from 'lucide-react'

interface Branding {
  primary_color?: string
  secondary_color?: string
  logo_url?: string
  company_name?: string
  tagline?: string
}

interface WorkspaceBrandingProps {
  workspaceId: string
}

export function WorkspaceBranding({ workspaceId }: WorkspaceBrandingProps) {
  const [branding, setBranding] = useState<Branding>({
    primary_color: '#3b82f6',
    secondary_color: '#8b5cf6',
    company_name: '',
    tagline: '',
  })
  const [logoUrl, setLogoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBranding()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  async function loadBranding() {
    try {
      const res = await fetch(`/api/workspaces/branding?workspaceId=${workspaceId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.branding) {
          setBranding(data.branding)
        }
        if (data.logo_url) {
          setLogoUrl(data.logo_url)
        }
      }
    } catch (e) {
      console.error('Failed to load branding:', e)
    }
  }

  async function saveBranding() {
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const res = await fetch('/api/workspaces/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          branding,
          logo_url: logoUrl || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save branding')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save branding')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Workspace Branding</h3>
      </div>

      {/* Company Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name
          </label>
          <input
            type="text"
            value={branding.company_name || ''}
            onChange={(e) => setBranding({ ...branding, company_name: e.target.value })}
            placeholder="Your Company"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tagline
          </label>
          <input
            type="text"
            value={branding.tagline || ''}
            onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
            placeholder="Your company tagline"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Primary Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={branding.primary_color || '#3b82f6'}
              onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={branding.primary_color || '#3b82f6'}
              onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
              className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Secondary Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={branding.secondary_color || '#8b5cf6'}
              onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={branding.secondary_color || '#8b5cf6'}
              onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
              className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono"
            />
          </div>
        </div>
      </div>

      {/* Color Preview */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div
          className="w-16 h-16 rounded-lg shadow-sm"
          style={{ backgroundColor: branding.primary_color }}
        />
        <div
          className="w-16 h-16 rounded-lg shadow-sm"
          style={{ backgroundColor: branding.secondary_color }}
        />
        <div
          className="flex-1 h-16 rounded-lg shadow-sm"
          style={{
            background: `linear-gradient(135deg, ${branding.primary_color} 0%, ${branding.secondary_color} 100%)`,
          }}
        />
      </div>

      {/* Logo URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Logo URL
        </label>
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {logoUrl && (
            <button
              onClick={() => setLogoUrl('')}
              className="p-2 text-gray-500 hover:text-red-500"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {logoUrl && (
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt="Logo preview"
              className="max-h-16 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        )}
      </div>

      {/* Save Button */}
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        onClick={saveBranding}
        disabled={saving}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium
                   hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2"
      >
        {saving ? (
          <span>Saving...</span>
        ) : saved ? (
          <>
            <Check className="w-5 h-5" />
            Saved!
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Save Branding
          </>
        )}
      </button>
    </div>
  )
}
