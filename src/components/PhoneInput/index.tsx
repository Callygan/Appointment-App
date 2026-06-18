import { useState, useRef, useEffect } from 'react'

export interface Country {
  code: string   // e.g. "RO"
  dial: string   // e.g. "+40"
  flag: string   // emoji
  name: string
  pattern: RegExp
}

export const COUNTRIES: Country[] = [
  { code: 'RO', dial: '+40',  flag: '🇷🇴', name: 'România',       pattern: /^0[0-9]{9}$|^[1-9][0-9]{8}$/ },
  { code: 'MD', dial: '+373', flag: '🇲🇩', name: 'Moldova',        pattern: /^0[0-9]{7,8}$|^[1-9][0-9]{6,7}$/ },
  { code: 'DE', dial: '+49',  flag: '🇩🇪', name: 'Germania',       pattern: /^0[0-9]{9,12}$|^[1-9][0-9]{8,11}$/ },
  { code: 'FR', dial: '+33',  flag: '🇫🇷', name: 'Franța',         pattern: /^0[0-9]{9}$|^[1-9][0-9]{8}$/ },
  { code: 'IT', dial: '+39',  flag: '🇮🇹', name: 'Italia',         pattern: /^0?[0-9]{9,10}$/ },
  { code: 'ES', dial: '+34',  flag: '🇪🇸', name: 'Spania',         pattern: /^[6-9][0-9]{8}$/ },
  { code: 'GB', dial: '+44',  flag: '🇬🇧', name: 'Marea Britanie', pattern: /^0[0-9]{10}$|^[1-9][0-9]{9}$/ },
  { code: 'AT', dial: '+43',  flag: '🇦🇹', name: 'Austria',        pattern: /^0[0-9]{9,12}$|^[1-9][0-9]{8,11}$/ },
  { code: 'BE', dial: '+32',  flag: '🇧🇪', name: 'Belgia',         pattern: /^0[0-9]{8,9}$|^[1-9][0-9]{7,8}$/ },
  { code: 'NL', dial: '+31',  flag: '🇳🇱', name: 'Olanda',         pattern: /^0[0-9]{9}$|^[1-9][0-9]{8}$/ },
  { code: 'US', dial: '+1',   flag: '🇺🇸', name: 'SUA',            pattern: /^[2-9][0-9]{9}$/ },
  { code: 'CA', dial: '+1',   flag: '🇨🇦', name: 'Canada',         pattern: /^[2-9][0-9]{9}$/ },
  { code: 'AU', dial: '+61',  flag: '🇦🇺', name: 'Australia',      pattern: /^0[0-9]{9}$|^[1-9][0-9]{8}$/ },
]

export function isValidPhone(number: string, country: Country): boolean {
  const clean = number.replace(/[\s\-().]/g, '')
  return country.pattern.test(clean)
}

interface Props {
  value: string          // just the local number
  countryDial: string    // e.g. "+40"
  onChange: (number: string, dial: string) => void
  error?: boolean
}

export function PhoneInput({ value, countryDial, onChange, error }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const country = COUNTRIES.find((c) => c.dial === countryDial && c.code === (COUNTRIES.find(x => x.dial === countryDial)?.code)) 
    ?? COUNTRIES.find((c) => c.dial === countryDial) 
    ?? COUNTRIES[0]

  const filtered = search
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search))
    : COUNTRIES

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const borderCls = error
    ? 'border-red-400/60 focus-within:border-red-400'
    : 'border-white/60 focus-within:border-[#34c759] focus-within:bg-white/85'

  return (
    <div
      ref={ref}
      className={`flex items-stretch bg-white/50 backdrop-blur-sm border rounded-2xl overflow-visible transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] relative ${borderCls}`}
    >
      {/* Country code button */}
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setSearch('') }}
        className="flex items-center gap-1.5 px-3 py-3 border-r border-white/60 bg-white/30 hover:bg-white/50 transition-colors rounded-l-2xl shrink-0 cursor-pointer"
      >
        <span className="text-base leading-none">{country.flag}</span>
        <span className="text-sm text-[#1d1d1f] font-medium">{country.dial}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`text-[#6e6e73] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <polyline points="1 3 5 7 9 3" />
        </svg>
      </button>

      {/* Number input */}
      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value, countryDial)}
        placeholder={country.code === 'RO' ? '07XX XXX XXX' : '...'}
        autoComplete="tel-national"
        className="flex-1 px-3 py-3 text-sm font-normal text-[#1d1d1f] bg-transparent outline-none min-w-0"
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 bottom-[calc(100%+6px)] z-50 w-64 glass-heavy rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden">
          {/* Search */}
          <div className="px-3 pt-3 pb-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută țara..."
              autoFocus
              className="w-full bg-white/50 border border-white/60 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#34c759] focus:bg-white/85 transition-all"
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.map((c) => (
              <div
                key={c.code}
                onClick={() => { onChange(value, c.dial); setOpen(false); setSearch('') }}
                className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-colors text-sm ${
                  c.dial === countryDial && c.code === country.code
                    ? 'bg-[#34c759]/15 text-[#1a6b2e] font-medium'
                    : 'text-[#1d1d1f] hover:bg-white/40'
                }`}
              >
                <span className="text-base">{c.flag}</span>
                <span className="flex-1">{c.name}</span>
                <span className="text-[#6e6e73] text-xs">{c.dial}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-[#6e6e73] text-center py-4">Nicio țară găsită.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
