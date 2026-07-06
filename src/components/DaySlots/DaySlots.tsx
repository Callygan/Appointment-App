import { useRef, useLayoutEffect } from 'react'
import { formatTime, formatDate } from '../../utils/dateUtils'
import type { AvailableSlot } from '../../types'

interface Props {
  date: string
  slots: AvailableSlot[]
  onBook: (slot: AvailableSlot) => void
  selectedSlotId?: string | null
  occupiedSlotIds?: Set<string>
  occupiedLabelBySlotId?: Record<string, string>
  bookLabel?: string
  afterHoursFrom?: number
  afterHoursLabel?: string
}

export function DaySlots({ date, slots, onBook, selectedSlotId, occupiedSlotIds, occupiedLabelBySlotId, bookLabel = 'Rezervă', afterHoursFrom, afterHoursLabel }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const prevH = useRef(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const from = prevH.current
    const to = el.scrollHeight
    prevH.current = to

    if (!from || from === to) return

    // Force starting height, cancel any ongoing transition
    el.style.transition = 'none'
    el.style.height = `${from}px`

    // Double rAF: browser needs 2 frames to pick up the forced height before transitioning
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        el.style.height = `${to}px`
        el.addEventListener('transitionend', () => {
          el.style.height = 'auto'
          el.style.transition = ''
        }, { once: true })
      })
    })
  }, [slots.length])

  return (
    <div ref={ref} className="w-full overflow-hidden px-0.5 pb-0.5">
      <h3 className="text-base font-semibold text-[#1d1d1f] tracking-tight mb-4">{formatDate(date)}</h3>
      {slots.length === 0 ? (
        <p className="text-sm text-[#6e6e73] text-center py-4">Nu există intervale disponibile pentru această zi.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 list-none p-0 m-0">
          {slots.map((slot) => (
            <li key={slot.id}>
              {(() => {
                const isOccupied = occupiedSlotIds?.has(slot.id) ?? false
                const isSelected = selectedSlotId === slot.id
                const startHour = Number(slot.start_time.slice(0, 2))
                const isAfterHours = afterHoursFrom != null && startHour >= afterHoursFrom
                const baseCls = isOccupied
                  ? 'bg-[#f59e0b]/15 border border-[#f59e0b]/45 hover:bg-[#f59e0b]/22 hover:border-[#f59e0b]/60 hover:shadow-[0_4px_16px_rgba(245,158,11,0.18)]'
                  : isAfterHours
                    ? 'bg-[#f59e0b]/12 border border-[#f59e0b]/35 hover:bg-[#f59e0b]/18 hover:border-[#f59e0b]/50 hover:shadow-[0_4px_16px_rgba(245,158,11,0.16)]'
                    : 'bg-white/40 border border-white/60 hover:bg-white/70 hover:border-[#34c759]/50 hover:shadow-[0_4px_16px_rgba(52,199,89,0.15)]'
                const selectedCls = isSelected
                  ? (isOccupied
                    ? 'bg-[#f59e0b]/24 border border-[#f59e0b]/70 shadow-[0_4px_16px_rgba(245,158,11,0.3)]'
                    : isAfterHours
                      ? 'bg-[#f59e0b]/22 border border-[#f59e0b]/65 shadow-[0_4px_16px_rgba(245,158,11,0.24)]'
                      : 'bg-[#34c759]/20 border border-[#34c759]/55 shadow-[0_4px_16px_rgba(52,199,89,0.25)]')
                  : baseCls
                const label = occupiedLabelBySlotId?.[slot.id]

                return (
              <button
                type="button"
                onClick={() => onBook(slot)}
                className={`w-full flex flex-col items-center justify-center gap-0.5 px-3 py-3 rounded-2xl backdrop-blur-sm cursor-pointer transition-all hover:scale-[1.02] active:scale-95 group ${selectedCls}`}
              >
                <span className="text-lg font-semibold text-[#1d1d1f] tabular-nums tracking-tight group-hover:text-[#34c759] transition-colors">
                  {formatTime(slot.start_time)}
                </span>
                <span className="text-[10px] font-medium text-[#6e6e73] uppercase tracking-wide group-hover:text-[#34c759]/70 transition-colors">
                  {bookLabel}
                </span>
                {!isOccupied && isAfterHours && afterHoursLabel && (
                  <span className="text-[10px] text-[#b45309] leading-tight text-center mt-0.5">
                    {afterHoursLabel}
                  </span>
                )}
                {label && (
                  <span className="text-[10px] text-[#b45309] leading-tight text-center mt-0.5 truncate max-w-full">
                    {label}
                  </span>
                )}
              </button>
                )
              })()}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
