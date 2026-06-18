import type { AvailableSlot } from '../../types'

interface Props {
  date: string
  slots: AvailableSlot[]
  onBook: (slot: AvailableSlot) => void
}

function formatTime(time: string) {
  // time is HH:MM:SS from Postgres, show only HH:MM
  return time.slice(0, 5)
}

function formatDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('ro-RO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export function DaySlots({ date, slots, onBook }: Props) {
  if (slots.length === 0) {
    return (
      <div className="w-full">
        <h3 className="text-base font-semibold text-[#1d1d1f] tracking-tight mb-4">{formatDate(date)}</h3>
        <p className="text-sm text-[#6e6e73] text-center py-4">Nu există intervale disponibile pentru această zi.</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <h3 className="text-base font-semibold text-[#1d1d1f] tracking-tight mb-4">{formatDate(date)}</h3>
      <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
        {slots.map((slot) => (
          <li key={slot.id} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/60">
            <span className="text-sm font-medium text-[#1d1d1f]">
              {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
            </span>
            <button
              onClick={() => onBook(slot)}
              className="bg-[#34c759] hover:bg-[#28a745] text-white text-xs font-semibold px-4 py-2 rounded-full cursor-pointer border-none transition-all hover:scale-105 active:scale-95 shadow-[0_2px_8px_rgba(52,199,89,0.3)]"
            >
              Rezervă
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
