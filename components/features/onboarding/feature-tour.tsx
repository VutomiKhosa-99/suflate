'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { 
  Mic, 
  Sparkles, 
  Calendar, 
  BarChart3, 
  FileText, 
  Share2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeatureSlide {
  id: number
  badge: string
  badgeColor: string
  title: string
  description: string
  icon: React.ReactNode
  previewContent: React.ReactNode
}

const featureSlides: FeatureSlide[] = [
  {
    id: 1,
    badge: 'Voice-First Creation',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    title: 'Turn your voice into LinkedIn posts that sound like you.',
    description: 'Record your thoughts naturally, and we\'ll transform them into engaging LinkedIn content.',
    icon: <Mic className="w-8 h-8" />,
    previewContent: (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <p className="text-sm text-gray-500 mb-2">What do you want to post about?</p>
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-sm text-gray-700">Share your thoughts on the latest AI developments and how they impact content creators...</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-gray-500">Recording...</span>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    badge: 'AI-Powered Variations',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
    title: 'Get 5 unique post variations from a single recording.',
    description: 'Our AI generates different styles: professional, personal, actionable tips, discussion starters, and bold opinions.',
    icon: <Sparkles className="w-8 h-8" />,
    previewContent: (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-2">
        <p className="text-sm text-gray-500 mb-2">Select your preferred style</p>
        {['Professional', 'Personal Story', 'Actionable Tips', 'Discussion', 'Bold Opinion'].map((style, i) => (
          <div key={style} className={cn(
            "px-3 py-2 rounded-lg text-sm border transition-colors",
            i === 0 ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-600"
          )}>
            {style}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 3,
    badge: 'Carousel Generator',
    badgeColor: 'bg-green-100 text-green-700 border-green-200',
    title: 'Create stunning carousels in seconds.',
    description: 'Transform your posts into eye-catching carousel slides with customizable templates.',
    icon: <FileText className="w-8 h-8" />,
    previewContent: (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">{i}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">Preview: 3 of 6 slides</p>
      </div>
    ),
  },
  {
    id: 4,
    badge: 'Smart Scheduling',
    badgeColor: 'bg-orange-100 text-orange-700 border-orange-200',
    title: 'Schedule posts for optimal engagement.',
    description: 'Plan your content calendar and let us remind you when it\'s time to post.',
    icon: <Calendar className="w-8 h-8" />,
    previewContent: (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="space-y-2">
          {['Mon 9:00 AM', 'Wed 12:00 PM', 'Fri 5:00 PM'].map((time, i) => (
            <div key={time} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">{time}</span>
              <div className={cn(
                "w-2 h-2 rounded-full",
                i === 0 ? "bg-green-500" : "bg-gray-300"
              )} />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 5,
    badge: 'Direct Publishing',
    badgeColor: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    title: 'Publish directly to LinkedIn with one click.',
    description: 'Connect your LinkedIn account and post your content without leaving Suflate.',
    icon: <Share2 className="w-8 h-8" />,
    previewContent: (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">in</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">LinkedIn Connected</p>
            <p className="text-xs text-green-600">Ready to publish</p>
          </div>
        </div>
        <Button size="sm" className="w-full">
          Publish Now
        </Button>
      </div>
    ),
  },
  {
    id: 6,
    badge: 'Analytics & Insights',
    badgeColor: 'bg-pink-100 text-pink-700 border-pink-200',
    title: 'Track your content performance.',
    description: 'See which posts resonate with your audience and optimize your strategy.',
    icon: <BarChart3 className="w-8 h-8" />,
    previewContent: (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Impressions</span>
            <span className="text-sm font-medium text-gray-900">12.4K</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-3/4 bg-blue-500 rounded-full" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Engagement</span>
            <span className="text-sm font-medium text-green-600">+24%</span>
          </div>
        </div>
      </div>
    ),
  },
]

interface FeatureTourProps {
  onComplete: () => void
  onSkip?: () => void
}

export function FeatureTour({ onComplete, onSkip }: FeatureTourProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const totalSlides = featureSlides.length
  const slide = featureSlides[currentSlide]

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      onComplete()
    }
  }

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const handleSkip = () => {
    onSkip?.()
    onComplete()
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="pt-8 pb-4 px-8 text-center border-b border-gray-100">
            <Logo size="md" className="mx-auto mb-4" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Get ready to enjoy these features
            </h1>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left: Feature info */}
              <div className="space-y-6">
                {/* Badge */}
                <span className={cn(
                  "inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium border",
                  slide.badgeColor
                )}>
                  {slide.badge}
                </span>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                  {slide.title}
                </h2>

                {/* Description */}
                <p className="text-gray-600">
                  {slide.description}
                </p>
              </div>

              {/* Right: Preview */}
              <div className="flex justify-center">
                <div className="w-full max-w-xs">
                  {slide.previewContent}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-between">
            {/* Pagination dots */}
            <div className="flex items-center gap-2">
              {featureSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-300",
                    index === currentSlide
                      ? "bg-orange-500 w-6"
                      : "bg-gray-300 hover:bg-gray-400"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-3">
              {currentSlide > 0 ? (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="min-w-[100px] border-gray-300 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Skip tour
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                className="min-w-[140px] bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25"
              >
                {currentSlide === totalSlides - 1 ? (
                  <>
                    Get Started
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    Continue
                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                      {currentSlide + 1}/{totalSlides}
                    </span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
