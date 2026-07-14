import { useState, useRef, useEffect } from 'react'
import { MonthCalendar } from '../../components/MonthCalendar/MonthCalendar'
import { DaySlots } from '../../components/DaySlots/DaySlots'
import { BookingForm } from '../../components/BookingForm/BookingForm'
import { SuccessPage } from '../SuccessPage/SuccessPage'
import { useAvailableSlots } from '../../hooks/useAvailableSlots'
import { useServices } from '../../hooks/useServices'
import type { AvailableSlot } from '../../types'

export function BookingPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1) // 1-12
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [bookingSlot, setBookingSlot] = useState<AvailableSlot | null>(null)
  const [bookedSlot, setBookedSlot] = useState<AvailableSlot | null>(null)
  const [booked, setBooked] = useState(false)
  const [bookingNumber, setBookingNumber] = useState<number>(0)

  const { slots, loading, error, datesWithSlots, refresh } = useAvailableSlots(year, month)
  const { services } = useServices()

  const slotsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedDate) {
      const t = setTimeout(() => {
        slotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 150)
      return () => clearTimeout(t)
    }
  }, [selectedDate])

  const slotsForDay = selectedDate
    ? slots.filter(
        (s) =>
          s.date === selectedDate &&
          new Date(`${s.date}T${s.start_time}`).getTime() >= Date.now() + 2 * 60 * 60 * 1000,
      )
    : []

  function handlePrev() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }

  function handleNext() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  function handleBookSuccess(num: number) {
    setBookingNumber(num)
    setBookedSlot(bookingSlot)
    setBookingSlot(null)
    setBooked(true)
    refresh()
  }

  if (booked) {
    return <SuccessPage bookingNumber={bookingNumber} slot={bookedSlot} onBack={() => { setBooked(false); setSelectedDate(null) }} />
  }

  return (
    <div className="flex flex-col items-center px-4 pt-28 pb-16">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-[#1d1d1f] tracking-tight mb-2">Fă-ți o programare</h1>
        <p className="text-sm text-[#6e6e73]">Selectează o zi disponibilă, apoi alege un interval orar.</p>
      </header>

      <div className="w-full max-w-sm flex flex-col gap-5">
        <div className="glass rounded-3xl p-6">
          <MonthCalendar
            year={year}
            month={month}
            datesWithSlots={datesWithSlots}
            selectedDate={selectedDate}
            onDaySelect={setSelectedDate}
            onPrev={handlePrev}
            onNext={handleNext}
            disablePrev={year === today.getFullYear() && month === today.getMonth() + 1}
          />
        </div>

        <div className="text-xs mb-1 h-1 leading-4 text-center">
            {error
              ? <span className="text-red-500">Eroare la încărcarea intervalelor. Reîncarcă pagina.</span>
              : loading
                ? <span className="text-[#6e6e73]">Se încarcă...</span>
                : null}
        </div>

        {selectedDate && (
          <div
            ref={slotsRef}
            className="glass rounded-3xl p-6 overflow-hidden"
            style={{ animation: 'slideDown 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            <DaySlots
              date={selectedDate}
              slots={slotsForDay}
              onBook={setBookingSlot}
              afterHoursFrom={18}
              afterHoursLabel="+40 RON în afara programului"
            />
          </div>
        )}
      </div>

      {bookingSlot && (
        <BookingForm
          slot={bookingSlot}
          services={services}
          onSuccess={handleBookSuccess}
          onCancel={() => setBookingSlot(null)}
        />
      )}
    </div>
  )
}
