export const inputCls =
  'bg-white/50 backdrop-blur-sm border rounded-2xl px-4 py-3 text-sm font-normal text-[#1d1d1f] outline-none focus:bg-white/85 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] w-full'

/** Variant for admin forms — border color included, smaller padding (py-2.5). */
export const adminInputCls =
  'bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl px-4 py-2.5 text-sm font-normal text-[#1d1d1f] outline-none focus:bg-white/85 focus:border-[#34c759] transition-all w-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)]'

export const labelCls =
  'flex flex-col gap-1.5 text-xs font-semibold text-[#6e6e73] uppercase tracking-wide'

export function inputBorderCls(hasError: boolean): string {
  return hasError ? 'border-red-400 focus:border-red-400' : 'border-white/60 focus:border-[#34c759]'
}

export function alertCls(type: 'success' | 'error'): string {
  return `text-sm rounded-2xl px-4 py-3 m-0 ${type === 'success' ? 'bg-[#34c759]/15 text-[#1a6b2e]' : 'bg-red-50/80 text-red-600'}`
}
