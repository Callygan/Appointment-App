import { useState } from 'react'

const NAV_LINKS = [
  { label: 'Programări', href: '/' },
  { label: 'Price List', href: '/prices' },
  { label: 'Programarea mea', href: '/programarea-mea' },
  { label: 'Despre', href: '/despre' },
  { label: 'Contact', href: '/contact' },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex justify-center px-4 pt-4">
      <nav className="glass rounded-2xl px-4 py-2.5 w-full max-w-4xl flex items-center justify-between">

        <a href="/" className="flex items-center gap-2.5 no-underline">
          {/* <img src="/../public/logo.png" alt="Nail Bar logo" className="w-8 h-8 rounded-xl object-cover" /> */}
          <span className="text-sm font-semibold text-[#1d1d1f] tracking-tight">Nail Bar</span>
        </a>

        <ul className="hidden sm:flex items-center gap-1 list-none m-0 p-0">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-xs font-medium text-[#6e6e73] hover:text-[#1d1d1f] no-underline px-3 py-2 rounded-xl hover:bg-white/40 transition-all"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          className="sm:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5 border-none bg-transparent cursor-pointer p-0"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Închide meniu' : 'Deschide meniu'}
        >
          <span className={`block w-5 h-0.5 bg-[#1d1d1f] rounded-full transition-all duration-300 origin-center ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-[#1d1d1f] rounded-full transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-[#1d1d1f] rounded-full transition-all duration-300 origin-center ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </nav>

      {menuOpen && (
        <div className="absolute top-[4.5rem] left-4 right-4 glass-heavy rounded-2xl py-2 sm:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block px-5 py-3 text-sm font-medium text-[#1d1d1f] no-underline hover:bg-white/40 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}