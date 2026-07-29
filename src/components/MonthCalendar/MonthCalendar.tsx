import { getDateStr } from '../../utils/dateUtils'

const DAYS = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du']
const MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
]

interface Props {
  year: number
  month: number // 1-12
  datesWithSlots: Set<string>
  selectedDate: string | null
  onDaySelect: (date: string) => void
  onPrev: () => void
  onNext: () => void
  allowPast?: boolean
  disablePrev?: boolean
  allDatesSelectable?: boolean
  maxDate?: string
}

export function MonthCalendar({
  year, month, datesWithSlots, selectedDate, onDaySelect, onPrev, onNext, allowPast, disablePrev, allDatesSelectable, maxDate,
}: Props) {
  const firstDow = (new Date(year, month - 1, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month, 0).getDate()
  const today = getDateStr(new Date())

  // Full week grid: include spill days from prev/next month to fill the rows.
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7
  const cells: Date[] = Array.from(
    { length: totalCells },
    (_, i) => new Date(year, month - 1, 1 - firstDow + i),
  )

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={onPrev}
          disabled={!!disablePrev}
          aria-label="Luna anterioară"
          className="w-9 h-9 rounded-full glass flex items-center justify-center text-[#1d1d1f] border-none transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 cursor-pointer hover:scale-105 active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="10 12 6 8 10 4" />
          </svg>
        </button>
        <span className="text-base font-semibold text-[#1d1d1f] tracking-tight">
          {MONTHS[month - 1]} {year}
        </span>
        <button
          type="button"
          onClick={onNext}
          aria-label="Luna următoare"
          className="w-9 h-9 rounded-full glass flex items-center justify-center cursor-pointer text-[#1d1d1f] hover:scale-105 transition-transform active:scale-95 border-none"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 4 10 8 6 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-[#6e6e73] py-1">{d}</div>
        ))}

        {cells.map((date) => {
          const dateStr = getDateStr(date)
          const inMonth = date.getMonth() === month - 1
          const day = date.getDate()
          const hasSlots = datesWithSlots.has(dateStr)
          const isSelected = selectedDate === dateStr
          const isPast = dateStr < today
          const isAfterMax = maxDate ? dateStr > maxDate : false
          const isAvailable = inMonth && (allDatesSelectable
            ? (!isPast || !!allowPast) && !isAfterMax
            : hasSlots && (!isPast || !!allowPast) && !isAfterMax)
          const jsDow = date.getDay()
          const isWeekend = jsDow === 0 || jsDow === 6
          const isFutureOrToday = dateStr >= today

          return (
            <button
              type="button"
              key={dateStr}
              onClick={() => isAvailable && onDaySelect(dateStr)}
              disabled={!isAvailable}
              aria-label={`${dateStr}${hasSlots ? ', disponibil' : ''}`}
              className={[
                'aspect-square rounded-2xl text-sm transition-all flex items-center justify-center w-full border',
                !inMonth
                  ? 'bg-transparent border-transparent text-[#1d1d1f]/25 cursor-not-allowed'
                  : isSelected
                  ? 'bg-[#34c759] border-[#34c759] text-white font-semibold shadow-[0_4px_16px_rgba(52,199,89,0.4)] scale-105'
                  : isAvailable
                    ? 'bg-[#34c759]/10 border-[#34c759]/25 text-[#34c759] font-semibold cursor-pointer hover:bg-[#34c759]/20 hover:scale-105'
                    : isPast
                      ? isWeekend
                        ? 'bg-transparent border-transparent text-red-400/60 cursor-not-allowed'
                        : 'bg-transparent border-transparent text-[#1d1d1f]/50 cursor-not-allowed'
                      : isFutureOrToday
                        ? isWeekend
                          ? 'bg-white/25 border border-white/30 text-red-400/90 cursor-not-allowed'
                          : 'bg-white/25 border border-white/30 text-[#1d1d1f]/85 cursor-not-allowed'
                        : 'bg-transparent border-transparent text-[#1d1d1f]/50 cursor-not-allowed',
              ].join(' ')}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
