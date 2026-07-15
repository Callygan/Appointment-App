import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getDateStr } from '../utils/dateUtils'

export interface StatAppointment {
  id: string
  status: 'pending' | 'confirmed' | 'cancelled'
  appointment_date?: string
  appointment_time?: string
  client_name: string
  client_phone: string
  service_id?: string
  services?: { name: string; price?: number }
  available_slots?: { date: string; start_time: string; end_time?: string } | null
}

const toIsoDate = getDateStr

/** Returns the effective date: the field saved on deletion or the active slot's date */
function effectiveDate(r: StatAppointment) {
  return r.appointment_date ?? r.available_slots?.date ?? null
}
function effectiveTime(r: StatAppointment) {
  return r.appointment_time ?? r.available_slots?.start_time ?? null
}

export interface StatsData {
  totalBookings: number
  activeBookings: number
  cancelledCount: number
  cancellationRate: number
  estimatedRevenue: number
  realizedRevenue: number
  byMonth: { label: string; count: number; revenue: number }[]
  byHour: { label: string; count: number }[]
  byDayOfWeek: { label: string; count: number }[]
  byService: { name: string; count: number; revenue: number }[]
  newClients: number
  returningClients: number
  topClients: { name: string; phone: string; count: number }[]
  avgDaysBetweenVisits: number | null
  momGrowth: { bookings: number | null; revenue: number | null }
}

