import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthDays, today, isToday, getMonthName, formatDate } from '../utils/dateUtils'
import EntryCard from './EntryCard'

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function MonthView({ entries, onDelete }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState(today())

  const entryMap = {}
  entries.forEach(e => {
    if (!entryMap[e.date]) entryMap[e.date] = []
    entryMap[e.date].push(e)
  })

  const days = getMonthDays(year, month)
  const selectedEntries = (entryMap[selectedDay] || []).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 text-espresso-light hover:text-espresso rounded-lg">
          <ChevronLeft size={17} />
        </button>
        <h2 className="font-display text-base italic text-espresso">
          {getMonthName(month)} {year}
        </h2>
        <button onClick={nextMonth} className="p-2 text-espresso-light hover:text-espresso rounded-lg">
          <ChevronRight size={17} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {DOW.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-ui text-espresso-light/60 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
        {days.map(({ date, isCurrentMonth }) => {
          const count = entryMap[date]?.length || 0
          const isSelected = selectedDay === date
          const isTdy = isToday(date)
          return (
            <button
              key={date}
              onClick={() => isCurrentMonth && setSelectedDay(date)}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all ${
                !isCurrentMonth
                  ? 'opacity-15 pointer-events-none'
                  : isSelected
                  ? 'bg-amber text-white shadow-sm'
                  : isTdy
                  ? 'bg-parchment-dark text-espresso font-medium ring-1 ring-amber/30'
                  : 'text-espresso-mid hover:bg-parchment-dark'
              }`}
            >
              <span className="font-ui leading-none">{parseInt(date.split('-')[2])}</span>
              {count > 0 && (
                <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white/60' : 'bg-amber'}`} />
              )}
            </button>
          )
        })}
      </div>

      <div className="pt-1">
        {selectedEntries.length > 0 ? (
          <div className="space-y-2.5">
            <p className="text-xs font-ui text-espresso-light">{formatDate(selectedDay)}</p>
            {selectedEntries.map(entry => (
              <EntryCard key={entry.id} entry={entry} onDelete={onDelete} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="font-body text-espresso-light text-sm italic">Nothing written on {formatDate(selectedDay)}</p>
          </div>
        )}
      </div>
    </div>
  )
}
