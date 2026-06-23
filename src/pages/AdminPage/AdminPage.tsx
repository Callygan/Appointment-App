import { useState, lazy, Suspense } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { SlotsTab } from './SlotsTab'
import { ServicesTab } from './ServicesTab'
import { AppointmentsTab } from './AppointmentsTab'

const StatisticsTab = lazy(() => import('./StatisticsTab').then(m => ({ default: m.StatisticsTab })))

export function AdminPage() {
  const { signOut } = useAuth()
  const [tab, setTab] = useState<'appointments' | 'slots' | 'services' | 'statistics'>('appointments')

  const tabIndex = tab === 'appointments' ? 0 : tab === 'slots' ? 1 : tab === 'services' ? 2 : 3

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

        <div className="flex flex-col md:flex-row gap-4 items-start max-w-screen-2xl mx-auto">
          {/* Sidebar — horizontal scrollable tabs on mobile, vertical on md+ */}
          <aside className="glass rounded-2xl p-2 w-full md:w-48 md:shrink-0 md:sticky md:top-8">
            <div className="relative flex md:flex-col flex-wrap gap-0.5">
              {/* sliding indicator */}
              <div
                className="absolute md:inset-x-0 md:h-10 md:rounded-xl hidden md:block bg-white/70 shadow-sm pointer-events-none"
                style={{
                  transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: `translateY(calc(${tabIndex} * (2.5rem + 2px)))`,
                }}
              />
              <button
                className={`relative z-10 flex-1 md:flex-none flex items-center justify-center md:justify-start gap-1 md:gap-3 h-10 rounded-xl px-2 md:px-3 text-xs md:text-sm font-medium cursor-pointer border-none text-left md:w-full bg-transparent transition-colors duration-200 ${tab === 'appointments' ? 'text-[#1d1d1f] md:bg-transparent bg-white/70' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                onClick={() => setTab('appointments')}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="hidden md:block">
                  <rect x="1.5" y="2.5" width="13" height="12" rx="2" />
                  <path d="M5 1v3M11 1v3M1.5 6.5h13" />
                </svg>
                Programări
              </button>
              <button
                className={`relative z-10 flex-1 md:flex-none flex items-center justify-center md:justify-start gap-1 md:gap-3 h-10 rounded-xl px-2 md:px-3 text-xs md:text-sm font-medium cursor-pointer border-none text-left md:w-full bg-transparent transition-colors duration-200 ${tab === 'slots' ? 'text-[#1d1d1f] md:bg-transparent bg-white/70' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                onClick={() => setTab('slots')}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="hidden md:block">
                  <circle cx="8" cy="8" r="6.5" />
                  <path d="M8 4.5V8l2.5 2.5" />
                </svg>
                Disponibilitate
              </button>
              <button
                className={`relative z-10 flex-1 md:flex-none flex items-center justify-center md:justify-start gap-1 md:gap-3 h-10 rounded-xl px-2 md:px-3 text-xs md:text-sm font-medium cursor-pointer border-none text-left md:w-full bg-transparent transition-colors duration-200 ${tab === 'services' ? 'text-[#1d1d1f] md:bg-transparent bg-white/70' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                onClick={() => setTab('services')}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="hidden md:block">
                  <path d="M8 1.5l1.5 3 3.5.5-2.5 2.5.5 3.5L8 9.5 5 11l.5-3.5L3 5l3.5-.5z" />
                </svg>
                Servicii
              </button>
              <button
                className={`relative z-10 flex-1 md:flex-none flex items-center justify-center md:justify-start gap-1 md:gap-3 h-10 rounded-xl px-2 md:px-3 text-xs md:text-sm font-medium cursor-pointer border-none text-left md:w-full bg-transparent transition-colors duration-200 ${tab === 'statistics' ? 'text-[#1d1d1f] md:bg-transparent bg-white/70' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                onClick={() => setTab('statistics')}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="hidden md:block">
                  <path d="M2 12h2.5V7H2v5zM6.75 12h2.5V4h-2.5v8zM11.5 12H14V9h-2.5v3z" />
                </svg>
                Statistici
              </button>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0 w-full">
            {tab === 'slots' && <SlotsTab />}
            {tab === 'services' && <ServicesTab />}
            {tab === 'appointments' && <AppointmentsTab />}
            {tab === 'statistics' && (
              <Suspense fallback={
                <div className="glass rounded-2xl px-6 py-10 flex items-center justify-center">
                  <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
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
