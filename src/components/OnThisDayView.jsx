import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { getOnThisDayFilter, getSameDayOfWeek, getSameDayOfMonth, today, formatDateShort } from '../utils/dateUtils'
import EntryCard from './EntryCard'

const WEEKDAY_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export default function OnThisDayView({ entries, onDelete, onEdit }) {
  const todayStr = today()
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [mode, setMode] = useState('onthisday')

  const [, mm, dd] = selectedDate.split('-')
  const selDate = new Date(parseInt(selectedDate.slice(0, 4)), parseInt(mm) - 1, parseInt(dd))
  const selDow = selDate.getDay()
  const selDom = parseInt(dd)

  const monthDay = selDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  const chips = [
    { id: 'onthisday', label: '历年今天' },
    { id: 'weekday', label: `每${WEEKDAY_ZH[selDow]}` },
    { id: 'dayofmonth', label: `每月${selDom}号` },
  ]

  let results
  if (mode === 'onthisday') results = getOnThisDayFilter(entries, selectedDate)
  else if (mode === 'weekday') results = getSameDayOfWeek(entries, selDow)
  else results = getSameDayOfMonth(entries, selDom)

  const subLabel = mode === 'onthisday' ? 'Across all years'
    : mode === 'weekday' ? 'Recent weeks'
    : 'Recent months'

  const emptyBody = mode === 'onthisday'
    ? 'Write today\'s entry — next year, it will appear here as a beautiful echo from the past'
    : '写下今天的日记，这一天的回响就开始了'

  return (
    <div className="space-y-4">
      <div className="text-center pb-1">
        <div className="relative inline-flex">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 group"
            aria-label="Change date"
          >
            <span className="font-display text-2xl italic text-espresso">{monthDay}</span>
            <CalendarDays
              size={13}
              className="text-espresso-light group-hover:text-amber transition-colors mt-0.5 shrink-0"
            />
          </button>
          <input
            type="date"
            value={selectedDate}
            max={todayStr}
            onChange={e => e.target.value && setSelectedDate(e.target.value)}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
            tabIndex={-1}
          />
        </div>
        {selectedDate !== todayStr && (
          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className="block mx-auto mt-0.5 text-[11px] font-ui text-amber hover:underline leading-none"
          >
            ← Today
          </button>
        )}
        <p className="font-ui text-[11px] text-espresso-light mt-1 tracking-widest uppercase">{subLabel}</p>
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        {chips.map(chip => (
          <button
            key={chip.id}
            onClick={() => setMode(chip.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-ui transition-colors ${
              mode === chip.id
                ? 'bg-amber text-white'
                : 'bg-parchment-dark text-espresso-light hover:text-espresso'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="w-14 h-14 rounded-full bg-parchment-dark flex items-center justify-center mb-4 text-xl">
            ✨
          </div>
          <h3 className="font-display text-lg text-espresso italic mb-2">
            {mode === 'onthisday' ? 'No memories yet' : '还没有记录'}
          </h3>
          <p className="font-body text-espresso-light text-sm leading-relaxed">{emptyBody}</p>
        </div>
      ) : mode === 'onthisday' ? (
        <div className="relative pb-4">
          <div className="absolute left-[18px] top-2 bottom-2 w-px bg-warm-border" />
          <div className="space-y-6">
            {[...new Set(results.map(e => e.date.split('-')[0]))]
              .sort((a, b) => b - a)
              .map((year, idx) => {
                const yearEntries = results.filter(e => e.date.startsWith(year))
                return (
                  <div
                    key={year}
                    className="relative pl-11 animate-fade-up"
                    style={{ animationDelay: `${idx * 0.08}s`, opacity: 0, animationFillMode: 'forwards' }}
                  >
                    <div className="absolute left-3 top-1 w-3 h-3 rounded-full border-2 border-amber bg-parchment" />
                    <div className="mb-2.5 flex items-baseline gap-2">
                      <span className="font-display text-base italic text-amber">{year}</span>
                      <span className="text-[11px] font-ui text-espresso-light">
                        {yearEntries.length} {yearEntries.length === 1 ? 'entry' : 'entries'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {yearEntries.map(entry => (
                        <EntryCard key={entry.id} entry={entry} onDelete={onDelete} onEdit={onEdit} />
                      ))}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((entry, idx) => (
            <div
              key={entry.id}
              className="animate-fade-up"
              style={{ animationDelay: `${idx * 0.05}s`, opacity: 0, animationFillMode: 'forwards' }}
            >
              <p className="text-[10px] font-ui text-amber tracking-wide uppercase mb-1 pl-1">
                {entry.date === todayStr ? '今天' : formatDateShort(entry.date)}
              </p>
              <EntryCard entry={entry} onDelete={onDelete} onEdit={onEdit} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
