'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface PricingTier {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  popular?: boolean
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    description: 'Perfect for trying out Suflate',
    features: [
      '10 voice recordings per month',
      'Basic transcription',
      '3 post variations per recording',
      'Community support',
    ],
    cta: 'Get started',
  },
  {
    name: 'Professional',
    price: '$29',
    period: 'per month',
    description: 'For serious LinkedIn creators',
    features: [
      'Unlimited voice recordings',
      'Advanced transcription',
      '5 post variations per recording',
      'Content library',
      'Priority support',
      'Analytics dashboard',
    ],
    cta: 'Start free trial',
    popular: true,
  },
  {
    name: 'Team',
    price: '$99',
    period: 'per month',
    description: 'For teams and agencies',
    features: [
      'Everything in Professional',
      'Team workspace',
      'Unlimited team members',
      'Team analytics',
      'Custom integrations',
      'Dedicated support',
    ],
    cta: 'Contact sales',
  },
]

export function Pricing() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-xl border-2 transition-all duration-300 ${
                  tier.popular
                    ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                    {tier.price !== 'Free' && (
                      <span className="text-gray-500">/{tier.period}</span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">{tier.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/signup" className="block">
                  <Button
                    className={`w-full h-12 ${
                      tier.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-white border-2 border-gray-300 hover:border-blue-600 text-gray-900 hover:text-blue-600'
                    }`}
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600">
              All plans include a 7-day free trial. No credit card required.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
