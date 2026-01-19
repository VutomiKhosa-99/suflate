'use client'

import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

interface AIAssistToolbarProps {
  onFixGrammar: () => Promise<void>
  onMakeClearer: () => Promise<void>
  onShorten: () => Promise<void>
}

export function AIAssistToolbar({ onFixGrammar, onMakeClearer, onShorten }: AIAssistToolbarProps) {
  const [loading, setLoading] = useState<'grammar' | 'clearer' | 'shorten' | null>(null)

  const handleAction = async (action: 'grammar' | 'clearer' | 'shorten', fn: () => Promise<void>) => {
    setLoading(action)
    try {
      await fn()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-2 p-4 border-t bg-gray-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction('grammar', onFixGrammar)}
        disabled={loading !== null}
      >
        {loading === 'grammar' ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Fixing...
          </>
        ) : (
          'Fix grammar'
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction('clearer', onMakeClearer)}
        disabled={loading !== null}
      >
        {loading === 'clearer' ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Making clearer...
          </>
        ) : (
          'Make clearer'
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction('shorten', onShorten)}
        disabled={loading !== null}
      >
        {loading === 'shorten' ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Shortening...
          </>
        ) : (
          'Shorten'
        )}
      </Button>
    </div>
  )
}
