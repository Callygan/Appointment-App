import { useState, useEffect } from 'react'
import { useAppointments } from '../../hooks/useAppointments'
import { getDateStr, formatDate, formatTime, addMinutesToTime } from '../../utils/dateUtils'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { EditAppointmentModal } from '../../components/ui/EditAppointmentModal'

export function AppointmentsTab() {
  const { appointments, loading, error, confirmAppointment, cancelAppointment, updateAppointmentSchedule } = useAppointments()
  const [pendingCancel, setPendingCancel] = useState<{ id: string; slotId: string; name: string } | null>(null)
  const [editing, setEditing] = useState<(typeof appointments)[number] | null>(null)
  const [search, setSearch] = useState('')

  const today = getDateStr(new Date())
  const effectiveDate = (a: typeof appointments[0]) => a.available_slots?.date ?? a.appointment_date ?? null
  // Real end time: prefer the slot's end_time; otherwise derive it from the start
  // time plus the service duration; fall back to the start time if neither exists.
  const effectiveEndTime = (a: typeof appointments[0]) => {
    if (a.available_slots?.end_time) return a.available_slots.end_time
    const start = a.available_slots?.start_time ?? a.appointment_time ?? null
    if (!start) return null
    return a.services?.duration_minutes
      ? addMinutesToTime(start, a.services.duration_minutes)
      : start
  }

  function isAppointmentPast(a: typeof appointments[0]): boolean {
    const d = effectiveDate(a)
    if (!d) return false
    if (d < today) return true
    if (d === today) {
      const end = effectiveEndTime(a)
      if (!end) return false
      const now = new Date()
      const [h, m] = end.split(':').map(Number)
      return now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m)
    }
    return false
  }

  function matchesSearch(a: typeof appointments[0]) {
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    return (
      a.client_name.toLowerCase().includes(q) ||
      String(a.booking_number).includes(q)
    )
  }

  const effectiveStartTime = (a: typeof appointments[0]) =>
    a.available_slots?.start_time ?? a.appointment_time ?? ''

  // Sort by appointment date + start time, ascending (nearest first).
  const byDateTimeAsc = (a: typeof appointments[0], b: typeof appointments[0]) => {
    const ka = `${effectiveDate(a) ?? ''} ${effectiveStartTime(a)}`
    const kb = `${effectiveDate(b) ?? ''} ${effectiveStartTime(b)}`
    return ka < kb ? -1 : ka > kb ? 1 : 0
  }

  const pending = appointments
    .filter((a) => a.status === 'pending' && matchesSearch(a))
    .sort(byDateTimeAsc)
  const upcoming = appointments
    .filter((a) => {
      const d = effectiveDate(a)
      return a.status === 'confirmed' && d !== null && !isAppointmentPast(a) && matchesSearch(a)
    })
    .sort(byDateTimeAsc)
  const past = appointments
    .filter((a) => {
      const d = effectiveDate(a)
      return a.status === 'confirmed' && d !== null && isAppointmentPast(a) && matchesSearch(a)
    })
    .sort((a, b) => -byDateTimeAsc(a, b))
  const cancelled = appointments
    .filter((a) => a.status === 'cancelled' && matchesSearch(a))
    .sort((a, b) => -byDateTimeAsc(a, b))

  if (error) return <p className="text-sm text-red-500 mb-4">Eroare: {error}</p>
  if (loading) return <p className="text-sm text-[#6e6e73] mb-4">Se încarcă programările...</p>

  return (
    <>
      {/* Search */}
      <div className="flex justify-center mb-3">
        <div className="glass rounded-2xl px-4 py-2.5 flex items-center gap-3 w-full max-w-sm">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#6e6e73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <circle cx="6.5" cy="6.5" r="5" />
          <path d="M10 10l3.5 3.5" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Caută după nume sau număr programare..."
          className="flex-1 bg-transparent border-none outline-none text-sm text-[#1d1d1f] placeholder:text-[#6e6e73]/60"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-[#6e6e73] hover:text-[#1d1d1f] bg-transparent border-none cursor-pointer p-0 leading-none">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          </button>
        )}
        </div>
      </div>
      {pending.length > 0 && (
        <Section title={`În așteptare (${pending.length})`} color="warning">
          <AppointmentTable items={pending} onRequestCancel={setPendingCancel} onConfirm={confirmAppointment} onEdit={setEditing} showCancel showConfirm showEdit />
        </Section>
      )}

      <Section title={`Viitoare (${upcoming.length})`} color="success" action={
        upcoming.length > 0 ? <ExportButton items={upcoming} label="viitoare" /> : undefined
      }>
        {upcoming.length === 0
          ? <p className="text-sm text-[#6e6e73] px-4 py-6 text-center">Nu există programări viitoare.</p>
          : <AppointmentTable items={upcoming} onRequestCancel={setPendingCancel} onEdit={setEditing} showCancel showEdit />}
      </Section>

      <Section title={`Trecute (${past.length})`} color="info" action={
        past.length > 0 ? <ExportButton items={past} label="trecute" /> : undefined
      }>
        {past.length === 0
          ? <p className="text-sm text-[#6e6e73] px-4 py-6 text-center">Nu există programări trecute.</p>
          : <AppointmentTable items={past} onRequestCancel={setPendingCancel} onEdit={setEditing} showCancel={false} showEdit={false} />}
      </Section>

      <Section title={`Anulate (${cancelled.length})`} color="danger" action={
        cancelled.length > 0 ? <ExportButton items={cancelled} label="anulate" /> : undefined
      }>
        {cancelled.length === 0
          ? <p className="text-sm text-[#6e6e73] px-4 py-6 text-center">Nu există programări anulate.</p>
          : <AppointmentTable items={cancelled} onRequestCancel={setPendingCancel} onEdit={setEditing} showCancel={false} showEdit={false} />}
      </Section>

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

      {editing && (
        <EditAppointmentModal
          appointment={editing}
          onDismiss={() => setEditing(null)}
          onSave={(slotId) => updateAppointmentSchedule(editing.id, slotId)}
        />
      )}
    </>
  )
}

