import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getWeekDays, today, isToday, getDayOfWeek, formatDateShort, formatDate } from '../utils/dateUtils'
import EntryCard from './EntryCard'

export default function WeekView({ entries, onDelete }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState(today())

  const baseDate = new Date()
  baseDate.setDate(baseDate.getDate() + weekOffset * 7)
  const weekDays = getWeekDays(baseDate)

  const entryMap = {}
  entries.forEach(e => {
    if (!entryMap[e.date]) entryMap[e.date] = []
    entryMap[e.date].push(e)
  })

  const selectedEntries = (entryMap[selectedDay] || []).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setWeekOffset(o => o - 1)} className="p-2 text-espresso-light hover:text-espresso rounded-lg">
          <ChevronLeft size={17} />
        </button>
        <span className="font-display text-sm italic text-espresso-mid">
          {formatDateShort(weekDays[0])} — {formatDateShort(weekDays[6])}
        </span>
        <button onClick={() => setWeekOffset(o => o + 1)} className="p-2 text-espresso-light hover:text-espresso rounded-lg">
          <ChevronRight size={17} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(date => {
          const count = entryMap[date]?.length || 0
          const isSelected = selectedDay === date
          const isTdy = isToday(date)
          return (
            <button
              key={date}
              onClick={() => setSelectedDay(date)}
              className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all ${
                isSelected
                  ? 'bg-amber text-white shadow-sm'
                  : isTdy
                  ? 'bg-parchment-dark text-espresso'
                  : 'text-espresso-light hover:bg-parchment-dark'
              }`}
            >
              <span className="text-[9px] font-ui uppercase tracking-wider opacity-70">
                {getDayOfWeek(date)}
              </span>
              <span className="text-sm font-ui font-medium">
                {parseInt(date.split('-')[2])}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full transition-colors ${
                count > 0
                  ? isSelected ? 'bg-white/70' : 'bg-amber'
                  : 'bg-transparent'
              }`} />
            </button>
          )
        })}
      </div>

      <div className="pt-1">
        {selectedEntries.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-body text-espresso-light text-sm italic">Nothing written on {formatDate(selectedDay)}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {selectedEntries.map(entry => (
              <EntryCard key={entry.id} entry={entry} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
