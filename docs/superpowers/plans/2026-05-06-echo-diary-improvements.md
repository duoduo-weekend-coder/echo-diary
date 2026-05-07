# Echo Diary Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate storage to IndexedDB with backup, add photo thumbnails, a comparison view, and audio file upload fallback.

**Architecture:** Phase 1 replaces localStorage with IndexedDB via the `idb` library and adds JSON export/import. Phase 2 adds UI features on top of the stable data layer: inline photo thumbnails in EntryCard, three-mode comparison in OnThisDayView, and an audio file upload fallback when no microphone is found.

**Tech Stack:** React 18, Vite 6, Tailwind CSS 3, idb, Vitest + jsdom + fake-indexeddb (tests)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `package.json` | Modify | Add `idb`; add `vitest`, `@vitest/environment-jsdom`, `fake-indexeddb` as devDeps |
| `vite.config.js` | Modify | Add Vitest test config |
| `src/utils/db.js` | Create | IndexedDB open, migrate, CRUD, export, import |
| `src/utils/db.test.js` | Create | Unit tests for db.js |
| `src/utils/dateUtils.js` | Modify | Add `getSameDayOfWeek`, `getSameDayOfMonth` |
| `src/utils/dateUtils.test.js` | Create | Unit tests for new helpers |
| `src/hooks/useEntries.js` | Modify | Async load from IndexedDB; expose `loading` |
| `src/hooks/useMediaRecorder.js` | Modify | Expose `deviceNotFound` boolean |
| `src/components/BackupSheet.jsx` | Create | Export/import UI bottom sheet |
| `src/components/EntryCard.jsx` | Modify | Inline photo thumbnail strip; remove toggle button |
| `src/components/OnThisDayView.jsx` | Modify | Add mode chips + weekday/day-of-month list modes |
| `src/components/AudioRecorder.jsx` | Modify | File upload fallback when `deviceNotFound` |
| `src/App.jsx` | Modify | Loading skeleton; settings button; wire BackupSheet |

---

## Task 1: Install dependencies + configure Vitest

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`

- [ ] **Step 1: Install production dependency**

```bash
npm install idb
```

Expected: `idb` appears in `dependencies` in `package.json`.

- [ ] **Step 2: Install test dependencies**

```bash
npm install --save-dev vitest @vitest/environment-jsdom fake-indexeddb
```

Expected: all three appear in `devDependencies`.

- [ ] **Step 3: Add test script and Vitest config**

Update `package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Replace the entire contents of `vite.config.js`:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 4: Verify Vitest runs**

```bash
npm test
```

Expected: `No test files found` (zero tests yet, but exits 0).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.js
git commit -m "chore: add idb and vitest dependencies"
```

---

## Task 2: Create db.js with tests

**Files:**
- Create: `src/utils/db.js`
- Create: `src/utils/db.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/db.test.js`:
```js
import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { migrateFromLocalStorage, getAllEntries, putEntry, removeEntry, importEntries } from './db'

beforeEach(() => {
  global.indexedDB = new IDBFactory()
  localStorage.clear()
})

const entry1 = { id: '1', date: '2026-05-06', text: 'Hello', audioDataUrl: null, photoDataUrl: null, createdAt: '2026-05-06T09:00:00.000Z' }
const entry2 = { id: '2', date: '2026-05-05', text: 'World', audioDataUrl: null, photoDataUrl: null, createdAt: '2026-05-05T09:00:00.000Z' }

describe('getAllEntries', () => {
  it('returns empty array when db is empty', async () => {
    expect(await getAllEntries()).toEqual([])
  })
})

describe('putEntry / removeEntry', () => {
  it('puts an entry and retrieves it', async () => {
    await putEntry(entry1)
    const all = await getAllEntries()
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe('1')
  })

  it('deletes an entry by id', async () => {
    await putEntry(entry1)
    await removeEntry('1')
    expect(await getAllEntries()).toHaveLength(0)
  })
})

describe('getAllEntries ordering', () => {
  it('returns entries sorted by date descending', async () => {
    await putEntry(entry2)
    await putEntry(entry1)
    const all = await getAllEntries()
    expect(all[0].id).toBe('1')
    expect(all[1].id).toBe('2')
  })
})

