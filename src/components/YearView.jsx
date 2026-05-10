import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getYearMonths, getMonthDays, today } from '../utils/dateUtils'

export default function YearView({ entries }) {
  const [year, setYear] = useState(new Date().getFullYear())

  const entryDates = new Set(entries.map(e => e.date))
  const photoMap = {}
  entries.forEach(e => { if (e.photoDataUrl && !photoMap[e.date]) photoMap[e.date] = e.photoDataUrl })
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
                    className={`relative aspect-square rounded-sm overflow-hidden ${
                      !isCurrentMonth
                        ? 'bg-transparent'
                        : photoMap[date]
                        ? ''
                        : entryDates.has(date)
                        ? 'bg-amber'
                        : date === todayStr
                        ? 'bg-parchment-dark ring-1 ring-amber/40'
                        : 'bg-parchment-dark/50'
                    }`}
                  >
                    {isCurrentMonth && photoMap[date] && (
                      <img src={photoMap[date]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    {date === todayStr && isCurrentMonth && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className={`w-1 h-1 rounded-full ${entryDates.has(date) ? 'bg-white/80' : 'bg-amber'}`} />
                      </span>
                    )}
                  </div>
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
