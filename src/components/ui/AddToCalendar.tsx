import { googleCalendarUrl, downloadICS, type CalendarEvent } from '../../utils/calendarExport'

interface Props {
  event: CalendarEvent
  /** Filename for the downloaded .ics file. */
  icsFilename?: string
}

const btnCls =
  'flex-1 flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold border border-white/60 bg-white/50 hover:bg-white/80 text-[#1d1d1f] cursor-pointer transition-all hover:scale-[1.01] active:scale-95 no-underline'

export function AddToCalendar({ event, icsFilename }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide text-center">Adaugă în calendar</p>
      <div className="flex gap-2">
        <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer" className={btnCls}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Google
        </a>
        <button type="button" onClick={() => downloadICS(event, icsFilename)} className={btnCls}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a4 4 0 0 0-4 4c0 1.5.5 2.5 1.5 3.5" /><path d="M12 22c4-3 7-7 7-11a7 7 0 0 0-14 0c0 4 3 8 7 11z" opacity="0" />
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Apple / iOS
        </button>
      </div>
    </div>
  )
}
