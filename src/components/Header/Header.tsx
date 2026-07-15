import { useState, useRef, useLayoutEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { label: 'Programări', href: '/' },
  { label: 'Price List', href: '/prices' },
  { label: 'Programarea mea', href: '/programarea-mea' },
  { label: 'Despre', href: '/despre' },
  { label: 'Contact', href: '/contact' },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const activeIndex = NAV_LINKS.findIndex(l => l.href === pathname)
  const navRef = useRef<HTMLUListElement>(null)
  const [measures, setMeasures] = useState<{ left: number; width: number }[]>([])

  // Măsoară pozițiile o singură dată după mount
  useLayoutEffect(() => {
    const ul = navRef.current
    if (!ul) return
    const lis = ul.querySelectorAll<HTMLElement>('li')
    setMeasures(Array.from(lis).map(li => ({ left: li.offsetLeft, width: li.offsetWidth })))
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex justify-center md:px-4 md:pt-4">
      {menuOpen && (
        <div
          className="fixed inset-0 z-[39] md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <nav className="glass-menu rounded-none md:rounded-2xl px-5 md:px-4 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] md:pt-2.5 w-full max-w-4xl flex items-center justify-between">
        <Link to="/" className="flex items-center pl-2 gap-3 no-underline group select-none">
          {/* Wordmark */}
          <div className="flex flex-col leading-none gap-[3px]">
            <span
              className="text-[13px] font-semibold tracking-tight transition-all duration-300"
              style={{ color: '#1d1d1f' }}
            >
              nail<span className="font-black">bar</span>
            </span>
            <span className="text-[7px] font-medium tracking-[0.3em] uppercase text-[#b0b0b8] group-hover:text-[#a855f7] transition-colors duration-300">by Daniela Cobosnean</span>
          </div>
        </Link>

        <ul ref={navRef} className="hidden md:flex items-center gap-1 list-none m-0 p-0 relative">
          <div
            className="absolute top-0 bottom-0 rounded-xl bg-white/70 shadow-sm pointer-events-none"
            style={{
              width: measures[activeIndex]?.width ?? 0,
              opacity: measures[activeIndex] && activeIndex !== -1 ? 1 : 0,
              transform: `translateX(${measures[activeIndex]?.left ?? 0}px)`,
              transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), width 0.28s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
          {NAV_LINKS.map((link, i) => (
            <li key={link.href}>
              <Link
                to={link.href}
                className={`relative z-10 text-xs font-medium no-underline px-3 py-2 rounded-xl transition-colors duration-200 block ${
                  i === activeIndex ? 'text-[#1d1d1f]' : 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-white/40'
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5 border-none bg-transparent cursor-pointer p-0"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Închide meniu' : 'Deschide meniu'}
        >
          <span className={`block w-5 h-0.5 bg-[#1d1d1f] rounded-full transition-all duration-300 origin-center ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-[#1d1d1f] rounded-full transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-[#1d1d1f] rounded-full transition-all duration-300 origin-center ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </nav>

      <div
        className="absolute top-[calc(4rem+env(safe-area-inset-top))] left-3 right-3 glass-menu rounded-2xl py-2 md:hidden overflow-hidden z-[41]"
        style={{
          opacity: menuOpen ? 1 : 0,
          transform: menuOpen ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.97)',
          pointerEvents: menuOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {NAV_LINKS.map((link, i) => (
          <Link
            key={link.href}
            to={link.href}
            onClick={() => setMenuOpen(false)}
            className="block px-5 py-3 text-sm font-medium text-[#1d1d1f] no-underline hover:bg-white/40 transition-colors"
            style={{
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? 'translateX(0)' : 'translateX(-12px)',
              transition: menuOpen
                ? `opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1) ${60 + i * 55}ms, transform 0.28s cubic-bezier(0.4, 0, 0.2, 1) ${60 + i * 55}ms`
                : `opacity 0.18s ease ${i * 30}ms, transform 0.18s ease ${i * 30}ms`,
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  )
}