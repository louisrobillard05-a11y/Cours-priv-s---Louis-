import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── EMAIL ──────────────────────────────────────────────
export async function sendConfirmationEmail(params: {
  to: string
  clientName: string
  date: string
  startTime: string
  endTime: string
  parkName: string
  parkAddress: string
  icsContent: string
  lang: 'fr' | 'en'
}) {
  const { to, clientName, date, startTime, endTime, parkName, parkAddress, icsContent, lang } = params

  const isFr = lang === 'fr'
  const subject = isFr
    ? `✅ Réservation confirmée – ${date} à ${startTime}`
    : `✅ Booking confirmed – ${date} at ${startTime}`

  const html = isFr ? frConfirmHtml({ clientName, date, startTime, endTime, parkName, parkAddress })
                    : enConfirmHtml({ clientName, date, startTime, endTime, parkName, parkAddress })

  return resend.emails.send({
    from: 'Ace Tennis Coaching <noreply@acetenniscoaching.ca>',
    to,
    subject,
    html,
    attachments: [{
      filename: 'cours-tennis.ics',
      content: Buffer.from(icsContent).toString('base64'),
    }],
  })
}

export async function sendReminderEmail(params: {
  to: string
  clientName: string
  date: string
  startTime: string
  parkName: string
  parkAddress: string
  lang: 'fr' | 'en'
}) {
  const { to, clientName, date, startTime, parkName, parkAddress, lang } = params
  const isFr = lang === 'fr'

  const subject = isFr
    ? `🎾 Rappel – Cours demain à ${startTime}`
    : `🎾 Reminder – Lesson tomorrow at ${startTime}`

  const html = isFr
    ? `<div style="font-family:Georgia,serif;max-width:520px;margin:auto;color:#1a1a1a">
        <div style="background:#0D0D0D;padding:24px;text-align:center">
          <span style="color:#C9A84C;font-size:22px;letter-spacing:2px">ACE TENNIS</span>
        </div>
        <div style="padding:32px 24px">
          <p>Bonjour <strong>${clientName}</strong>,</p>
          <p>Petit rappel pour votre cours de tennis <strong>demain</strong> :</p>
          <div style="background:#f8f6f0;border-left:4px solid #C9A84C;padding:16px;margin:20px 0">
            <p style="margin:0">📅 <strong>${date}</strong> à <strong>${startTime}</strong></p>
            <p style="margin:8px 0 0">📍 <strong>${parkName}</strong><br><span style="color:#666">${parkAddress}</span></p>
          </div>
          <p>À bientôt sur le court!</p>
          <p style="color:#C9A84C;font-weight:bold">— Ace Tennis Coaching</p>
        </div>
      </div>`
    : `<div style="font-family:Georgia,serif;max-width:520px;margin:auto;color:#1a1a1a">
        <div style="background:#0D0D0D;padding:24px;text-align:center">
          <span style="color:#C9A84C;font-size:22px;letter-spacing:2px">ACE TENNIS</span>
        </div>
        <div style="padding:32px 24px">
          <p>Hi <strong>${clientName}</strong>,</p>
          <p>Just a reminder about your tennis lesson <strong>tomorrow</strong>:</p>
          <div style="background:#f8f6f0;border-left:4px solid #C9A84C;padding:16px;margin:20px 0">
            <p style="margin:0">📅 <strong>${date}</strong> at <strong>${startTime}</strong></p>
            <p style="margin:8px 0 0">📍 <strong>${parkName}</strong><br><span style="color:#666">${parkAddress}</span></p>
          </div>
          <p>See you on the court!</p>
          <p style="color:#C9A84C;font-weight:bold">— Ace Tennis Coaching</p>
        </div>
      </div>`

  return resend.emails.send({
    from: 'Ace Tennis Coaching <noreply@acetenniscoaching.ca>',
    to,
    subject,
    html,
  })
}

// ─── SMS (Twilio) ────────────────────────────────────────
export async function sendConfirmationSMS(params: {
  to: string
  clientName: string
  date: string
  startTime: string
  parkName: string
  lang: 'fr' | 'en'
}) {
  const { to, clientName, date, startTime, parkName, lang } = params
  const body = lang === 'fr'
    ? `Ace Tennis 🎾 Bonjour ${clientName}! Votre cours est confirmé le ${date} à ${startTime} — ${parkName}. À bientôt!`
    : `Ace Tennis 🎾 Hi ${clientName}! Your lesson is confirmed on ${date} at ${startTime} — ${parkName}. See you soon!`

  const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  return twilio.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  })
}

