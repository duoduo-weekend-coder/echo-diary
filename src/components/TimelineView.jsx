import { groupByDate, formatDate, isToday } from '../utils/dateUtils'
import EntryCard from './EntryCard'

export default function TimelineView({ entries, onDelete }) {
  const groups = groupByDate(entries)

  if (!entries.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-parchment-dark flex items-center justify-center mb-5 text-2xl">
          📖
        </div>
        <h3 className="font-display text-xl text-espresso italic mb-2">Your story begins here</h3>
        <p className="font-body text-espresso-light text-sm leading-relaxed">
          Tap the <span className="text-amber font-medium">+</span> button above to write your first entry
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-2">
      {groups.map(([date, dayEntries], idx) => (
        <div key={date} className="animate-fade-up" style={{ animationDelay: `${Math.min(idx * 0.04, 0.3)}s`, opacity: 0, animationFillMode: 'forwards' }}>
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
  )
}
