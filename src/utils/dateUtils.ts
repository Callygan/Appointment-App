/** Formats a Date as YYYY-MM-DD using local time (not UTC). */
export function getDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Formats a "HH:MM:SS" string to "HH:MM". */
export function formatTime(time: string): string {
  return time.slice(0, 5)
}

/** Minimum lead time (in ms) before a slot can be booked. */
export const MIN_BOOKING_LEAD_MS = 2 * 60 * 60 * 1000

/** Returns true if a slot (date + start time) is far enough in the future to be booked. */
export function isBookable(date: string, startTime: string, now: number = Date.now()): boolean {
  return new Date(`${date}T${startTime}`).getTime() >= now + MIN_BOOKING_LEAD_MS
}

/** Adds a number of minutes to a "HH:MM[:SS]" time and returns "HH:MM". */
export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

/** Formats a "YYYY-MM-DD" string as a date in Romanian.
 *  Default: long weekday + day + long month + year (e.g. "joi, 26 iunie 2025"). */
export function formatDate(
  date: string,
  options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('ro-RO', options)
}
