'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, MicOff } from 'lucide-react'

interface ErrorStateProps {
  error: 'mic-permission' | 'transcription-failure' | 'ai-timeout' | 'linkedin-auth' | 'generic'
  onRetry?: () => void
  message?: string
}

const errorConfig = {
  'mic-permission': {
    icon: MicOff,
    title: 'Microphone Access Denied',
    message: 'We need microphone access to record your voice. Please enable microphone permissions in your browser settings.',
    action: 'Enable Microphone',
  },
  'transcription-failure': {
    icon: AlertCircle,
    title: 'Transcription Failed',
    message: 'We couldn\'t transcribe your recording. Please try recording again.',
    action: 'Record Again',
  },
  'ai-timeout': {
    icon: AlertCircle,
    title: 'Processing Timeout',
    message: 'Processing is taking longer than expected. Please try again.',
    action: 'Try Again',
  },
  'linkedin-auth': {
    icon: AlertCircle,
    title: 'LinkedIn Connection Failed',
    message: 'We couldn\'t connect your LinkedIn account. Please try again.',
    action: 'Connect Again',
  },
  'generic': {
    icon: AlertCircle,
    title: 'Something Went Wrong',
    message: 'An error occurred. Please try again.',
    action: 'Try Again',
  },
}

export function ErrorState({ error, onRetry, message }: ErrorStateProps) {
  const config = errorConfig[error]
  const Icon = config.icon

  return (
    <Card className="p-6 border-red-200 bg-red-50">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <Icon className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{config.title}</h3>
          <p className="text-sm text-gray-600">{message || config.message}</p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            {config.action}
          </Button>
        )}
      </div>
    </Card>
  )
}
