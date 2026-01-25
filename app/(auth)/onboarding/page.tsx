'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { User, Users, Building2, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type UserRole = 'individual' | 'ghostwriter' | 'team'

interface RoleOption {
  id: UserRole
  title: string
  description: string
  icon: React.ReactNode
}

const roleOptions: RoleOption[] = [
  {
    id: 'individual',
    title: 'Individual Creator',
    description: 'Grow Your Personal Brand',
    icon: <User className="w-6 h-6" />,
  },
  {
    id: 'ghostwriter',
    title: 'Ghostwriter',
    description: 'Manage Multiple Client Accounts',
    icon: <Users className="w-6 h-6" />,
  },
  {
    id: 'team',
    title: 'Team',
    description: 'Activate & Scale Your Team&apos;s LinkedIn Presence',
    icon: <Building2 className="w-6 h-6" />,
  },
]

/**
 * Onboarding page - Role selection after signup
 * Similar to Supergrow's onboarding flow
 */
export default function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user has already completed onboarding
      const { data: userData } = await supabase
        .from('users')
        .select('user_role, onboarding_completed')
        .eq('id', user.id)
        .single()

      if (userData && (userData as { onboarding_completed?: boolean }).onboarding_completed) {
        router.push('/dashboard')
        return
      }

      setUser(user)
      setLoading(false)
    }

    checkUser()
  }, [router])

  const handleContinue = async () => {
    if (!selectedRole || !user) return

    setSaving(true)
    try {
      const supabase = createClient()
      
      // Update user's role and mark onboarding as complete
      const client = supabase as unknown as {
        from: (table: string) => {
          update: (data: Record<string, unknown>) => {
            eq: (col: string, val: string) => Promise<{ error: Error | null }>
          }
        }
      }
      
      const { error } = await client
        .from('users')
        .update({
          user_role: selectedRole,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) {
        console.error('Failed to save role:', error)
        // Still proceed even if update fails
      }

      // Redirect to welcome tutorial or dashboard
      router.push('/welcome')
    } catch (err) {
      console.error('Error saving role:', err)
      router.push('/welcome')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-2xl">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Welcome to Suflate 👋
            </h1>
            <p className="text-gray-600">
              Let&apos;s personalize your journey. Select your role below.
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Check className="w-4 h-4 text-green-500" />
              <span>Voice-First Content</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Check className="w-4 h-4 text-green-500" />
              <span>AI for LinkedIn Growth</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Check className="w-4 h-4 text-green-500" />
              <span>Direct Publishing</span>
            </div>
          </div>

          {/* Role label */}
          <p className="text-sm font-medium text-gray-700 mb-4">
            Please choose your role:
          </p>

          {/* Role options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {roleOptions.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={cn(
                  'relative p-6 rounded-xl border-2 text-left transition-all duration-200',
                  'hover:border-primary/50 hover:bg-primary/5',
                  selectedRole === role.id
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-gray-200 bg-white'
                )}
              >
                {/* Selection indicator */}
                <div className={cn(
                  'absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                  selectedRole === role.id
                    ? 'border-primary bg-primary'
                    : 'border-gray-300'
                )}>
                  {selectedRole === role.id && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>

                {/* Icon */}
                <div className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center mb-4',
                  selectedRole === role.id
                    ? 'bg-primary/10 text-primary'
                    : 'bg-gray-100 text-gray-600'
                )}>
                  {role.icon}
                </div>

                {/* Text */}
                <h3 className="font-semibold text-gray-900 mb-1">
                  {role.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {role.description}
                </p>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 mb-6" />

          {/* Continue button */}
          <div className="flex justify-end">
            <Button
              onClick={handleContinue}
              disabled={!selectedRole || saving}
              size="lg"
              className="min-w-[140px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
