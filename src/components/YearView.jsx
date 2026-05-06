import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getYearMonths, getMonthDays, today } from '../utils/dateUtils'

export default function YearView({ entries }) {
  const [year, setYear] = useState(new Date().getFullYear())

  const entryDates = new Set(entries.map(e => e.date))
  const months = getYearMonths(year)
  const todayStr = today()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setYear(y => y - 1)} className="p-2 text-espresso-light hover:text-espresso rounded-lg">
          <ChevronLeft size={17} />
        </button>
        <h2 className="font-display text-lg italic text-espresso">{year}</h2>
        <button onClick={() => setYear(y => y + 1)} className="p-2 text-espresso-light hover:text-espresso rounded-lg">
          <ChevronRight size={17} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {months.map(({ month, year: y, label }) => {
          const days = getMonthDays(y, month)
          const monthEntries = days.filter(d => d.isCurrentMonth && entryDates.has(d.date)).length

          return (
            <div key={month} className="entry-card p-3">
              <p className="text-[11px] font-ui text-espresso-light mb-2 uppercase tracking-wider">{label}</p>
              <div className="grid grid-cols-7 gap-px">
                {days.slice(0, 35).map(({ date, isCurrentMonth }) => (
                  <div
                    key={date}
                    className={`aspect-square rounded-sm ${
                      !isCurrentMonth
                        ? 'bg-transparent'
                        : entryDates.has(date)
                        ? 'bg-amber'
                        : date === todayStr
                        ? 'bg-parchment-dark ring-1 ring-amber/40'
                        : 'bg-parchment-dark/50'
                    }`}
                  />
                ))}
              </div>
              {monthEntries > 0 && (
                <p className="text-[10px] font-ui text-espresso-light mt-1.5">
                  {monthEntries} {monthEntries === 1 ? 'entry' : 'entries'}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
