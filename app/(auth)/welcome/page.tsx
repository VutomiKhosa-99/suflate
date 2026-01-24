'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { OnboardingModal } from '@/components/features/onboarding/onboarding-modal'
import { Logo } from '@/components/ui/logo'
import { Mic, Sparkles, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Welcome page shown after email verification
 * Story 2.5: Onboarding Tutorial
 */
export default function WelcomePage() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)
      setLoading(false)

      // Check if user has completed onboarding
      const onboardingCompleted = localStorage.getItem(`onboarding_completed_${user.id}`)
      if (!onboardingCompleted) {
        setShowOnboarding(true)
      }
    }

    checkUser()
  }, [router])

  const handleOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true')
    }
    setShowOnboarding(false)
    router.push('/record')
  }

  const handleOnboardingSkip = () => {
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true')
    }
    setShowOnboarding(false)
  }

  const handleStartRecording = () => {
    router.push('/record')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Logo />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          {/* Welcome Message */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Welcome to Suflate{user?.user_metadata?.name ? `, ${user.user_metadata.name}` : ''}!
            </h1>
            <p className="text-xl text-gray-600">
              Say it. We'll help you post it.
            </p>
          </div>

          {/* How it works */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Mic className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Speak</h3>
              <p className="text-sm text-gray-600">
                Record your thoughts naturally. No scripts needed.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Shape</h3>
              <p className="text-sm text-gray-600">
                We turn your voice into LinkedIn posts that sound like you.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Send className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Post</h3>
              <p className="text-sm text-gray-600">
                Choose your favorite variation and publish to LinkedIn.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <Button
              onClick={handleStartRecording}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg h-auto"
            >
              <Mic className="w-5 h-5 mr-2" />
              Record your first post
            </Button>
            
            <p className="text-sm text-gray-500">
              Takes less than 3 minutes
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
