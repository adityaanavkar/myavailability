import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import CalendarGrid from '../components/CalendarGrid'
import BlockPopover from '../components/BlockPopover'
import { getWeekStart, addDays, formatMonthYear, toYMD, formatTime } from '../lib/dates'

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
]

export default function EditPage() {
  const { editId } = useParams()

  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [popover, setPopover]   = useState(null)
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [copied, setCopied]     = useState(false)
  const [saving, setSaving]     = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dayCount, setDayCount] = useState(window.innerWidth < 640 ? 3 : 7)

  useEffect(() => {
    api.getEdit(editId)
      .then(s => { setSchedule(s); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [editId])

  const accentColor = schedule?.accent_color || '#3b82f6'
  const viewUrl = schedule ? `${window.location.origin}/view/${schedule.id}` : ''

  async function handleColorChange(color) {
    setSchedule(s => ({ ...s, accent_color: color }))
    await api.updateSchedule(editId, { accent_color: color })
  }

  async function handleNameChange(name) {
    setSchedule(s => ({ ...s, name }))
    setSaving(true)
    await api.updateSchedule(editId, { name })
    setSaving(false)
  }

  async function handleSaveBlocks(blocksData) {
    setPopover(null)
    const newBlocks = await Promise.all(blocksData.map(b => api.addBlock(editId, b)))
    setSchedule(s => ({ ...s, blocks: [...s.blocks, ...newBlocks] }))
  }

  async function handleDeleteBlock(block) {
    setSelectedBlock(null)
    await api.deleteBlock(editId, block.id)
    setSchedule(s => ({ ...s, blocks: s.blocks.filter(b => b.id !== block.id) }))
  }

  function handleSlotClick(date, startTime, endTime) {
    setPopover({ date: toYMD(date), start_time: startTime, end_time: endTime })
    setSelectedBlock(null)
  }

  function handleBlockClick(block) {
    setSelectedBlock(block)
    setPopover(null)
  }

  async function copyViewLink() {
    await navigator.clipboard.writeText(viewUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const weekLabel = formatMonthYear(weekStart)

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen error={error} />

  const recurringBlocks = schedule.blocks.filter(b => b.type === 'recurring')
  const oneoffBlocks    = schedule.blocks.filter(b => b.type === 'oneoff')
  const DOW_LABEL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      {/* ── Mobile top bar ── */}
      <div className="mobile-topbar" style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
        height: 52, borderBottom: '1px solid #e5e7eb', flexShrink: 0, background: '#fff',
      }}>
        <button
          onClick={() => setSidebarOpen(true)}
          className="sidebar-toggle"
          style={{
            width: 34, height: 34, borderRadius: 8, border: '1px solid #e5e7eb',
            background: '#fff', cursor: 'pointer', fontSize: 18, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#374151', flexShrink: 0,
          }}
        >☰</button>
        <select
          value={dayCount}
          onChange={e => setDayCount(Number(e.target.value))}
          style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, color: '#374151', background: '#fff', flexShrink: 0, fontWeight: 500 }}
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
          style={{ marginLeft: 'auto', padding: '5px 10px', borderRadius: 20, border: '1px solid #e5e7eb', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#374151', fontWeight: 500, flexShrink: 0 }}
        >Today</button>
      </div>

      {/* ── Desktop layout (sidebar + calendar) ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar — visible on desktop, hidden on mobile (shown as overlay) */}
        <div className="sidebar-desktop" style={{
          width: 268, flexShrink: 0, borderRight: '1px solid #e5e7eb',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff',
        }}>
          <SidebarContent
            schedule={schedule}
            accentColor={accentColor}
            viewUrl={viewUrl}
            copied={copied}
            saving={saving}
            recurringBlocks={recurringBlocks}
            oneoffBlocks={oneoffBlocks}
            DOW_LABEL={DOW_LABEL}
            onNameChange={handleNameChange}
            onColorChange={handleColorChange}
            onCopyLink={copyViewLink}
            onDeleteBlock={handleDeleteBlock}
          />
        </div>

        {/* Calendar */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Desktop-only top bar (hidden on mobile where we use the mobile-topbar) */}
          <div className="desktop-topbar" style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px',
            height: 56, borderBottom: '1px solid #e5e7eb', flexShrink: 0,
          }}>
            <button
              onClick={() => setWeekStart(getWeekStart(new Date()))}
              style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#374151', fontWeight: 500 }}
            >Today</button>
            <div style={{ display: 'flex', gap: 2 }}>
              <button onClick={() => setWeekStart(w => addDays(w, -dayCount))} style={navBtn}>‹</button>
              <button onClick={() => setWeekStart(w => addDays(w, dayCount))} style={navBtn}>›</button>
            </div>
            <span style={{ fontSize: 17, fontWeight: 500, color: '#1f2937' }}>{weekLabel}</span>
            <div style={{ marginLeft: 'auto' }}>
              <select
                value={dayCount}
                onChange={e => setDayCount(Number(e.target.value))}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, color: '#374151', background: '#fff' }}
              >
                <option value={1}>Day</option>
                <option value={3}>3 Day</option>
                <option value={7}>Week</option>
              </select>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <CalendarGrid
              weekStart={weekStart}
              dayCount={dayCount}
              blocks={schedule.blocks}
              accentColor={accentColor}
              editable={true}
              onSlotClick={handleSlotClick}
              onBlockClick={handleBlockClick}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 900 }}
          onClick={() => setSidebarOpen(false)}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
          <div
            onClick={e => e.stopPropagation()}
            className="sidebar-sheet"
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              maxHeight: '75dvh', background: '#fff',
              borderTopLeftRadius: 16, borderTopRightRadius: 16,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
              animation: 'slideUp 0.2s ease-out',
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#d1d5db' }} />
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <SidebarContent
                schedule={schedule}
                accentColor={accentColor}
                viewUrl={viewUrl}
                copied={copied}
                saving={saving}
                recurringBlocks={recurringBlocks}
                oneoffBlocks={oneoffBlocks}
                DOW_LABEL={DOW_LABEL}
                onNameChange={handleNameChange}
                onColorChange={handleColorChange}
                onCopyLink={copyViewLink}
                onDeleteBlock={handleDeleteBlock}
              />
            </div>
          </div>
        </div>
      )}

      {/* Block delete tooltip */}
      {selectedBlock && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1f2937', color: '#fff', borderRadius: 10, padding: '10px 18px',
          display: 'flex', alignItems: 'center', gap: 12, zIndex: 500,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)', maxWidth: 'calc(100vw - 32px)',
        }}>
          <span style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedBlock.label || 'Available'} · {formatTime(selectedBlock.start_time)} – {formatTime(selectedBlock.end_time)}
          </span>
          <button
            onClick={() => handleDeleteBlock(selectedBlock)}
            style={{ padding: '4px 12px', borderRadius: 6, background: '#ef4444', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 500, flexShrink: 0 }}
          >Delete</button>
          <button
            onClick={() => setSelectedBlock(null)}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }}
          >×</button>
        </div>
      )}

      {/* Create popover */}
      {popover && (
        <BlockPopover
          initial={popover}
          accentColor={accentColor}
          onSave={handleSaveBlocks}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  )
}

