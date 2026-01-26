import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { X, Check } from 'lucide-react'
import { TIMEZONES } from './timezones'

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export interface TimeSlot {
  time: string // '09:00 AM'
  days: boolean[] // [true, true, ...] for each weekday
}

interface TimeSlotSettingsModalProps {
  open: boolean
  onClose: () => void
  timezone: string
  setTimezone: (tz: string) => void
  timeSlots: TimeSlot[]
  setTimeSlots: (slots: TimeSlot[]) => void
}

export function TimeSlotSettingsModal({ open, onClose, timezone, setTimezone, timeSlots, setTimeSlots }: TimeSlotSettingsModalProps) {
  const [localSlots, setLocalSlots] = useState<TimeSlot[]>(timeSlots)
  const [localTz, setLocalTz] = useState<string>(timezone)

  const handleDayToggle = (slotIdx: number, dayIdx: number) => {
    setLocalSlots(slots => slots.map((slot, i) => i === slotIdx ? { ...slot, days: slot.days.map((d, j) => j === dayIdx ? !d : d) } : slot))
  }
  const handleTimeChange = (slotIdx: number, value: string) => {
    setLocalSlots(slots => slots.map((slot, i) => i === slotIdx ? { ...slot, time: value } : slot))
  }
  const handleRemoveSlot = (slotIdx: number) => {
    setLocalSlots(slots => slots.filter((_, i) => i !== slotIdx))
  }
  const handleAddSlot = () => {
    setLocalSlots(slots => [...slots, { time: '09:00 AM', days: [true, true, true, true, true, true, true] }])
  }
  const handleSave = () => {
    setTimezone(localTz)
    setTimeSlots(localSlots)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg w-full p-0">
        <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b">
          <DialogTitle>Schedule Settings</DialogTitle>
        </DialogHeader>
        <div className="px-6 pt-4 pb-2">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <select
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
              value={localTz}
              onChange={e => setLocalTz(e.target.value)}
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="font-medium text-gray-700 mb-2">Time Slots</div>
            <div className="text-xs text-gray-400 mb-3">Editing your schedule here won&apos;t affect posts that are already scheduled.</div>
            <div className="rounded-xl border border-gray-200 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Time</th>
                    {WEEKDAYS.map(day => (
                      <th key={day} className="px-2 py-2 font-normal">{day}</th>
                    ))}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {localSlots.map((slot, slotIdx) => (
                    <tr key={slotIdx} className="border-t">
                      <td className="px-4 py-2">
                        <select
                          value={slot.time}
                          onChange={e => handleTimeChange(slotIdx, e.target.value)}
                          className="w-32 px-2 py-1 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200 bg-white"
                        >
                          <option value="">Select a time</option>
                          {Array.from({ length: 24 * 4 }, (_, i) => {
                            const hour = Math.floor(i / 4)
                            const min = (i % 4) * 15
                            const ampm = hour < 12 ? 'AM' : 'PM'
                            const hour12 = hour % 12 === 0 ? 12 : hour % 12
                            const label = `${hour12.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')} ${ampm}`
                            return <option key={label} value={label}>{label}</option>
                          })}
                        </select>
                      </td>
                      {slot.days.map((checked, dayIdx) => (
                        <td key={dayIdx} className="px-2 py-2 text-center">
                            <button
                              type="button"
                              aria-pressed={checked}
                              onClick={() => handleDayToggle(slotIdx, dayIdx)}
                              className={`w-5 h-5 rounded-sm border border-gray-300 flex items-center justify-center mx-auto transition-colors focus:outline-none ${checked ? 'bg-orange-500 border-orange-500' : 'bg-white'}`}
                            >
                              {checked && <Check className="w-3 h-3 text-white" />}
                            </button>
                        </td>
                      ))}
                      <td className="px-2 py-2 text-center"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center px-4 py-2">
                <button onClick={handleAddSlot} className="flex items-center text-orange-600 hover:underline text-sm font-medium mt-1">
                  + Add Time Slot
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600">Save</button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