export async function sendReminderSMS(params: {
  to: string
  clientName: string
  date: string
  startTime: string
  parkName: string
  lang: 'fr' | 'en'
}) {
  const { to, clientName, date, startTime, parkName, lang } = params
  const body = lang === 'fr'
    ? `Ace Tennis 🎾 Rappel: cours demain ${date} à ${startTime} — ${parkName}. À bientôt!`
    : `Ace Tennis 🎾 Reminder: lesson tomorrow ${date} at ${startTime} — ${parkName}. See you then!`

  const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  return twilio.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  })
}

// ─── HTML TEMPLATES ──────────────────────────────────────
function frConfirmHtml(p: any) {
  return `<div style="font-family:Georgia,serif;max-width:520px;margin:auto;color:#1a1a1a">
    <div style="background:#0D0D0D;padding:28px;text-align:center">
      <span style="color:#C9A84C;font-size:24px;letter-spacing:3px;font-weight:bold">ACE TENNIS</span>
      <p style="color:#888;margin:4px 0 0;font-size:12px;letter-spacing:1px">COACHING PRIVÉ</p>
    </div>
    <div style="padding:36px 28px">
      <h2 style="color:#0D0D0D;margin:0 0 8px">Réservation confirmée ✅</h2>
      <p>Bonjour <strong>${p.clientName}</strong>,</p>
      <p>Votre cours de tennis est confirmé. Le fichier joint (.ics) s'ouvre directement dans Outlook ou Google Calendar.</p>
      <div style="background:#faf8f2;border:1px solid #e8d98a;border-radius:8px;padding:20px;margin:24px 0">
        <table style="width:100%;font-size:14px">
          <tr><td style="color:#888;padding:4px 0">📅 Date</td><td style="font-weight:bold">${p.date}</td></tr>
          <tr><td style="color:#888;padding:4px 0">🕐 Heure</td><td style="font-weight:bold">${p.startTime} – ${p.endTime}</td></tr>
          <tr><td style="color:#888;padding:4px 0">📍 Lieu</td><td style="font-weight:bold">${p.parkName}</td></tr>
          <tr><td style="color:#888;padding:4px 0"></td><td style="color:#666;font-size:13px">${p.parkAddress}</td></tr>
        </table>
      </div>
      <p style="font-size:13px;color:#666">Besoin d'annuler? Répondez simplement à cet email.</p>
      <p style="color:#C9A84C;font-weight:bold;margin-top:24px">— Ace Tennis Coaching</p>
    </div>
  </div>`
}

function enConfirmHtml(p: any) {
  return `<div style="font-family:Georgia,serif;max-width:520px;margin:auto;color:#1a1a1a">
    <div style="background:#0D0D0D;padding:28px;text-align:center">
      <span style="color:#C9A84C;font-size:24px;letter-spacing:3px;font-weight:bold">ACE TENNIS</span>
      <p style="color:#888;margin:4px 0 0;font-size:12px;letter-spacing:1px">PRIVATE COACHING</p>
    </div>
    <div style="padding:36px 28px">
      <h2 style="color:#0D0D0D;margin:0 0 8px">Booking confirmed ✅</h2>
      <p>Hi <strong>${p.clientName}</strong>,</p>
      <p>Your tennis lesson is confirmed. The attached file (.ics) opens directly in Outlook or Google Calendar.</p>
      <div style="background:#faf8f2;border:1px solid #e8d98a;border-radius:8px;padding:20px;margin:24px 0">
        <table style="width:100%;font-size:14px">
          <tr><td style="color:#888;padding:4px 0">📅 Date</td><td style="font-weight:bold">${p.date}</td></tr>
          <tr><td style="color:#888;padding:4px 0">🕐 Time</td><td style="font-weight:bold">${p.startTime} – ${p.endTime}</td></tr>
          <tr><td style="color:#888;padding:4px 0">📍 Location</td><td style="font-weight:bold">${p.parkName}</td></tr>
          <tr><td style="color:#888;padding:4px 0"></td><td style="color:#666;font-size:13px">${p.parkAddress}</td></tr>
        </table>
      </div>
      <p style="font-size:13px;color:#666">Need to cancel? Simply reply to this email.</p>
      <p style="color:#C9A84C;font-weight:bold;margin-top:24px">— Ace Tennis Coaching</p>
    </div>
  </div>`
}
