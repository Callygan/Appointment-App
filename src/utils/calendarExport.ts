import { addMinutesToTime } from './dateUtils'

/** Salon address used for calendar event location/description. */
export const SALON_ADDRESS = 'Nail Bar Sibiu, Strada Mihail Sebastian nr. 18, 550326 Sibiu'

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
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n')
}

/** Triggers a download of the event as an .ics file (Apple/iOS/Outlook). */
export function downloadICS(e: CalendarEvent, filename = 'programare.ics'): void {
  const blob = new Blob([buildICS(e)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
