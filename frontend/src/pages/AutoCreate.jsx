import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

export default function AutoCreate() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    async function init() {
      // Check if user already has a schedule
      const stored = JSON.parse(localStorage.getItem('my_schedules') || '[]')
      if (stored.length > 0) {
        navigate(`/edit/${stored[0].edit_id}`, { replace: true })
        return
      }

      // Auto-create a new schedule with placeholder name
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
        const data = await api.createSchedule({ name: 'Your Name', timezone: tz })
        const entry = { name: 'Your Name', edit_id: data.edit_id, view_id: data.view_id, created: new Date().toISOString() }
        localStorage.setItem('my_schedules', JSON.stringify([entry]))
        navigate(`/edit/${data.edit_id}`, { replace: true })
      } catch (e) {
        setError(e.message)
      }
    }
    init()
  }, [navigate])

  if (error) {
    return (
      <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
        {error}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
      Loading…
    </div>
  )
}
