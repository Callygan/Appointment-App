import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList,
} from 'recharts'
import { useStatistics } from '../../hooks/useStatistics'
import { getDateStr } from '../../utils/dateUtils'
import { Spinner } from '../../components/ui/Spinner'

// ── helpers ─────────────────────────────────────────────────────────────────

const toIso = getDateStr

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

function inputToDisplay(iso: string) {
  if (!iso) return ''
  const [y, m, day] = iso.split('-')
  return `${day}.${m}.${y}`
}

// ── sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, growth }: { label: string; value: string | number; sub?: string; growth?: number | null }) {
  return (
    <div className="glass rounded-2xl px-5 py-4 flex flex-col gap-1 min-w-0">
      <div className="flex items-start justify-between gap-1">
        <span className="text-xs font-medium text-[#6e6e73] uppercase tracking-wider">{label}</span>
        {growth != null && (
          <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            growth > 0 ? 'bg-[#34c759]/15 text-[#1a6b2e]' : growth < 0 ? 'bg-red-100 text-red-600' : 'bg-black/[0.06] text-[#6e6e73]'
          }`}>
            {growth > 0 ? '+' : ''}{growth}%
          </span>
        )}
      </div>
      <span className="text-2xl font-semibold text-[#1d1d1f] leading-none">{value}</span>
      {sub && <span className="text-xs text-[#6e6e73]">{sub}</span>}
    </div>
  )
}

interface ChartCardProps {
  title: string
  children: React.ReactNode
}
function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-3 min-w-0">
      <span className="text-sm font-semibold text-[#1d1d1f]">{title}</span>
      {children}
    </div>
  )
}

const CHART_COLOR = '#34c759'
const CHART_COLOR2 = '#5e5ce6'

const tooltipStyle = {
  backgroundColor: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: '10px',
  fontSize: '12px',
  color: '#1d1d1f',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
}

// ── main component ───────────────────────────────────────────────────────────

type QuickRange = 'current' | 'last' | '3m' | '1y'

export function StatisticsTab() {
  const today = useMemo(() => new Date(), [])

  const [quick, setQuick] = useState<QuickRange>('current')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  // Compute effective date range
  const { from, to } = useMemo(() => {
    if (customFrom && customTo && customFrom <= customTo) {
      return { from: customFrom, to: customTo }
    }
    if (quick === 'current') {
      return { from: toIso(startOfMonth(today)), to: toIso(endOfMonth(today)) }
    }
    if (quick === 'last') {
      const start = startOfMonth(addMonths(today, -1))
      const end = new Date(today.getFullYear(), today.getMonth(), 0)
      return { from: toIso(start), to: toIso(end) }
    }
    if (quick === '3m') {
      return { from: toIso(addMonths(today, -3)), to: toIso(today) }
    }
    // 1y
    return { from: toIso(addMonths(today, -12)), to: toIso(today) }
  }, [quick, customFrom, customTo, today])

  const { data, loading, error } = useStatistics(from, to)

  function handleQuick(range: QuickRange) {
    setQuick(range)
    setCustomFrom('')
    setCustomTo('')
  }

  const QUICK_BTNS: { key: QuickRange; label: string }[] = [
    { key: 'current', label: 'Luna curentă' },
    { key: 'last', label: 'Luna trecută' },
    { key: '3m', label: 'Ultimele 3 luni' },
    { key: '1y', label: 'Ultimul an' },
  ]

  const isCustomActive = !!(customFrom && customTo && customFrom <= customTo)

  return (
    <div className="flex flex-col gap-5">
      {/* Period selector */}
      <div className="glass rounded-2xl p-4 flex flex-col gap-3">
        <span className="text-sm font-semibold text-[#1d1d1f]">Perioadă</span>

        {/* Quick buttons */}
        <div className="flex flex-wrap gap-2">
          {QUICK_BTNS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleQuick(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border-none cursor-pointer transition-all ${
                quick === key && !isCustomActive
                  ? 'bg-[#34c759] text-white shadow-sm'
                  : 'bg-white/60 text-[#6e6e73] hover:bg-white/80 hover:text-[#1d1d1f]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Custom date pickers */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
          <span className="text-xs text-[#6e6e73] shrink-0 w-full text-center sm:w-auto sm:text-left">Interval custom:</span>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 w-full sm:w-auto sm:min-w-[320px]">
            <div className="relative min-w-0">
              <input
                lang="en-GB"
                type="date"
                value={customFrom}
                max={customTo || toIso(today)}
                onChange={e => { setCustomFrom(e.target.value); setQuick('current') }}
                onClick={e => (e.currentTarget as HTMLInputElement).showPicker?.()}
                className="glass rounded-xl px-3 py-1.5 text-xs text-[#1d1d1f] border-none outline-none cursor-pointer w-full"
              />
              {!customFrom && <span className="date-placeholder absolute inset-0 flex items-center px-3 text-xs text-[#aaa] pointer-events-none">De la</span>}
            </div>
            <span className="text-xs text-[#6e6e73] shrink-0">—</span>
            <div className="relative min-w-0">
              <input
                lang="en-GB"
                type="date"
                value={customTo}
                min={customFrom}
                max={toIso(today)}
                onChange={e => { setCustomTo(e.target.value); setQuick('current') }}
                onClick={e => (e.currentTarget as HTMLInputElement).showPicker?.()}
                className="glass rounded-xl px-3 py-1.5 text-xs text-[#1d1d1f] border-none outline-none cursor-pointer w-full"
              />
              {!customTo && <span className="date-placeholder absolute inset-0 flex items-center px-3 text-xs text-[#aaa] pointer-events-none">Până la</span>}
            </div>
          </div>
          {isCustomActive && (
            <span className="text-xs text-[#34c759] font-medium w-full text-center sm:w-auto sm:text-left">
              {inputToDisplay(customFrom)} – {inputToDisplay(customTo)}
            </span>
          )}
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="glass rounded-2xl px-6 py-10 flex items-center justify-center">
          <Spinner />
        </div>
      )}

      {error && (
        <div className="glass rounded-2xl px-6 py-4 text-sm text-red-500">{error}</div>
      )}

      {!loading && !error && data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Programări"
              value={data.activeBookings}
              sub={`din ${data.totalBookings} total`}
              growth={data.momGrowth.bookings}
            />
            <KpiCard
              label="Venit realizat"
              value={`${data.realizedRevenue} RON`}
              sub="din programări finalizate"
            />
            <KpiCard
              label="Venit estimat"
              value={`${data.estimatedRevenue} RON`}
              sub={data.activeBookings > 0 ? `~${Math.round(data.estimatedRevenue / data.activeBookings)} RON/prog.` : undefined}
              growth={data.momGrowth.revenue}
            />
            <KpiCard
              label="Anulări"
              value={data.cancelledCount}
              sub={`${data.cancellationRate}% rată anulare`}
            />
            <KpiCard
              label="Clienți noi"
              value={data.newClients}
              sub="prima vizită vreodată"
            />
            <KpiCard
              label="Clienți reveniți"
              value={data.returningClients}
              sub="au mai fost înainte"
            />
            <KpiCard
              label="Interval mediu vizite"
              value={data.avgDaysBetweenVisits != null ? `${data.avgDaysBetweenVisits} zile` : '—'}
              sub={data.avgDaysBetweenVisits != null ? 'între vizite consecutive' : 'insuficiente date'}
            />
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ChartCard title="Venit realizat pe lună (evoluție)">
              {data.byMonth.every(m => m.realizedRevenue === 0) ? (
                <p className="text-xs text-[#6e6e73] text-center py-6">Nu există date în această perioadă</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.byMonth} barSize={28} margin={{ top: 18, right: 4, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(52,199,89,0.08)' }} formatter={(v) => [`${v} RON`, 'Venit realizat']} />
                    <Bar dataKey="realizedRevenue" fill={CHART_COLOR} radius={[6, 6, 0, 0]}>
                      <LabelList dataKey="realizedRevenue" position="top" fontSize={10} fill="#1d1d1f" formatter={(v) => (v ? v : '')} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Programări pe lună (evoluție)">
              {data.byMonth.every(m => m.count === 0) ? (
                <p className="text-xs text-[#6e6e73] text-center py-6">Nu există date în această perioadă</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.byMonth} barSize={28} margin={{ top: 18, right: 4, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(52,199,89,0.08)' }} formatter={(v) => [`${v} prog.`, 'Programări']} />
                    <Bar dataKey="count" fill={CHART_COLOR} radius={[6, 6, 0, 0]}>
                      <LabelList dataKey="count" position="top" fontSize={10} fill="#1d1d1f" formatter={(v) => (v ? v : '')} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ChartCard title="Servicii populare">
              {data.byService.length === 0 ? (
                <p className="text-xs text-[#6e6e73] text-center py-6">Nu există date în această perioadă</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.byService} layout="vertical" barSize={18} margin={{ top: 4, right: 40, bottom: 0, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#1d1d1f' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(94,92,230,0.08)' }} formatter={(v) => [`${v} prog.`, 'Programări']} />
                    <Bar dataKey="count" fill={CHART_COLOR2} radius={[0, 6, 6, 0]}>
                      <LabelList dataKey="count" position="right" fontSize={10} fill="#1d1d1f" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Ore de vârf">
              {data.byHour.length === 0 ? (
                <p className="text-xs text-[#6e6e73] text-center py-6">Nu există date în această perioadă</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.byHour} barSize={22} margin={{ top: 18, right: 4, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(52,199,89,0.08)' }} formatter={(v) => [`${v} prog.`, 'Programări']} />
                    <Bar dataKey="count" fill={CHART_COLOR} radius={[5, 5, 0, 0]}>
                      <LabelList dataKey="count" position="top" fontSize={10} fill="#1d1d1f" formatter={(v) => (v ? v : '')} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* Charts row 3 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ChartCard title="Zile de săptămână">
              {data.byDayOfWeek.every(d => d.count === 0) ? (
                <p className="text-xs text-[#6e6e73] text-center py-6">Nu există date în această perioadă</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.byDayOfWeek} barSize={30} margin={{ top: 18, right: 4, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6e6e73' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(94,92,230,0.08)' }} formatter={(v) => [`${v} prog.`, 'Programări']} />
                    <Bar dataKey="count" fill={CHART_COLOR2} radius={[6, 6, 0, 0]}>
                      <LabelList dataKey="count" position="top" fontSize={10} fill="#1d1d1f" formatter={(v) => (v ? v : '')} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

          {data.byService.length > 0 && (
            <ChartCard title="Venit estimat per serviciu">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[360px]">
                  <thead>
                    <tr className="border-b border-black/[0.06]">
                      <th className="text-left text-xs font-medium text-[#6e6e73] pb-2 pr-4">Serviciu</th>
                      <th className="text-center text-xs font-medium text-[#6e6e73] pb-2 pr-4">Programări</th>
                      <th className="text-right text-xs font-medium text-[#6e6e73] pb-2">Venit est.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byService.map((s, i) => (
                      <tr key={i} className="border-b border-black/[0.04] last:border-0">
                        <td className="py-2 pr-4 text-[#1d1d1f] font-medium">{s.name}</td>
                        <td className="py-2 pr-4 text-center text-[#6e6e73]">{s.count}</td>
                        <td className="py-2 text-right text-[#1d1d1f] font-semibold">{s.revenue} RON</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          )}
          </div>
        </>
      )}
    </div>
  )
}
