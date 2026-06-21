import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { SlotsTab } from './SlotsTab'
import { ServicesTab } from './ServicesTab'
import { AppointmentsTab } from './AppointmentsTab'

export function AdminPage() {
  const { signOut } = useAuth()
  const [tab, setTab] = useState<'appointments' | 'slots' | 'services'>('appointments')

  const tabIndex = tab === 'appointments' ? 0 : tab === 'slots' ? 1 : 2

  return (
    <div className="min-h-screen px-4 py-8 pb-16">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold pl-2 text-[#1d1d1f] tracking-tight m-0">Dashboard</h1>
          <button
            onClick={signOut}
            className="glass rounded-full px-4 py-2 text-sm text-[#6e6e73] cursor-pointer hover:scale-105 active:scale-95 transition-all border-none font-medium"
          >
            Deconectează-te
          </button>
        </header>

        <div className="flex gap-6 items-start">
          {/* Sidebar */}
          <aside className="glass rounded-2xl p-2 w-52 shrink-0 sticky top-8">
            <div className="relative flex flex-col gap-0.5">
              {/* sliding indicator */}
              <div
                className="absolute inset-x-0 h-10 rounded-xl bg-white/70 shadow-sm pointer-events-none"
                style={{
                  transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: `translateY(calc(${tabIndex} * (2.5rem + 2px)))`,
                }}
              />
              <button
                className={`relative z-10 flex items-center gap-3 h-10 rounded-xl px-3 text-sm font-medium cursor-pointer border-none text-left w-full bg-transparent transition-colors duration-200 ${tab === 'appointments' ? 'text-[#1d1d1f]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                onClick={() => setTab('appointments')}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1.5" y="2.5" width="13" height="12" rx="2" />
                  <path d="M5 1v3M11 1v3M1.5 6.5h13" />
                </svg>
                Programări
              </button>
              <button
                className={`relative z-10 flex items-center gap-3 h-10 rounded-xl px-3 text-sm font-medium cursor-pointer border-none text-left w-full bg-transparent transition-colors duration-200 ${tab === 'slots' ? 'text-[#1d1d1f]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                onClick={() => setTab('slots')}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="6.5" />
                  <path d="M8 4.5V8l2.5 2.5" />
                </svg>
                Disponibilitate
              </button>
              <button
                className={`relative z-10 flex items-center gap-3 h-10 rounded-xl px-3 text-sm font-medium cursor-pointer border-none text-left w-full bg-transparent transition-colors duration-200 ${tab === 'services' ? 'text-[#1d1d1f]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                onClick={() => setTab('services')}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 1.5l1.5 3 3.5.5-2.5 2.5.5 3.5L8 9.5 5 11l.5-3.5L3 5l3.5-.5z" />
                </svg>
                Servicii
              </button>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {tab === 'slots' && <SlotsTab />}
            {tab === 'services' && <ServicesTab />}
            {tab === 'appointments' && <AppointmentsTab />}
          </div>
        </div>
      </div>
    </div>
  )
}
