import { useAppointments } from '../../hooks/useAppointments'

function formatDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('ro-RO', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatTime(time: string) {
  return time.slice(0, 5)
}

export function AppointmentsTab() {
  const { appointments, loading, error, cancelAppointment } = useAppointments()

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = appointments.filter(
    (a) => a.status === 'confirmed' && a.available_slots && a.available_slots.date >= today
  )
  const past = appointments.filter(
    (a) => a.status === 'confirmed' && a.available_slots && a.available_slots.date < today
  )
  const cancelled = appointments.filter((a) => a.status === 'cancelled')

  if (error) return <p className="text-sm text-red-500 mb-4">Eroare: {error}</p>
  if (loading) return <p className="text-sm text-[#6e6e73] mb-4">Se încarcă programările...</p>

  return (
    <>
      <Section title={`Viitoare (${upcoming.length})`}>
        {upcoming.length === 0
          ? <p className="text-sm text-[#6e6e73] px-4 py-6 text-center">Nu există programări viitoare.</p>
          : <AppointmentTable items={upcoming} onCancel={cancelAppointment} showCancel />}
      </Section>

      <Section title={`Trecute (${past.length})`}>
        {past.length === 0
          ? <p className="text-sm text-[#6e6e73] px-4 py-6 text-center">Nu există programări trecute.</p>
          : <AppointmentTable items={past} onCancel={cancelAppointment} showCancel={false} />}
      </Section>

      {cancelled.length > 0 && (
        <Section title={`Anulate (${cancelled.length})`}>
          <AppointmentTable items={cancelled} onCancel={cancelAppointment} showCancel={false} />
        </Section>
      )}
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider mb-3 px-1">
        {title}
      </h2>
      <div className="glass rounded-2xl overflow-hidden">
        {children}
      </div>
    </section>
  )
}

interface TableProps {
  items: ReturnType<typeof useAppointments>['appointments']
  onCancel: (id: string, slotId: string) => void
  showCancel: boolean
}

function AppointmentTable({ items, onCancel, showCancel }: TableProps) {
  const cols = ['Dată', 'Oră', 'Nume', 'Telefon', 'Instagram', 'Serviciu', ...(showCancel ? [''] : [])]
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/50">
            {cols.map((h, i) => (
              <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-[#6e6e73] uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr key={a.id} className={`border-b border-white/30 last:border-0 hover:bg-white/20 transition-colors ${a.status === 'cancelled' ? 'opacity-40' : ''}`}>
              <td className="px-4 py-3 text-[#1d1d1f] whitespace-nowrap">
                {a.available_slots ? formatDate(a.available_slots.date) : '—'}
              </td>
              <td className="px-4 py-3 text-[#1d1d1f] whitespace-nowrap">
                {a.available_slots ? formatTime(a.available_slots.start_time) : '—'}
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
              {showCancel && (
                <td className="px-4 py-3">
                  <button
                    onClick={() => {
                      if (confirm(`Anulezi programarea pentru ${a.client_name}?`)) {
                        onCancel(a.id, a.slot_id)
                      }
                    }}
                    className="rounded-full px-3 py-1 text-xs text-red-500 cursor-pointer hover:bg-red-50/60 transition-all border border-red-200/50 bg-white/30 hover:scale-105"
                  >
                    Anulează
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
