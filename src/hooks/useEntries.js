import { useState, useCallback } from 'react'

const STORAGE_KEY = 'echo-diary-entries'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persist(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function useEntries() {
  const [entries, setEntries] = useState(load)

  const addEntry = useCallback(({ date, text, audioDataUrl, photoDataUrl }) => {
    const entry = {
      id: Date.now().toString(),
      date,
      text: text.trim(),
      audioDataUrl: audioDataUrl || null,
      photoDataUrl: photoDataUrl || null,
      createdAt: new Date().toISOString(),
    }
    setEntries(prev => {
      const next = [entry, ...prev]
      persist(next)
      return next
    })
    return entry
  }, [])

  const deleteEntry = useCallback((id) => {
    setEntries(prev => {
      const next = prev.filter(e => e.id !== id)
      persist(next)
      return next
    })
  }, [])

  return { entries, addEntry, deleteEntry }
}
