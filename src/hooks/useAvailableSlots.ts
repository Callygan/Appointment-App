import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { AvailableSlot } from '../types'

export function useAvailableSlots(year: number, month: number) {
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    queueMicrotask(() => {
      setLoading(true)
      setError(null)
    })

    supabase
      .from('available_slots')
      .select('*')
      .eq('is_booked', false)
      .gte('date', from)
      .lte('date', to)
      .order('date')
      .order('start_time')
      .then(({ data, error }) => {
        if (error) setError('Nu s-au putut încărca intervalele disponibile.')
        else setSlots(data ?? [])
        setLoading(false)
      })
  }, [year, month, tick])

  // Returns a Set of date strings ('YYYY-MM-DD') that have free slots
  const datesWithSlots = new Set(slots.map((s) => s.date))

  return { slots, loading, error, datesWithSlots, refresh }
}