function computeStats(allRows: StatAppointment[], from: string, to: string): StatsData {
  // All confirmed with a valid date (for historical analysis)
  const allConfirmed = allRows.filter(r => r.status === 'confirmed' && effectiveDate(r) !== null)

  // Filter within the period
  const active = allConfirmed.filter(r => {
    const d = effectiveDate(r)!
    return d >= from && d <= to
  })
  const cancelled = allRows.filter(r => {
    const d = effectiveDate(r)
    return r.status === 'cancelled' && d !== null && d >= from && d <= to
  })

  const estimatedRevenue = active.reduce((sum, r) => sum + (r.services?.price ?? 0), 0)

  // Realized revenue = only confirmed appointments already in the past
  const today = toIsoDate(new Date())
  const nowMs = Date.now()
  const realizedRevenue = active.filter(r => {
    const d = effectiveDate(r)!
    if (d < today) return true
    if (d === today) {
      const end = r.available_slots?.end_time ?? r.appointment_time ?? null
      if (!end) return false
      const [h, m] = end.split(':').map(Number)
      const endMs = new Date().setHours(h, m, 0, 0)
      return nowMs >= endMs
    }
    return false
  }).reduce((sum, r) => sum + (r.services?.price ?? 0), 0)

  // Previous period (MTD vs prior MTD)
  // Align to day 1 of the previous month, same duration
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const dayFrom = fromDate.getDate()  // day of month of "from" (e.g. 1)
  const dayTo = toDate.getDate()      // day of month of "to" (e.g. 23)
  const prevMonthFrom = new Date(fromDate.getFullYear(), fromDate.getMonth() - 1, dayFrom)
  const prevMonthTo = new Date(toDate.getFullYear(), toDate.getMonth() - 1, dayTo)
  const prevFromStr = toIsoDate(prevMonthFrom)
  const prevToStr = toIsoDate(prevMonthTo)
  const prevActive = allConfirmed.filter(r => {
    const d = effectiveDate(r)!
    return d >= prevFromStr && d <= prevToStr
  })
  const prevRevenue = prevActive.reduce((sum, r) => sum + (r.services?.price ?? 0), 0)
  const momGrowth = {
    bookings: prevActive.length > 0 ? Math.round(((active.length - prevActive.length) / prevActive.length) * 100) : null,
    revenue: prevRevenue > 0 ? Math.round(((estimatedRevenue - prevRevenue) / prevRevenue) * 100) : null,
  }

  // By month
  const monthMap = new Map<string, { count: number; revenue: number }>()
  for (const r of active) {
    const d = effectiveDate(r)
    if (!d) continue
    const [y, m] = d.split('-')
    const key = `${y}-${m}`
    const prev = monthMap.get(key) ?? { count: 0, revenue: 0 }
    monthMap.set(key, {
      count: prev.count + 1,
      revenue: prev.revenue + (r.services?.price ?? 0),
    })
  }
  const byMonth = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => {
      const [y, m] = key.split('-')
      const date = new Date(parseInt(y), parseInt(m) - 1)
      const label = date.toLocaleString('ro-RO', { month: 'short', year: '2-digit' })
      return { label, count: v.count, revenue: v.revenue }
    })

  // By hour
  const hourMap = new Map<number, number>()
  for (const r of active) {
    const t = effectiveTime(r)
    if (!t) continue
    const hour = parseInt(t.split(':')[0])
    hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1)
  }
  const byHour = Array.from(hourMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([h, count]) => ({ label: `${String(h).padStart(2, '0')}:00`, count }))

  // By day of week
  const dayLabels = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm']
  const dayMap = new Map<number, number>()
  for (const r of active) {
    const d = effectiveDate(r)
    if (!d) continue
    const day = new Date(d).getDay()
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1)
  }
  // Sort Mon–Sun (1–7, with 0=Sun at end)
  const byDayOfWeek = [1, 2, 3, 4, 5, 6, 0].map(d => ({
    label: dayLabels[d],
    count: dayMap.get(d) ?? 0,
  }))

  // By service
  const serviceMap = new Map<string, { count: number; revenue: number }>()
  for (const r of active) {
    const name = r.services?.name ?? 'Necunoscut'
    const prev = serviceMap.get(name) ?? { count: 0, revenue: 0 }
    serviceMap.set(name, {
      count: prev.count + 1,
      revenue: prev.revenue + (r.services?.price ?? 0),
    })
  }
  const byService = Array.from(serviceMap.entries())
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 7)
    .map(([name, v]) => ({ name, ...v }))

  // New vs. returning clients
  const beforePeriod = new Set(
    allConfirmed.filter(r => effectiveDate(r)! < from).map(r => r.client_phone)
  )
  const seenInPeriod = new Set<string>()
  let newClients = 0
  let returningClients = 0
  for (const r of active) {
    if (!seenInPeriod.has(r.client_phone)) {
      seenInPeriod.add(r.client_phone)
      if (beforePeriod.has(r.client_phone)) returningClients++
      else newClients++
    }
  }

  // Top clients in the period (excluding GDPR-anonymized clients)
  const clientMap = new Map<string, { name: string; phone: string; count: number }>()
  for (const r of active) {
    const phone = r.client_phone
    if (phone === 'număr anonim') continue
    const prev = clientMap.get(phone) ?? { name: r.client_name, phone, count: 0 }
    clientMap.set(phone, { ...prev, count: prev.count + 1 })
  }
  const topClients = Array.from(clientMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Average interval between visits (all time, clients with 2+ visits)
  const visitsByPhone = new Map<string, string[]>()
  for (const r of allConfirmed) {
    const d = effectiveDate(r)!
    const arr = visitsByPhone.get(r.client_phone) ?? []
    arr.push(d)
    visitsByPhone.set(r.client_phone, arr)
  }
  const diffs: number[] = []
  for (const dates of visitsByPhone.values()) {
    if (dates.length < 2) continue
    dates.sort()
    for (let i = 1; i < dates.length; i++) {
      const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000
      diffs.push(diff)
    }
  }
  const avgDaysBetweenVisits =
    diffs.length > 0 ? Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length) : null

  const totalBookings = active.length + cancelled.length

  return {
    totalBookings,
    activeBookings: active.length,
    cancelledCount: cancelled.length,
    cancellationRate: totalBookings > 0 ? Math.round((cancelled.length / totalBookings) * 100) : 0,
    estimatedRevenue,
    realizedRevenue,
    byMonth,
    byHour,
    byDayOfWeek,
    byService,
    newClients,
    returningClients,
    topClients,
    avgDaysBetweenVisits,
    momGrowth,
  }
}

export function useStatistics(from: string, to: string) {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!from || !to) return

    queueMicrotask(() => {
      setLoading(true)
      setError(null)
    })

    supabase
      .from('appointments')
      .select('id, status, appointment_date, appointment_time, client_name, client_phone, service_id, services(name, price), available_slots(date, start_time, end_time)')
      .then(({ data: rows, error: err }) => {
        if (err) {
          setError(err.message)
          setLoading(false)
          return
        }
        setData(computeStats((rows ?? []) as unknown as StatAppointment[], from, to))
        setLoading(false)
      })
  }, [from, to])

  return { data, loading, error }
}
