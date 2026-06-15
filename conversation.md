# Conversation Log

## Session 1 — 2026-06-15 — Initial Build

### Context
User (Aditya) wants a minimalist availability sharing tool — like Google Calendar's appointment scheduling page but much simpler. No invites, no meeting creation, no accounts. Just "set your free times, share a link, people see when you're available."

Reference UIs: tweek.so (for minimalism), Google Calendar week view (for the visual layout of full colored blocks), Google Calendar's quick-create popover (for the add-block interaction).

### Decisions Made
- **Stack**: FastAPI + SQLite backend, React + Vite + Tailwind frontend
- **No accounts**: Two UUID links (edit private, view public). localStorage remembers edit links.
- **No landing page**: Visiting `/` auto-creates a schedule and redirects to edit. Zero friction.
- **Blocks**: Both recurring (repeat on weekdays) and one-off (specific date). Stored in `availability_blocks` table.
- **Accent color**: User picks from 8 presets + custom. Stored on schedule, applies to all blocks.
- **View page**: Pure read-only. No buttons, no actions. Just colored blocks.
- **Future-proof**: Schema supports multi-user overlay (color per block, UUID-based model extensible to user accounts).

### Work Done
1. Built entire backend — FastAPI app with SQLite, all 6 API endpoints, tested with curl
2. Built entire frontend — auto-create landing, edit page (sidebar + interactive grid + popover), view page
3. Fixed scroll bug — restructured CalendarGrid so day headers are pinned and time gutter scrolls with content
4. Fixed time labels not rendering (absolute positioning was clipping in overflow container — switched to flow layout)
5. Made name field larger/more prominent, removed useless hint text from top-right

### Known Issues at End of Session
- View page shows "Your Name's availability" when opened from auto-created schedule (user needs to set name first)
- Half-hour grid lines are very faint (`#f9fafb` dashed) — may need to be slightly more visible
- No current time indicator (red line)
- No mobile layout yet
- No .gitignore yet

### User Preferences Observed
- Wants zero friction — no extra clicks, no unnecessary pages
- Prefers Google Calendar's visual style (full colored blocks, clean headers)
- Dislikes: circles/chips for time slots, excess options, cluttered UI
- Values: clean, minimal, just works
