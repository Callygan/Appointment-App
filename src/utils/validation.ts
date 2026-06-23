// Shared form validation utilities

export function validateName(name: string): string | null {
  if (name.trim().length < 5) return 'Introdu numele complet (minim 5 caractere).'
  return null
}

export function validateEmail(email: string): string | null {
  // local part cannot start or end with dot, no consecutive dots, valid domain
  const re = /^[a-zA-Z0-9]([a-zA-Z0-9._%+\-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/
  if (!email.trim()) return 'Adresa de email este obligatorie.'
  if (!re.test(email.trim())) return 'Adresa de email nu este validă.'
  return null
}

export function validatePhone(dialCode: string, number: string): string | null {
  const clean = dialCode.trim()
  const digits = number.replace(/\D/g, '')
  if (!clean.startsWith('+') || clean.length < 2 || digits.length < 6)
    return 'Număr de telefon invalid.'
  return null
}

export function validateMessage(message: string): string | null {
  if (message.trim().length < 10) return 'Mesajul trebuie să aibă cel puțin 10 caractere.'
  return null
}

export function capitalizeWords(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ')
}

// Shared CSS class helpers
export const inputCls =
  'bg-white/50 backdrop-blur-sm border rounded-2xl px-4 py-3 text-sm font-normal text-[#1d1d1f] outline-none focus:bg-white/85 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] w-full'

export const labelCls =
  'flex flex-col gap-1.5 text-xs font-semibold text-[#6e6e73] uppercase tracking-wide'

export function inputBorderCls(hasError: boolean): string {
  return hasError ? 'border-red-400 focus:border-red-400' : 'border-white/60 focus:border-[#34c759]'
}
