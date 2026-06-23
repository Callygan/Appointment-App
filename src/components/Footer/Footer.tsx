export function Footer() {
  return (
    <footer className="w-full px-6 pb-8 mt-12">
      <div className="max-w-4xl mx-auto glass rounded-2xl px-6 py-4 flex flex-col">
        {/* Top row: links + Instagram */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <a
              href="/termeni-si-conditii"
              className="text-xs text-[#6e6e73] hover:text-[#1d1d1f] no-underline transition-colors"
            >
              Termeni și condiții
            </a>
            <a
              href="/politica-de-confidentialitate"
              className="text-xs text-[#6e6e73] hover:text-[#1d1d1f] no-underline transition-colors"
            >
              Politica de confidențialitate
            </a>
          </div>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/nail.bar_sibiu/"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4.5" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </div>

        {/* Bottom: copyright */}
        <p className="text-xs text-[#6e6e73]/50 m-0 border-t border-white/30 pt-1 text-center">
          © {new Date().getFullYear()}<span className="text-[#6e6e73]"> Nail Bar</span>. Powered by <a href="https://www.instagram.com/dumitrupodar/" target="_blank" className="text-[#6e6e73] hover:text-[#1d1d1f] no-underline transition-colors">Dumitru Podar</a>.
        </p>
      </div>
    </footer>
  )
}
