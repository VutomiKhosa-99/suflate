'use client'

import { Progress } from '@/components/ui/progress'
import { Check } from 'lucide-react'

interface ProcessingStep {
  id: string
  label: string
  status: 'pending' | 'active' | 'completed'
}

interface ProcessingStepperProps {
  steps: ProcessingStep[]
  currentStep: number
}

export function ProcessingStepper({ steps, currentStep }: ProcessingStepperProps) {
  const getStepIcon = (step: ProcessingStep, index: number) => {
    if (step.status === 'completed') {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white">
          <Check className="w-5 h-5" />
        </div>
      )
    }
    if (step.status === 'active') {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
        </div>
      )
    }
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-600">
        {index + 1}
      </div>
    )
  }

  return (
    <div className="space-y-6 py-8">
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-4">
            {getStepIcon(step, index)}
            <div className="flex-1">
              <p
                className={`font-medium ${
                  step.status === 'active'
                    ? 'text-blue-600'
                    : step.status === 'completed'
                    ? 'text-gray-900'
                    : 'text-gray-500'
                }`}
              >
                {step.label}
              </p>
              {step.status === 'active' && (
                <Progress value={(currentStep / steps.length) * 100} className="mt-2" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
