import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendReminderEmail, sendReminderSMS } from '@/lib/notifications'
import { addDays, format } from 'date-fns'

// Called daily by Vercel Cron or an external cron service
// Schedule: every day at 9am → sends reminders for tomorrow's bookings
export async function GET(req: NextRequest) {
  // Simple security: check for secret header
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabaseAdmin()
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  // Get all confirmed bookings for tomorrow that haven't been reminded yet
  const { data: bookings } = await db
    .from('bookings')
    .select('*, slots(date, start_time, end_time, parks(name, address))')
    .eq('status', 'confirmed')
    .eq('reminder_email_sent', false)
    .eq('slots.date', tomorrow)

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No reminders needed' })
  }

  let sent = 0
  for (const booking of bookings) {
    const slot = booking.slots as any
    if (!slot) continue

    const park = slot.parks as any
    const lang = booking.language || 'fr'

    try {
      await sendReminderEmail({
        to: booking.client_email,
        clientName: booking.client_first_name,
        date: slot.date,
        startTime: slot.start_time.slice(0, 5),
        parkName: park?.name || '',
        parkAddress: park?.address || '',
        lang,
      })

      if (booking.client_phone) {
        await sendReminderSMS({
          to: booking.client_phone,
          clientName: booking.client_first_name,
          date: slot.date,
          startTime: slot.start_time.slice(0, 5),
          parkName: park?.name || '',
          lang,
        })
      }

      await db
        .from('bookings')
        .update({ reminder_email_sent: true, reminder_sms_sent: !!booking.client_phone })
        .eq('id', booking.id)

      sent++
    } catch (err) {
      console.error('Reminder failed for booking', booking.id, err)
    }
  }

  return NextResponse.json({ sent, message: `${sent} reminders sent for ${tomorrow}` })
}
