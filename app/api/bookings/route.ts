import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendConfirmationEmail, sendConfirmationSMS } from '@/lib/notifications'
import { generateICS } from '@/lib/ics'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slot_id, client_first_name, client_last_name, client_email, client_phone, language } = body

    const db = supabaseAdmin()

    // Get slot details
    const { data: slot, error: slotErr } = await db
      .from('slots_with_details')
      .select('*')
      .eq('id', slot_id)
      .single()

    if (slotErr || !slot) {
      return NextResponse.json({ error: 'Créneau introuvable' }, { status: 404 })
    }

    // Check availability
    if (slot.booking_count >= slot.max_bookings) {
      return NextResponse.json({ error: 'Ce créneau est complet' }, { status: 409 })
    }

    if (slot.is_blocked) {
      return NextResponse.json({ error: 'Ce créneau n\'est pas disponible' }, { status: 409 })
    }

    // Create booking
    const { data: booking, error: bookErr } = await db
      .from('bookings')
      .insert([{
        slot_id,
        client_first_name,
        client_last_name,
        client_email,
        client_phone: client_phone || null,
        language: language || 'fr',
      }])
      .select()
      .single()

    if (bookErr || !booking) {
      return NextResponse.json({ error: 'Erreur lors de la réservation' }, { status: 500 })
    }

    // Generate ICS
    const ics = generateICS({
      clientName: `${client_first_name} ${client_last_name}`,
      date: slot.date,
      startTime: slot.start_time,
      endTime: slot.end_time,
      parkName: slot.park_name,
      parkAddress: slot.park_address || '',
      bookingId: booking.id,
      lang: language || 'fr',
    })

    // Send confirmation email + SMS (non-blocking)
    const notifications = [
      sendConfirmationEmail({
        to: client_email,
        clientName: client_first_name,
        date: slot.date,
        startTime: slot.start_time.slice(0, 5),
        endTime: slot.end_time.slice(0, 5),
        parkName: slot.park_name,
        parkAddress: slot.park_address || '',
        icsContent: ics,
        lang: language || 'fr',
      }).catch(console.error),
    ]

    if (client_phone) {
      notifications.push(
        sendConfirmationSMS({
          to: client_phone,
          clientName: client_first_name,
          date: slot.date,
          startTime: slot.start_time.slice(0, 5),
          parkName: slot.park_name,
          lang: language || 'fr',
        }).catch(console.error) as any
      )
    }

    // Notify coach
    if (process.env.COACH_EMAIL) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      resend.emails.send({
        from: 'Ace Tennis Coaching <noreply@acetenniscoaching.ca>',
        to: process.env.COACH_EMAIL,
        subject: `🎾 Nouvelle réservation – ${client_first_name} ${client_last_name}`,
        html: `<p><strong>${client_first_name} ${client_last_name}</strong> a réservé un cours.<br>
          📅 ${slot.date} à ${slot.start_time.slice(0, 5)}<br>
          📍 ${slot.park_name}<br>
          📧 ${client_email}<br>
          📱 ${client_phone || 'N/A'}</p>`,
      }).catch(console.error)
    }

    await Promise.allSettled(notifications)

    return NextResponse.json({ booking, slot })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
