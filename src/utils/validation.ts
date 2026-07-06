// Shared form validation utilities

export function validateName(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length < 5) return 'Introdu numele complet (minim 5 caractere).'
  if (trimmed.length > 100) return 'Numele este prea lung (maxim 100 caractere).'
  return null
}

export function validateEmail(email: string): string | null {
  // local part cannot start or end with dot, no consecutive dots, valid domain
  const re = /^[a-zA-Z0-9]([a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/
  if (!email.trim()) return 'Adresa de email este obligatorie.'
  if (!re.test(email.trim())) return 'Adresa de email nu este validă.'
  return null
}

export function validatePhone(dialCode: string, number: string): string | null {
  const clean = dialCode.trim()
  const digits = number.replace(/\D/g, '')
  if (!clean.startsWith('+') || clean.length < 2 || digits.length < 6)
    return 'Număr de telefon invalid.'
  if (digits.length > 15) return 'Număr de telefon prea lung.'
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
