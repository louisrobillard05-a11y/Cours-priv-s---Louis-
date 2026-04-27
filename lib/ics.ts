export function generateICS(params: {
  clientName: string
  date: string        // YYYY-MM-DD
  startTime: string   // HH:MM
  endTime: string     // HH:MM
  parkName: string
  parkAddress: string
  bookingId: string
  lang: 'fr' | 'en'
}): string {
  const { clientName, date, startTime, endTime, parkName, parkAddress, bookingId, lang } = params

  const fmt = (d: string, t: string) =>
    `${d.replace(/-/g, '')}T${t.replace(/:/g, '')}00`

  const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'

  const summary = lang === 'fr'
    ? `Cours de tennis – Ace Tennis Coaching`
    : `Tennis Lesson – Ace Tennis Coaching`

  const description = lang === 'fr'
    ? `Votre cours de tennis avec votre coach.\\nLieu: ${parkName}\\n${parkAddress}`
    : `Your tennis lesson with your coach.\\nLocation: ${parkName}\\n${parkAddress}`

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ace Tennis Coaching//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${bookingId}@acetenniscoaching`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=America/Toronto:${fmt(date, startTime)}`,
    `DTEND;TZID=America/Toronto:${fmt(date, endTime)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${parkName}\\, ${parkAddress}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${lang === 'fr' ? 'Rappel: cours de tennis demain' : 'Reminder: tennis lesson tomorrow'}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
