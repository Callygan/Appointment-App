import { useRef, useState } from 'react'
import { useClickOutside } from '../../hooks/useClickOutside'
import type { SelectOption } from '../Select/Select'

interface Props {
  values: string[]
  onChange: (values: string[]) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  error?: boolean
}

export function MultiSelect({ values, onChange, options, placeholder = '— Selectează —', className = '', error = false }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useClickOutside(ref, () => setOpen(false))

  const selectedLabels = options.filter((o) => values.includes(o.value)).map((o) => o.label)

  function toggle(value: string) {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value])
  }

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
        <span className={selectedLabels.length ? 'text-[#1d1d1f] truncate' : 'text-[#6e6e73]'}>
          {selectedLabels.length ? selectedLabels.join(', ') : placeholder}
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
        <div
          className="absolute left-0 right-0 bottom-[calc(100%+6px)] z-50 glass-heavy rounded-2xl overflow-y-auto max-h-72 shadow-[0_8px_32px_rgba(0,0,0,0.10)]"
          style={{
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(64px) saturate(180%)',
            WebkitBackdropFilter: 'blur(64px) saturate(180%)',
          }}
        >
          {options.map((opt) => {
            const checked = values.includes(opt.value)
            return (
              <div
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className={`flex items-center justify-between gap-2 px-4 py-3 text-sm cursor-pointer transition-colors ${
                  checked
                    ? 'bg-[#34c759]/15 text-[#1a6b2e] font-medium'
                    : 'text-[#1d1d1f] hover:bg-white/40'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {checked && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
