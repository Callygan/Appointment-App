// Vercel Serverless Function: serves an .ics file over a real HTTP URL.
//
// Why this exists: in-app browsers (Instagram/Facebook) on iOS use WKWebView,
// which blocks blob-URL and data-URI downloads. The only reliable way to add an
// event to the calendar there is to navigate to a real URL that returns
// `text/calendar`; iOS then hands it to the Calendar app natively.
//
// The client (src/utils/calendarExport.ts) builds the .ics, base64-encodes it,
// and links here as /api/calendar?n=<name>&d=<base64 ics>.

export default function handler(req, res) {
  const d = req.query?.d
  const rawName = req.query?.n

  if (!d || typeof d !== 'string') {
    res.status(400).send('Missing calendar data')
    return
  }

  let ics
  try {
    ics = Buffer.from(d, 'base64').toString('utf-8')
  } catch {
    res.status(400).send('Invalid calendar data')
    return
  }

  // Only accept genuine iCalendar payloads (defense in depth: the response is
  // always served as text/calendar with nosniff, so it can't be abused as HTML).
  if (!ics.startsWith('BEGIN:VCALENDAR')) {
    res.status(400).send('Invalid calendar data')
    return
  }

  // Sanitize the filename to prevent header injection.
  const safeName =
    (typeof rawName === 'string' ? rawName.replace(/[^a-zA-Z0-9._-]/g, '') : '') || 'programare'

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Content-Disposition', `inline; filename="${safeName}.ics"`)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).send(ics)
}
