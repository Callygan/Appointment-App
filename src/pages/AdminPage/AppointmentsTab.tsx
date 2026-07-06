import { useState } from 'react'
import { useAppointments } from '../../hooks/useAppointments'
import { getDateStr, formatDate, formatTime } from '../../utils/dateUtils'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { EditAppointmentModal } from '../../components/ui/EditAppointmentModal'

export function AppointmentsTab() {
  const { appointments, loading, error, confirmAppointment, cancelAppointment, updateAppointmentSchedule } = useAppointments()
  const [pendingCancel, setPendingCancel] = useState<{ id: string; slotId: string; name: string } | null>(null)
  const [editing, setEditing] = useState<(typeof appointments)[number] | null>(null)
  const [search, setSearch] = useState('')

  const today = getDateStr(new Date())
  const effectiveDate = (a: typeof appointments[0]) => a.available_slots?.date ?? a.appointment_date ?? null
  const effectiveEndTime = (a: typeof appointments[0]) => a.available_slots?.end_time ?? a.appointment_time ?? null

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

  const pending = appointments.filter((a) => a.status === 'pending' && matchesSearch(a))
  const upcoming = appointments.filter((a) => {
    const d = effectiveDate(a)
    return a.status === 'confirmed' && d !== null && !isAppointmentPast(a) && matchesSearch(a)
  })
  const past = appointments.filter((a) => {
    const d = effectiveDate(a)
    return a.status === 'confirmed' && d !== null && isAppointmentPast(a) && matchesSearch(a)
  })
  const cancelled = appointments.filter((a) => a.status === 'cancelled' && matchesSearch(a))

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
          <AppointmentTable items={pending} onRequestCancel={setPendingCancel} onConfirm={confirmAppointment} onEdit={setEditing} showCancel showConfirm />
        </Section>
      )}

      <Section title={`Viitoare (${upcoming.length})`} color="success">
        {upcoming.length === 0
          ? <p className="text-sm text-[#6e6e73] px-4 py-6 text-center">Nu există programări viitoare.</p>
          : <AppointmentTable items={upcoming} onRequestCancel={setPendingCancel} onEdit={setEditing} showCancel />}
      </Section>

      <Section title={`Trecute (${past.length})`} color="info" action={
        past.length > 0 ? <ExportButton items={past} /> : undefined
      }>
        {past.length === 0
          ? <p className="text-sm text-[#6e6e73] px-4 py-6 text-center">Nu există programări trecute.</p>
          : <AppointmentTable items={past} onRequestCancel={setPendingCancel} onEdit={setEditing} showCancel={false} />}
      </Section>

      <Section title={`Anulate (${cancelled.length})`} color="danger">
        {cancelled.length === 0
          ? <p className="text-sm text-[#6e6e73] px-4 py-6 text-center">Nu există programări anulate.</p>
          : <AppointmentTable items={cancelled} onRequestCancel={setPendingCancel} onEdit={setEditing} showCancel={false} />}
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
}

type SortKey = 'booking_number' | 'date' | 'time' | 'client_name' | 'service'
type SortDir = 'asc' | 'desc'

function AppointmentTable({ items, onRequestCancel, onEdit, onConfirm, showCancel, showConfirm }: TableProps) {
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

  const hasActions = true

  const COLS: { label: string; key?: SortKey }[] = [
    { label: 'Nr.', key: 'booking_number' },
    { label: 'Dată', key: 'date' },
    { label: 'Oră', key: 'time' },
    { label: 'Nume', key: 'client_name' },
    { label: 'Telefon' },
    { label: 'Instagram' },
    { label: 'Serviciu', key: 'service' },
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
            <tr key={a.id} className={`border-b border-white/30 last:border-0 hover:bg-white/20 transition-colors ${a.status === 'cancelled' ? 'opacity-40' : ''}`}>
              <td className="px-4 py-3 text-xs font-semibold text-center text-[#6e6e73] w-8 tabular-nums">#{a.booking_number}</td>
              <td className="px-4 py-3 text-[#1d1d1f] whitespace-nowrap">
                {a.available_slots ? formatDate(a.available_slots.date) : a.appointment_date ? formatDate(a.appointment_date) : '—'}
              </td>
              <td className="px-4 py-3 text-[#1d1d1f] whitespace-nowrap">
                {a.available_slots ? formatTime(a.available_slots.start_time) : a.appointment_time ? formatTime(a.appointment_time) : '—'}
              </td>
              <td className="px-4 py-3 text-[#1d1d1f]">{a.client_name}</td>
              <td className="px-4 py-3">
                <a href={`tel:${a.client_phone}`} className="text-[#34c759] no-underline hover:underline">{a.client_phone}</a>
              </td>
              <td className="px-4 py-3">
                {a.client_instagram
                  ? <a href={`https://instagram.com/${a.client_instagram}`} target="_blank" rel="noreferrer" className="text-[#34c759] no-underline hover:underline">@{a.client_instagram}</a>
                  : <span className="text-[#6e6e73]/40">—</span>}
              </td>
              <td className="px-4 py-3 text-[#1d1d1f]">{a.services?.name ?? <span className="text-[#6e6e73]/40">—</span>}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
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

function ExportButton({ items }: { items: ReturnType<typeof useAppointments>['appointments'] }) {
  function handleExport() {
    const BOM = '\uFEFF'
    const headers = ['Nr. programare', 'Data', 'Serviciu', 'Client', 'Telefon', 'Pret (RON)']

    function toRoDate(iso: string): string {
      const [y, m, d] = iso.split('-')
      return `${d}.${m}.${y}`
    }

    const rows = [...items]
      .sort((a, b) => {
        const da = a.available_slots?.date ?? a.appointment_date ?? ''
        const db = b.available_slots?.date ?? b.appointment_date ?? ''
        return da.localeCompare(db)
      })
      .map(a => {
        const date = a.available_slots?.date ?? a.appointment_date ?? ''
        return [
          `#${a.booking_number}`,
          date ? toRoDate(date) : '',
          a.services?.name ?? '',
          a.client_name,
          a.client_phone,
          a.services?.price != null ? String(a.services.price) : '',
        ]
      })

    const csv = BOM + [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `programari_trecute_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
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
  )
}