function SidebarContent({ schedule, accentColor, viewUrl, copied, saving, recurringBlocks, oneoffBlocks, DOW_LABEL, onNameChange, onColorChange, onCopyLink, onDeleteBlock }) {
  return (
    <>
      {/* Name */}
      <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid #f3f4f6' }}>
        <input
          value={schedule.name === 'Your Name' ? '' : schedule.name}
          placeholder="Your name"
          onChange={e => onNameChange(e.target.value || 'Your Name')}
          style={{
            width: '100%', fontSize: 20, fontWeight: 700, color: '#1f2937',
            border: 'none', outline: 'none', background: 'transparent', padding: 0,
          }}
        />
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
          {schedule.timezone}{saving ? ' · saving…' : ''}
        </div>
      </div>

      {/* View link */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>Share link</div>
        <div style={{
          background: '#f9fafb', borderRadius: 8, padding: '8px 10px',
          fontSize: 12, color: '#6b7280', marginBottom: 8,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {viewUrl}
        </div>
        <button
          onClick={onCopyLink}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 8,
            border: `1px solid ${accentColor}`,
            background: copied ? accentColor : '#fff',
            color: copied ? '#fff' : accentColor,
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {copied ? '✓ Copied!' : 'Copy view link'}
        </button>
      </div>

      {/* Accent color */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10, fontWeight: 500 }}>Accent color</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => onColorChange(c)}
              style={{
                width: 30, height: 30, borderRadius: 8, background: c, border: 'none',
                cursor: 'pointer', outline: accentColor === c ? `2px solid ${c}` : 'none',
                outlineOffset: 2, flexShrink: 0,
              }}
            />
          ))}
          <input
            type="color"
            value={accentColor}
            onChange={e => onColorChange(e.target.value)}
            title="Custom color"
            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer', padding: 2 }}
          />
        </div>
      </div>

      {/* Block list */}
      <div style={{ padding: '14px 18px' }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10, fontWeight: 500 }}>
          Availability ({schedule.blocks.length})
        </div>

        {schedule.blocks.length === 0 && (
          <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>
            Tap any time slot on the calendar to add your availability.
          </p>
        )}

        {recurringBlocks.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recurring</div>
            {recurringBlocks.map(b => (
              <BlockListItem key={b.id} block={b} label={DOW_LABEL[b.day_of_week]} accentColor={accentColor} onDelete={() => onDeleteBlock(b)} />
            ))}
          </>
        )}

        {oneoffBlocks.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: recurringBlocks.length ? 10 : 0, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>One-off</div>
            {oneoffBlocks.map(b => (
              <BlockListItem key={b.id} block={b} label={b.date} accentColor={accentColor} onDelete={() => onDeleteBlock(b)} />
            ))}
          </>
        )}
      </div>
    </>
  )
}

const navBtn = {
  width: 28, height: 28, borderRadius: '50%', border: '1px solid #e5e7eb',
  background: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex',
  alignItems: 'center', justifyContent: 'center', color: '#374151', lineHeight: 1,
}

function BlockListItem({ block, label, accentColor, onDelete }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px',
      borderRadius: 6, marginBottom: 4, background: '#f9fafb',
    }}>
      <div style={{ width: 8, height: 8, borderRadius: 2, background: accentColor, flexShrink: 0 }} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {block.label || 'Available'}
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>
          {label} · {formatTime(block.start_time)}–{formatTime(block.end_time)}
        </div>
      </div>
      <button
        onClick={onDelete}
        style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 18, padding: '0 4px', lineHeight: 1, flexShrink: 0 }}
        title="Delete"
      >×</button>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
      Loading…
    </div>
  )
}

function ErrorScreen({ error }) {
  return (
    <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <p style={{ color: '#ef4444' }}>Could not load schedule: {error}</p>
      <a href="/" style={{ color: '#3b82f6', fontSize: 14 }}>← Back to home</a>
    </div>
  )
}
