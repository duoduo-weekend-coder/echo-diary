import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getWeekDays, today, isToday, getDayOfWeek, formatDateShort, formatDate, groupByDate } from '../utils/dateUtils'
import EntryCard from './EntryCard'

export default function WeekView({ entries, onDelete }) {
  const [weekOffset, setWeekOffset] = useState(0)

  const baseDate = new Date()
  baseDate.setDate(baseDate.getDate() + weekOffset * 7)
  const weekDays = getWeekDays(baseDate)

  const weekDaySet = new Set(weekDays)
  const entryMap = {}
  entries.forEach(e => {
    if (!entryMap[e.date]) entryMap[e.date] = []
    entryMap[e.date].push(e)
  })

  const weekEntries = entries.filter(e => weekDaySet.has(e.date))
  const groups = groupByDate(weekEntries)

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
          const isTdy = isToday(date)
          const firstPhoto = entryMap[date]?.find(e => e.photoDataUrl)?.photoDataUrl
          return (
            <div
              key={date}
              className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl ${
                isTdy ? 'bg-parchment-dark text-espresso' : 'text-espresso-light'
              }`}
            >
              <span className="text-[9px] font-ui uppercase tracking-wider opacity-70">
                {getDayOfWeek(date)}
              </span>
              <span className="text-sm font-ui font-medium">
                {parseInt(date.split('-')[2])}
              </span>
              {firstPhoto ? (
                <img src={firstPhoto} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <span className={`w-1.5 h-1.5 rounded-full ${count > 0 ? 'bg-amber' : 'bg-transparent'}`} />
              )}
            </div>
          )
        })}
      </div>

      <div className="pt-1">
        {groups.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-body text-espresso-light text-sm italic">Nothing written this week</p>
          </div>
        ) : (
          <div className="space-y-6 pb-2">
            {groups.map(([date, dayEntries]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isToday(date) ? 'bg-amber' : 'bg-warm-border'}`} />
                  <h3 className={`font-display text-sm italic ${isToday(date) ? 'text-amber' : 'text-espresso-light'}`}>
                    {formatDate(date)}
                    {isToday(date) && <span className="ml-2 text-[10px] font-ui tracking-widest uppercase not-italic">Today</span>}
                  </h3>
                  <div className="flex-1 h-px bg-warm-border" />
                </div>
                <div className="space-y-2.5">
                  {dayEntries.map(entry => (
                    <EntryCard key={entry.id} entry={entry} onDelete={onDelete} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
