import { BookOpen, CalendarDays, Calendar, CalendarRange, Star } from 'lucide-react'

const TABS = [
  { id: 'timeline', label: 'Timeline', Icon: BookOpen },
  { id: 'week', label: 'Week', Icon: CalendarDays },
  { id: 'month', label: 'Month', Icon: Calendar },
  { id: 'year', label: 'Year', Icon: CalendarRange },
  { id: 'onthisday', label: 'This Day', Icon: Star },
]

export default function Navigation({ activeView, onViewChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-parchment-light/95 backdrop-blur-md border-t border-warm-border">
      <div className="flex justify-around items-center px-1 py-1 max-w-lg mx-auto">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={`nav-tab ${activeView === id ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
