import { useEffect, useMemo, useRef, useState } from 'react'
import { useClickOutside } from '../../hooks/useClickOutside'
import type { Country } from '../../utils/countries'

interface Props {
  value: string
  onChange: (dialCode: string) => void
  error?: boolean
}

// Module-level cache so the dataset is fetched (and parsed) only once per session.
let cache: Country[] | null = null

export function CountryCodeSelect({ value, onChange, error = false }: Props) {
  const [open, setOpen] = useState(false)
  const [countries, setCountries] = useState<Country[] | null>(cache)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useClickOutside(ref, () => setOpen(false), open)

  // Lazy-load the country list the first time the dropdown is opened.
  async function ensureLoaded() {
    if (cache || loading) return
    setLoading(true)
    const mod = await import('../../utils/countries')
    cache = mod.default
    setCountries(cache)
    setLoading(false)
  }

  function toggle() {
    setOpen((o) => {
      const next = !o
      if (next) ensureLoaded()
      return next
    })
  }

  // Focus the search field when the list opens.
  useEffect(() => {
    if (open && countries) searchRef.current?.focus()
  }, [open, countries])

  // România + Republica Moldova pinned on top, rest sorted by Romanian name.
  const ordered = useMemo(() => {
    if (!countries) return []
    const pinned = ['RO', 'MD']
    const top = pinned
      .map((iso) => countries.find((c) => c.iso2 === iso))
      .filter((c): c is Country => Boolean(c))
    const rest = countries
      .filter((c) => !pinned.includes(c.iso2))
      .sort((a, b) => a.name.localeCompare(b.name, 'ro'))
    return [...top, ...rest]
  }, [countries])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ordered
    return ordered.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.iso2.toLowerCase().includes(q),
    )
  }, [ordered, query])

  return (
    <div ref={ref} className="relative shrink-0">
      {/* Trigger */}
      <button
        type="button"
        onClick={toggle}
        className={`flex items-center gap-1 h-full px-3 py-3 rounded-2xl bg-white/50 backdrop-blur-sm border text-sm font-medium text-[#1d1d1f] cursor-pointer select-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] ${
          open ? 'border-[#34c759] bg-white/85' : error ? 'border-red-400' : 'border-white/60'
        }`}
      >
        <span>{value}</span>
        <svg
          width="12" height="12" viewBox="0 0 14 14" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`text-[#6e6e73] transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="2 5 7 10 12 5" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-50 w-[min(280px,80vw)] rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.10)]"
          style={{
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(64px) saturate(180%)',
            WebkitBackdropFilter: 'blur(64px) saturate(180%)',
          }}
        >
          {/* Search */}
          <div className="p-2 border-b border-black/5">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Caută țara sau prefixul…"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="w-full px-3 py-2 text-sm font-normal text-[#1d1d1f] bg-white/60 border border-white/60 rounded-xl outline-none focus:border-[#34c759] transition-colors"
            />
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-60">
            {loading && (
              <div className="px-4 py-3 text-sm text-[#6e6e73]">Se încarcă…</div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="px-4 py-3 text-sm text-[#6e6e73]">Niciun rezultat.</div>
            )}
            {!loading &&
              filtered.map((c) => (
                <div
                  key={c.iso2}
                  onClick={() => {
                    onChange(c.dialCode)
                    setOpen(false)
                    setQuery('')
                  }}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                    c.dialCode === value
                      ? 'bg-[#34c759]/15 text-[#1a6b2e] font-medium'
                      : 'text-[#1d1d1f] hover:bg-black/[0.04]'
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="text-[#6e6e73] shrink-0">{c.dialCode}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
