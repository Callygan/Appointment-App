import type { AvailableSlot } from '../../types'

interface Props {
  onBack: () => void
  bookingNumber: number
  slot: AvailableSlot | null
}

export function SuccessPage({ onBack, bookingNumber, slot }: Props) {
  const dateLabel = slot ? new Date(slot.date + 'T00:00:00').toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : null
  const timeLabel = slot ? slot.start_time.slice(0, 5) : null
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center glass-heavy rounded-3xl px-8 py-12 max-w-sm w-full">
        <div className="w-20 h-20 rounded-full bg-[#f59e0b]/15 border border-[#f59e0b]/30 flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-2 tracking-tight">Cerere de rezervare trimisă!</h1>
        <p className="text-[#6e6e73] leading-relaxed mb-3 text-sm">Vei primi un mesaj pe Telefon sau Instagram cu confirmarea comenzii.<br />Ne vedem curând!</p>
        <div className="inline-flex items-center gap-1.5 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-full px-3 py-1 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
          <span className="text-xs font-medium text-[#f59e0b]">În așteptare confirmare</span>
        </div>

        {bookingNumber > 0 && (
          <div className="bg-white/50 border border-white/60 rounded-2xl px-5 py-4 mb-6 text-center">
            <p className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide mb-1">Număr programare</p>
            <p className="text-2xl font-bold text-[#1d1d1f] tracking-tight mb-2">#{bookingNumber}</p>
            {dateLabel && timeLabel && (
              <p className="text-sm font-medium text-[#1d1d1f] mb-2">{dateLabel} &middot; ora {timeLabel}</p>
            )}
            <p className="text-xs text-[#6e6e73] leading-relaxed">Reține acest număr — îl vei folosi dacă dorești să anulezi sau să verifici statusul rezervării tale.</p>
          </div>
        )}

        <button
          onClick={onBack}
          className="bg-[#34c759] hover:bg-[#28a745] text-white border-none rounded-full px-8 py-3 text-sm font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-[0_4px_16px_rgba(52,199,89,0.35)]"
        >
          Fă o altă programare
        </button>
      </div>
    </div>
  )
}
