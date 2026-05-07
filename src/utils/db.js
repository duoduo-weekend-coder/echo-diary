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
  if (!Array.isArray(incoming)) return 0
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
