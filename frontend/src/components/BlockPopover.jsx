import { useState, useEffect, useRef } from 'react'
import { toYMD, minsToTime, timeToMins } from '../lib/dates'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function timeOptions() {
  const opts = []
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {
      const time = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
      const label = h === 0 ? `12:${String(m).padStart(2,'0')} AM`
        : h < 12 ? `${h}:${String(m).padStart(2,'0')} AM`
        : h === 12 ? `12:${String(m).padStart(2,'0')} PM`
        : `${h-12}:${String(m).padStart(2,'0')} PM`
      opts.push({ value: time, label })
    }
  }
  return opts
}
const TIME_OPTS = timeOptions()

export default function BlockPopover({ initial, onSave, onClose, accentColor }) {
  const [label, setLabel]       = useState(initial?.label || '')
  const [type, setType]         = useState(initial?.type || 'oneoff')
  const [date, setDate]         = useState(initial?.date || toYMD(new Date()))
  const [days, setDays]         = useState(
    initial?.day_of_week != null ? [initial.day_of_week] : []
  )
  const [startTime, setStart]   = useState(initial?.start_time || '09:00')
  const [endTime, setEnd]       = useState(initial?.end_time || '10:00')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  const ref = useRef(null)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [onClose])

  function toggleDay(d) {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  function handleSave() {
    if (type === 'recurring' && days.length === 0) return
    const blocks = type === 'oneoff'
      ? [{ label: label || null, type, date, start_time: startTime, end_time: endTime }]
      : days.map(d => ({ label: label || null, type, day_of_week: d, start_time: startTime, end_time: endTime }))
    onSave(blocks)
  }

  const accent = accentColor || '#3b82f6'

  const formContent = (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: accent, marginRight: 10, flexShrink: 0 }} />
        <input
          autoFocus
          placeholder="Label (optional)"
          value={label}
          onChange={e => setLabel(e.target.value)}
          style={{
            flex: 1, border: 'none', outline: 'none', fontSize: isMobile ? 16 : 15, fontWeight: 500,
            color: '#1f2937', background: 'transparent',
          }}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20, padding: '0 4px', lineHeight: 1 }}
        >×</button>
      </div>

      {/* Type toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {['oneoff', 'recurring'].map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            style={{
              flex: 1, padding: isMobile ? '8px 0' : '6px 0', borderRadius: isMobile ? 8 : 6,
              border: `1px solid ${type === t ? accent : '#e5e7eb'}`,
              backgroundColor: type === t ? accent + '18' : '#fff',
              color: type === t ? accent : '#6b7280',
              fontSize: isMobile ? 14 : 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            {t === 'oneoff' ? 'One-off' : 'Recurring'}
          </button>
        ))}
      </div>

      {/* Date / day picker */}
      {type === 'oneoff' ? (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{
              width: '100%', padding: isMobile ? '10px 12px' : '7px 10px', borderRadius: isMobile ? 8 : 6,
              border: '1px solid #e5e7eb', fontSize: isMobile ? 14 : 13, color: '#1f2937', outline: 'none',
            }}
          />
        </div>
      ) : (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6 }}>Repeat on</label>
          <div style={{ display: 'flex', gap: isMobile ? 4 : 5 }}>
            {DAYS.map((d, i) => (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                style={{
                  flex: 1, height: isMobile ? 34 : 30, borderRadius: isMobile ? 8 : 6,
                  border: `1px solid ${days.includes(i) ? accent : '#e5e7eb'}`,
                  backgroundColor: days.includes(i) ? accent : '#fff',
                  color: days.includes(i) ? '#fff' : '#6b7280',
                  fontSize: 11, fontWeight: 500, cursor: 'pointer', padding: 0,
                }}
              >{d}</button>
            ))}
          </div>
        </div>
      )}

      {/* Time */}
      <div style={{ display: 'flex', gap: 8, marginBottom: isMobile ? 20 : 18, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>From</label>
          <select
            value={startTime}
            onChange={e => {
              setStart(e.target.value)
              if (timeToMins(e.target.value) >= timeToMins(endTime)) {
                setEnd(minsToTime(timeToMins(e.target.value) + 60))
              }
            }}
            style={{ width: '100%', padding: isMobile ? '10px 8px' : '7px 8px', borderRadius: isMobile ? 8 : 6, border: '1px solid #e5e7eb', fontSize: isMobile ? 14 : 13, color: '#1f2937', outline: 'none', background: '#fff' }}
          >
            {TIME_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <span style={{ color: '#9ca3af', marginTop: 18 }}>–</span>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>To</label>
          <select
            value={endTime}
            onChange={e => setEnd(e.target.value)}
            style={{ width: '100%', padding: isMobile ? '10px 8px' : '7px 8px', borderRadius: isMobile ? 8 : 6, border: '1px solid #e5e7eb', fontSize: isMobile ? 14 : 13, color: '#1f2937', outline: 'none', background: '#fff' }}
          >
            {TIME_OPTS.filter(o => timeToMins(o.value) > timeToMins(startTime)).map(o =>
              <option key={o.value} value={o.value}>{o.label}</option>
            )}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: isMobile ? 'stretch' : 'flex-end', gap: 8 }}>
        <button
          onClick={onClose}
          style={{ flex: isMobile ? 1 : undefined, padding: isMobile ? '12px 0' : '7px 16px', borderRadius: isMobile ? 8 : 6, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: isMobile ? 14 : 13, cursor: 'pointer', fontWeight: 500 }}
        >Cancel</button>
        <button
          onClick={handleSave}
          style={{ flex: isMobile ? 1 : undefined, padding: isMobile ? '12px 0' : '7px 16px', borderRadius: isMobile ? 8 : 6, border: 'none', background: accent, color: '#fff', fontSize: isMobile ? 14 : 13, fontWeight: 600, cursor: 'pointer' }}
        >Save</button>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.25)' }}>
        <div
          ref={ref}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: '#fff',
            borderTopLeftRadius: 16, borderTopRightRadius: 16,
            boxShadow: '0 -4px 32px rgba(0,0,0,0.15)',
            padding: '20px 20px 24px',
            animation: 'slideUp 0.2s ease-out',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#d1d5db' }} />
          </div>
          {formContent}
        </div>
      </div>
    )
  }

  // Desktop: centered floating card
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, pointerEvents: 'none' }}>
      <div
        ref={ref}
        style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          width: 340,
          padding: 20,
          pointerEvents: 'all',
        }}
      >
        {formContent}
      </div>
    </div>
  )
}