const SECTION_COLORS = {
  warning: { title: 'text-[#f59e0b]', ring: 'ring-1 ring-[#f59e0b]/30' },
  success: { title: 'text-[#34c759]', ring: 'ring-1 ring-[#34c759]/30' },
  info:    { title: 'text-[#5e5ce6]', ring: 'ring-1 ring-[#5e5ce6]/30' },
  danger:  { title: 'text-red-400',   ring: 'ring-1 ring-red-300/40' },
}

function Section({ title, children, color, action }: { title: string; children: React.ReactNode; color?: keyof typeof SECTION_COLORS; action?: React.ReactNode }) {
  const c = color ? SECTION_COLORS[color] : null
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className={`text-xs font-semibold uppercase tracking-wider ${c ? c.title : 'text-[#6e6e73]'}`}>
          {title}
        </h2>
        {action}
      </div>
      <div className={`glass rounded-2xl overflow-hidden ${c ? c.ring : ''}`}>
        {children}
      </div>
    </section>
  )
}

interface TableProps {
  items: ReturnType<typeof useAppointments>['appointments']
  onRequestCancel: (info: { id: string; slotId: string; name: string }) => void
  onEdit: (appointment: ReturnType<typeof useAppointments>['appointments'][number]) => void
  onConfirm?: (id: string) => void
  showCancel: boolean
  showConfirm?: boolean
  showEdit?: boolean
}

type SortKey = 'booking_number' | 'date' | 'time' | 'client_name' | 'service'
type SortDir = 'asc' | 'desc'

