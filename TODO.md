# TODO

## Completed
- [x] Backend: FastAPI + SQLite with all CRUD endpoints
- [x] Frontend: React + Vite + Tailwind scaffold
- [x] CalendarGrid component (Google Calendar-style week view)
- [x] Edit page with sidebar (name, link, colors, block list) + interactive grid
- [x] View page (read-only shared link)
- [x] Block creation popover (one-off / recurring, time pickers)
- [x] Auto-create flow (no landing page friction)
- [x] Fix scroll alignment — day headers pinned, time gutter + content scroll together
- [x] Fix time labels not showing in gutter
- [x] Make name field more prominent (larger font)
- [x] Remove useless "click a time slot" hint from top right

## In Progress
- (none)

## Pending / Next
- [ ] View page blocks not rendering when opened from copy-link (verify data flow — may be a stale localStorage issue where user copies link of wrong schedule)
- [ ] Add current time indicator line (red horizontal line like Google Calendar)
- [ ] Mobile responsive layout (sidebar collapses to bottom sheet or hidden)
- [ ] Drag to select time range (instead of just click for 1hr default)
- [ ] Polish: empty state on view page should show name clearly not "Your Name"
- [ ] Deploy: backend to Render, frontend to Vercel
- [ ] Add .gitignore (exclude venv/, node_modules/, *.db, dist/)

## Future Features (designed for, not started)
- [ ] User accounts / auth layer
- [ ] Overlay view (multiple people's schedules on one grid)
- [ ] Timezone conversion for viewer (show in viewer's local time)
- [ ] Edit existing blocks (not just delete + re-create)
- [ ] Week vs day view toggle
