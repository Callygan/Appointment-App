import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Header } from '../../components/Header/Header'
import { labelCls } from '../../utils/validation'
import { ConfirmModal } from '../../components/ui/ConfirmModal'

type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled'

interface AppointmentInfo {
  id: string
  slot_id: string | null
  booking_number: number
  client_name: string
  status: AppointmentStatus
  appointment_date?: string
  appointment_time?: string
  available_slots: {
    date: string
    start_time: string
  } | null
  services: {
    name: string
  } | null
}

function formatDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('ro-RO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(time: string) {
  return time.slice(0, 5)
}

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  pending: {
    label: 'În așteptare',
    color: 'text-[#f59e0b]',
    bg: 'bg-[#f59e0b]/10',
    border: 'border-[#f59e0b]/30',
    dot: 'bg-[#f59e0b]',
  },
  confirmed: {
    label: 'Confirmată',
    color: 'text-[#34c759]',
    bg: 'bg-[#34c759]/10',
    border: 'border-[#34c759]/30',
    dot: 'bg-[#34c759]',
  },
  cancelled: {
    label: 'Anulată',
    color: 'text-red-500',
    bg: 'bg-red-50/60',
    border: 'border-red-200/50',
    dot: 'bg-red-400',
  },
}

export function MyAppointmentPage() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [appointment, setAppointment] = useState<AppointmentInfo | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const num = parseInt(input.trim(), 10)
    if (!num) return

    setLoading(true)
    setNotFound(false)
    setAppointment(null)
    setError(null)
    setCancelled(false)

    const { data, error: searchErr } = await supabase
      .from('appointments')
      .select(`
        id, slot_id, booking_number, client_name, status,
        appointment_date, appointment_time,
        available_slots ( date, start_time ),
        services ( name )
      `)
      .eq('booking_number', num)
      .single()

    setLoading(false)

    if (searchErr || !data) {
      setNotFound(true)
      return
    }

    setAppointment(data as unknown as AppointmentInfo)
  }

  async function handleCancel() {
    if (!appointment) return
    setCancelling(true)
    setShowCancelModal(false)
    const { error: cancelErr } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appointment.id)
    if (cancelErr) { setError('A apărut o eroare la anulare. Încearcă din nou.'); setCancelling(false); return }
    if (appointment.slot_id) {
      await supabase.from('available_slots').update({ is_booked: false }).eq('id', appointment.slot_id)
    }
    setCancelling(false)
    setCancelled(true)
    setAppointment({ ...appointment, status: 'cancelled' })
  }

  const status = appointment ? STATUS_CONFIG[appointment.status] : null

  return (
    <div className="flex flex-col items-center px-4 pt-28 pb-16">
      <Header />

      <div className="w-full max-w-md">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-[#1d1d1f] tracking-tight mb-2">Programarea mea</h1>
          <p className="text-sm text-[#6e6e73]">Introdu numărul de programare pentru a verifica statusul sau a anula.</p>
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

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-[#34c759] hover:bg-[#28a745] text-white border-none rounded-full px-6 py-2.5 text-sm font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(52,199,89,0.35)]"
          >
            {loading ? 'Se caută...' : 'Caută programarea'}
          </button>
        </form>

        {/* Not found */}
        {notFound && (
          <div className="mt-4 glass rounded-2xl px-6 py-4 text-sm text-red-500 text-center">
            Nu a fost găsită nicio programare cu numărul <strong>#{input}</strong>.
          </div>
        )}

        {/* Result */}
        {appointment && status && (
          <div
            className="mt-4 glass rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
            style={{ animation: 'slideDown 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            {/* Status banner */}
            <div className={`${status.bg} border-b ${status.border} px-6 py-3 flex items-center gap-2`}>
              <span className={`w-2 h-2 rounded-full ${status.dot} ${appointment.status === 'pending' ? 'animate-pulse' : ''}`} />
              <span className={`text-xs font-semibold uppercase tracking-wide ${status.color}`}>{status.label}</span>
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
              {(appointment.available_slots || (appointment.appointment_date && appointment.appointment_time)) && (
                <>
                  <div className="h-px bg-white/40" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">Dată</span>
                    <span className="text-sm text-[#1d1d1f]">
                      {formatDate(appointment.available_slots?.date ?? appointment.appointment_date!)}
                    </span>
                  </div>
                  <div className="h-px bg-white/40" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">Oră</span>
                    <span className="text-sm text-[#1d1d1f]">
                      {formatTime(appointment.available_slots?.start_time ?? appointment.appointment_time!)}
                    </span>
                  </div>
                </>
              )}
              {appointment.services && (
                <>
                  <div className="h-px bg-white/40" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">Serviciu</span>
                    <span className="text-sm text-[#1d1d1f]">{appointment.services.name}</span>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            {(appointment.status === 'pending' || appointment.status === 'confirmed') && !cancelled && (
              <div className="px-6 pb-5">
                {error && <p className="text-xs text-red-500 mb-3 text-center">{error}</p>}
                <button
                  onClick={() => setShowCancelModal(true)}
                  disabled={cancelling}
                  className="w-full rounded-full px-6 py-2.5 text-sm font-semibold text-red-500 border border-red-200/60 bg-white/40 hover:bg-red-50/60 cursor-pointer transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                >
                  {cancelling ? 'Se anulează...' : 'Anulează programarea'}
                </button>
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
    </div>
  )
}
