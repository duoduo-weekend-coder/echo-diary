import { useState } from 'react'
import { Plus, Settings } from 'lucide-react'
import { useEntries } from './hooks/useEntries'
import { today, formatDate } from './utils/dateUtils'
import Navigation from './components/Navigation'
import EntryEditor from './components/EntryEditor'
import WeekView from './components/WeekView'
import MonthView from './components/MonthView'
import YearView from './components/YearView'
import OnThisDayView from './components/OnThisDayView'
import BackupSheet from './components/BackupSheet'

export default function App() {
  const { entries, addEntry, deleteEntry, loading, reloadEntries } = useEntries()
  const [view, setView] = useState('week')
  const [showEditor, setShowEditor] = useState(false)
  const [showBackup, setShowBackup] = useState(false)

  return (
    <div className="min-h-dvh flex flex-col bg-parchment">
      <header className="sticky top-0 z-30 bg-parchment/95 backdrop-blur-md border-b border-warm-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl text-espresso italic font-normal tracking-tight leading-none">
              Echo Diary
            </h1>
            <p className="text-[10px] font-ui text-espresso-light tracking-widest uppercase mt-0.5">
              {formatDate(today())}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBackup(true)}
              className="w-9 h-9 rounded-full text-espresso-light hover:text-espresso flex items-center justify-center transition-colors"
              aria-label="Backup settings"
            >
              <Settings size={17} />
            </button>
            <button
              onClick={() => setShowEditor(true)}
              className="w-9 h-9 rounded-full bg-amber hover:bg-amber-light text-white flex items-center justify-center shadow-sm transition-all active:scale-95"
              aria-label="New entry"
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 pb-24">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-xl bg-parchment-dark/60" />
            ))}
          </div>
        ) : (
          <>
            {view === 'week' && <WeekView entries={entries} onDelete={deleteEntry} />}
            {view === 'month' && <MonthView entries={entries} onDelete={deleteEntry} />}
            {view === 'year' && <YearView entries={entries} />}
            {view === 'onthisday' && <OnThisDayView entries={entries} onDelete={deleteEntry} />}
          </>
        )}
      </main>

      <Navigation activeView={view} onViewChange={setView} />

      {showEditor && (
        <EntryEditor onSave={addEntry} onClose={() => setShowEditor(false)} />
      )}

      {showBackup && (
        <BackupSheet
          onClose={() => setShowBackup(false)}
          onImport={() => {
            setShowBackup(false)
            reloadEntries()
          }}
        />
      )}
    </div>
  )
}
