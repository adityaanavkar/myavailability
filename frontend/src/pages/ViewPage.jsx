import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import CalendarGrid from '../components/CalendarGrid'
import { getWeekStart, addDays, formatMonthYear } from '../lib/dates'

export default function ViewPage() {
  const { viewId } = useParams()
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [dayCount, setDayCount] = useState(window.innerWidth < 640 ? 3 : 7)

  useEffect(() => {
    api.getView(viewId)
      .then(s => { setSchedule(s); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [viewId])

  if (loading) return (
    <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
      Loading…
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <p style={{ color: '#ef4444' }}>Could not load availability: {error}</p>
    </div>
  )

  const accent = schedule.accent_color || '#3b82f6'
  const weekLabel = formatMonthYear(weekStart)
  const displayName = schedule.name && schedule.name !== 'Your Name' ? schedule.name : 'Someone'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #e5e7eb', flexShrink: 0, background: '#fff', padding: '10px 14px' }}>
        {/* Name row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: accent, flexShrink: 0 }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>
            {displayName}'s availability
          </span>
        </div>
        {/* Nav row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={dayCount}
            onChange={e => setDayCount(Number(e.target.value))}
            style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, color: '#374151', background: '#fff', fontWeight: 500 }}
          >
            <option value={1}>Day</option>
            <option value={3}>3 Day</option>
            <option value={7}>Week</option>
          </select>
          <div style={{ display: 'flex', gap: 2 }}>
            <button onClick={() => setWeekStart(w => addDays(w, -dayCount))} style={navBtn}>‹</button>
            <button onClick={() => setWeekStart(w => addDays(w, dayCount))} style={navBtn}>›</button>
          </div>
          <span style={{ fontSize: 15, fontWeight: 500, color: '#1f2937', whiteSpace: 'nowrap' }}>{weekLabel}</span>
          <button
            onClick={() => setWeekStart(getWeekStart(new Date()))}
            style={{ marginLeft: 'auto', padding: '5px 10px', borderRadius: 20, border: '1px solid #e5e7eb', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#6b7280' }}
          >Today</button>
        </div>
      </div>

      {/* Calendar */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <CalendarGrid
          weekStart={weekStart}
          dayCount={dayCount}
          blocks={schedule.blocks}
          accentColor={accent}
          editable={false}
        />
      </div>

      {/* Empty state */}
      {schedule.blocks.length === 0 && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10,
          padding: '10px 20px', fontSize: 13, color: '#9ca3af', whiteSpace: 'nowrap',
        }}>
          No availability set yet.
        </div>
      )}
    </div>
  )
}

const navBtn = {
  width: 28, height: 28, borderRadius: '50%', border: '1px solid #e5e7eb',
  background: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex',
  alignItems: 'center', justifyContent: 'center', color: '#374151', lineHeight: 1,
}
