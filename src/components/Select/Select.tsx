import { useState, useRef } from 'react'
import { useClickOutside } from '../../hooks/useClickOutside'

export interface SelectOption {
  value: string
  label: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  error?: boolean
}

export function Select({ value, onChange, options, placeholder = '— Selectează —', className = '', error = false }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  useClickOutside(ref, () => setOpen(false))

  const baseCls = `relative bg-white/50 backdrop-blur-sm border rounded-2xl text-sm font-normal text-[#1d1d1f] cursor-pointer select-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] ${
    open ? 'border-[#34c759] bg-white/85' : error ? 'border-red-400' : 'border-white/60'
  } ${className}`

  return (
    <div ref={ref} className={baseCls}>
      {/* Trigger */}
      <div
        className="flex items-center justify-between px-4 py-3 gap-2"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={selected ? 'text-[#1d1d1f]' : 'text-[#6e6e73]'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`text-[#6e6e73] transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="2 5 7 10 12 5" />
        </svg>
      </div>

      {/* Dropdown - opens upward */}
      {open && (
        <div className="absolute left-0 right-0 bottom-[calc(100%+6px)] z-50 glass-heavy rounded-2xl overflow-y-auto max-h-52 shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`px-4 py-3 text-sm cursor-pointer transition-colors ${
                opt.value === value
                  ? 'bg-[#34c759]/15 text-[#1a6b2e] font-medium'
                  : 'text-[#1d1d1f] hover:bg-white/40'
              }`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
