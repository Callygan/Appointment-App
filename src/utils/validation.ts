// Shared form validation utilities

export function validateName(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length < 5) return 'Introdu numele complet (minim 5 caractere).'
  if (trimmed.length > 100) return 'Numele este prea lung (maxim 100 caractere).'
  if (!/^[\p{L} .-]+$/u.test(trimmed)) return 'Numele poate conține doar litere, spații, cratimă și punct.'
  if (!/\p{L}/u.test(trimmed)) return 'Introdu un nume valid.'
  return null
}

/** Removes characters that are not letters, spaces, hyphens or dots. */
export function sanitizeName(value: string): string {
  return value.replace(/[^\p{L} .-]/gu, '')
}

/**
 * Live-sanitizes an Instagram username: extracts the handle from a pasted
 * profile URL or leading @, forces lowercase, keeps only [a-z0-9._], removes
 * leading dots and collapses consecutive dots, max 30 chars. A single trailing
 * dot is intentionally kept so the user can still type dots mid-word; strip it
 * before saving with `.replace(/\.+$/, '')`.
 */
export function sanitizeInstagram(value: string): string {
  let v = value.trim()
  // If a full profile URL was pasted, keep only the username segment.
  const urlMatch = v.match(/(?:instagram\.com|instagr\.am)\/([^/?#\s]+)/i)
  if (urlMatch) v = urlMatch[1]
  // Drop a leading @ if present.
  v = v.replace(/^@+/, '')
  return v
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
    .replace(/^\.+/, '')
    .replace(/\.{2,}/g, '.')
    .slice(0, 30)
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
  const nationalDigits = number.replace(/\D/g, '')
  const countryDigits = clean.replace(/\D/g, '') // digits of the country code, without the +
  if (!clean.startsWith('+') || clean.length < 2 || nationalDigits.length < 6)
    return 'Număr de telefon invalid.'
  // E.164: country code + national number ≤ 15 digits in total.
  if (countryDigits.length + nationalDigits.length > 15) return 'Număr de telefon prea lung.'
  return null
}

export function validateMessage(message: string): string | null {
  if (message.trim().length < 10) return 'Mesajul trebuie să aibă cel puțin 10 caractere.'
  return null
}

export function capitalizeWords(value: string): string {
  return value.replace(/(^|[\s.-])(\p{L})/gu, (_, sep, c) => sep + c.toUpperCase())
}

export function formatPhoneNumber(value: string): string {
  // E.164 allows at most 15 digits for a full international number.
  const digits = value.replace(/\D/g, '').slice(0, 12)
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ')
}
