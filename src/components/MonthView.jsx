import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthDays, today, isToday, getMonthName, formatDate, groupByDate } from '../utils/dateUtils'
import EntryCard from './EntryCard'

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function MonthView({ entries, onDelete, onEdit }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const entryMap = {}
  entries.forEach(e => {
    if (!entryMap[e.date]) entryMap[e.date] = []
    entryMap[e.date].push(e)
  })

  const days = getMonthDays(year, month)
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthEntries = entries.filter(e => e.date.startsWith(monthPrefix))
  const groups = groupByDate(monthEntries)

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
          const isTdy = isToday(date)
          const firstPhoto = isCurrentMonth && entryMap[date]?.find(e => e.photoDataUrl)?.photoDataUrl
          return (
            <div
              key={date}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs ${
                !isCurrentMonth
                  ? 'opacity-15'
                  : isTdy
                  ? 'bg-parchment-dark text-espresso font-medium ring-1 ring-amber/30'
                  : 'text-espresso-mid'
              }`}
            >
              <span className="font-ui leading-none">{parseInt(date.split('-')[2])}</span>
              {isCurrentMonth && (
                firstPhoto ? (
                  <img src={firstPhoto} alt="" className="w-3 h-3 rounded-full object-cover mt-0.5" />
                ) : count > 0 ? (
                  <span className="w-1 h-1 rounded-full mt-0.5 bg-amber" />
                ) : null
              )}
            </div>
          )
        })}
      </div>

      <div className="pt-1">
        {groups.length === 0 ? (
          <div className="text-center py-10">
            <p className="font-body text-espresso-light text-sm italic">Nothing written in {getMonthName(month)}</p>
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
                    <EntryCard key={entry.id} entry={entry} onDelete={onDelete} onEdit={onEdit} />
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
