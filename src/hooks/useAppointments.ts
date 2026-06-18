import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Appointment } from '../types'

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        available_slots ( date, start_time, end_time ),
        services ( name )
      `)
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setAppointments(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function cancelAppointment(id: string, slotId: string) {
    // Mark appointment cancelled and free the slot
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)
    await supabase.from('available_slots').update({ is_booked: false }).eq('id', slotId)
    await load()
  }

  return { appointments, loading, error, cancelAppointment }
}
