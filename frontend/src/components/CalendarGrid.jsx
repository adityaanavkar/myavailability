import { useRef, useEffect, useState } from 'react'
import {
  addDays, toYMD, formatDayLabel, timeToMins, formatTime
} from '../lib/dates'

const HOUR_START = 7
const HOUR_END   = 22
const TOTAL_HOURS = HOUR_END - HOUR_START
const HOUR_PX    = 56
const HEADER_H   = 44

function getBlocksForDay(blocks, date) {
  const ymd = toYMD(date)
  const dow = date.getDay() === 0 ? 6 : date.getDay() - 1

  return blocks.filter(b => {
    if (b.type === 'recurring') return b.day_of_week === dow
    if (b.type === 'oneoff')    return b.date === ymd
    return false
  })
}

function TimeBlock({ block, accentColor, onClick, editable }) {
  const startMins = timeToMins(block.start_time)
  const endMins   = timeToMins(block.end_time)
  const top    = ((startMins - HOUR_START * 60) / 60) * HOUR_PX
  const height = Math.max(((endMins - startMins) / 60) * HOUR_PX, 20)

  const bg      = accentColor || '#3b82f6'
  const bgLight = bg + '33'

  return (
    <div
      onClick={(e) => { e.stopPropagation(); editable && onClick && onClick(block) }}
      data-block="1"
      style={{
        position: 'absolute',
        top, height,
        left: 2, right: 2,
        backgroundColor: bgLight,
        borderLeft: `3px solid ${bg}`,
        borderRadius: 4,
        padding: '2px 4px',
        overflow: 'hidden',
        cursor: editable ? 'pointer' : 'default',
        userSelect: 'none',
        zIndex: 2,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 600, color: bg, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {block.label || 'Available'}
      </div>
      {height > 30 && (
        <div style={{ fontSize: 9, color: bg, opacity: 0.8, lineHeight: 1.3 }}>
          {formatTime(block.start_time)} – {formatTime(block.end_time)}
        </div>
      )}
    </div>
  )
}

export default function CalendarGrid({
  weekStart,
  dayCount = 7,
  blocks = [],
  accentColor = '#3b82f6',
  editable = false,
  onSlotClick,
  onBlockClick,
}) {
  const scrollRef = useRef(null)
  const days = Array.from({ length: dayCount }, (_, i) => addDays(weekStart, i))
  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i)
  const today = toYMD(new Date())
  const gridHeight = TOTAL_HOURS * HOUR_PX

  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const GUTTER_W = isMobile ? 36 : 52

  function handleColumnClick(e, date) {
    if (!editable || !onSlotClick) return
    if (e.target.closest('[data-block]')) return

    const col = e.currentTarget
    const rect = col.getBoundingClientRect()
    const y = e.clientY - rect.top
    const totalMins = HOUR_START * 60 + Math.floor((y / HOUR_PX) * 60)
    const snapped = Math.round(totalMins / 30) * 30
    const startTime = `${String(Math.floor(snapped / 60)).padStart(2,'0')}:${String(snapped % 60).padStart(2,'0')}`
    const endMins   = Math.min(snapped + 60, HOUR_END * 60)
    const endTime   = `${String(Math.floor(endMins / 60)).padStart(2,'0')}:${String(endMins % 60).padStart(2,'0')}`
    onSlotClick(date, startTime, endTime)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* ─── Sticky day headers row ─── */}
      <div style={{ display: 'flex', flexShrink: 0, borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ width: GUTTER_W, flexShrink: 0, borderRight: '1px solid #e5e7eb' }} />
        {days.map((date, di) => {
          const isToday = toYMD(date) === today
          return (
            <div key={di} style={{
              flex: 1, minWidth: 0, height: HEADER_H,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              borderRight: di < dayCount - 1 ? '1px solid #f3f4f6' : 'none',
            }}>
              <span style={{ fontSize: isMobile ? 9 : 11, color: '#6b7280', fontWeight: 500, letterSpacing: '0.03em' }}>
                {isMobile ? formatDayLabel(date).slice(0, 3).toUpperCase() : formatDayLabel(date)}
              </span>
              <span style={{
                width: isMobile ? 24 : 28, height: isMobile ? 24 : 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', fontSize: isMobile ? 12 : 14, fontWeight: isToday ? 600 : 400,
                backgroundColor: isToday ? accentColor : 'transparent',
                color: isToday ? '#fff' : '#374151',
                marginTop: 1,
              }}>
                {date.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      {/* ─── Scrollable body ─── */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', paddingTop: 6, WebkitOverflowScrolling: 'touch' }}>
        {/* Time gutter */}
        <div style={{ width: GUTTER_W, flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb' }}>
          {hours.map(h => (
            <div key={h} style={{ height: HOUR_PX, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: isMobile ? 4 : 8 }}>
              <span style={{ fontSize: isMobile ? 9 : 11, color: '#9ca3af', userSelect: 'none', whiteSpace: 'nowrap', transform: 'translateY(-7px)' }}>
                {isMobile
                  ? (h === 12 ? '12p' : h < 12 ? `${h}a` : `${h-12}p`)
                  : (h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`)
                }
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((date, di) => {
          const dayBlocks = getBlocksForDay(blocks, date)
          return (
            <div
              key={di}
              onClick={(e) => handleColumnClick(e, date)}
              style={{
                flex: 1, minWidth: 0, position: 'relative', height: gridHeight,
                borderRight: di < dayCount - 1 ? '1px solid #f3f4f6' : 'none',
                cursor: editable ? 'cell' : 'default',
              }}
            >
              {hours.map(h => (
                <div key={h} style={{
                  position: 'absolute', top: (h - HOUR_START) * HOUR_PX, left: 0, right: 0,
                  borderTop: '1px solid #f3f4f6', pointerEvents: 'none',
                }} />
              ))}
              {hours.slice(0, -1).map(h => (
                <div key={`${h}h`} style={{
                  position: 'absolute', top: (h - HOUR_START) * HOUR_PX + 28, left: 0, right: 0,
                  borderTop: '1px dashed #eee', pointerEvents: 'none',
                }} />
              ))}
              {dayBlocks.map(block => (
                <TimeBlock
                  key={block.id}
                  block={block}
                  accentColor={accentColor}
                  editable={editable}
                  onClick={onBlockClick}
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
