import { getOnThisDayFilter, today } from '../utils/dateUtils'
import EntryCard from './EntryCard'

export default function OnThisDayView({ entries, onDelete }) {
  const t = today()
  const [, mm, dd] = t.split('-')
  const monthDay = new Date(2000, parseInt(mm) - 1, parseInt(dd))
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  const onThisDay = getOnThisDayFilter(entries)
  const years = [...new Set(onThisDay.map(e => e.date.split('-')[0]))].sort((a, b) => b - a)

  return (
    <div className="space-y-4">
      <div className="text-center pb-1">
        <p className="font-display text-2xl italic text-espresso">{monthDay}</p>
        <p className="font-ui text-[11px] text-espresso-light mt-1 tracking-widest uppercase">Across all years</p>
      </div>

      {onThisDay.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="w-14 h-14 rounded-full bg-parchment-dark flex items-center justify-center mb-4 text-xl">
            ✨
          </div>
          <h3 className="font-display text-lg text-espresso italic mb-2">No memories yet</h3>
          <p className="font-body text-espresso-light text-sm leading-relaxed">
            Write today's entry — next year, it will appear here as a beautiful echo from the past
          </p>
        </div>
      ) : (
        <div className="relative pb-4">
          <div className="absolute left-[18px] top-2 bottom-2 w-px bg-warm-border" />

          <div className="space-y-6">
            {years.map((year, idx) => {
              const yearEntries = onThisDay.filter(e => e.date.startsWith(year))
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
                      <EntryCard key={entry.id} entry={entry} onDelete={onDelete} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
