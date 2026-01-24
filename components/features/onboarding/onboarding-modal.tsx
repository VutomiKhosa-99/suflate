'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Sparkles, Send, ArrowRight, X } from 'lucide-react'

interface OnboardingModalProps {
  onComplete: () => void
  onSkip: () => void
}

const steps = [
  {
    title: 'Speak naturally',
    description: 'Record your thoughts in your own voice. No scripts, no preparation needed. Just talk for up to 3 minutes about what\'s on your mind.',
    icon: Mic,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'We shape it',
    description: 'Suflate turns your voice into 5 different LinkedIn post variations. Each one preserves your authentic voice while optimizing for engagement.',
    icon: Sparkles,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    title: 'You post it',
    description: 'Choose your favorite variation, make any edits you want, then publish directly to LinkedIn or schedule for later.',
    icon: Send,
    color: 'bg-green-100 text-green-600',
  },
]

export function OnboardingModal({ onComplete, onSkip }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onSkip()
  }

  const currentStepData = steps[currentStep]
  const Icon = currentStepData.icon

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div className={`w-20 h-20 rounded-full ${currentStepData.color} flex items-center justify-center mx-auto mb-6`}>
            <Icon className="w-10 h-10" />
          </div>

          {/* Step Number */}
          <div className="text-sm font-medium text-gray-500 mb-2">
            Step {currentStep + 1} of {steps.length}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {currentStepData.title}
          </h2>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed mb-8">
            {currentStepData.description}
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {currentStep === steps.length - 1 ? (
                'Get Started'
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Skip link */}
        <div className="p-4 border-t text-center">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Skip tutorial
          </button>
        </div>
      </div>
    </div>
  )
}
