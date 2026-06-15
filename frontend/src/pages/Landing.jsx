import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

export default function Landing() {
  const navigate = useNavigate()
  const [name, setName]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const data = await api.createSchedule({ name: name.trim(), timezone: tz })
      // Store the edit_id in localStorage so the user can always get back to it
      const stored = JSON.parse(localStorage.getItem('my_schedules') || '[]')
      stored.unshift({ name: name.trim(), edit_id: data.edit_id, view_id: data.view_id, created: new Date().toISOString() })
      localStorage.setItem('my_schedules', JSON.stringify(stored))
      navigate(`/edit/${data.edit_id}`)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#fafafa' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo / title */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#1f2937', letterSpacing: '-0.5px' }}>availa</span>
          </div>
          <p style={{ color: '#6b7280', fontSize: 15, margin: 0, lineHeight: 1.6 }}>
            Share your availability with a simple link.<br />No sign-up, no invites.
          </p>
        </div>

        {/* Create card */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 28, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
            Your name
          </label>
          <input
            autoFocus
            placeholder="e.g. Aditya"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8,
              border: '1px solid #d1d5db', fontSize: 15, color: '#1f2937',
              outline: 'none', marginBottom: 16,
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#3b82f6'}
            onBlur={e => e.target.style.borderColor = '#d1d5db'}
          />

          {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            style={{
              width: '100%', padding: '11px 0', borderRadius: 8, border: 'none',
              background: name.trim() ? '#3b82f6' : '#e5e7eb',
              color: name.trim() ? '#fff' : '#9ca3af',
              fontSize: 15, fontWeight: 500, cursor: name.trim() ? 'pointer' : 'default',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Creating…' : 'Create my availability page →'}
          </button>
        </div>

        {/* Existing schedules */}
        <ExistingSchedules />

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 32 }}>
          Your edit link is private. Only your view link is shared.
        </p>
      </div>
    </div>
  )
}

function ExistingSchedules() {
  const navigate = useNavigate()
  const stored = JSON.parse(localStorage.getItem('my_schedules') || '[]')
  if (stored.length === 0) return null

  return (
    <div style={{ marginTop: 24 }}>
      <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 10, textAlign: 'center' }}>Your existing pages</p>
      {stored.slice(0, 5).map(s => (
        <button
          key={s.edit_id}
          onClick={() => navigate(`/edit/${s.edit_id}`)}
          style={{
            display: 'flex', alignItems: 'center', width: '100%', padding: '10px 14px',
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 6,
            cursor: 'pointer', textAlign: 'left', gap: 10,
          }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <span style={{ flex: 1, fontSize: 14, color: '#374151', fontWeight: 500 }}>{s.name}</span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>Open →</span>
        </button>
      ))}
    </div>
  )
}
