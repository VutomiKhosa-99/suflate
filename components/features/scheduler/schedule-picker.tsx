'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface SchedulePickerProps {
  onSchedule: (date: Date) => void
  onPostNow: () => void
}

export function SchedulePicker({ onSchedule, onPostNow }: SchedulePickerProps) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  const handleSchedule = () => {
    if (!date || !time) {
      alert('Please select both date and time')
      return
    }

    const scheduledDate = new Date(`${date}T${time}`)
    if (scheduledDate < new Date()) {
      alert('Please select a future date and time')
      return
    }

    onSchedule(scheduledDate)
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]
  const defaultTime = '09:00'

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Schedule Post</h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose when to post. We'll send you a reminder before it goes live.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={minDate}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            defaultValue={defaultTime}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSchedule} disabled={!date || !time} className="flex-1">
          Schedule
        </Button>
        <Button onClick={onPostNow} variant="outline" className="flex-1">
          Post Now Instead
        </Button>
      </div>
    </Card>
  )
}
