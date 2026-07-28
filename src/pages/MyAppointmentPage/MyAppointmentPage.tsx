import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { labelCls } from '../../components/ui/formStyles'
import { STATUS_COLOR, STATUS_LABELS, type AppointmentStatus } from '../../utils/statusColors'
import { greenBtnCls } from '../../components/ui/buttons'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { formatDate, formatTime } from '../../utils/dateUtils'
import { RescheduleModal } from '../../components/ui/RescheduleModal'
import type { AvailableSlot } from '../../types'

interface AppointmentInfo {
  booking_number: number
  client_name: string
  status: AppointmentStatus
  appointment_date: string | null
  appointment_time: string | null
  service_name: string | null
}

const STATUS_CONFIG = STATUS_COLOR

export function MyAppointmentPage() {
  const [input, setInput] = useState('')
  const [phoneVerify, setPhoneVerify] = useState('')
  const [loading, setLoading] = useState(false)
  const [appointment, setAppointment] = useState<AppointmentInfo | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nowTs, setNowTs] = useState(() => Date.now())

  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (appointment) {
      const t = setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 120)
      return () => clearTimeout(t)
    }
  }, [appointment])

  const MAX_ATTEMPTS = 5
  const LOCKOUT_MS = 3 * 60 * 1000 // 3 minute
  const LS_KEY = 'appt_search_lock'

  function readLock(): { attempts: number; lockedUntil: number | null } {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (!raw) return { attempts: 0, lockedUntil: null }
      return JSON.parse(raw)
    } catch { return { attempts: 0, lockedUntil: null } }
  }

  function writeLock(attempts: number, lockedUntil: number | null) {
    localStorage.setItem(LS_KEY, JSON.stringify({ attempts, lockedUntil }))
  }

  useEffect(() => {
    const id = window.setInterval(() => setNowTs(Date.now()), 30000)
    return () => window.clearInterval(id)
  }, [])

  const lock = readLock()
  const isLocked = lock.lockedUntil !== null && nowTs < lock.lockedUntil
  const lockExpired = lock.lockedUntil !== null && nowTs >= lock.lockedUntil
  const lockMinutesLeft = isLocked ? Math.ceil((lock.lockedUntil! - nowTs) / 60000) : 0
  // After a lockout expires, reset the counter so the user gets a fresh set of attempts.
  const attempts = lockExpired ? 0 : lock.attempts

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (isLocked) return
    const num = parseInt(input.trim(), 10)
    const last4 = phoneVerify.replace(/\D/g, '').slice(-4)
    if (!num || last4.length < 4) return

    setLoading(true)
    setNotFound(false)
    setAppointment(null)
    setError(null)
    setCancelled(false)

    const { data, error: searchErr } = await supabase.rpc('find_appointment', {
      p_booking_number: num,
      p_phone_last4: last4,
    })

    setLoading(false)

    const found = Array.isArray(data) ? data[0] : data
    if (searchErr || !found) {
      const newAttempts = attempts + 1
      writeLock(newAttempts, newAttempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : null)
      setNotFound(true)
      return
    }

    localStorage.removeItem(LS_KEY)
    setAppointment(found as AppointmentInfo)
  }

  async function handleCancel() {
    if (!appointment) return
    setCancelling(true)
    setShowCancelModal(false)
    const last4 = phoneVerify.replace(/\D/g, '').slice(-4)
    const { data: ok, error: cancelErr } = await supabase.rpc('cancel_appointment', {
      p_booking_number: appointment.booking_number,
      p_phone_last4: last4,
    })
    if (cancelErr || ok !== true) {
      setError('A apărut o eroare la anulare. Încearcă din nou.')
      setCancelling(false)
      return
    }
    setCancelling(false)
    setCancelled(true)
    setAppointment({ ...appointment, status: 'cancelled' })
  }

  async function handleReschedule(slot: AvailableSlot): Promise<string | null> {
    if (!appointment) return 'Programare lipsă.'
    setError(null)
    const last4 = phoneVerify.replace(/\D/g, '').slice(-4)
    const { data, error: rescheduleErr } = await supabase.rpc('reschedule_appointment', {
      p_booking_number: appointment.booking_number,
      p_phone_last4: last4,
      p_new_slot_id: slot.id,
    })
    if (rescheduleErr) return 'A apărut o eroare. Încearcă din nou.'
    const res = data as { ok: boolean; reason?: string; date?: string; time?: string } | null
    if (!res?.ok) {
      switch (res?.reason) {
        case 'slot_taken': return 'Intervalul tocmai a fost rezervat. Alege altul.'
        case 'same_slot': return 'Este intervalul actual. Alege altul.'
        case 'not_active': return 'Programarea nu mai poate fi modificată.'
        case 'too_late': return 'Modificarea este posibilă doar cu cel puțin 24 de ore înainte de programare.'
        default: return 'Nu am putut modifica programarea. Verifică datele.'
      }
    }
    setAppointment({
      ...appointment,
      appointment_date: res.date ?? appointment.appointment_date,
      appointment_time: res.time ?? appointment.appointment_time,
    })
    return null
  }

  const status = appointment ? STATUS_CONFIG[appointment.status] : null

  const hoursUntilAppointment =
    appointment?.appointment_date && appointment?.appointment_time
      ? (new Date(`${appointment.appointment_date}T${appointment.appointment_time}`).getTime() - nowTs) / 3600000
      : null
  const canReschedule = hoursUntilAppointment !== null && hoursUntilAppointment >= 24

  return (
    <div className="flex flex-col items-center px-4 pt-6 md:pt-28 pb-16">

      <div className="w-full max-w-md">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-[#1d1d1f] tracking-tight mb-2">Programarea mea</h1>
          <p className="text-sm text-[#6e6e73]">Introdu numărul de programare și ultimele 4 cifre din numărul de telefon pentru a verifica statusul sau a anula.</p>
        </header>

        <form onSubmit={handleSearch} className="glass rounded-3xl px-8 py-8 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] flex flex-col gap-4">
          <label className={labelCls}>
            <span className="pl-2">Număr programare</span>
            <div className="flex items-center bg-white/50 backdrop-blur-sm border border-white/60 focus-within:border-[#34c759] focus-within:bg-white/85 rounded-2xl overflow-hidden transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)]">
              <span className="px-3 py-3 text-sm font-semibold text-[#6e6e73] border-r border-white/60 bg-white/30 select-none">#</span>
              <input
                type="text"
                inputMode="numeric"
                value={input}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '')
                  setInput(val)
                  setNotFound(false)
                  setAppointment(null)
                  setCancelled(false)
                }}
                placeholder="e.g. 472831"
                className="flex-1 px-3 py-3 text-sm font-normal text-[#1d1d1f] bg-transparent outline-none normal-case tracking-normal"
              />
            </div>
          </label>

          <label className={labelCls}>
            <span className="pl-2">Ultimele 4 cifre din numărul de telefon</span>
            <div className="flex items-center bg-white/50 backdrop-blur-sm border border-white/60 focus-within:border-[#34c759] focus-within:bg-white/85 rounded-2xl overflow-hidden transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)]">
              <span className="px-3 py-3 flex items-center text-[#6e6e73] border-r border-white/60 bg-white/30 select-none">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"/></svg>
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={phoneVerify}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4)
                  setPhoneVerify(val)
                  setNotFound(false)
                  setAppointment(null)
                  setCancelled(false)
                }}
                maxLength={4}
                placeholder="e.g. 7890"
                className="flex-1 px-3 py-3 text-sm font-normal text-[#1d1d1f] bg-transparent outline-none normal-case tracking-normal"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={!input.trim() || phoneVerify.length < 4 || loading || isLocked}
            className={`${greenBtnCls} px-6 py-2.5`}
          >
            {loading ? 'Se caută...' : 'Caută programarea'}
          </button>
        </form>

        {/* Locked out */}
        {isLocked && (
          <div className="mt-4 glass rounded-2xl px-6 py-4 text-sm text-red-500 text-center">
            Prea multe încercări eșuate. Încearcă din nou peste <strong>{lockMinutesLeft} {lockMinutesLeft === 1 ? 'minut' : 'minute'}</strong>.
          </div>
        )}

        {/* Not found */}
        {notFound && !isLocked && (
          <div className="mt-4 glass rounded-2xl px-6 py-4 text-sm text-red-500 text-center">
            Nu a fost găsită nicio programare cu numărul <strong>#{input}</strong> sau ultimele 4 cifre din numărul de telefon <strong>{phoneVerify}</strong>.
            {attempts > 0 && attempts < MAX_ATTEMPTS && (
              <span className="block mt-1 text-xs text-red-400">{MAX_ATTEMPTS - attempts} {MAX_ATTEMPTS - attempts === 1 ? 'încercare rămasă' : 'încercări rămase'}.</span>
            )}
          </div>
        )}

        {/* Result */}
        {appointment && status && (
          <div
            ref={resultRef}
            className="mt-4 glass rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
            style={{ animation: 'slideDown 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            {/* Status banner */}
            <div className={`${status.bg} border-b ${status.border} px-6 py-3 flex items-center gap-2`}>
              <span className={`w-2 h-2 rounded-full ${status.dot} ${appointment.status === 'pending' ? 'animate-pulse' : ''}`} />
              <span className={`text-xs font-semibold uppercase tracking-wide ${status.color}`}>{STATUS_LABELS[appointment.status]}</span>
            </div>

            {/* Info */}
            <div className="px-6 py-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">Nr. programare</span>
                <span className="text-sm font-bold text-[#1d1d1f]">#{appointment.booking_number}</span>
              </div>
              <div className="h-px bg-white/40" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">Nume</span>
                <span className="text-sm text-[#1d1d1f]">{appointment.client_name}</span>
              </div>
              {appointment.appointment_date && appointment.appointment_time && (
                <>
                  <div className="h-px bg-white/40" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">Dată</span>
                    <span className="text-sm text-[#1d1d1f]">
                      {formatDate(appointment.appointment_date)}
                    </span>
                  </div>
                  <div className="h-px bg-white/40" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">Oră</span>
                    <span className="text-sm text-[#1d1d1f]">
                      {formatTime(appointment.appointment_time)}
                    </span>
                  </div>
                </>
              )}
              {appointment.service_name && (
                <>
                  <div className="h-px bg-white/40" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">Serviciu</span>
                    <span className="text-sm text-[#1d1d1f]">{appointment.service_name}</span>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            {(appointment.status === 'pending' || appointment.status === 'confirmed') && !cancelled && (
              <div className="px-6 pb-5">
                {error && <p className="text-xs text-red-500 mb-3 text-center">{error}</p>}
                <div className="flex gap-2">
                  {canReschedule && (
                    <button
                      onClick={() => setShowReschedule(true)}
                      disabled={cancelling}
                      className="flex-1 rounded-full px-6 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 border-none cursor-pointer transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 shadow-[0_4px_16px_rgba(249,115,22,0.3)]"
                    >
                      Modifică
                    </button>
                  )}
                  <button
                    onClick={() => setShowCancelModal(true)}
                    disabled={cancelling}
                    className="flex-1 rounded-full px-6 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 border-none cursor-pointer transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 shadow-[0_4px_16px_rgba(239,68,68,0.3)]"
                  >
                    {cancelling ? 'Se anulează...' : 'Anulează'}
                  </button>
                </div>
                {!canReschedule && (
                  <p className="text-xs text-[#6e6e73] text-center mt-2">
                    Modificarea este posibilă doar cu cel puțin 24 de ore înainte de programare.
                  </p>
                )}
              </div>
            )}

            {cancelled && (
              <div className="px-6 pb-5 text-center text-sm text-[#6e6e73]">
                Programarea a fost anulată.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel confirmation modal */}
      {showCancelModal && appointment && (
        <ConfirmModal
          title="Anulezi programarea?"
          description={<>Programarea <strong className="text-[#1d1d1f]">#{appointment.booking_number}</strong> va fi anulată definitiv.</>}
          confirmLabel="Da, anulează"
          cancelLabel="Înapoi"
          onConfirm={handleCancel}
          onDismiss={() => setShowCancelModal(false)}
        />
      )}

      {/* Reschedule modal */}
      {showReschedule && appointment && (
        <RescheduleModal
          onDismiss={() => setShowReschedule(false)}
          onConfirm={handleReschedule}
        />
      )}
    </div>
  )
}
