'use client'
import { useState, useEffect } from 'react'
import CoachDashboard from '@/components/CoachDashboard'

export default function CoachPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (sessionStorage.getItem('coach_authed') === '1') setAuthed(true)
    setChecking(false)
  }, [])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) })
    if (res.ok) {
      sessionStorage.setItem('coach_authed', '1')
      setAuthed(true)
    } else {
      setError('Mot de passe incorrect / Wrong password')
    }
  }

  if (checking) return null

  if (!authed) return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 360, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 className="font-display" style={{ color: 'var(--gold)', fontSize: 28, letterSpacing: 3 }}>ACE TENNIS</h1>
          <p style={{ color: '#666', fontSize: 12, letterSpacing: 1, marginTop: 4 }}>COACH ACCESS</p>
        </div>
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', marginBottom: 32 }} />
        <form onSubmit={login}>
          <label style={{ display: 'block', color: '#888', fontSize: 12, letterSpacing: 1, marginBottom: 8 }}>MOT DE PASSE</label>
          <input
            type="password"
            className="input-field"
            value={pw}
            onChange={e => setPw(e.target.value)}
            autoFocus
            style={{ marginBottom: 16, background: '#1a1a1a', color: 'white', borderColor: '#333' }}
          />
          {error && <p style={{ color: '#e57373', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button className="btn-gold" type="submit" style={{ width: '100%' }}>Entrer →</button>
        </form>
      </div>
    </div>
  )

  return <CoachDashboard onLogout={() => { sessionStorage.removeItem('coach_authed'); setAuthed(false) }} />
}
