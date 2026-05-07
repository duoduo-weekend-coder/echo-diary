import { describe, it, expect } from 'vitest'
import { getSameDayOfWeek, getSameDayOfMonth } from './dateUtils'

// 2026-05-04 = Monday (1), 2026-05-05 = Tuesday (2), 2026-05-06 = Wednesday (3)
const entries = [
  { id: 'a', date: '2026-05-04', createdAt: '2026-05-04T09:00:00.000Z', text: 'Mon 1' },
  { id: 'b', date: '2026-04-27', createdAt: '2026-04-27T09:00:00.000Z', text: 'Mon 2' },
  { id: 'c', date: '2026-04-20', createdAt: '2026-04-20T09:00:00.000Z', text: 'Mon 3' },
  { id: 'd', date: '2026-05-06', createdAt: '2026-05-06T09:00:00.000Z', text: 'Wed' },
  { id: 'e', date: '2026-01-06', createdAt: '2026-01-06T09:00:00.000Z', text: '6th Jan' },
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
