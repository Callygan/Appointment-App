import { useState, useMemo, useRef } from 'react'
import { useAppointments } from '../../hooks/useAppointments'
import { useClickOutside } from '../../hooks/useClickOutside'
import { STATUS_COLOR, STATUS_LABELS } from '../../utils/statusColors'
import { Spinner } from '../../components/ui/Spinner'
import { EditAppointmentModal } from '../../components/ui/EditAppointmentModal'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import type { Appointment } from '../../types'

type View = 'month' | 'week' | 'day'

const DAYS_RO = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum']
const MONTHS_RO = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie']

function getDateStr(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function apptDate(a: Appointment): string {
  return a.available_slots?.date ?? a.appointment_date ?? ''
}

function apptTime(a: Appointment): string {
  return (a.available_slots?.start_time ?? a.appointment_time ?? '').slice(0, 5)
}

// Monday-first week array for a month
function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startDow = (first.getDay() + 6) % 7 // 0=Mon
  const grid: (Date | null)[] = Array(startDow).fill(null)
  for (let d = 1; d <= last.getDate(); d++) grid.push(new Date(year, month, d))
  while (grid.length % 7 !== 0) grid.push(null)
  return grid
}

// Week days Mon-Sun from a date
function getWeekDays(ref: Date): Date[] {
  const dow = (ref.getDay() + 6) % 7
  const mon = new Date(ref); mon.setDate(ref.getDate() - dow)
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d })
}

// Hours array 8..21
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8)
const ROW_H = 56 // px per hour

function apptDurationMins(a: Appointment): number {
  const end = (a.available_slots?.end_time ?? '').slice(0, 5)
  const start = apptTime(a)
  if (start && end && end > start) {
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    return (eh * 60 + em) - (sh * 60 + sm)
  }
  return a.services?.duration_minutes ?? 60
}

// Gray palette for appointments that already happened
const PAST_COLOR = { bg: 'bg-[#8e8e93]/15', text: 'text-[#6e6e73]', dot: 'bg-[#8e8e93]' }

// An appointment is "past" once its end time is before now
function isPastAppt(a: Appointment, now: Date = new Date()): boolean {
  const ds = apptDate(a)
  const t = apptTime(a)
  if (!ds || !t) return false
  const [sh, sm] = t.split(':').map(Number)
  const start = new Date(`${ds}T00:00:00`)
  start.setHours(sh, sm, 0, 0)
  const end = new Date(start.getTime() + apptDurationMins(a) * 60000)
  return end.getTime() < now.getTime()
}

// Gray for past appointments, status color otherwise
function apptColor(a: Appointment) {
  return isPastAppt(a) ? PAST_COLOR : STATUS_COLOR[a.status]
}


