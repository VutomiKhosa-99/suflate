'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, BarChart3, Zap } from 'lucide-react'
import Link from 'next/link'

export default function UsagePage() {
  const [usage, setUsage] = useState({
    creditsUsed: 45,
    creditsTotal: 100,
    wordsGenerated: 12500,
    wordsLimit: 50000,
    postsCreated: 23,
    carouselsCreated: 5,
  })

  const creditsPercentage = (usage.creditsUsed / usage.creditsTotal) * 100
  const wordsPercentage = (usage.wordsGenerated / usage.wordsLimit) * 100

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/settings" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Usage & Limits</h1>
          <p className="text-gray-600 mt-1">Track your AI usage and remaining credits</p>
        </div>
      </div>

      {/* Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Credits Usage */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Credits</h3>
                <p className="text-sm text-gray-500">Resets monthly</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {usage.creditsUsed}/{usage.creditsTotal}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
              style={{ width: `${creditsPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {usage.creditsTotal - usage.creditsUsed} credits remaining this month
          </p>
        </div>

        {/* Words Generated */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Words Generated</h3>
                <p className="text-sm text-gray-500">This month</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {(usage.wordsGenerated / 1000).toFixed(1)}K
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
              style={{ width: `${wordsPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {((usage.wordsLimit - usage.wordsGenerated) / 1000).toFixed(1)}K words remaining
          </p>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">This Month&apos;s Activity</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{usage.postsCreated}</div>
            <div className="text-sm text-gray-500">Posts Created</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{usage.carouselsCreated}</div>
            <div className="text-sm text-gray-500">Carousels Made</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">8</div>
            <div className="text-sm text-gray-500">Voice Notes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">12</div>
            <div className="text-sm text-gray-500">AI Assists</div>
          </div>
        </div>
      </div>
    </div>
  )
}
