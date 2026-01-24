'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Clock, Sparkles, Calendar, X } from 'lucide-react'

interface SchedulePickerProps {
  onSchedule: (date: Date) => void
  onPostNow: () => void
  onCancel?: () => void
  initialDate?: Date | null
  isRescheduling?: boolean
}

// Optimal posting times based on LinkedIn best practices (Story 4.7)
const OPTIMAL_TIMES = [
  { time: '09:00', label: '9:00 AM', description: 'Start of workday' },
  { time: '12:00', label: '12:00 PM', description: 'Lunch break' },
  { time: '17:00', label: '5:00 PM', description: 'End of workday' },
]

/**
 * Story 4.3, 4.5, 4.7: Enhanced Schedule Picker
 * 
 * Features:
 * - Date/time picker with validation
 * - Optimal posting time suggestions (Story 4.7)
 * - Quick select buttons for common times
 * - Support for rescheduling (Story 4.5)
 */
export function SchedulePicker({
  onSchedule,
  onPostNow,
  onCancel,
  initialDate,
  isRescheduling = false,
}: SchedulePickerProps) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [showOptimalTimes, setShowOptimalTimes] = useState(true)

  // Helper to format date as YYYY-MM-DD in LOCAL timezone (not UTC)
  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Initialize with existing date if rescheduling
  useEffect(() => {
    if (initialDate) {
      const d = new Date(initialDate)
      setDate(formatLocalDate(d))
      setTime(d.toTimeString().slice(0, 5))
    }
  }, [initialDate])

  const handleSchedule = () => {
    if (!date || !time) {
      alert('Please select both date and time')
      return
    }

    const scheduledDate = new Date(`${date}T${time}`)
    if (scheduledDate <= new Date()) {
      alert('Please select a future date and time')
      return
    }

    onSchedule(scheduledDate)
  }

  const selectOptimalTime = (optimalTime: string) => {
    setTime(optimalTime)
    // Don't auto-change the date - let user explicitly select it
  }

  const selectQuickDate = (daysFromNow: number) => {
    const newDate = new Date()
    newDate.setDate(newDate.getDate() + daysFromNow)
    setDate(formatLocalDate(newDate))
  }

  // Allow scheduling for today (API validates time is in future)
  const today = new Date()
  const minDate = formatLocalDate(today)

  const isOptimalTime = OPTIMAL_TIMES.some(t => t.time === time)

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">
            {isRescheduling ? 'Reschedule Post' : 'Schedule Post'}
          </h3>
          <p className="text-sm text-gray-600">
            {isRescheduling
              ? 'Select a new date and time for your post.'
              : "Choose when to post. We'll send you a reminder before it goes live."}
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick date buttons */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Quick Select</label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectQuickDate(0)}
            className={date === new Date().toISOString().split('T')[0] ? 'border-blue-500' : ''}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectQuickDate(1)}
            className={date === new Date(Date.now() + 86400000).toISOString().split('T')[0] ? 'border-blue-500' : ''}
          >
            Tomorrow
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectQuickDate(2)}
          >
            In 2 days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectQuickDate(7)}
          >
            Next week
          </Button>
        </div>
      </div>

      {/* Date and time inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="w-4 h-4 inline mr-1" />
            Date
          </label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={minDate}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Clock className="w-4 h-4 inline mr-1" />
            Time
          </label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>

      {/* Optimal posting times (Story 4.7) */}
      {showOptimalTimes && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Optimal Posting Times</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {OPTIMAL_TIMES.map((optimal) => (
              <button
                key={optimal.time}
                onClick={() => selectOptimalTime(optimal.time)}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  time === optimal.time
                    ? 'border-blue-500 bg-blue-100'
                    : 'border-transparent bg-white hover:bg-blue-100'
                }`}
              >
                <div className="font-medium text-gray-900">{optimal.label}</div>
                <div className="text-xs text-gray-500">{optimal.description}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-blue-700 mt-2">
            Based on LinkedIn engagement data - best times for professional content
          </p>
        </div>
      )}

      {/* Selected time indicator */}
      {date && time && (
        <div className={`p-3 rounded-lg text-sm ${isOptimalTime ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-700'}`}>
          <strong>Scheduled for:</strong>{' '}
          {new Date(`${date}T${time}`).toLocaleString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
          {isOptimalTime && (
            <span className="ml-2 text-green-600">
              <Sparkles className="w-3 h-3 inline" /> Optimal time!
            </span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button onClick={handleSchedule} disabled={!date || !time} className="flex-1">
          {isRescheduling ? 'Reschedule' : 'Schedule'}
        </Button>
        {!isRescheduling && (
          <Button onClick={onPostNow} variant="outline" className="flex-1">
            Post Now Instead
          </Button>
        )}
      </div>
    </Card>
  )
}