function AppointmentTable({ items, onRequestCancel, onEdit, onConfirm, showCancel, showConfirm, showEdit = true }: TableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function getVal(a: typeof items[0], key: SortKey): string {
    switch (key) {
      case 'booking_number': return String(a.booking_number).padStart(10, '0')
      case 'date': return a.available_slots?.date ?? a.appointment_date ?? ''
      case 'time': return a.available_slots?.start_time ?? a.appointment_time ?? ''
      case 'client_name': return a.client_name.toLowerCase()
      case 'service': return (a.services?.name ?? '').toLowerCase()
    }
  }

  const sorted = [...items].sort((a, b) => {
    const cmp = getVal(a, sortKey).localeCompare(getVal(b, sortKey))
    return sortDir === 'asc' ? cmp : -cmp
  })

  const hasActions = showEdit || showCancel || showConfirm

  const COLS: { label: string; key?: SortKey }[] = [
    { label: 'Nume', key: 'client_name' },
    { label: 'Dată', key: 'date' },
    { label: 'Oră', key: 'time' },
    { label: 'Serviciu', key: 'service' },
    { label: 'Telefon' },
    { label: 'Instagram' },
    { label: 'Nr.', key: 'booking_number' },
    ...(hasActions ? [{ label: '' }] : []),
  ]

  function SortIcon({ col }: { col: typeof COLS[0] }) {
    if (!col.key) return null
    const active = sortKey === col.key
    return (
      <span className={`ml-1 inline-flex flex-col gap-[1px] ${active ? 'opacity-100' : 'opacity-30'}`}>
        <svg width="7" height="5" viewBox="0 0 7 5" fill="currentColor" className={sortDir === 'asc' && active ? 'text-[#1d1d1f]' : 'text-[#6e6e73]'}>
          <path d="M3.5 0L7 5H0L3.5 0Z" />
        </svg>
        <svg width="7" height="5" viewBox="0 0 7 5" fill="currentColor" className={sortDir === 'desc' && active ? 'text-[#1d1d1f]' : 'text-[#6e6e73]'}>
          <path d="M3.5 5L0 0H7L3.5 5Z" />
        </svg>
      </span>
    )
  }

  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[520px]">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-white/60 backdrop-blur-sm">
          <tr className="border-b border-white/50">
            {COLS.map((col, i) => (
              <th
                key={i}
                onClick={() => col.key && handleSort(col.key)}
                className={`text-left px-4 py-3 text-xs font-semibold text-[#6e6e73] uppercase tracking-wide whitespace-nowrap select-none ${col.key ? 'cursor-pointer hover:text-[#1d1d1f]' : ''}`}
              >
                <span className="inline-flex items-center">
                  {col.label}
                  <SortIcon col={col} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((a) => (
            <tr key={a.id} className={`border-b border-white/30 last:border-0 even:bg-black/[0.025] hover:bg-white/20 transition-colors ${a.status === 'cancelled' ? 'opacity-40' : ''}`}>
              <td className="px-4 py-3 text-[#1d1d1f]">{a.client_name}</td>
              <td className="px-4 py-3 text-[#1d1d1f] whitespace-nowrap">
                {a.available_slots ? formatDate(a.available_slots.date) : a.appointment_date ? formatDate(a.appointment_date) : '—'}
              </td>
              <td className="px-4 py-3 text-[#1d1d1f] whitespace-nowrap">
                {a.available_slots ? formatTime(a.available_slots.start_time) : a.appointment_time ? formatTime(a.appointment_time) : '—'}
              </td>
              <td className="px-4 py-3 text-[#1d1d1f]">{a.services?.name ?? <span className="text-[#6e6e73]/40">—</span>}</td>
              <td className="px-4 py-3">
                <a href={`tel:${a.client_phone}`} className="text-[#34c759] no-underline hover:underline">{a.client_phone}</a>
              </td>
              <td className="px-4 py-3">
                {a.client_instagram
                  ? <a href={`https://instagram.com/${a.client_instagram}`} target="_blank" rel="noreferrer" className="text-[#34c759] no-underline hover:underline">@{a.client_instagram}</a>
                  : <span className="text-[#6e6e73]/40">—</span>}
              </td>
              <td className="px-4 py-3 text-xs font-semibold text-center text-[#6e6e73] w-8 tabular-nums">#{a.booking_number}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  {showEdit && (
                    <button
                      onClick={() => onEdit(a)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6e6e73] hover:text-[#34c759] hover:bg-white/50 bg-transparent border-none cursor-pointer transition-all"
                      aria-label="Editează data și ora"
                      title="Editează data și ora"
                    >
                      <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" />
                      </svg>
                    </button>
                  )}
                  {showConfirm && (
                    <button
                      onClick={() => onConfirm?.(a.id)}
                      className="rounded-full px-3 py-1 text-xs text-[#34c759] cursor-pointer hover:bg-[#34c759]/10 transition-all border border-[#34c759]/40 bg-white/30 hover:scale-105"
                    >
                      Confirmă
                    </button>
                  )}
                  {showCancel && (
                    <button
                      onClick={() => onRequestCancel({ id: a.id, slotId: a.slot_id, name: a.client_name })}
                      className="rounded-full px-3 py-1 text-xs text-white bg-red-500 hover:bg-red-600 cursor-pointer transition-all border-none shadow-[0_2px_8px_rgba(239,68,68,0.3)] hover:scale-105"
                    >
                      Anulează
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ExportButton({ items, label = 'trecute' }: { items: ReturnType<typeof useAppointments>['appointments']; label?: string }) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [exportAll, setExportAll] = useState(true)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  const effDate = (a: (typeof items)[number]) => a.available_slots?.date ?? a.appointment_date ?? ''

  useEffect(() => {
    if (!open) return
    // Default the range to the span of available appointments
    const dates = items.map(effDate).filter(Boolean).sort((a, b) => a.localeCompare(b))
    if (dates.length) {
      setStart(dates[0])
      setEnd(dates[dates.length - 1])
    }
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function dismiss() {
    setVisible(false)
    setTimeout(() => setOpen(false), 250)
  }

  function inRange(a: (typeof items)[number]): boolean {
    const d = effDate(a)
    if (!d) return false
    if (start && d < start) return false
    if (end && d > end) return false
    return true
  }

  const selected = exportAll ? items : items.filter(inRange)

  async function handleExport() {
    const XLSX = await import('xlsx')
    const headers = ['Nr. programare', 'Data', 'Serviciu', 'Client', 'Telefon', 'Pret (RON)']

    function toRoDate(iso: string): string {
      const [y, m, d] = iso.split('-')
      return `${d}.${m}.${y}`
    }

    const rows = [...selected]
      .sort((a, b) => effDate(a).localeCompare(effDate(b)))
      .map(a => {
        const date = effDate(a)
        return [
          a.booking_number,
          date ? toRoDate(date) : '',
          a.services?.name ?? '',
          a.client_name,
          a.client_phone,
          a.services?.price != null ? a.services.price : '',
        ]
      })

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    ws['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 28 }, { wch: 24 }, { wch: 16 }, { wch: 12 }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Programari ${label}`)
    const suffix = exportAll ? 'toate' : `${start}_${end}`
    XLSX.writeFile(wb, `programari_${label}_${suffix}.xlsx`)
    dismiss()
  }

  const inputCls = 'bg-white/50 backdrop-blur-sm border border-white/60 focus:border-[#5e5ce6] focus:bg-white/85 rounded-2xl px-4 py-2.5 text-sm text-[#1d1d1f] outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] cursor-pointer'

  function openPicker(e: React.MouseEvent<HTMLLabelElement>) {
    const input = e.currentTarget.querySelector('input')
    try { input?.showPicker?.() } catch { /* picker already open */ }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Exportă în Excel"
        className="flex items-center gap-1.5 text-xs text-[#5e5ce6] hover:text-[#3634a3] glass rounded-full px-3 py-1.5 border-none cursor-pointer transition-all hover:scale-105"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Export
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none" onClick={dismiss}>
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto"
            style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.25s ease' }}
          />
          <div
            className="relative glass-heavy rounded-3xl p-7 w-full max-w-sm mx-4 pointer-events-auto"
            style={{
              transform: visible ? 'translateY(0) scale(1)' : 'translateY(-40px) scale(0.97)',
              opacity: visible ? 1 : 0,
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl border bg-[#5e5ce6]/10 border-[#5e5ce6]/30 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5e5ce6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[#1d1d1f] text-center tracking-tight mb-1">Exportă programări</h2>
            <p className="text-sm text-[#6e6e73] text-center mb-5">Alege un interval sau exportă toate programările trecute.</p>

            {/* mode switcher */}
            <div className="bg-white/30 rounded-xl p-1 mb-4">
              <div className="relative grid grid-cols-2">
                {/* sliding indicator */}
                <div
                  className="absolute top-0 bottom-0 bg-white/80 rounded-lg shadow-sm pointer-events-none"
                  style={{
                    width: '50%',
                    left: exportAll ? '50%' : '0%',
                    transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
                  }}
                />
                <button
                  onClick={() => setExportAll(false)}
                  className={`relative z-10 py-2 text-xs font-semibold rounded-lg border-none cursor-pointer transition-colors duration-200 ${!exportAll ? 'text-[#1d1d1f]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                >
                  Interval
                </button>
                <button
                  onClick={() => setExportAll(true)}
                  className={`relative z-10 py-2 text-xs font-semibold rounded-lg border-none cursor-pointer transition-colors duration-200 ${exportAll ? 'text-[#1d1d1f]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                >
                  Toate
                </button>
              </div>
            </div>

            {/* date range (animated expand / collapse) */}
            <div
              className="overflow-hidden"
              style={{
                maxHeight: exportAll ? 0 : 220,
                opacity: exportAll ? 0 : 1,
                marginBottom: exportAll ? 0 : 16,
                transform: exportAll ? 'translateY(-8px)' : 'translateY(0)',
                transition: 'max-height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease, transform 0.32s cubic-bezier(0.4,0,0.2,1), margin-bottom 0.32s cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5 cursor-pointer" onClick={openPicker}>
                  <span className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">De la</span>
                  <input type="date" value={start} max={end || undefined} onChange={(e) => setStart(e.target.value)} className={inputCls} />
                </label>
                <label className="flex flex-col gap-1.5 cursor-pointer" onClick={openPicker}>
                  <span className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">Până la</span>
                  <input type="date" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} className={inputCls} />
                </label>
              </div>
            </div>

            {/* count */}
            <div className="text-sm text-[#6e6e73] text-center mb-5">
              <strong className="text-[#1d1d1f]">{selected.length}</strong> {selected.length === 1 ? 'programare' : 'programări'} de exportat
            </div>

            {/* actions */}
            <div className="flex gap-3">
              <button
                onClick={dismiss}
                className="flex-1 rounded-full px-4 py-2.5 text-sm font-medium text-[#6e6e73] glass cursor-pointer border-none hover:scale-105 active:scale-95 transition-all"
              >
                Anulează
              </button>
              <button
                onClick={handleExport}
                disabled={selected.length === 0}
                className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-white border-none cursor-pointer transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 bg-[#5e5ce6] hover:bg-[#4b48d6] shadow-[0_4px_16px_rgba(94,92,230,0.35)]"
              >
                Exportă
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
