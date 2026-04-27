'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { generateICS } from '@/lib/ics'
import { format, parseISO } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'

type Slot = {
  id: string
  date: string
  start_time: string
  end_time: string
  duration_minutes: number
  park_name: string
  park_address: string
  park_color: string
  booking_count: number
  max_bookings: number
  notes: string
}

type Lang = 'fr' | 'en'

const t = {
  fr: {
    title: 'Ace Tennis Coaching',
    subtitle: 'Coaching privé · Montréal & Blainville',
    tagline: 'Choisissez votre créneau et réservez en quelques secondes.',
    available: 'Créneaux disponibles',
    noSlots: 'Aucun créneau disponible pour le moment. Revenez bientôt!',
    book: 'Réserver',
    full: 'Complet',
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'Courriel',
    phone: 'Téléphone (pour rappel SMS)',
    phonePlaceholder: '+1 514 555-0000',
    confirm: 'Confirmer la réservation',
    cancel: 'Annuler',
    successTitle: 'Réservation confirmée!',
    successMsg: 'Vous recevrez un email de confirmation avec le fichier calendrier (.ics) pour Outlook.',
    downloadICS: 'Ajouter à mon calendrier',
    newBooking: 'Faire une autre réservation',
    duration: 'min',
    spot: 'place restante',
    spots: 'places restantes',
    required: 'Champs obligatoires',
    loading: 'Chargement...',
    bookingFor: 'Réservation pour',
    at: 'à',
  },
  en: {
    title: 'Ace Tennis Coaching',
    subtitle: 'Private coaching · Montréal & Blainville',
    tagline: 'Choose your time slot and book in seconds.',
    available: 'Available slots',
    noSlots: 'No slots available right now. Check back soon!',
    book: 'Book',
    full: 'Full',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    phone: 'Phone (for SMS reminder)',
    phonePlaceholder: '+1 514 555-0000',
    confirm: 'Confirm booking',
    cancel: 'Cancel',
    successTitle: 'Booking confirmed!',
    successMsg: 'You will receive a confirmation email with the calendar file (.ics) for Outlook.',
    downloadICS: 'Add to my calendar',
    newBooking: 'Book another slot',
    duration: 'min',
    spot: 'spot left',
    spots: 'spots left',
    required: 'Required fields',
    loading: 'Loading...',
    bookingFor: 'Booking for',
    at: 'at',
  }
}

