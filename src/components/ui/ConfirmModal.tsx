import { useState, useEffect } from 'react'

interface Props {
  title: string
  description: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'success'
  hideCancel?: boolean
  onConfirm?: () => void | Promise<void>
  onDismiss: () => void
}

export function ConfirmModal({
  title,
  description,
  confirmLabel = 'Confirmă',
  cancelLabel = 'Anulează',
  variant = 'danger',
  hideCancel = false,
  onConfirm,
  onDismiss,
}: Props) {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    setVisible(false)
    setTimeout(onDismiss, 250)
  }

  async function handleConfirm() {
    if (!onConfirm) { dismiss(); return }
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }

  const iconColor = variant === 'danger' ? '#ef4444' : variant === 'warning' ? '#f59e0b' : '#34c759'
  const iconBg = variant === 'danger'
    ? 'bg-red-50/80 border-red-200/50'
    : variant === 'warning'
      ? 'bg-[#f59e0b]/10 border-[#f59e0b]/30'
      : 'bg-[#34c759]/10 border-[#34c759]/30'
  const confirmCls = variant === 'danger'
    ? 'bg-red-500 hover:bg-red-600 shadow-[0_4px_16px_rgba(239,68,68,0.35)]'
    : variant === 'warning'
      ? 'bg-[#f59e0b] hover:bg-[#d97706] shadow-[0_4px_16px_rgba(245,158,11,0.35)]'
      : 'bg-[#34c759] hover:bg-[#28a745] shadow-[0_4px_16px_rgba(52,199,89,0.35)]'

  const icon = variant === 'success'
    ? <polyline points="20 6 9 17 4 12" />
    : <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      onClick={dismiss}
    >
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.25s ease' }}
      />
      <div
        className="relative glass-heavy rounded-3xl p-7 w-full max-w-sm mx-4 pointer-events-auto"
        style={{
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(-40px) scale(0.97)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto mb-4 ${iconBg}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {icon}
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[#1d1d1f] text-center tracking-tight mb-1">{title}</h2>
        <div className="text-sm text-[#6e6e73] text-center leading-relaxed mb-6">{description}</div>
        <div className="flex gap-3">
          {!hideCancel && (
            <button
              onClick={dismiss}
              disabled={loading}
              className="flex-1 rounded-full px-4 py-2.5 text-sm font-medium text-[#6e6e73] glass cursor-pointer border-none hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-white border-none cursor-pointer transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 ${confirmCls}`}
          >
            {loading ? 'Se procesează...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
