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


          <a href="/" className="flex items-center gap-3 no-underline group select-none">
            {/* Wordmark */}
            <div className="flex flex-col leading-none gap-[3px]">
              <span
                className="text-[13px] text-center font-semibold tracking-tight transition-all duration-300"
                style={{ color: '#1d1d1f' }}
              >
                nail<span className="font-black">bar</span>
              </span>
              {/* <span className="text-[7px] font-medium tracking-[0.3em] uppercase text-[#b0b0b8] group-hover:text-[#a855f7] transition-colors duration-300">by Daniela Cobosnean</span> */}
            </div>
          </a>
        </div>

        {/* Bottom: copyright */}
        <p className="text-xs text-[#6e6e73]/50 mt-2 border-t border-white/30 pt-1 text-center">
          © {new Date().getFullYear()}<span className="text-[#6e6e73]"> Nail Bar</span>. Powered by <a href="https://www.instagram.com/dumitrupodar/" target="_blank" rel="noreferrer" className="text-[#6e6e73] hover:text-[#1d1d1f] no-underline transition-colors">Dumitru Podar</a>.
        </p>
      </div>
    </footer>
  )
}
