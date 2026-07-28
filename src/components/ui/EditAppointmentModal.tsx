import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { MonthCalendar } from '../MonthCalendar/MonthCalendar'
import { DaySlots } from '../DaySlots/DaySlots'
import type { AvailableSlot } from '../../types'
import type { Appointment } from '../../types'

interface EditAppointmentModalProps {
  appointment: Appointment
  onDismiss: () => void
  onSave: (slotId: string) => Promise<string | null>
}

function getInitialDate(a: Appointment): string {
  return a.available_slots?.date ?? a.appointment_date ?? ''
}

export function EditAppointmentModal({ appointment, onDismiss, onSave }: EditAppointmentModalProps) {
  const initialDate = getInitialDate(appointment)
  const parsed = initialDate ? new Date(initialDate + 'T00:00:00') : new Date()
  const [year, setYear] = useState(parsed.getFullYear())
  const [month, setMonth] = useState(parsed.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate || null)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [occupiedBySlotId, setOccupiedBySlotId] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slotsRef = useRef<HTMLDivElement>(null)

  // Scroll to the hours only when the user actively picks a date — never on open,
  // so the popup always shows from the top (title).
  function handleDaySelect(date: string) {
    setSelectedDate(date)
    setTimeout(() => {
      slotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)
  }

  useEffect(() => {
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const effectiveFrom = from < todayStr ? todayStr : from

    queueMicrotask(() => {
      setLoading(true)
      setLoadError(null)
    })

    supabase
      .from('available_slots')
      .select('*')
      .gte('date', effectiveFrom)
      .lte('date', to)
      .order('date')
      .order('start_time')
      .then(async (slotsRes) => {
        if (slotsRes.error) {
          setLoadError('Nu s-au putut încărca sloturile.')
          setSlots([])
          setOccupiedBySlotId({})
          setLoading(false)
          return
        }

        const allSlotsData = slotsRes.data ?? []
        const slotIds = allSlotsData.map(s => s.id)

        // Match occupied appointments by slot_id (NOT appointment_date): client
        // bookings made via book_slot leave appointment_date NULL, so filtering by
        // date would hide them and occupied slots would only show intermittently.
        const apptsRes = slotIds.length
          ? await supabase
              .from('appointments')
              .select('id, slot_id, client_name, status')
              .in('status', ['pending', 'confirmed'])
              .in('slot_id', slotIds)
          : { data: [], error: null }

        if (apptsRes.error) {
          setLoadError('Nu s-au putut încărca sloturile.')
          setSlots([])
          setOccupiedBySlotId({})
          setLoading(false)
          return
        }

        const nowMs = Date.now()
        const allSlots = allSlotsData
          .filter(s => s.id !== appointment.slot_id)
          // Hide slots whose time has already passed (e.g. earlier hours of today).
          .filter(s => new Date(`${s.date}T${s.start_time}`).getTime() > nowMs)
        const bySlot: Record<string, string> = {}
        for (const a of apptsRes.data ?? []) {
          if (!a.slot_id) continue
          if (a.id === appointment.id) continue
          bySlot[a.slot_id] = a.client_name
        }

        setSlots(allSlots)
        setOccupiedBySlotId(bySlot)
        setLoading(false)
      })
  }, [year, month, appointment.id, appointment.slot_id])

  const datesWithSlots = useMemo(() => new Set(slots.map(s => s.date)), [slots])
  const slotsForDay = selectedDate ? slots.filter(s => s.date === selectedDate) : []
  const selectedSlotIsInCurrentDay = selectedSlotId ? slotsForDay.some(s => s.id === selectedSlotId) : false
  const effectiveSelectedSlotId = selectedSlotIsInCurrentDay ? selectedSlotId : null

  const selectedSlot = useMemo(
    () => slots.find(s => s.id === effectiveSelectedSlotId) ?? null,
    [slots, effectiveSelectedSlotId],
  )

  const occupiedSlotIds = useMemo(() => new Set(Object.keys(occupiedBySlotId)), [occupiedBySlotId])

  const occupiedLabels = useMemo(() => {
    const labels: Record<string, string> = {}
    for (const slotId of Object.keys(occupiedBySlotId)) {
      labels[slotId] = `${occupiedBySlotId[slotId]}`
    }
    return labels
  }, [occupiedBySlotId])

  function handlePrev() {
    setLoading(true)
    setLoadError(null)
    if (month === 1) {
      setYear(y => y - 1)
      setMonth(12)
    } else {
      setMonth(m => m - 1)
    }
  }

  function handleNext() {
    setLoading(true)
    setLoadError(null)
    if (month === 12) {
      setYear(y => y + 1)
      setMonth(1)
    } else {
      setMonth(m => m + 1)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!effectiveSelectedSlotId) return
    setSaving(true)
    setError(null)
    const err = await onSave(effectiveSelectedSlotId)
    if (err) {
      setError(err)
      setSaving(false)
      return
    }
    setSaving(false)
    onDismiss()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onDismiss}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative glass-heavy rounded-3xl p-6 w-full max-w-md mx-4 shadow-2xl max-h-[85vh] overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex flex-col"
        style={{ animation: 'slideDown 0.3s cubic-bezier(0.4,0,0.2,1)' }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onDismiss} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/8 flex items-center justify-center border-none cursor-pointer text-[#6e6e73] hover:bg-black/15 transition-colors" aria-label="Închide">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <h3 className="text-base font-semibold text-[#1d1d1f] mb-4">Modifică data și ora pentru "{appointment.client_name}"</h3>
        <p className="text-sm text-[#6e6e73] mb-4">Alege un slot liber sau un slot ocupat (orange) pentru schimb de loc.</p>

        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div className="flex flex-col pr-1 [scrollbar-gutter:stable]">
            <div className="glass rounded-2xl p-4">
            <MonthCalendar
              year={year}
              month={month}
              datesWithSlots={datesWithSlots}
              selectedDate={selectedDate}
              onDaySelect={handleDaySelect}
              onPrev={handlePrev}
              onNext={handleNext}
              disablePrev={year === new Date().getFullYear() && month === new Date().getMonth() + 1}
              allDatesSelectable={false}
            />
            </div>

            <div className="text-xs h-4 leading-4 text-center mt-3">
              {loadError
                ? <span className="text-red-500">{loadError}</span>
                : loading
                  ? <span className="text-[#6e6e73]">Se încarcă...</span>
                  : null}
            </div>

            {selectedDate && (
              <div ref={slotsRef} className="glass rounded-2xl p-4 overflow-hidden mt-3">
                <DaySlots
                  date={selectedDate}
                  slots={slotsForDay}
                  onBook={(slot) => setSelectedSlotId(slot.id)}
                  selectedSlotId={effectiveSelectedSlotId}
                  occupiedSlotIds={occupiedSlotIds}
                  occupiedLabelBySlotId={occupiedLabels}
                  bookLabel="Selectează"
                />
              </div>
            )}

            <p className={`text-xs text-center m-0 mt-3 min-h-4 ${effectiveSelectedSlotId ? 'text-[#34c759]' : 'text-transparent'}`}>
              {effectiveSelectedSlotId
                ? `Slot selectat: ${selectedSlot ? `${selectedSlot.date} · ${selectedSlot.start_time.slice(0, 5)}` : '—'}`
                : 'Slot selectat:'}
            </p>

            {error && <p className="text-sm text-red-500 mt-3 mb-0 text-center">{error}</p>}
          </div>

          <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-white/30">
            <button type="button" onClick={onDismiss} className="px-4 py-2 rounded-full text-sm font-medium text-[#6e6e73] glass cursor-pointer border-none hover:scale-105 transition-all">
              Anulează
            </button>
            <button
              type="submit"
              disabled={saving || !effectiveSelectedSlotId}
              className="bg-[#34c759] hover:bg-[#28a745] text-white border-none rounded-full px-5 py-2 text-sm font-semibold cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
            >
              {saving ? 'Se salvează...' : 'Salvează'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
