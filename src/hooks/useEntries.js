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
