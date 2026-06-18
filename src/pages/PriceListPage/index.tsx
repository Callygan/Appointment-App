import { Header } from '../../components/Header'
import { useServices } from '../../hooks/useServices'

function formatDuration(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

export function PriceListPage() {
  const { services } = useServices()

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pt-28 pb-16">
      <Header />

      <header className="text-center mb-10">
        <h1 className="text-3xl font-semibold text-[#1d1d1f] tracking-tight mb-2">Servicii &amp; Prețuri</h1>
        <p className="text-sm text-[#6e6e73]">Toate prețurile sunt exprimate în lei (RON).</p>
      </header>

      <div className="w-full max-w-lg flex flex-col gap-3">
        {services.length === 0 && (
          <p className="text-center text-sm text-[#6e6e73] py-12">Se încarcă...</p>
        )}

        {services.map((s) => (
          <div
            key={s.id}
            className="glass rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-semibold text-[#1d1d1f] leading-snug">{s.name}</span>
              {s.description && (
                <span className="text-xs text-[#6e6e73] leading-snug">{s.description}</span>
              )}
              <span className="text-xs text-[#6e6e73]/70 mt-0.5">{formatDuration(s.duration_minutes)}</span>
            </div>

            <div className="shrink-0 text-right">
              {s.price != null
                ? <span className="text-base font-semibold text-[#1d1d1f]">{s.price} <span className="text-xs font-normal text-[#6e6e73]">RON</span></span>
                : <span className="text-sm text-[#6e6e73]">—</span>}
            </div>
          </div>
        ))}
      </div>

      <a
        href="/"
        className="mt-10 bg-[#34c759] hover:bg-[#28a745] text-white border-none rounded-full px-7 py-3 text-sm font-semibold no-underline transition-all hover:scale-105 active:scale-95 shadow-[0_4px_16px_rgba(52,199,89,0.35)]"
      >
        Fă o programare
      </a>
    </div>
  )
}
