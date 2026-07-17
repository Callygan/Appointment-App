import { useState, lazy, Suspense, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Spinner } from '../../components/ui/Spinner'
import { SlotsTab } from './SlotsTab'
import { ServicesTab } from './ServicesTab'
import { AppointmentsTab } from './AppointmentsTab'
import { GdprTab } from './GdprTab'
import { CalendarTab } from './CalendarTab'

const StatisticsTab = lazy(() => import('./StatisticsTab').then(m => ({ default: m.StatisticsTab })))

type TabId = 'appointments' | 'calendar' | 'slots' | 'services' | 'statistics' | 'gdpr'

const TAB_ORDER: TabId[] = ['appointments', 'calendar', 'slots', 'services', 'statistics', 'gdpr']
const TAB_LABELS: Record<TabId, string> = {
  appointments: 'Programări',
  calendar: 'Calendar',
  slots: 'Disponibilitate',
  services: 'Servicii',
  statistics: 'Statistici',
  gdpr: 'GDPR',
}

function TabIcon({ id }: { id: TabId }) {
  if (id === 'appointments') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="1.5" width="11" height="13" rx="1.5" />
      <path d="M5 5.5h6M5 8h6M5 10.5h3.5" />
    </svg>
  )
  if (id === 'calendar') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
  if (id === 'slots') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5" /><path d="M8 4.5V8l2.5 2.5" />
    </svg>
  )
  if (id === 'services') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5l1.5 3 3.5.5-2.5 2.5.5 3.5L8 9.5 5 11l.5-3.5L3 5l3.5-.5z" />
    </svg>
  )
  if (id === 'statistics') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h2.5V7H2v5zM6.75 12h2.5V4h-2.5v8zM11.5 12H14V9h-2.5v3z" />
    </svg>
  )
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

export function AdminPage() {
  const { signOut } = useAuth()
  const [tab, setTab] = useState<TabId>('appointments')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const tabIndex = TAB_ORDER.indexOf(tab)

  function selectTab(t: TabId) {
    setTab(t)
    setMenuOpen(false)
    window.scrollTo(0, 0)
  }

  return (
    <div className="min-h-screen px-4 py-8 pb-16">
      <div className="w-full">
        <header className="flex items-center justify-between mb-6 max-w-screen-2xl mx-auto">
          <h1 className="text-3xl font-semibold pl-2 text-[#1d1d1f] tracking-tight m-0">Dashboard</h1>
          <button
            onClick={signOut}
            className="glass rounded-full px-4 py-2 text-sm text-[#6e6e73] cursor-pointer hover:scale-105 active:scale-95 transition-all border-none font-medium"
          >
            Deconectează-te
          </button>
        </header>

        {/* ── Mobile hamburger bar ── */}
        {menuOpen && (
          <div
            className="fixed inset-0 z-[19] md:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}
        <div className="relative md:hidden mb-4 z-20">
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Închide meniu' : 'Deschide meniu'}
            className="glass-menu rounded-2xl px-4 h-12 flex items-center justify-between w-full border-none cursor-pointer"
          >
            <div className="flex items-center gap-2.5 text-sm font-semibold text-[#1d1d1f]">
              <TabIcon id={tab} />
              {TAB_LABELS[tab]}
            </div>
            <div className="w-8 h-8 flex flex-col items-center justify-center gap-1.5 p-0 shrink-0">
              <span className={`block w-5 h-0.5 bg-[#1d1d1f] rounded-full transition-all duration-300 origin-center ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-[#1d1d1f] rounded-full transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-[#1d1d1f] rounded-full transition-all duration-300 origin-center ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>

          {/* dropdown */}
          <div
            className="absolute top-[calc(100%+8px)] left-0 right-0 glass-menu rounded-2xl py-2 overflow-hidden"
            style={{
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.97)',
              pointerEvents: menuOpen ? 'auto' : 'none',
              transition: 'opacity 0.3s cubic-bezier(0.4,0,0.2,1), transform 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {TAB_ORDER.map((id, i) => (
              <button
                key={id}
                onClick={() => selectTab(id)}
                className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium border-none bg-transparent cursor-pointer text-left transition-colors hover:bg-white/40 ${tab === id ? 'text-[#1d1d1f]' : 'text-[#6e6e73]'}`}
                style={{
                  opacity: menuOpen ? 1 : 0,
                  transform: menuOpen ? 'translateX(0)' : 'translateX(-12px)',
                  transition: menuOpen
                    ? `opacity 0.28s cubic-bezier(0.4,0,0.2,1) ${60 + i * 50}ms, transform 0.28s cubic-bezier(0.4,0,0.2,1) ${60 + i * 50}ms`
                    : `opacity 0.18s ease ${i * 25}ms, transform 0.18s ease ${i * 25}ms`,
                }}
              >
                <TabIcon id={id} />
                {TAB_LABELS[id]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start max-w-screen-2xl mx-auto">
          {/* ── Desktop sidebar ── */}
          <aside className="hidden md:block glass-menu rounded-2xl p-2 w-48 shrink-0 sticky top-8 z-10">
            <div className="relative flex flex-col gap-0.5">
              {/* sliding indicator */}
              <div
                className="absolute inset-x-0 h-10 rounded-xl bg-white/70 shadow-sm pointer-events-none"
                style={{
                  transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
                  transform: `translateY(calc(${tabIndex} * (2.5rem + 2px)))`,
                }}
              />
              {TAB_ORDER.map(id => (
                <button
                  key={id}
                  onClick={() => selectTab(id)}
                  className={`relative z-10 flex items-center gap-3 h-10 rounded-xl px-3 text-sm font-medium cursor-pointer border-none w-full bg-transparent transition-colors duration-200 text-left ${tab === id ? 'text-[#1d1d1f]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                >
                  <TabIcon id={id} />
                  {TAB_LABELS[id]}
                </button>
              ))}
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0 w-full">
            {tab === 'slots' && <SlotsTab />}
            {tab === 'services' && <ServicesTab />}
            {tab === 'appointments' && <AppointmentsTab />}
            {tab === 'calendar' && <CalendarTab />}
            {tab === 'gdpr' && <GdprTab />}
            {tab === 'statistics' && (
              <Suspense fallback={
                <div className="glass rounded-2xl px-6 py-10 flex items-center justify-center">
                  <Spinner />
                </div>
              }>
                <StatisticsTab />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
