interface Props {
  onBack: () => void
}

export function SuccessPage({ onBack }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center glass-heavy rounded-3xl px-8 py-12 max-w-sm w-full">
        <div className="w-20 h-20 rounded-full bg-[#34c759]/15 border border-[#34c759]/30 flex items-center justify-center mx-auto mb-6">
          <span className="text-[#34c759] text-3xl">✓</span>
        </div>
        <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-2 tracking-tight">Rezervare confirmată!</h1>
        <p className="text-[#6e6e73] leading-relaxed mb-8 text-sm">Programarea ta a fost confirmată cu succes.<br />Ne vedem curând!</p>
        <button
          onClick={onBack}
          className="bg-[#34c759] hover:bg-[#28a745] text-white border-none rounded-full px-8 py-3 text-sm font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-[0_4px_16px_rgba(52,199,89,0.35)]"
        >
          Fă o altă programare
        </button>
      </div>
    </div>
  )
}
