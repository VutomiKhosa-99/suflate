'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, CreditCard, Check } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    popular: false,
    features: [
      '100 credits/month',
      'Voice to Post',
      'Content Repurposing',
      'Basic Analytics',
      '1 Workspace',
    ],
  },
  {
    id: 'creator',
    name: 'Creator',
    price: 59,
    popular: true,
    features: [
      '250 credits/month',
      'All Starter Features',
      'Advanced Analytics',
      'Carousel Creator',
      '3 Workspaces',
      'Priority Support',
    ],
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 149,
    popular: false,
    features: [
      '750 credits/month',
      'All Creator Features',
      'Unlimited Workspaces',
      'Team Management',
      'White-label Carousels',
      'API Access',
    ],
  },
]

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState('starter')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/settings" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments & Plans</h1>
          <p className="text-gray-600 mt-1">Manage your subscription and billing</p>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <span className={`text-sm ${billingCycle === 'monthly' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
          Monthly Plans
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            billingCycle === 'annual' ? 'bg-purple-500' : 'bg-gray-300'
          }`}
        >
          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            billingCycle === 'annual' ? 'translate-x-8' : 'translate-x-1'
          }`} />
        </button>
        <span className={`text-sm ${billingCycle === 'annual' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
          Annual Plans
        </span>
      </div>

      {billingCycle === 'annual' && (
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-200">
            ✨ Get 20% off on annual plans
          </span>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const price = billingCycle === 'annual' ? Math.round(plan.price * 0.8) : plan.price
          const isCurrentPlan = currentPlan === plan.id
          
          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 p-6 ${
                plan.popular 
                  ? 'border-purple-500 shadow-lg' 
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-purple-500 text-white text-xs font-semibold rounded-full">
                    POPULAR CHOICE
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">${price}</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  isCurrentPlan 
                    ? 'bg-gray-100 text-gray-500 cursor-default' 
                    : plan.popular 
                    ? 'bg-purple-500 hover:bg-purple-600' 
                    : ''
                }`}
                disabled={isCurrentPlan}
              >
                {isCurrentPlan ? 'Current Plan' : 'Upgrade'}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
