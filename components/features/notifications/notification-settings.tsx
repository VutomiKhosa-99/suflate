'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Bell, BellOff, Mail, Smartphone, Loader2, Check, X } from 'lucide-react'

interface NotificationPreferences {
  email: boolean
  push: boolean
}

/**
 * Notification Settings Component
 * Allows users to manage email and push notification preferences
 */
export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    push: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check push notification support
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true)
      setPushPermission(Notification.permission)
    }

    // Load current preferences
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/users/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.notifications || { email: true, push: false })
      }
    } catch (err) {
      console.error('Failed to load preferences:', err)
    } finally {
      setLoading(false)
    }
  }

  const requestPushPermission = async () => {
    try {
      const permission = await Notification.requestPermission()
      setPushPermission(permission)

      if (permission === 'granted') {
        await subscribeToPush()
      }
    } catch (err) {
      setError('Failed to request notification permission')
    }
  }

  const subscribeToPush = async () => {
    try {
      // Get VAPID public key
      const keyResponse = await fetch('/api/notifications/subscribe')
      if (!keyResponse.ok) {
        throw new Error('Push notifications not configured on server')
      }
      const { publicKey } = await keyResponse.json()

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      })

      // Send subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      })

      setPreferences(prev => ({ ...prev, push: true }))
    } catch (err) {
      console.error('Push subscription failed:', err)
      setError('Failed to enable push notifications')
    }
  }

  const unsubscribeFromPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }

      setPreferences(prev => ({ ...prev, push: false }))
    } catch (err) {
      console.error('Push unsubscribe failed:', err)
      setError('Failed to disable push notifications')
    }
  }

  const toggleEmail = async () => {
    setSaving(true)
    try {
      const newValue = !preferences.email
      const response = await fetch('/api/users/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notifications: { ...preferences, email: newValue },
        }),
      })

      if (response.ok) {
        setPreferences(prev => ({ ...prev, email: newValue }))
      }
    } catch (err) {
      setError('Failed to update preferences')
    } finally {
      setSaving(false)
    }
  }

  const togglePush = async () => {
    if (preferences.push) {
      await unsubscribeFromPush()
    } else {
      if (pushPermission !== 'granted') {
        await requestPushPermission()
      } else {
        await subscribeToPush()
      }
    }
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
      <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
      <p className="text-sm text-gray-600">
        Choose how you want to be notified when your scheduled posts are ready.
      </p>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {/* Email Notifications */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-500">
                  Receive emails when posts are ready to publish
                </p>
              </div>
            </div>
            <Button
              variant={preferences.email ? 'default' : 'outline'}
              size="sm"
              onClick={toggleEmail}
              disabled={saving}
            >
              {preferences.email ? (
                <>
                  <Check className="w-4 h-4 mr-1" /> Enabled
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-1" /> Disabled
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Push Notifications */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                {preferences.push ? (
                  <Bell className="w-5 h-5 text-purple-600" />
                ) : (
                  <BellOff className="w-5 h-5 text-purple-600" />
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Push Notifications</h4>
                <p className="text-sm text-gray-500">
                  {pushSupported
                    ? 'Get instant browser notifications'
                    : 'Not supported in this browser'}
                </p>
              </div>
            </div>
            <Button
              variant={preferences.push ? 'default' : 'outline'}
              size="sm"
              onClick={togglePush}
              disabled={!pushSupported || saving}
            >
              {preferences.push ? (
                <>
                  <Check className="w-4 h-4 mr-1" /> Enabled
                </>
              ) : pushPermission === 'denied' ? (
                'Blocked'
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-1" /> Enable
                </>
              )}
            </Button>
          </div>
          {pushPermission === 'denied' && (
            <p className="text-xs text-amber-600 mt-2 ml-13">
              Push notifications are blocked. Please enable them in your browser settings.
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