describe('migrateFromLocalStorage', () => {
  it('is a no-op when localStorage has no legacy key', async () => {
    await migrateFromLocalStorage()
    expect(await getAllEntries()).toHaveLength(0)
  })

  it('migrates entries and removes the localStorage key', async () => {
    localStorage.setItem('echo-diary-entries', JSON.stringify([entry1, entry2]))
    await migrateFromLocalStorage()
    expect(localStorage.getItem('echo-diary-entries')).toBeNull()
    const all = await getAllEntries()
    expect(all).toHaveLength(2)
  })

  it('handles malformed localStorage data gracefully', async () => {
    localStorage.setItem('echo-diary-entries', 'not-json')
    await migrateFromLocalStorage()
    expect(await getAllEntries()).toHaveLength(0)
  })
})

describe('importEntries', () => {
  it('adds only entries not already present', async () => {
    await putEntry(entry1)
    const count = await importEntries([entry1, entry2])
    expect(count).toBe(1)
    expect(await getAllEntries()).toHaveLength(2)
  })

  it('returns 0 when all entries already exist', async () => {
    await putEntry(entry1)
    expect(await importEntries([entry1])).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: FAIL — `Cannot find module './db'`

- [ ] **Step 3: Create src/utils/db.js**

```js
import { openDB } from 'idb'

const DB_NAME = 'echo-diary-db'
const STORE = 'entries'
const LEGACY_KEY = 'echo-diary-entries'

function open() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      const store = db.createObjectStore(STORE, { keyPath: 'id' })
      store.createIndex('date', 'date')
    },
  })
}

export async function migrateFromLocalStorage() {
  const raw = localStorage.getItem(LEGACY_KEY)
  if (!raw) return
  let entries
  try { entries = JSON.parse(raw) } catch { return }
  if (!Array.isArray(entries) || entries.length === 0) {
    localStorage.removeItem(LEGACY_KEY)
    return
  }
  const db = await open()
  const tx = db.transaction(STORE, 'readwrite')
  await Promise.all(entries.map(e => tx.store.put(e)))
  await tx.done
  localStorage.removeItem(LEGACY_KEY)
}

export async function getAllEntries() {
  const db = await open()
  const all = await db.getAll(STORE)
  return all.sort((a, b) =>
    b.date.localeCompare(a.date) || new Date(b.createdAt) - new Date(a.createdAt)
  )
}

export async function putEntry(entry) {
  const db = await open()
  await db.put(STORE, entry)
}

export async function removeEntry(id) {
  const db = await open()
  await db.delete(STORE, id)
}

export async function exportAll() {
  return getAllEntries()
}

export async function importEntries(incoming) {
  const db = await open()
  const existing = await db.getAll(STORE)
  const existingIds = new Set(existing.map(e => e.id))
  const toAdd = incoming.filter(e => !existingIds.has(e.id))
  if (toAdd.length === 0) return 0
  const tx = db.transaction(STORE, 'readwrite')
  await Promise.all(toAdd.map(e => tx.store.put(e)))
  await tx.done
  return toAdd.length
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test
```

Expected: all 9 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/db.js src/utils/db.test.js
git commit -m "feat: add IndexedDB utilities with migration and import/export"
```

---

## Task 3: Update useEntries.js

**Files:**
- Modify: `src/hooks/useEntries.js`

- [ ] **Step 1: Replace the full file**

```js
import { useState, useCallback, useEffect } from 'react'
import { migrateFromLocalStorage, getAllEntries, putEntry, removeEntry } from '../utils/db'

export function useEntries() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    migrateFromLocalStorage()
      .then(() => getAllEntries())
      .then(all => {
        setEntries(all)
        setLoading(false)
      })
  }, [])

  const addEntry = useCallback(async ({ date, text, audioDataUrl, photoDataUrl }) => {
    const entry = {
      id: Date.now().toString(),
      date,
      text: text.trim(),
      audioDataUrl: audioDataUrl || null,
      photoDataUrl: photoDataUrl || null,
      createdAt: new Date().toISOString(),
    }
    await putEntry(entry)
    setEntries(prev =>
      [entry, ...prev].sort((a, b) =>
        b.date.localeCompare(a.date) || new Date(b.createdAt) - new Date(a.createdAt)
      )
    )
    return entry
  }, [])

  const deleteEntry = useCallback(async (id) => {
    await removeEntry(id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }, [])

  return { entries, addEntry, deleteEntry, loading }
}
```

- [ ] **Step 2: Verify tests still pass**

```bash
npm test
```

Expected: all 9 PASS (useEntries has no unit tests — covered by db.js tests).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useEntries.js
git commit -m "feat: migrate useEntries to IndexedDB"
```

---

## Task 4: Create BackupSheet.jsx

**Files:**
- Create: `src/components/BackupSheet.jsx`

- [ ] **Step 1: Create the component**

```jsx
import { useState, useRef } from 'react'
import { X, Download, Upload } from 'lucide-react'
import { exportAll, importEntries } from '../utils/db'

export default function BackupSheet({ onClose, onImport }) {
  const [status, setStatus] = useState(null)
  const fileRef = useRef()

  const handleExport = async () => {
    const entries = await exportAll()
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `echo-diary-backup-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.json`
    a.click()
    URL.revokeObjectURL(url)
    setStatus('导出成功')
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      if (!Array.isArray(data)) throw new Error('invalid')
      const count = await importEntries(data)
      onImport()
      setStatus(`已导入 ${count} 条新记录`)
    } catch {
      setStatus('文件格式有误，请选择有效的备份文件')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div
        className="flex-1 bg-espresso/40"
        onClick={onClose}
        style={{ backdropFilter: 'blur(2px)' }}
      />
      <div className="bg-parchment-light rounded-t-2xl shadow-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-espresso italic font-normal">备份与恢复</h2>
          <button onClick={onClose} className="p-1.5 text-espresso-light hover:text-espresso rounded-lg">
            <X size={17} />
          </button>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-3 w-full p-3 rounded-xl bg-parchment-dark hover:bg-parchment transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-full bg-amber/10 flex items-center justify-center shrink-0">
            <Download size={15} className="text-amber" />
          </div>
          <div>
            <p className="font-ui text-sm text-espresso font-medium">导出 JSON</p>
            <p className="font-ui text-xs text-espresso-light mt-0.5">下载所有日记为备份文件</p>
          </div>
        </button>

        <button
          onClick={() => fileRef.current.click()}
          className="flex items-center gap-3 w-full p-3 rounded-xl bg-parchment-dark hover:bg-parchment transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-full bg-sage/10 flex items-center justify-center shrink-0">
            <Upload size={15} className="text-sage" />
          </div>
          <div>
            <p className="font-ui text-sm text-espresso font-medium">导入 JSON</p>
            <p className="font-ui text-xs text-espresso-light mt-0.5">从备份文件恢复，不覆盖已有记录</p>
          </div>
        </button>

        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />

        {status && (
          <p className="text-xs font-ui text-center text-espresso-light py-1">{status}</p>
        )}

        <div className="pb-safe" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/BackupSheet.jsx
git commit -m "feat: add BackupSheet component for JSON export and import"
```

---

## Task 5: Update App.jsx — loading skeleton + settings button

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Replace the full file**

```jsx
import { useState } from 'react'
import { Plus, Settings } from 'lucide-react'
import { useEntries } from './hooks/useEntries'
import { today, formatDate } from './utils/dateUtils'
import Navigation from './components/Navigation'
import EntryEditor from './components/EntryEditor'
import TimelineView from './components/TimelineView'
import WeekView from './components/WeekView'
import MonthView from './components/MonthView'
import YearView from './components/YearView'
import OnThisDayView from './components/OnThisDayView'
import BackupSheet from './components/BackupSheet'

export default function App() {
  const { entries, addEntry, deleteEntry, loading } = useEntries()
  const [view, setView] = useState('timeline')
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
            {view === 'timeline' && <TimelineView entries={entries} onDelete={deleteEntry} />}
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
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run dev server and verify loading skeleton appears briefly on first load**

```bash
npm run dev
```

Open `http://localhost:5173`. Check:
1. Brief 3-bar pulsing skeleton, then timeline loads
2. ⚙ icon appears in the header left of the + button
3. Click ⚙ — BackupSheet opens with export/import buttons
4. Click "导出 JSON" — file downloads
5. Click backdrop — sheet closes

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add loading skeleton and settings button to App"
```

---

## Task 6: Add dateUtils helpers with tests

**Files:**
- Modify: `src/utils/dateUtils.js`
- Create: `src/utils/dateUtils.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/utils/dateUtils.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { getSameDayOfWeek, getSameDayOfMonth } from './dateUtils'

// 2026-05-04 = Monday (1), 2026-05-05 = Tuesday (2), 2026-05-06 = Wednesday (3)
const entries = [
  { id: 'a', date: '2026-05-04', createdAt: '2026-05-04T09:00:00.000Z', text: 'Mon 1' },
  { id: 'b', date: '2026-04-27', createdAt: '2026-04-27T09:00:00.000Z', text: 'Mon 2' },
  { id: 'c', date: '2026-04-20', createdAt: '2026-04-20T09:00:00.000Z', text: 'Mon 3' },
  { id: 'd', date: '2026-05-06', createdAt: '2026-05-06T09:00:00.000Z', text: 'Wed' },
  { id: 'e', date: '2026-04-06', createdAt: '2026-04-06T09:00:00.000Z', text: '6th April' },
]

describe('getSameDayOfWeek', () => {
  it('returns entries on the given weekday sorted desc', () => {
    const result = getSameDayOfWeek(entries, 1) // Monday
    expect(result.map(e => e.id)).toEqual(['a', 'b', 'c'])
  })

  it('respects the n limit', () => {
    expect(getSameDayOfWeek(entries, 1, 2)).toHaveLength(2)
    expect(getSameDayOfWeek(entries, 1, 2)[0].id).toBe('a')
  })

  it('returns empty array when no entries match', () => {
    expect(getSameDayOfWeek(entries, 0)).toEqual([]) // Sunday
  })
})

describe('getSameDayOfMonth', () => {
  it('returns entries on the given day of month sorted desc', () => {
    const result = getSameDayOfMonth(entries, 6)
    expect(result.map(e => e.id)).toEqual(['d', 'e'])
  })

  it('respects the n limit', () => {
    expect(getSameDayOfMonth(entries, 6, 1)).toHaveLength(1)
    expect(getSameDayOfMonth(entries, 6, 1)[0].id).toBe('d')
  })

  it('returns empty array when no entries match', () => {
    expect(getSameDayOfMonth(entries, 31)).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: FAIL — `getSameDayOfWeek is not a function`

- [ ] **Step 3: Add the two helpers to the bottom of dateUtils.js**

Append to `src/utils/dateUtils.js`:
```js
export function getSameDayOfWeek(entries, dayOfWeek, n = 8) {
  return entries
    .filter(e => {
      const [year, month, day] = e.date.split('-').map(Number)
      return new Date(year, month - 1, day).getDay() === dayOfWeek
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, n)
}

export function getSameDayOfMonth(entries, dayOfMonth, n = 8) {
  return entries
    .filter(e => parseInt(e.date.split('-')[2]) === dayOfMonth)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, n)
}
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
npm test
```

Expected: all tests PASS (db tests + dateUtils tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/dateUtils.js src/utils/dateUtils.test.js
git commit -m "feat: add getSameDayOfWeek and getSameDayOfMonth to dateUtils"
```

---

## Task 7: Update EntryCard.jsx — photo thumbnail strip

**Files:**
- Modify: `src/components/EntryCard.jsx`

- [ ] **Step 1: Replace the full file**

```jsx
import { useState } from 'react'
import { Mic, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { formatTime, formatDate } from '../utils/dateUtils'

export default function EntryCard({ entry, onDelete, showDate = false }) {
  const [expanded, setExpanded] = useState(false)
  const [photoExpanded, setPhotoExpanded] = useState(false)
  const isLong = entry.text.length > 220

  return (
    <div className="entry-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {showDate && (
            <p className="text-xs font-ui text-espresso-light mb-1 tracking-wide uppercase">
              {formatDate(entry.date)}
            </p>
          )}
          <p className="text-[11px] font-ui text-espresso-light/70 mb-2 tabular-nums">
            {formatTime(entry.createdAt)}
          </p>
          {entry.text && (
            <p className="font-body text-espresso leading-relaxed text-[15px] whitespace-pre-wrap break-words">
              {isLong && !expanded ? entry.text.slice(0, 220) + '…' : entry.text}
            </p>
          )}
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-amber mt-1.5 font-ui"
            >
              {expanded ? <><ChevronUp size={11} /> Less</> : <><ChevronDown size={11} /> Read more</>}
            </button>
          )}

          {entry.audioDataUrl && (
            <div className="flex items-center gap-1.5 mt-3">
              <Mic size={11} className="text-sage shrink-0" />
              <audio src={entry.audioDataUrl} controls style={{ height: '28px', maxWidth: '160px' }} />
            </div>
          )}

          {entry.photoDataUrl && (
            <div
              className="mt-3 rounded-lg overflow-hidden cursor-pointer"
              onClick={() => setPhotoExpanded(p => !p)}
            >
              <img
                src={entry.photoDataUrl}
                alt="Entry photo"
                className={`w-full object-cover rounded-lg transition-all duration-200 ${
                  photoExpanded ? 'max-h-64' : 'h-20'
                }`}
              />
            </div>
          )}
        </div>

        {onDelete && (
          <button
            onClick={() => onDelete(entry.id)}
            className="p-1 text-espresso-light/40 hover:text-red-400 transition-colors shrink-0 mt-0.5"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

With `npm run dev`, create a new entry with a photo. Verify:
- Photo appears as an 80px strip directly below the text, no button needed
- Tapping the strip expands to full width (max-h-64)
- Tapping again collapses back to 80px
- Entries without photos look identical to before

- [ ] **Step 3: Commit**

```bash
git add src/components/EntryCard.jsx
git commit -m "feat: show photo as inline thumbnail strip in EntryCard"
```

---

## Task 8: Update OnThisDayView.jsx — comparison chips

**Files:**
- Modify: `src/components/OnThisDayView.jsx`

- [ ] **Step 1: Replace the full file**

```jsx
import { useState } from 'react'
import { getOnThisDayFilter, getSameDayOfWeek, getSameDayOfMonth, today, formatDateShort } from '../utils/dateUtils'
import EntryCard from './EntryCard'

const WEEKDAY_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export default function OnThisDayView({ entries, onDelete }) {
  const t = today()
  const [, mm, dd] = t.split('-')
  const [mode, setMode] = useState('onthisday')

  const todayDate = new Date(parseInt(t.slice(0, 4)), parseInt(mm) - 1, parseInt(dd))
  const todayDow = todayDate.getDay()
  const todayDom = parseInt(dd)

  const monthDay = todayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  const chips = [
    { id: 'onthisday', label: '历年今天' },
    { id: 'weekday', label: `每${WEEKDAY_ZH[todayDow]}` },
    { id: 'dayofmonth', label: `每月${todayDom}号` },
  ]

  let results
  if (mode === 'onthisday') results = getOnThisDayFilter(entries)
  else if (mode === 'weekday') results = getSameDayOfWeek(entries, todayDow)
  else results = getSameDayOfMonth(entries, todayDom)

  const subLabel = mode === 'onthisday' ? 'Across all years'
    : mode === 'weekday' ? 'Recent weeks'
    : 'Recent months'

  const emptyBody = mode === 'onthisday'
    ? 'Write today\'s entry — next year, it will appear here as a beautiful echo from the past'
    : '写下今天的日记，这一天的回响就开始了'

  return (
    <div className="space-y-4">
      <div className="text-center pb-1">
        <p className="font-display text-2xl italic text-espresso">{monthDay}</p>
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
                        <EntryCard key={entry.id} entry={entry} onDelete={onDelete} />
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
                {entry.date === t ? '今天' : formatDateShort(entry.date)}
              </p>
              <EntryCard entry={entry} onDelete={onDelete} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Open the "This Day" tab. Verify:
- Three chips appear: "历年今天", "每周X" (today's weekday), "每月X号" (today's day)
- "历年今天" is active by default, timeline view unchanged from before
- Tapping "每周X" switches to flat list; each entry has a date label above it
- Tapping "每月X号" same flat list behaviour
- Active chip is amber, others are muted

- [ ] **Step 3: Commit**

```bash
git add src/components/OnThisDayView.jsx
git commit -m "feat: add weekday and day-of-month comparison modes to OnThisDayView"
```

---

## Task 9: Audio upload fallback for missing microphone

**Files:**
- Modify: `src/hooks/useMediaRecorder.js`
- Modify: `src/components/AudioRecorder.jsx`

- [ ] **Step 1: Update useMediaRecorder.js to expose deviceNotFound**

Replace full file:
```js
import { useState, useRef, useCallback } from 'react'

export function useMediaRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioDataUrl, setAudioDataUrl] = useState(null)
  const [error, setError] = useState(null)
  const [deviceNotFound, setDeviceNotFound] = useState(false)
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  const startRecording = useCallback(async () => {
    setError(null)
    setDeviceNotFound(false)
    setAudioDataUrl(null)
    setDuration(0)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onload = () => setAudioDataUrl(reader.result)
        reader.readAsDataURL(blob)
        stream.getTracks().forEach(t => t.stop())
      }

      mediaRecorder.start(100)
      setIsRecording(true)

      timerRef.current = setInterval(() => {
        setDuration(d => d + 1)
      }, 1000)
    } catch (err) {
      if (err.name === 'NotFoundError') {
        setDeviceNotFound(true)
      } else {
        setError(err.message || 'Microphone access denied')
      }
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(timerRef.current)
    }
  }, [isRecording])

  const clearRecording = useCallback(() => {
    setAudioDataUrl(null)
    setDuration(0)
    setDeviceNotFound(false)
  }, [])

  return { isRecording, audioDataUrl, error, deviceNotFound, duration, startRecording, stopRecording, clearRecording }
}
```

- [ ] **Step 2: Update AudioRecorder.jsx to use deviceNotFound**

Replace full file:
```jsx
import { useEffect, useRef } from 'react'
import { Mic, Square, Trash2, Upload } from 'lucide-react'
import { useMediaRecorder } from '../hooks/useMediaRecorder'

function formatDuration(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function AudioRecorder({ value, onChange }) {
  const { isRecording, audioDataUrl, error, deviceNotFound, duration, startRecording, stopRecording, clearRecording } = useMediaRecorder()
  const fileRef = useRef()

  useEffect(() => {
    if (audioDataUrl) onChange(audioDataUrl)
  }, [audioDataUrl, onChange])

  const handleClear = () => {
    clearRecording()
    onChange(null)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-600 font-ui">{error}</p>}

      {!value && !isRecording && !deviceNotFound && (
        <button
          type="button"
          onClick={startRecording}
          className="flex items-center gap-2 text-sm text-espresso-light hover:text-amber font-ui transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-parchment-dark flex items-center justify-center">
            <Mic size={14} />
          </div>
          <span>Add voice note</span>
        </button>
      )}

      {deviceNotFound && !value && (
        <button
          type="button"
          onClick={() => fileRef.current.click()}
          className="flex items-center gap-2 text-sm text-espresso-light hover:text-amber font-ui transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-parchment-dark flex items-center justify-center">
            <Upload size={14} />
          </div>
          <span>Upload audio file</span>
        </button>
      )}

      <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />

      {isRecording && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-ui text-espresso-mid tabular-nums">{formatDuration(duration)}</span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-ui"
          >
            <Square size={14} fill="currentColor" />
            Stop
          </button>
        </div>
      )}

      {value && !isRecording && (
        <div className="flex items-center gap-2">
          <audio src={value} controls className="flex-1" style={{ height: '32px', maxWidth: '220px' }} />
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-espresso-light hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify in browser (desktop with no mic)**

1. Open new entry editor
2. Click "Add voice note"
3. The button should instantly switch to "Upload audio file" (no error text shown)
4. Click "Upload audio file" — file picker opens
5. Select an mp3/m4a/wav — audio player appears, identical to after recording

- [ ] **Step 4: Run all tests**

```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useMediaRecorder.js src/components/AudioRecorder.jsx
git commit -m "feat: show audio file upload fallback when no microphone device found"
```

---

## Task 10: Add .gitignore entry for brainstorm session files

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add .superpowers to .gitignore**

Open `.gitignore` and append:
```
.superpowers/
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore .superpowers brainstorm session files"
```

---

## Manual Verification Checklist

After all tasks complete, do a full end-to-end check in the browser (`npm run dev`):

- [ ] App loads — brief skeleton, then entries appear
- [ ] Existing entries (if any) are still present after IndexedDB migration
- [ ] New entry with photo: photo shows as 80px strip; tap expands; tap collapses
- [ ] New entry with audio (mobile) or uploaded file (desktop): playback works
- [ ] ⚙ icon → BackupSheet opens; Export downloads a .json file
- [ ] Import: upload the exported file; "已导入 0 条新记录" (already exists); delete an entry, re-import → it comes back
- [ ] "This Day" tab — three chips visible; switching modes changes content
- [ ] 每周X and 每月X号 chips reflect today's actual weekday and date
