import { useRef, useLayoutEffect } from 'react'
import type { AvailableSlot } from '../../types'

interface Props {
  date: string
  slots: AvailableSlot[]
  onBook: (slot: AvailableSlot) => void
}

function formatTime(time: string) {
  return time.slice(0, 5)
}

function formatDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('ro-RO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export function DaySlots({ date, slots, onBook }: Props) {
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
              <button
                onClick={() => onBook(slot)}
                className="w-full flex flex-col items-center justify-center gap-0.5 px-3 py-3 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/60 cursor-pointer transition-all hover:bg-white/70 hover:border-[#34c759]/50 hover:shadow-[0_4px_16px_rgba(52,199,89,0.15)] hover:scale-[1.02] active:scale-95 group"
              >
                <span className="text-lg font-semibold text-[#1d1d1f] tabular-nums tracking-tight group-hover:text-[#34c759] transition-colors">
                  {formatTime(slot.start_time)}
                </span>
                <span className="text-[10px] font-medium text-[#6e6e73] uppercase tracking-wide group-hover:text-[#34c759]/70 transition-colors">
                  Rezervă
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
