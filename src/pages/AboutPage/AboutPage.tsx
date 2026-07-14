import { greenBtnCls } from '../../components/ui/buttons'

const VALUES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Igienă & Sterilizare',
    desc: 'Toate instrumentele sunt sterilizate înainte de fiecare client. Poți vedea mai multe despre procesul nostru în highlights-urile de pe Instagram.',
    color: '#34c759',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    title: 'Rezistență & Calitate',
    desc: 'Tehnica rusă și manichiura japoneză garantează un rezultat durabil. Poți urmări recenzii și înainte/după în highlights.',
    color: '#f59e0b',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    title: 'Atmosferă caldă',
    desc: 'Înainte sau după procedură putem savura o cafea împreună. Mă bucur să cunosc oameni noi și sunt deschisă pentru orice discuție.',
    color: '#f43f5e',
  },
]

export function AboutPage() {
  return (
    <div className="flex flex-col items-center px-4 pt-28 pb-16">

      <div className="w-full max-w-2xl flex flex-col gap-10">

        {/* Hero */}
        <header className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 border border-white/60 text-xs font-semibold text-[#6e6e73] uppercase tracking-widest mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]" />
            7+ ani experiență · Sibiu
          </div>
          <h1 className="text-4xl font-bold text-[#1d1d1f] tracking-tight mb-4 leading-tight">
            Unde arta întâlnește<br />
            <span style={{ background: 'linear-gradient(90deg, #f43f5e, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              îngrijirea autentică
            </span>
          </h1>
          <p className="text-[15px] text-[#6e6e73] leading-relaxed max-w-md mx-auto">
            Nail Bar by Daniela Cobosnean — un spațiu dedicat tehnicilor moderne de nail art, minimalismului și experienței relaxante pentru fiecare clientă din Sibiu.
          </p>
        </header>

        {/* Stats */}
        <div className="glass rounded-3xl px-6 py-6 grid grid-cols-2 gap-4 text-center">
          {[
            { value: '7', label: 'ani de activitate' },
            { value: 'Sibiu', label: 'Calea Dumbrăvii' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-[#1d1d1f] tracking-tight">{s.value}</p>
              <p className="text-[11px] font-medium text-[#6e6e73] mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* About Daniela */}
        <div className="glass rounded-3xl px-7 py-7 flex flex-col gap-5">
          {/* Profile header */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-2xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #f43f5e, #a855f7)' }}
            >
              DC
            </div>
            <div>
              <p className="text-base font-semibold text-[#1d1d1f]">Daniela Cobosnean</p>
              <p className="text-xs text-[#6e6e73]">Nail Artist · Tehnică rusă · Manichiură japoneză</p>
              <a
                href="https://www.instagram.com/daniela_cobosnean/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-[#f43f5e] no-underline hover:text-[#e11d48] transition-colors"
              >
                @daniela_cobosnean
              </a>
            </div>
          </div>

          <p className="text-sm text-[#6e6e73] leading-relaxed">
            Cu peste 7 ani de experiență în domeniul frumuseții, mă specializez în tehnica rusă, manichiura japoneză și minimalism. Vin din Republica Moldova (Transnistria), motiv pentru care vei găsi postări mai vechi în rusă pe profilul meu — dar comunicăm fără bariere!
          </p>
          <p className="text-sm text-[#6e6e73] leading-relaxed">
            Îmi place mult să cunosc oameni noi și sunt deschisă pentru orice discuție. Călătoriile, cafeaua și ceva dulce la ea mă fac fericită. Înainte sau după procedură putem savura cafeaua împreună.
          </p>
          <p className="text-sm text-[#6e6e73] leading-relaxed">
            Dacă ai întrebări — scrie-mi în privat sau în comentarii pe Instagram. Vă aștept să creăm ceva frumos împreună!
          </p>

          {/* Specialties */}
          <div className="flex flex-wrap gap-2">
            {['Tehnică rusă', 'Manichiură japoneză', 'Minimalism', 'Gel', 'Nail art'].map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-white/60 text-[11px] font-semibold text-[#6e6e73]">{tag}</span>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-[#1d1d1f] px-1">Ce mă definește</h2>
          {VALUES.map((v) => (
            <div key={v.title} className="glass rounded-2xl px-5 py-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${v.color}18`, color: v.color }}>
                {v.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1d1d1f] mb-0.5">{v.title}</p>
                <p className="text-xs text-[#6e6e73] leading-relaxed">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="glass rounded-3xl px-7 py-7 text-center flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f43f5e, #a855f7)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1d1d1f] mb-1">Vino să ne cunoaștem</h3>
            <p className="text-sm text-[#6e6e73]">Programează-te online în mai puțin de un minut.</p>
          </div>
          <a
            href="/"
            className={`${greenBtnCls} px-7 py-2.5 no-underline`}
          >
            Fă o programare
          </a>
        </div>

      </div>
    </div>
  )
}