export function CalendarTab() {
  const { appointments, loading, updateAppointmentSchedule, cancelAppointment } = useAppointments()
  const [view, setView] = useState<View>('month')
  const [current, setCurrent] = useState(new Date())
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [editing, setEditing] = useState<Appointment | null>(null)
  const [pendingCancel, setPendingCancel] = useState<{ id: string; slotId: string; name: string } | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerNav, setPickerNav] = useState(new Date())
  const pickerRef = useRef<HTMLDivElement>(null)

  useClickOutside(pickerRef, () => setPickerOpen(false), pickerOpen)

  const todayStr = getDateStr(new Date())

  // ── navigation ──────────────────────────────────────────────
  function prev() {
    const d = new Date(current)
    if (view === 'month') d.setMonth(d.getMonth() - 1)
    else if (view === 'week') d.setDate(d.getDate() - 7)
    else d.setDate(d.getDate() - 1)
    setCurrent(d)
  }
  function next() {
    const d = new Date(current)
    if (view === 'month') d.setMonth(d.getMonth() + 1)
    else if (view === 'week') d.setDate(d.getDate() + 7)
    else d.setDate(d.getDate() + 1)
    setCurrent(d)
  }
  // ── index by date ────────────────────────────────────────────
  const byDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {}
    for (const a of appointments) {
      if (a.status === 'cancelled') continue
      const k = apptDate(a)
      if (k) { if (!map[k]) map[k] = []; map[k].push(a) }
    }
    // sort each day by time
    for (const k in map) map[k].sort((a, b) => apptTime(a).localeCompare(apptTime(b)))
    return map
  }, [appointments])

  // ── title ────────────────────────────────────────────────────
  const title = useMemo(() => {
    if (view === 'month') return `${MONTHS_RO[current.getMonth()]} ${current.getFullYear()}`
    if (view === 'week') {
      const days = getWeekDays(current)
      const s = days[0], e = days[6]
      if (s.getMonth() === e.getMonth()) return `${s.getDate()} – ${e.getDate()} ${MONTHS_RO[s.getMonth()]} ${s.getFullYear()}`
      return `${s.getDate()} ${MONTHS_RO[s.getMonth()]} – ${e.getDate()} ${MONTHS_RO[e.getMonth()]} ${e.getFullYear()}`
    }
    return current.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }, [view, current])

  // ── chip component ───────────────────────────────────────────
  function renderChip(a: Appointment, showTime?: boolean) {
    const c = apptColor(a)
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setSelected(a) }}
        className={`w-full text-left rounded-lg px-2 py-0.5 text-[11px] font-medium truncate border-none cursor-pointer transition-all hover:scale-[1.02] ${c.bg} ${c.text}`}
      >
        {showTime && <>{apptTime(a)} </>}{a.client_name}
      </button>
    )
  }

  // ── MONTH view ───────────────────────────────────────────────
  function renderMonthView() {
    const grid = buildMonthGrid(current.getFullYear(), current.getMonth())
    return (
      <div className="flex flex-col gap-0">
        {/* header */}
        <div className="grid grid-cols-7 border-b border-black/10">
          {DAYS_RO.map(d => (
            <div key={d} className="py-2 text-center text-[11px] font-semibold text-[#6e6e73] uppercase tracking-wide">{d}</div>
          ))}
        </div>
        {/* grid */}
        <div className="grid grid-cols-7">
          {grid.map((day, i) => {
            if (!day) return <div key={`e-${i}`} className="min-h-[110px] border-b border-r border-black/8 bg-black/[0.02]" />
            const ds = getDateStr(day)
            const isToday = ds === todayStr
            const isOtherMonth = day.getMonth() !== current.getMonth()
            const isWeekend = day.getDay() === 0 || day.getDay() === 6
            const appts = byDate[ds] ?? []
            return (
              <div
                key={ds}
                onClick={() => { setCurrent(day); setView('day') }}
                className={`min-h-[110px] border-b border-r border-black/8 p-1.5 flex flex-col gap-1 cursor-pointer hover:bg-black/[0.03] transition-colors ${isOtherMonth ? 'opacity-40' : ''}`}
              >
                <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full self-end ${isToday ? 'bg-[#f43f5e] text-white' : isWeekend ? 'text-[#f43f5e]' : 'text-[#1d1d1f]'}`}>
                  {day.getDate()}
                </span>
                <div className="flex flex-col gap-0.5">
                  {appts.slice(0, 3).map(a => <span key={a.id}>{renderChip(a, true)}</span>)}
                  {appts.length > 3 && (
                    <span className="text-[10px] text-[#6e6e73] px-1">+{appts.length - 3} mai mult</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── WEEK view ────────────────────────────────────────────────
  function renderWeekView() {
    const days = getWeekDays(current)
    const totalH = HOURS.length * ROW_H
    return (
      <div className="flex flex-col">
        {/* header */}
        <div className="grid border-b border-black/10" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
          <div />
          {days.map(d => {
            const ds = getDateStr(d)
            const isToday = ds === todayStr
            const isWeekend = d.getDay() === 0 || d.getDay() === 6
            return (
              <div key={ds} className="py-2 text-center">
                <span className="text-[10px] text-[#6e6e73] uppercase tracking-wide block">{DAYS_RO[(d.getDay() + 6) % 7]}</span>
                <button
                  onClick={() => { setCurrent(d); setView('day') }}
                  className={`text-sm font-semibold w-7 h-7 rounded-full mx-auto flex items-center justify-center border-none cursor-pointer transition-colors ${isToday ? 'bg-[#f43f5e] text-white' : isWeekend ? 'bg-transparent text-[#f43f5e] hover:bg-white/30' : 'bg-transparent text-[#1d1d1f] hover:bg-white/30'}`}
                >
                  {d.getDate()}
                </button>
              </div>
            )
          })}
        </div>
        {/* time grid */}
        <div className="overflow-y-auto max-h-[520px]">
          <div className="grid" style={{ gridTemplateColumns: '48px repeat(7, 1fr)', height: totalH }}>
            {/* time labels column */}
            <div className="relative">
              {HOURS.map((h, i) => (
                <div key={h} className="absolute w-full pr-2 text-right text-[10px] text-[#6e6e73] font-medium pt-1" style={{ top: i * ROW_H, height: ROW_H }}>
                  {String(h).padStart(2,'0')}:00
                </div>
              ))}
            </div>
            {/* day columns */}
            {days.map(d => {
              const ds = getDateStr(d)
              const appts = byDate[ds] ?? []
              return (
                <div key={ds} className="relative border-l border-black/8">
                  {/* hour lines */}
                  {HOURS.map((_, i) => (
                    <div key={i} className="absolute left-0 right-0 border-b border-black/8" style={{ top: i * ROW_H, height: ROW_H }} />
                  ))}
                  {/* appointments */}
                  {appts.map(a => {
                    const c = apptColor(a)
                    const [sh, sm] = apptTime(a).split(':').map(Number)
                    const top = ((sh - HOURS[0]) + sm / 60) * ROW_H
                    const height = Math.max((apptDurationMins(a) / 60) * ROW_H - 2, 22)
                    return (
                      <button
                        key={a.id}
                        onClick={(e) => { e.stopPropagation(); setSelected(a) }}
                        className={`absolute flex flex-col justify-center px-1.5 border-none cursor-pointer hover:brightness-95 rounded-md z-10 ${c.bg}`}
                        style={{ top: top + 1, height, left: 2, right: 2 }}
                      >
                        <span className={`text-[11px] font-medium truncate w-full ${c.text}`}>{a.client_name}</span>
                        {a.services?.name && height > 34 && <span className="text-[10px] text-[#6e6e73] truncate w-full">{a.services.name}</span>}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── DAY view ─────────────────────────────────────────────────
  function renderDayView() {
    const ds = getDateStr(current)
    const appts = byDate[ds] ?? []
    const totalH = HOURS.length * ROW_H
    return (
      <div className="overflow-y-auto max-h-[560px]">
        {appts.length === 0 && (
          <div className="flex items-center justify-center py-6 text-sm text-[#6e6e73]">Nicio programare în această zi.</div>
        )}
        <div className="flex" style={{ height: totalH }}>
          {/* time labels */}
          <div className="w-12 shrink-0 relative">
            {HOURS.map((h, i) => (
              <div key={h} className="absolute w-full pr-2 text-right text-[10px] text-[#6e6e73] font-medium pt-1" style={{ top: i * ROW_H, height: ROW_H }}>
                {String(h).padStart(2,'0')}:00
              </div>
            ))}
          </div>
          {/* day column */}
          <div className="flex-1 relative border-l border-black/8">
            {/* hour lines */}
            {HOURS.map((_, i) => (
              <div key={i} className="absolute left-0 right-0 border-b border-black/8" style={{ top: i * ROW_H, height: ROW_H }} />
            ))}
            {/* appointments */}
            {appts.map(a => {
              const c = apptColor(a)
              const [sh, sm] = apptTime(a).split(':').map(Number)
              const top = ((sh - HOURS[0]) + sm / 60) * ROW_H
              const height = Math.max((apptDurationMins(a) / 60) * ROW_H - 2, 32)
              return (
                <button
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className={`absolute text-left rounded-xl px-3 border-none cursor-pointer hover:brightness-95 z-10 flex flex-col justify-center ${c.bg}`}
                  style={{ top: top + 1, height, left: 4, right: 4 }}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-medium ${c.text}`}>{a.client_name}</p>
                    {a.services?.name && height > 44 && <span className="text-[10px] text-[#6e6e73] truncate">{a.services.name}</span>}
                  </div>
                  {a.client_phone && height > 54 && <p className="text-[11px] text-[#6e6e73]">{a.client_phone}</p>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* toolbar */}
      <div className="relative z-10 glass rounded-2xl px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
        {/* view switcher */}
        <div className="bg-white/30 rounded-xl p-1 lg:shrink-0">
          <div className="relative grid grid-cols-3">
            {/* sliding indicator */}
            <div
              className="absolute top-0 bottom-0 bg-white/80 rounded-lg shadow-sm transition-all duration-200 ease-in-out pointer-events-none"
              style={{
                width: '33.333%',
                left: `${(['month','week','day'] as View[]).indexOf(view) * 33.333}%`
              }}
            />
            {(['month','week','day'] as View[]).map((v, i) => {
              const labels = ['Lună','Săptămână','Zi']
              return (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`relative z-10 px-3 py-1.5 text-xs font-semibold rounded-lg border-none cursor-pointer transition-colors duration-200 whitespace-nowrap text-center ${view === v ? 'text-[#1d1d1f]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                >
                  {labels[i]}
                </button>
              )
            })}
          </div>
        </div>

        {/* nav + title */}
        <div className="flex items-center gap-1 justify-center lg:justify-end">
            <button onClick={prev} className="w-8 h-8 rounded-full glass flex items-center justify-center border-none cursor-pointer hover:bg-white/60 transition-colors text-[#1d1d1f]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>

            {/* period selector */}
            <div className="relative" ref={pickerRef}>
              <button
                onClick={() => { if (!pickerOpen) setPickerNav(new Date(current)); setPickerOpen(o => !o) }}
                className="glass rounded-xl px-3 h-8 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1d1d1f] capitalize whitespace-nowrap min-w-[160px] sm:min-w-[200px] border-none cursor-pointer hover:bg-white/40 transition-colors"
              >
                {title}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${pickerOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
              </button>

              {/* picker dropdown */}
              <div
                className="absolute top-[calc(100%+6px)] left-1/2 z-50 glass-heavy rounded-2xl shadow-2xl overflow-hidden"
                style={{
                  opacity: pickerOpen ? 1 : 0,
                  transform: pickerOpen ? 'translateX(-50%) translateY(0) scale(1)' : 'translateX(-50%) translateY(-6px) scale(0.97)',
                  pointerEvents: pickerOpen ? 'auto' : 'none',
                  transition: 'opacity 0.25s cubic-bezier(0.4,0,0.2,1), transform 0.25s cubic-bezier(0.4,0,0.2,1)',
                  transformOrigin: 'top center',
                }}
              >
                {/* ── Month picker ── */}
                {view === 'month' && (
                  <div className="p-5 w-72">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setPickerNav(d => { const n = new Date(d); n.setFullYear(n.getFullYear() - 1); return n })}
                        className="w-8 h-8 rounded-lg glass flex items-center justify-center border-none cursor-pointer hover:bg-white/40 transition-colors text-[#1d1d1f]"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                      </button>
                      <span className="text-sm font-semibold text-[#1d1d1f]">{pickerNav.getFullYear()}</span>
                      <button
                        onClick={() => setPickerNav(d => { const n = new Date(d); n.setFullYear(n.getFullYear() + 1); return n })}
                        className="w-8 h-8 rounded-lg glass flex items-center justify-center border-none cursor-pointer hover:bg-white/40 transition-colors text-[#1d1d1f]"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {MONTHS_RO.map((m, i) => {
                        const isActive = current.getFullYear() === pickerNav.getFullYear() && current.getMonth() === i
                        return (
                          <button
                            key={i}
                            onClick={() => { setCurrent(new Date(pickerNav.getFullYear(), i, 1)); setPickerOpen(false) }}
                            className={`py-3.5 text-sm rounded-xl border-none cursor-pointer font-medium transition-colors ${isActive ? 'bg-[#f43f5e] text-white' : 'text-[#1d1d1f] hover:bg-white/50'}`}
                          >
                            {m.slice(0, 3)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ── Week / Day picker (mini calendar) ── */}
                {(view === 'week' || view === 'day') && (() => {
                  // Build grid: only pad end to complete the last week
                  const y = pickerNav.getFullYear(), m = pickerNav.getMonth()
                  const first = new Date(y, m, 1)
                  const last = new Date(y, m + 1, 0)
                  const startDow = (first.getDay() + 6) % 7
                  const endDow = (last.getDay() + 6) % 7 // 0=Mon
                  const fullGrid: Date[] = []
                  for (let i = startDow - 1; i >= 0; i--) fullGrid.push(new Date(y, m, -i))
                  for (let d = 1; d <= last.getDate(); d++) fullGrid.push(new Date(y, m, d))
                  const trailing = endDow === 6 ? 0 : 6 - endDow
                  for (let d = 1; d <= trailing; d++) fullGrid.push(new Date(y, m + 1, d))

                  const currentWeekDays = view === 'week' ? getWeekDays(current).map(getDateStr) : []
                  const currentDayStr = view === 'day' ? getDateStr(current) : ''
                  return (
                    <div className="p-3 w-60">
                      <div className="flex items-center justify-between mb-2">
                        <button
                          onClick={() => setPickerNav(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n })}
                          className="w-7 h-7 rounded-lg glass flex items-center justify-center border-none cursor-pointer hover:bg-white/40 transition-colors text-[#1d1d1f]"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <span className="text-xs font-semibold text-[#1d1d1f]">{MONTHS_RO[pickerNav.getMonth()]} {pickerNav.getFullYear()}</span>
                        <button
                          onClick={() => setPickerNav(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n })}
                          className="w-7 h-7 rounded-lg glass flex items-center justify-center border-none cursor-pointer hover:bg-white/40 transition-colors text-[#1d1d1f]"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-7 mb-1">
                        {DAYS_RO.map(d => <div key={d} className="text-center text-[9px] text-[#6e6e73] font-semibold uppercase">{d[0]}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-y-0.5">
                        {fullGrid.map((day, i) => {
                          const ds = getDateStr(day)
                          const isCurrentMonth = day.getMonth() === m
                          const isToday = ds === todayStr
                          const isSelected = view === 'day' ? ds === currentDayStr : currentWeekDays.includes(ds)
                          return (
                            <button
                              key={`${ds}-${i}`}
                              onClick={() => { setCurrent(day); setPickerOpen(false) }}
                              className={`w-7 h-7 mx-auto flex items-center justify-center text-[11px] rounded-full border-none cursor-pointer font-medium transition-colors ${
                                isSelected
                                  ? 'bg-[#f43f5e] text-white'
                                  : isToday
                                    ? 'ring-1 ring-[#f43f5e] text-[#f43f5e] hover:bg-white/40'
                                    : isCurrentMonth
                                      ? 'text-[#1d1d1f] hover:bg-white/50'
                                      : 'text-[#b0b0b8] hover:bg-white/30'
                              }`}
                            >
                              {day.getDate()}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            <button onClick={next} className="w-8 h-8 rounded-full glass flex items-center justify-center border-none cursor-pointer hover:bg-white/60 transition-colors text-[#1d1d1f]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
        </div>
      </div>

      {/* calendar body */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <>
            {view === 'month' && renderMonthView()}
            {view === 'week' && renderWeekView()}
            {view === 'day' && renderDayView()}
          </>
        )}
      </div>

      {/* detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative glass-heavy rounded-3xl p-6 w-full max-w-sm mx-4 shadow-2xl"
            style={{ animation: 'slideDown 0.3s cubic-bezier(0.4,0,0.2,1)' }}
            onClick={e => e.stopPropagation()}
          >
            {!isPastAppt(selected) && (
              <button onClick={() => { setEditing(selected); setSelected(null) }} className="absolute top-4 right-20 w-7 h-7 rounded-full bg-black/8 flex items-center justify-center border-none cursor-pointer text-[#6e6e73] hover:text-[#34c759] hover:bg-black/15 transition-colors" aria-label="Editează data și ora" title="Editează data și ora">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z"/></svg>
              </button>
            )}
            {!isPastAppt(selected) && (
              <button onClick={() => { setPendingCancel({ id: selected.id, slotId: selected.slot_id ?? '', name: selected.client_name }); setSelected(null) }} className="absolute top-4 right-12 w-7 h-7 rounded-full bg-black/8 flex items-center justify-center border-none cursor-pointer text-[#6e6e73] hover:text-red-500 hover:bg-black/15 transition-colors" aria-label="Anulează programarea" title="Anulează programarea">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            )}
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/8 flex items-center justify-center border-none cursor-pointer text-[#6e6e73] hover:bg-black/15 transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            {/* status banner */}
            {(() => {
              const c = apptColor(selected)
              const labels = STATUS_LABELS
              return (
                <div className={`flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full w-fit ${c.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${selected.status === 'pending' ? 'animate-pulse' : ''}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wide ${c.text}`}>{labels[selected.status]}</span>
                </div>
              )
            })()}

            <div className="flex flex-col gap-3">
              {[
                { label: 'Nr. programare', value: `#${selected.booking_number}` },
                { label: 'Nume', value: selected.client_name },
              ].map(({ label, value }, i, arr) => (
                <div key={label}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">{label}</span>
                    <span className="text-sm text-[#1d1d1f] font-medium">{value}</span>
                  </div>
                  {i < arr.length - 1 && <div className="h-px bg-white/40 mt-3" />}
                </div>
              ))}

              {selected.client_phone && (
                <div>
                  <div className="h-px bg-white/40 mb-3" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">Telefon</span>
                    <a
                      href={`tel:${selected.client_phone}`}
                      className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
                    >
                      {selected.client_phone}
                    </a>
                  </div>
                </div>
              )}

              {selected.client_instagram && (
                <div>
                  <div className="h-px bg-white/40 mb-3" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">Instagram</span>
                    <a
                      href={`https://instagram.com/${selected.client_instagram.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
                    >
                      @{selected.client_instagram.replace(/^@/, '')}
                    </a>
                  </div>
                </div>
              )}

              {[
                { label: 'Dată', value: apptDate(selected) ? new Date(apptDate(selected) + 'T00:00:00').toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' }) : '—' },
                { label: 'Oră', value: apptTime(selected) || '—' },
                ...(selected.services ? [{ label: 'Serviciu', value: selected.services.name }] : []),
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="h-px bg-white/40 mb-3" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">{label}</span>
                    <span className="text-sm text-[#1d1d1f] font-medium">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editing && (
        <EditAppointmentModal
          appointment={editing}
          onDismiss={() => setEditing(null)}
          onSave={async (slotId) => {
            const err = await updateAppointmentSchedule(editing.id, slotId)
            if (!err) setSelected(null)
            return err
          }}
        />
      )}

      {pendingCancel && (
        <ConfirmModal
          title="Anulezi programarea?"
          description={<>Programarea lui <strong className="text-[#1d1d1f]">{pendingCancel.name}</strong> va fi anulată definitiv și intervalul orar va fi eliberat.</>}
          confirmLabel="Da, anulează"
          cancelLabel="Înapoi"
          onConfirm={() => { cancelAppointment(pendingCancel.id, pendingCancel.slotId); setPendingCancel(null) }}
          onDismiss={() => setPendingCancel(null)}
        />
      )}
    </div>
  )
}
