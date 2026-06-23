import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { AvailableSlot } from '../types'

export function useAdminSlots(year: number, month: number) {
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    setLoading(true)
    setError(null)

    supabase
      .from('available_slots')
      .select('*')
      .gte('date', from)
      .lte('date', to)
      .order('date')
      .order('start_time')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setSlots(data ?? [])
        setLoading(false)
      })
  }, [year, month, tick])

  const datesWithSlots = new Set(slots.map(s => s.date))

  async function deleteSlot(id: string): Promise<string | null> {
    // Block deletion if slot has an active (pending/confirmed) appointment
    const { data: active } = await supabase
      .from('appointments')
      .select('id')
      .eq('slot_id', id)
      .in('status', ['pending', 'confirmed'])
      .limit(1)
    if (active && active.length > 0) {
      return 'Slotul are o rezervare activă. Anulează rezervarea înainte de a șterge slotul.'
    }

    // Fetch slot date/time so we can preserve it on any linked appointments
    const { data: slot } = await supabase.from('available_slots').select('date, start_time').eq('id', id).single()
    if (slot) {
      await supabase.from('appointments')
        .update({ appointment_date: slot.date, appointment_time: slot.start_time })
        .eq('slot_id', id)
    }
    const { error } = await supabase.from('available_slots').delete().eq('id', id)
    if (error) { console.error('deleteSlot error:', error); return error.message }
    refresh()
    return null
  }

  return { slots, loading, error, datesWithSlots, refresh, deleteSlot }
}
