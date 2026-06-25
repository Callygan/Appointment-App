/** Formatează un Date ca YYYY-MM-DD folosind ora locală (nu UTC). */
export function getDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Formatează un string de tip "HH:MM:SS" la "HH:MM". */
export function formatTime(time: string): string {
  return time.slice(0, 5)
}

/** Formatează un string de tip "YYYY-MM-DD" ca dată în română.
 *  Default: weekday lung + zi + lună lungă + an (ex: "joi, 26 iunie 2025"). */
export function formatDate(
  date: string,
  options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('ro-RO', options)
}
