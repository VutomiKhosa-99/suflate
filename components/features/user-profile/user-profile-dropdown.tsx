'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { 
  CreditCard, 
  BarChart3, 
  Building2, 
  MessageSquarePlus, 
  HelpCircle, 
  LogOut,
  ChevronDown
} from 'lucide-react'

interface UserProfileDropdownProps {
  user: {
    email?: string | null
    user_metadata?: {
      name?: string
    }
  }
  onLogout: () => void
}

export function UserProfileDropdown({ user, onLogout }: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const menuItems = [
    { icon: CreditCard, label: 'Payments & Plans', href: '/settings/billing' },
    { icon: BarChart3, label: 'AI Usage & Limits', href: '/settings/usage' },
    { icon: Building2, label: 'Manage All Workspaces', href: '/settings/workspaces' },
    { divider: true },
    { icon: MessageSquarePlus, label: 'Feature Request', href: '/feedback', external: true },
    { icon: HelpCircle, label: 'Help Center', href: '/help', external: true },
  ]

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
          {user.email?.charAt(0).toUpperCase() || 'U'}
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs text-gray-500">Signed in as</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.email}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item, index) => {
              if ('divider' in item) {
                return <div key={index} className="my-2 border-t border-gray-100" />
              }
              
              const Icon = item.icon
              return (
                <Link
                  key={index}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Icon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 py-2">
            <button
              onClick={() => {
                setIsOpen(false)
                onLogout()
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
