import { googleCalendarUrl, downloadICS, type CalendarEvent } from '../../utils/calendarExport'

interface Props {
  event: CalendarEvent
  /** Filename for the downloaded .ics file. */
  icsFilename?: string
}

const btnCls =
  'flex-1 flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold border border-black/10 bg-white hover:bg-white/90 text-[#1d1d1f] cursor-pointer transition-all hover:scale-[1.01] active:scale-95 no-underline shadow-[0_2px_8px_rgba(0,0,0,0.08)]'

export function AddToCalendar({ event, icsFilename }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <p className="hidden lg:block text-xs font-semibold text-[#6e6e73] uppercase tracking-wide text-center">Adaugă în calendar</p>

      {/* Google (works everywhere, incl. in-app browsers) + Apple/download (.ics) */}
      <div className="flex gap-2">
        <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer" className={btnCls}>
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/>
            <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"/>
          </svg>
          Google
        </a>
        <button type="button" onClick={() => downloadICS(event, icsFilename)} className={btnCls}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Apple
        </button>
      </div>
    </div>
  )
}
