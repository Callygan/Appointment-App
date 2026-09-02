import { useEffect, useState, useCallback } from 'react'
import { supabase, runAuthed } from '../lib/supabase'
import { useAutoRefresh } from './useAutoRefresh'
import type { Appointment } from '../types'

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
      setError(null)
    }
    const { data, error } = await runAuthed<Appointment[]>(() =>
      supabase
        .from('appointments')
        .select(`
          *,
          available_slots ( date, start_time, end_time ),
          services ( name, price, duration_minutes )
        `)
        .order('created_at', { ascending: false }),
    )

    if (error) setError(error.message)
    else setAppointments(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Refresh silently on interval and whenever the app regains focus / visibility
  // (e.g. reopening the installed PWA) so new bookings show up without a manual reload.
  useAutoRefresh(() => load(false), 30000)

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

  async function updateAppointmentSchedule(id: string, newSlotId: string): Promise<string | null> {
    const current = appointments.find(a => a.id === id)
    if (!current) return 'Programarea nu a fost găsită.'
    if (!current.slot_id) return 'Programarea curentă nu are slot asociat.'
    if (newSlotId === current.slot_id) return 'Alege un slot diferit de cel curent.'

    const { data: targetSlot, error: targetErr } = await supabase
      .from('available_slots')
      .select('id, date, start_time, is_booked')
      .eq('id', newSlotId)
      .maybeSingle()

    if (targetErr || !targetSlot) {
      if (import.meta.env.DEV) console.error('loadTargetSlot error:', targetErr)
      return 'Slotul selectat nu a fost găsit.'
    }

    if (targetSlot.is_booked) {
      const targetAppt = appointments.find(a => a.slot_id === newSlotId && a.id !== id && a.status !== 'cancelled')
      if (!targetAppt) return 'Slotul selectat este ocupat și nu poate fi folosit pentru schimb.'
      if (!targetAppt.slot_id) return 'Programarea țintă nu are slot asociat.'

      const currentDate = current.available_slots?.date ?? current.appointment_date
      const currentTime = current.available_slots?.start_time ?? current.appointment_time
      if (!currentDate || !currentTime) {
        return 'Nu s-au putut determina data și ora programării curente.'
      }

      const { error: currentErr } = await supabase
        .from('appointments')
        .update({ slot_id: newSlotId, appointment_date: targetSlot.date, appointment_time: targetSlot.start_time })
        .eq('id', current.id)

      if (currentErr) {
        if (import.meta.env.DEV) console.error('swapCurrentAppointment error:', currentErr)
        return 'Nu s-a putut actualiza programarea curentă.'
      }

      const { error: targetErr } = await supabase
        .from('appointments')
        .update({ slot_id: current.slot_id, appointment_date: currentDate, appointment_time: currentTime })
        .eq('id', targetAppt.id)

      if (targetErr) {
        if (import.meta.env.DEV) console.error('swapTargetAppointment error:', targetErr)
        // Rollback current appointment if swap counterpart failed.
        await supabase
          .from('appointments')
          .update({ slot_id: current.slot_id, appointment_date: currentDate, appointment_time: currentTime })
          .eq('id', current.id)
        return 'Nu s-a putut finaliza schimbul între programări.'
      }

      await supabase
        .from('available_slots')
        .update({ is_booked: true })
        .in('id', [current.slot_id, newSlotId])

      await load()
      return null
    }

    const { data: locked, error: lockErr } = await supabase
      .from('available_slots')
      .update({ is_booked: true })
      .eq('id', newSlotId)
      .eq('is_booked', false)
      .select('id')
      .maybeSingle()

    if (lockErr || !locked) {
      if (import.meta.env.DEV) console.error('lockTargetSlot error:', lockErr)
      return 'Slotul selectat nu mai este disponibil.'
    }

    const { error: freeOldErr } = await supabase
      .from('available_slots')
      .update({ is_booked: false })
      .eq('id', current.slot_id)

    if (freeOldErr && import.meta.env.DEV) console.error('freeOldSlot error:', freeOldErr)

    const { error: apptErr } = await supabase
      .from('appointments')
      .update({ slot_id: newSlotId, appointment_date: targetSlot.date, appointment_time: targetSlot.start_time })
      .eq('id', id)

    if (apptErr) {
      if (import.meta.env.DEV) console.error('updateAppointment error:', apptErr)
      // Rollback slot state if appointment update failed.
      await supabase.from('available_slots').update({ is_booked: false }).eq('id', newSlotId)
      await supabase.from('available_slots').update({ is_booked: true }).eq('id', current.slot_id)
      return 'Nu s-a putut actualiza programarea. Încearcă din nou.'
    }

    await load()
    return null
  }

  return { appointments, loading, error, confirmAppointment, cancelAppointment, updateAppointmentSchedule }
}
