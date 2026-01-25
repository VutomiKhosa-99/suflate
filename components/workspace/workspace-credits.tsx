'use client'

import { useState, useEffect } from 'react'
import { CreditCard, TrendingUp, Zap } from 'lucide-react'

interface CreditUsage {
  workspace_id: string
  plan: string
  credits_remaining: number
  credits_total: number
  credits_used_this_month: number
  usage_percentage: number
  usage_by_feature: Record<string, number>
  recent_usage: Array<{
    feature_type: string
    credits_used: number
    created_at: string
  }>
}

interface WorkspaceCreditsProps {
  workspaceId: string
}

const featureLabels: Record<string, string> = {
  transcription: 'Voice Transcription',
  post_generation: 'Post Generation',
  carousel: 'Carousel Creation',
  repurpose_blog: 'Blog Repurposing',
  repurpose_tweet: 'Tweet Repurposing',
  repurpose_pdf: 'PDF Repurposing',
  repurpose_youtube: 'YouTube Repurposing',
}

const featureColors: Record<string, string> = {
  transcription: 'bg-blue-500',
  post_generation: 'bg-purple-500',
  carousel: 'bg-green-500',
  repurpose_blog: 'bg-orange-500',
  repurpose_tweet: 'bg-sky-500',
  repurpose_pdf: 'bg-red-500',
  repurpose_youtube: 'bg-pink-500',
}

export function WorkspaceCredits({ workspaceId }: WorkspaceCreditsProps) {
  const [usage, setUsage] = useState<CreditUsage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  async function loadUsage() {
    try {
      const res = await fetch(`/api/workspaces/credits?workspaceId=${workspaceId}`)
      if (res.ok) {
        const data = await res.json()
        setUsage(data)
      }
    } catch (e) {
      console.error('Failed to load usage:', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse h-48 bg-gray-100 rounded-lg" />
  }

  if (!usage) {
    return <div className="text-gray-500">Failed to load credit usage</div>
  }

  const usagePercentage = Math.min(usage.usage_percentage, 100)

  return (
    <div className="space-y-6">
      {/* Credit Balance Card */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <span className="font-medium">Credit Balance</span>
          </div>
          <span className="text-sm opacity-80 capitalize">{usage.plan} Plan</span>
        </div>
        <div className="text-4xl font-bold mb-2">
          {usage.credits_remaining}
          <span className="text-lg font-normal opacity-80">/{usage.credits_total}</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2 mb-2">
          <div 
            className="bg-white rounded-full h-2 transition-all"
            style={{ width: `${100 - usagePercentage}%` }}
          />
        </div>
        <div className="text-sm opacity-80">
          {usage.credits_used_this_month} credits used this month
        </div>
      </div>

      {/* Usage Breakdown */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5" />
          Usage Breakdown
        </h3>
        
        {Object.keys(usage.usage_by_feature).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(usage.usage_by_feature)
              .sort(([, a], [, b]) => b - a)
              .map(([feature, credits]) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${featureColors[feature] || 'bg-gray-400'}`} />
                  <span className="flex-1 text-sm text-gray-700">
                    {featureLabels[feature] || feature}
                  </span>
                  <span className="text-sm font-medium">{credits} credits</span>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-gray-500 text-sm">No usage this month yet</div>
        )}
      </div>

      {/* Credit Costs Reference */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Credit Costs
        </h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Transcription</span>
            <span className="font-medium">1/min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Post Generation</span>
            <span className="font-medium">5/job</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Carousel</span>
            <span className="font-medium">10/job</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Blog Repurpose</span>
            <span className="font-medium">5/job</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tweet Repurpose</span>
            <span className="font-medium">3/job</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">PDF Repurpose</span>
            <span className="font-medium">5/job</span>
          </div>
        </div>
      </div>
    </div>
  )
}
