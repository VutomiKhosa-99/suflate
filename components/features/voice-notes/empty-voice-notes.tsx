'use client'

import { Mic, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyVoiceNotesProps {
  onAddVoiceNote: () => void
}

export function EmptyVoiceNotes({ onAddVoiceNote }: EmptyVoiceNotesProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Illustration */}
      <div className="relative mb-8">
        {/* Background decorations */}
        <div className="absolute -top-6 -left-8 text-cyan-400 text-2xl">+</div>
        <div className="absolute -top-2 right-4 text-purple-300 text-sm">~</div>
        <div className="absolute bottom-8 -right-6 text-orange-300 text-xl">♪</div>
        <div className="absolute bottom-2 -left-4 text-cyan-300 text-lg">~</div>
        
        {/* Main illustration - Person with headphones */}
        <svg
          width="280"
          height="220"
          viewBox="0 0 280 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative"
        >
          {/* Wave/Sound bar on left */}
          <g transform="translate(20, 60)">
            <rect x="0" y="30" width="4" height="15" rx="2" fill="#0EA5E9" />
            <rect x="8" y="20" width="4" height="35" rx="2" fill="#0EA5E9" />
            <rect x="16" y="25" width="4" height="25" rx="2" fill="#0EA5E9" />
            <rect x="24" y="15" width="4" height="45" rx="2" fill="#0EA5E9" />
            <rect x="32" y="28" width="4" height="20" rx="2" fill="#0EA5E9" />
          </g>
          
          {/* Main circle background */}
          <circle cx="140" cy="110" r="70" fill="#FEF3C7" />
          
          {/* Pause button decoration */}
          <circle cx="95" cy="55" r="18" fill="#60A5FA" />
          <rect x="89" y="48" width="4" height="14" rx="1" fill="white" />
          <rect x="97" y="48" width="4" height="14" rx="1" fill="white" />
          
          {/* Person head */}
          <ellipse cx="140" cy="90" rx="28" ry="32" fill="#FBBF24" />
          
          {/* Hair */}
          <path
            d="M112 75C112 60 125 50 140 50C155 50 168 60 168 75C168 75 165 68 140 68C115 68 112 75 112 75Z"
            fill="#1E293B"
          />
          
          {/* Face */}
          <circle cx="130" cy="85" r="2" fill="#1E293B" /> {/* Left eye */}
          <circle cx="150" cy="85" r="2" fill="#1E293B" /> {/* Right eye */}
          <path d="M135 100C135 100 140 105 145 100" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" /> {/* Smile */}
          
          {/* Headphones */}
          <path
            d="M108 80C108 65 122 52 140 52C158 52 172 65 172 80"
            stroke="#1E293B"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="108" cy="88" r="10" fill="#1E293B" />
          <circle cx="172" cy="88" r="10" fill="#1E293B" />
          
          {/* Body/Shoulders */}
          <path
            d="M100 130C100 130 110 115 140 115C170 115 180 130 180 130L185 175L95 175L100 130Z"
            fill="#0EA5E9"
          />
          
          {/* Hand waving */}
          <g transform="translate(180, 115)">
            <ellipse cx="15" cy="30" rx="18" ry="22" fill="#FBBF24" />
            {/* Fingers */}
            <ellipse cx="5" cy="12" rx="5" ry="12" fill="#FBBF24" />
            <ellipse cx="15" cy="8" rx="5" ry="14" fill="#FBBF24" />
            <ellipse cx="25" cy="10" rx="5" ry="13" fill="#FBBF24" />
            <ellipse cx="33" cy="15" rx="4" ry="11" fill="#FBBF24" />
            <ellipse cx="38" cy="25" rx="4" ry="9" fill="#FBBF24" />
          </g>
          
          {/* Microphone on left */}
          <g transform="translate(60, 120)">
            <rect x="8" y="0" width="14" height="35" rx="7" fill="#374151" />
            <rect x="0" y="30" width="30" height="5" rx="2" fill="#374151" />
            <rect x="12" y="35" width="6" height="20" fill="#374151" />
            <rect x="5" y="55" width="20" height="4" rx="2" fill="#374151" />
          </g>
          
          {/* Small decorative elements */}
          <circle cx="230" cy="50" r="3" fill="#C084FC" />
          <text x="255" y="90" fill="#FDA4AF" fontSize="18">~</text>
        </svg>
      </div>

      {/* Text */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No voice notes created yet!!
      </h3>
      <p className="text-gray-500 mb-6">
        Convert voice notes to LinkedIn posts
      </p>

      {/* CTA Button */}
      <Button
        onClick={onAddVoiceNote}
        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Voice Note
      </Button>
    </div>
  )
}
