export function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatDateShort(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatTime(isoStr) {
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function today() {
  const d = new Date()
  return toDateStr(d)
}

export function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function getWeekDays(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday)
    dd.setDate(monday.getDate() + i)
    return toDateStr(dd)
  })
}

export function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days = []

  let startDow = firstDay.getDay()
  if (startDow === 0) startDow = 7
  for (let i = 1; i < startDow; i++) {
    const d = new Date(year, month, 1 - (startDow - 1 - i + 1))
    days.push({ date: toDateStr(d), isCurrentMonth: false })
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: toDateStr(new Date(year, month, d)), isCurrentMonth: true })
  }

  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    days.push({ date: toDateStr(d), isCurrentMonth: false })
  }

  return days
}

export function getYearMonths(year) {
  return Array.from({ length: 12 }, (_, i) => ({
    month: i,
    year,
    label: new Date(year, i, 1).toLocaleDateString('en-US', { month: 'short' }),
  }))
}

export function getOnThisDayFilter(entries) {
  const t = today()
  const [, mm, dd] = t.split('-')
  return entries
    .filter(e => {
      const [, em, ed] = e.date.split('-')
      return em === mm && ed === dd
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function groupByDate(entries) {
  const groups = {}
  entries.forEach(e => {
    if (!groups[e.date]) groups[e.date] = []
    groups[e.date].push(e)
  })
  Object.values(groups).forEach(g => g.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
}

export function getDayOfWeek(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'short' })
}

export function getMonthName(month) {
  return new Date(2000, month, 1).toLocaleDateString('en-US', { month: 'long' })
}

export function isToday(dateStr) {
  return dateStr === today()
}
