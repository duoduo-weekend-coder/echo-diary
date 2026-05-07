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
