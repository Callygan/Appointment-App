import { useRef, useState } from 'react'
import { MonthCalendar } from '../MonthCalendar/MonthCalendar'
import { DaySlots } from '../DaySlots/DaySlots'
import { useAvailableSlots } from '../../hooks/useAvailableSlots'
import { isBookable } from '../../utils/dateUtils'
import type { AvailableSlot } from '../../types'

interface Props {
  onDismiss: () => void
  onConfirm: (slot: AvailableSlot) => Promise<string | null>
}

export function RescheduleModal({ onDismiss, onConfirm }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { slots, loading, error: loadError, datesWithSlots } = useAvailableSlots(year, month)
  const slotsRef = useRef<HTMLDivElement>(null)

  // Nu se poate reprograma pentru ziua curentă (prea din scurt) — se exclude azi.
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const selectableDates = new Set([...datesWithSlots].filter((d) => d > todayStr))

  const slotsForDay = selectedDate && selectedDate > todayStr
    ? slots.filter((s) => s.date === selectedDate && isBookable(s.date, s.start_time))
    : []

  function handleDaySelect(date: string) {
    setSelectedDate(date)
    setSelectedSlot(null)
    setTimeout(() => {
      slotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)
  }

  function handlePrev() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12) }
    else setMonth((m) => m - 1)
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  function handleNext() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1) }
    else setMonth((m) => m + 1)
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot) return
    setSaving(true)
    setError(null)
    const err = await onConfirm(selectedSlot)
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
        className="relative bg-[#f8e0f8] rounded-3xl p-6 w-full max-w-md mx-4 shadow-2xl max-h-[85vh] overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex flex-col"
        style={{ animation: 'slideDown 0.3s cubic-bezier(0.4,0,0.2,1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onDismiss} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/8 flex items-center justify-center border-none cursor-pointer text-[#6e6e73] hover:bg-black/15 transition-colors" aria-label="Închide">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>

        <h3 className="text-base font-semibold text-[#1d1d1f] mb-4">Modifică data și ora</h3>
        <p className="text-sm text-[#6e6e73] mb-4">Alege o zi disponibilă, apoi un interval liber pentru noua ta programare.</p>

        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div className="flex flex-col pr-1 [scrollbar-gutter:stable]">
            <div className="glass rounded-3xl p-6">
            <MonthCalendar
              year={year}
              month={month}
              datesWithSlots={selectableDates}
              selectedDate={selectedDate}
              onDaySelect={handleDaySelect}
              onPrev={handlePrev}
              onNext={handleNext}
              disablePrev={year === today.getFullYear() && month === today.getMonth() + 1}
              allDatesSelectable={false}
            />
            </div>

            <div className="text-xs h-4 leading-4 text-center mt-3">
              {loadError
                ? <span className="text-red-500">Eroare la încărcarea intervalelor. Reîncarcă pagina.</span>
                : loading
                  ? <span className="text-[#6e6e73]">Se încarcă...</span>
                  : null}
            </div>

            {selectedDate && (
              <div
                ref={slotsRef}
                key={selectedDate}
                className="glass rounded-3xl p-6 overflow-hidden mt-3"
                style={{ animation: 'slideDown 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}
              >
                <DaySlots
                  date={selectedDate}
                  slots={slotsForDay}
                  onBook={(slot) => setSelectedSlot(slot)}
                  selectedSlotId={selectedSlot?.id ?? null}
                  bookLabel="Selectează"
                />
              </div>
            )}

            <p className={`text-xs text-center m-0 mt-3 min-h-4 ${selectedSlot ? 'text-[#34c759]' : 'text-transparent'}`}>
              {selectedSlot
                ? `Slot selectat: ${selectedSlot.date} · ${selectedSlot.start_time.slice(0, 5)}`
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
              disabled={saving || !selectedSlot}
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
