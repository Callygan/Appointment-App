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
        services ( name, price )
      `)
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setAppointments(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function confirmAppointment(id: string) {
    await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', id)
    await load()
  }

  async function cancelAppointment(id: string, slotId: string) {
    const { error: apptErr } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)
    if (apptErr) {
      if (import.meta.env.DEV) console.error('cancelAppointment appt error:', apptErr)
      return
    }
    const { error: slotErr } = await supabase.from('available_slots').update({ is_booked: false }).eq('id', slotId)
    if (slotErr && import.meta.env.DEV) console.error('cancelAppointment slot free error:', slotErr)
    await load()
  }

  return { appointments, loading, error, confirmAppointment, cancelAppointment }
}