export default function BookPage() {
  const [lang, setLang] = useState<Lang>('fr')
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Slot | null>(null)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<{ slot: Slot; ics: string } | null>(null)
  const [error, setError] = useState('')

  const tx = t[lang]

  useEffect(() => {
    loadSlots()
  }, [])

  async function loadSlots() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('slots_with_details')
      .select('*')
      .gte('date', today)
      .eq('is_blocked', false)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    setSlots((data || []).filter((s: Slot) => s.booking_count < s.max_bookings))
    setLoading(false)
  }

  function groupByDate(slots: Slot[]) {
    return slots.reduce((acc: Record<string, Slot[]>, slot) => {
      if (!acc[slot.date]) acc[slot.date] = []
      acc[slot.date].push(slot)
      return acc
    }, {})
  }

  function formatDate(dateStr: string) {
    const d = parseISO(dateStr)
    if (lang === 'fr') return format(d, "EEEE d MMMM", { locale: fr })
    return format(d, "EEEE, MMMM d", { locale: enUS })
  }

  async function handleBook(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: selected.id,
          client_first_name: form.firstName,
          client_last_name: form.lastName,
          client_email: form.email,
          client_phone: form.phone,
          language: lang,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')

      const ics = generateICS({
        clientName: `${form.firstName} ${form.lastName}`,
        date: selected.date,
        startTime: selected.start_time,
        endTime: selected.end_time,
        parkName: selected.park_name,
        parkAddress: selected.park_address,
        bookingId: data.booking.id,
        lang,
      })

      setSuccess({ slot: selected, ics })
      setSelected(null)
      setForm({ firstName: '', lastName: '', email: '', phone: '' })
      loadSlots()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function downloadICS(ics: string) {
    const blob = new Blob([ics], { type: 'text/calendar' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'cours-tennis.ics'
    a.click()
  }

  const grouped = groupByDate(slots)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Header */}
      <header style={{ background: 'var(--ink)', padding: '0' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="font-display" style={{ color: 'var(--gold)', fontSize: 26, margin: 0, letterSpacing: 2 }}>
              ACE TENNIS
            </h1>
            <p style={{ color: '#888', margin: '4px 0 0', fontSize: 12, letterSpacing: 1 }}>
              {tx.subtitle.toUpperCase()}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setLang('fr')} style={{ background: lang === 'fr' ? 'var(--gold)' : 'transparent', color: lang === 'fr' ? 'var(--ink)' : '#888', border: '1px solid #444', borderRadius: 4, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>FR</button>
            <button onClick={() => setLang('en')} style={{ background: lang === 'en' ? 'var(--gold)' : 'transparent', color: lang === 'en' ? 'var(--ink)' : '#888', border: '1px solid #444', borderRadius: 4, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>EN</button>
          </div>
        </div>
        <div style={{ height: 3, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
      </header>

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>
        {/* Tagline */}
        <p className="fade-up" style={{ color: '#666', fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
          {tx.tagline}
        </p>

        {/* Success state */}
        {success && (
          <div className="card fade-up" style={{ borderColor: 'var(--gold)', marginBottom: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎾</div>
            <h2 className="font-display" style={{ color: 'var(--ink)', marginBottom: 8 }}>{tx.successTitle}</h2>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>{tx.successMsg}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-gold" onClick={() => downloadICS(success.ics)}>
                📅 {tx.downloadICS}
              </button>
              <button className="btn-dark" onClick={() => setSuccess(null)}>
                {tx.newBooking}
              </button>
            </div>
          </div>
        )}

        {/* Slots */}
        <h2 className="font-display fade-up" style={{ fontSize: 20, marginBottom: 20, color: 'var(--ink)' }}>
          {tx.available}
        </h2>

        {loading && <p style={{ color: '#888' }}>{tx.loading}</p>}

        {!loading && slots.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: '#888', padding: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎾</div>
            <p>{tx.noSlots}</p>
          </div>
        )}

        {Object.entries(grouped).map(([date, daySlots], i) => (
          <div key={date} className={`fade-up-${Math.min(i + 1, 3)}`} style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#888', marginBottom: 10 }}>
              {formatDate(date)}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {daySlots.map(slot => {
                const spotsLeft = slot.max_bookings - slot.booking_count
                return (
                  <div key={slot.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#e8dfc0')}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
                          {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                        </span>
                        <span style={{ fontSize: 12, color: '#888' }}>{slot.duration_minutes} {tx.duration}</span>
                      </div>
                      <span className="park-badge">{slot.park_name}</span>
                      {slot.park_address && (
                        <p style={{ fontSize: 12, color: '#888', margin: '6px 0 0' }}>{slot.park_address}</p>
                      )}
                      {slot.notes && (
                        <p style={{ fontSize: 12, color: '#999', margin: '4px 0 0', fontStyle: 'italic' }}>{slot.notes}</p>
                      )}
                      {spotsLeft > 1 && (
                        <p style={{ fontSize: 11, color: 'var(--gold-dark)', margin: '4px 0 0' }}>
                          {spotsLeft} {spotsLeft === 1 ? tx.spot : tx.spots}
                        </p>
                      )}
                    </div>
                    <button className="btn-gold" onClick={() => { setSelected(slot); setSuccess(null) }}>
                      {tx.book}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Booking modal */}
        {selected && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div className="card fade-up" style={{ width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 className="font-display" style={{ fontSize: 20, margin: 0 }}>{tx.bookingFor}</h2>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>×</button>
              </div>

              <div style={{ background: 'var(--cream)', borderRadius: 6, padding: 14, marginBottom: 20 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{formatDate(selected.date)} {tx.at} {selected.start_time.slice(0, 5)}</p>
                <span className="park-badge" style={{ marginTop: 6, display: 'inline-flex' }}>{selected.park_name}</span>
              </div>

              <form onSubmit={handleBook}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#555' }}>{tx.firstName} *</label>
                    <input className="input-field" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#555' }}>{tx.lastName} *</label>
                    <input className="input-field" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#555' }}>{tx.email} *</label>
                  <input className="input-field" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#555' }}>{tx.phone}</label>
                  <input className="input-field" type="tel" placeholder={tx.phonePlaceholder} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>

                {error && <p style={{ color: '#c62828', fontSize: 13, marginBottom: 12 }}>{error}</p>}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn-dark" style={{ flex: 1 }} onClick={() => setSelected(null)}>{tx.cancel}</button>
                  <button type="submit" className="btn-gold" style={{ flex: 2 }} disabled={submitting}>
                    {submitting ? '...' : tx.confirm}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
