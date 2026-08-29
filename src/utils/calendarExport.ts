import { addMinutesToTime } from './dateUtils'

/** Salon address used for calendar event location/description. */
export const SALON_ADDRESS = 'Strada Mihail Sebastian 18, 550326 Sibiu'

export interface CalendarEvent {
  title: string
  /** format: YYYY-MM-DD */
  date: string
  /** format: HH:MM */
  startTime: string
  /** Either provide endTime or durationMinutes (endTime wins). format: HH:MM */
  endTime?: string
  durationMinutes?: number
  description?: string
  location?: string
  /** Minutes before the event to trigger a reminder. Defaults to 1440 (24h). Set to 0 to disable. */
  reminderMinutes?: number
}

/** Resolves the event's end time (HH:MM), defaulting to +60 min. */
function resolveEndTime(e: CalendarEvent): string {
  if (e.endTime && e.endTime > e.startTime) return e.endTime
  return addMinutesToTime(e.startTime, e.durationMinutes ?? 60)
}

/** "2026-08-10" + "09:00" -> "20260810T090000" (floating local time). */
function toCalDate(date: string, time: string): string {
  return `${date.replace(/-/g, '')}T${time.replace(':', '')}00`
}

/** Escapes text for an iCalendar (RFC 5545) property value. */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** Builds a Google Calendar "add event" URL that opens a pre-filled event. */
export function googleCalendarUrl(e: CalendarEvent): string {
  const dates = `${toCalDate(e.date, e.startTime)}/${toCalDate(e.date, resolveEndTime(e))}`
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates,
  })
  if (e.description) params.set('details', e.description)
  if (e.location) params.set('location', e.location)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** Builds the raw .ics (iCalendar) text for the event. */
export function buildICS(e: CalendarEvent): string {
  const now = new Date()
  const dtstamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}T${String(now.getUTCHours()).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}${String(now.getUTCSeconds()).padStart(2, '0')}Z`
  const uid = `${toCalDate(e.date, e.startTime)}-${Math.random().toString(36).slice(2)}@appointment-app`

  const reminder = e.reminderMinutes ?? 1440 // default: 24h before

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Appointment App//RO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${toCalDate(e.date, e.startTime)}`,
    `DTEND:${toCalDate(e.date, resolveEndTime(e))}`,
    `SUMMARY:${escapeICS(e.title)}`,
    ...(e.description ? [`DESCRIPTION:${escapeICS(e.description)}`] : []),
    ...(e.location ? [`LOCATION:${escapeICS(e.location)}`] : []),
    ...(reminder > 0 ? [
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeICS(e.title)}`,
      `TRIGGER:-PT${reminder}M`,
      'END:VALARM',
    ] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n')
}

/**
 * Detects in-app browsers (Instagram, Facebook, Messenger, TikTok, etc.).
 * These WebViews — especially iOS WKWebView — block blob-URL and data-URI
 * downloads, so an .ics "click" silently does nothing.
 */
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /Instagram|FBAN|FBAV|FB_IAB|FBIOS|Messenger|Line\/|TikTok|Snapchat|Pinterest|LinkedIn|Twitter/i.test(ua)
}

/** Detects iOS (iPhone/iPad/iPod), including iPadOS reporting as desktop Safari. */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1)
}

/** UTF-8 safe base64 (handles Romanian diacritics), for passing the .ics via URL. */
function utf8ToBase64(s: string): string {
  return btoa(unescape(encodeURIComponent(s)))
}

/** Triggers a download of the event as an .ics file (Apple/iOS/Outlook). */
export function downloadICS(e: CalendarEvent, filename = 'programare.ics'): void {
  const ics = buildICS(e)

  // iOS (Safari and especially in-app WKWebViews like Instagram/Facebook) blocks
  // blob-URL and data-URI downloads. The only reliable path is to navigate to a
  // real HTTP endpoint that serves `text/calendar`, which iOS hands off to the
  // Calendar app natively — even inside Instagram. Handled by /api/calendar.
  if (isIOS() || isInAppBrowser()) {
    const name = filename.replace(/\.ics$/i, '')
    window.location.href = `/api/calendar?n=${encodeURIComponent(name)}&d=${encodeURIComponent(utf8ToBase64(ics))}`
    return
  }

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
