'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

type Park = { id: string; name: string; address: string; color: string; active: boolean }
type Slot = {
  id: string; date: string; start_time: string; end_time: string
  duration_minutes: number; park_id: string; park_name: string; park_address: string
  max_bookings: number; booking_count: number; notes: string; is_blocked: boolean
}
type Booking = {
  id: string; slot_id: string; client_first_name: string; client_last_name: string
  client_email: string; client_phone: string; status: string; created_at: string
  language: string
}

type Tab = 'calendar' | 'slots' | 'bookings' | 'parks'

export default function CoachDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('calendar')
  const [parks, setParks] = useState<Park[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  // Add slot form
  const [form, setForm] = useState({
    park_id: '', date: '', start_time: '09:00', end_time: '10:00',
    duration_minutes: 60, max_bookings: 1, notes: ''
  })

  // Add park form
  const [parkForm, setParkForm] = useState({ name: '', address: '' })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: p }, { data: s }, { data: b }] = await Promise.all([
      supabase.from('parks').select('*').eq('active', true).order('name'),
      supabase.from('slots_with_details').select('*').gte('date', new Date().toISOString().split('T')[0]).order('date').order('start_time'),
      supabase.from('bookings').select('*, slots(date, start_time, parks(name))').eq('status', 'confirmed').order('created_at', { ascending: false }).limit(50),
    ])
    setParks(p || [])
    setSlots(s || [])
    setBookings(b || [])
    if (p && p.length > 0) setForm(f => ({ ...f, park_id: p[0].id }))
    setLoading(false)
  }

  async function addSlot(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('slots').insert([{
      park_id: form.park_id,
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time,
      duration_minutes: form.duration_minutes,
      max_bookings: form.max_bookings,
      notes: form.notes,
    }])
    if (!error) { loadAll(); setForm(f => ({ ...f, date: '', notes: '' })) }
  }

  async function deleteSlot(id: string) {
    if (!confirm('Supprimer ce créneau?')) return
    await supabase.from('slots').delete().eq('id', id)
    loadAll()
  }

  async function toggleBlock(id: string, blocked: boolean) {
    await supabase.from('slots').update({ is_blocked: !blocked }).eq('id', id)
    loadAll()
  }

  async function cancelBooking(id: string) {
    if (!confirm('Annuler cette réservation?')) return
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
    loadAll()
  }

  async function addPark(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('parks').insert([{ name: parkForm.name, address: parkForm.address }])
    setParkForm({ name: '', address: '' })
    loadAll()
  }

  async function deletePark(id: string) {
    if (!confirm('Supprimer ce parc?')) return
    await supabase.from('parks').update({ active: false }).eq('id', id)
    loadAll()
  }

  // Stats
  const totalUpcoming = slots.filter(s => !s.is_blocked).length
  const totalBooked = bookings.length
  const totalAvail = slots.filter(s => s.booking_count < s.max_bookings && !s.is_blocked).length

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: 'calendar', label: 'Calendrier', emoji: '📅' },
    { id: 'slots', label: 'Créneaux', emoji: '⏰' },
    { id: 'bookings', label: 'Réservations', emoji: '🎾' },
    { id: 'parks', label: 'Parcs', emoji: '📍' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Header */}
      <header style={{ background: 'var(--ink)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="font-display" style={{ color: 'var(--gold)', fontSize: 22, margin: 0, letterSpacing: 2 }}>ACE TENNIS</h1>
            <p style={{ color: '#555', margin: '2px 0 0', fontSize: 11, letterSpacing: 1 }}>TABLEAU DE BORD COACH</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <a href="/book" target="_blank" style={{ color: 'var(--gold)', fontSize: 13, textDecoration: 'none', border: '1px solid #333', borderRadius: 4, padding: '6px 12px' }}>
              Voir page client ↗
            </a>
            <button onClick={onLogout} style={{ background: 'none', border: '1px solid #333', borderRadius: 4, color: '#666', fontSize: 13, padding: '6px 12px', cursor: 'pointer' }}>
              Déconnexion
            </button>
          </div>
        </div>
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 24px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Créneaux à venir', value: totalUpcoming },
            { label: 'Places disponibles', value: totalAvail },
            { label: 'Réservations actives', value: totalBooked },
          ].map((s, i) => (
            <div key={i} className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '9px 18px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                background: tab === t.id ? 'var(--ink)' : 'white',
                color: tab === t.id ? 'var(--gold)' : '#666',
                boxShadow: tab === t.id ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
              }}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* ── CALENDAR TAB ─────────────────────────────── */}
        {tab === 'calendar' && (
          <div>
            {loading ? <p>Chargement...</p> : (
              Object.entries(
                slots.reduce((acc: Record<string, Slot[]>, s) => {
                  if (!acc[s.date]) acc[s.date] = []
                  acc[s.date].push(s)
                  return acc
                }, {})
              ).map(([date, daySlots]) => (
                <div key={date} style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#888' }}>
                      {format(parseISO(date), "EEEE d MMMM", { locale: fr })}
                    </h3>
                    <div style={{ height: 1, flex: 1, background: '#e8dfc0' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(daySlots as Slot[]).map(slot => (
                      <div key={slot.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', opacity: slot.is_blocked ? 0.5 : 1 }}>
                        <div style={{ minWidth: 90 }}>
                          <span style={{ fontSize: 15, fontWeight: 700 }}>{slot.start_time.slice(0, 5)}</span>
                          <span style={{ color: '#888', fontSize: 13 }}> – {slot.end_time.slice(0, 5)}</span>
                        </div>
                        <span className="park-badge">{slot.park_name}</span>
                        {slot.is_blocked && <span className="badge-cancelled">Bloqué</span>}
                        {!slot.is_blocked && slot.booking_count >= slot.max_bookings && <span className="badge-full" style={{ background: '#e8eaf6', color: '#3949ab' }}>Complet</span>}
                        {!slot.is_blocked && slot.booking_count < slot.max_bookings && <span className="badge-available">{slot.max_bookings - slot.booking_count} libre{slot.max_bookings - slot.booking_count > 1 ? 's' : ''}</span>}
                        {slot.notes && <span style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>{slot.notes}</span>}
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                          <button onClick={() => toggleBlock(slot.id, slot.is_blocked)} style={{ fontSize: 12, padding: '5px 10px', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', background: 'white', color: '#555' }}>
                            {slot.is_blocked ? '🔓 Débloquer' : '🔒 Bloquer'}
                          </button>
                          <button onClick={() => deleteSlot(slot.id)} style={{ fontSize: 12, padding: '5px 10px', border: '1px solid #f5c6c6', borderRadius: 4, cursor: 'pointer', background: 'white', color: '#c62828' }}>
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── SLOTS TAB ─────────────────────────────────── */}
        {tab === 'slots' && (
          <div>
            <div className="card" style={{ marginBottom: 24 }}>
              <h2 className="font-display" style={{ fontSize: 18, marginBottom: 20 }}>Ajouter un créneau</h2>
              <form onSubmit={addSlot}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Parc / Terrain *</label>
                    <select className="input-field" value={form.park_id} onChange={e => setForm({ ...form, park_id: e.target.value })} required>
                      {parks.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Date *</label>
                    <input className="input-field" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required min={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Début *</label>
                    <input className="input-field" type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Fin *</label>
                    <input className="input-field" type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Durée</label>
                    <select className="input-field" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: +e.target.value })}>
                      <option value={60}>60 min</option>
                      <option value={90}>90 min</option>
                      <option value={120}>120 min</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Nb places</label>
                    <input className="input-field" type="number" min={1} max={10} value={form.max_bookings} onChange={e => setForm({ ...form, max_bookings: +e.target.value })} />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Notes (optionnel)</label>
                  <input className="input-field" placeholder="ex: Court 3, apportez vos balles..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
                <button className="btn-gold" type="submit">+ Ajouter ce créneau</button>
              </form>
            </div>

            {/* Tips */}
            <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8, padding: 14, marginBottom: 20, fontSize: 13, color: '#6d4c00' }}>
              <strong>💡 Astuce :</strong> Pour bloquer un parc le matin et en ouvrir un autre l'après-midi, ajoute simplement deux créneaux distincts — un avec le Parc A (ex: 8h-12h) et un avec le Parc B (ex: 13h-17h). Chaque créneau est lié à un parc spécifique.
            </div>
          </div>
        )}

        {/* ── BOOKINGS TAB ──────────────────────────────── */}
        {tab === 'bookings' && (
          <div>
            <h2 className="font-display" style={{ fontSize: 18, marginBottom: 20 }}>Réservations actives</h2>
            {bookings.length === 0 && <p style={{ color: '#888' }}>Aucune réservation pour l'instant.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bookings.map(b => {
                const slot = slots.find(s => s.id === b.slot_id)
                return (
                  <div key={b.id} className="card" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{b.client_first_name} {b.client_last_name}</p>
                      <p style={{ margin: '3px 0', fontSize: 13, color: '#555' }}>{b.client_email}</p>
                      {b.client_phone && <p style={{ margin: '2px 0', fontSize: 13, color: '#888' }}>{b.client_phone}</p>}
                    </div>
                    {slot && (
                      <div style={{ minWidth: 160 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                          {format(parseISO(slot.date), "d MMM", { locale: fr })} · {slot.start_time.slice(0, 5)}
                        </p>
                        <span className="park-badge" style={{ marginTop: 6, display: 'inline-flex' }}>{slot.park_name}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="badge-confirmed">Confirmé</span>
                      <button onClick={() => cancelBooking(b.id)} style={{ fontSize: 12, padding: '5px 10px', border: '1px solid #f5c6c6', borderRadius: 4, cursor: 'pointer', background: 'white', color: '#c62828' }}>
                        Annuler
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── PARKS TAB ─────────────────────────────────── */}
        {tab === 'parks' && (
          <div>
            <div className="card" style={{ marginBottom: 24 }}>
              <h2 className="font-display" style={{ fontSize: 18, marginBottom: 20 }}>Ajouter un parc</h2>
              <form onSubmit={addPark}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Nom du parc *</label>
                    <input className="input-field" placeholder="ex: Parc des Érables" value={parkForm.name} onChange={e => setParkForm({ ...parkForm, name: e.target.value })} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Adresse</label>
                    <input className="input-field" placeholder="ex: 123 Rue des Sports, Blainville" value={parkForm.address} onChange={e => setParkForm({ ...parkForm, address: e.target.value })} />
                  </div>
                </div>
                <button className="btn-gold" type="submit">+ Ajouter ce parc</button>
              </form>
            </div>

            <h2 className="font-display" style={{ fontSize: 18, marginBottom: 16 }}>Mes parcs ({parks.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {parks.map(p => (
                <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700 }}>{p.name}</p>
                    {p.address && <p style={{ margin: '3px 0 0', fontSize: 13, color: '#888' }}>{p.address}</p>}
                  </div>
                  <button onClick={() => deletePark(p.id)} style={{ fontSize: 12, padding: '5px 10px', border: '1px solid #f5c6c6', borderRadius: 4, cursor: 'pointer', background: 'white', color: '#c62828' }}>
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
