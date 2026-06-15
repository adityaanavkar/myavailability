# Availability Calendar — Project Context

## What is this?
A minimalist availability sharing tool. User sets their free time slots on a Google Calendar-style weekly view, gets a shareable read-only link. No accounts, no invites, no meeting creation — just "here's when I'm free."

Core use case: eliminate the "what times work for you?" back-and-forth in chat.

## Stack
- **Backend**: FastAPI + SQLite (`backend/`)
- **Frontend**: React + Vite + Tailwind CSS (`frontend/`)
- **No auth** — uses two UUID links per schedule: private edit link, public view link

## How to run
```bash
cd ~/pep/calendar
./start.sh
# Backend: http://localhost:8000
# Frontend: http://localhost:5173
```
Requires Node 20 (installed via fnm at `~/.local/share/fnm/node-versions/v20.20.2/`) and Python venv at `./venv/`.

## Architecture

### Backend (`backend/`)
- `main.py` — FastAPI app, all routes, CORS configured for `*`
- `database.py` — SQLite setup, `get_conn()`, `init_db()` creates tables
- `models.py` — Pydantic schemas for request validation
- DB file: `backend/availability.db` (auto-created on first run)

### Frontend (`frontend/`)
- `src/App.jsx` — Router: `/` (auto-create), `/edit/:editId`, `/view/:viewId`
- `src/pages/AutoCreate.jsx` — Hits `/` → checks localStorage for existing schedule, creates one if none, redirects to edit
- `src/pages/EditPage.jsx` — Main editing interface: sidebar (name, share link, colors, block list) + calendar grid
- `src/pages/ViewPage.jsx` — Read-only calendar view for shared links
- `src/components/CalendarGrid.jsx` — Core reusable week grid (used by both edit & view)
- `src/components/BlockPopover.jsx` — Modal for creating availability blocks (one-off or recurring)
- `src/lib/api.js` — All fetch calls to backend
- `src/lib/dates.js` — Date utilities (week start, formatting, time conversion)

### Data Model
- `schedules` table: id (view_uuid PK), edit_id, name, timezone, accent_color, created_at
- `availability_blocks` table: id, schedule_id FK, label, type (recurring|oneoff), day_of_week, date, start_time, end_time

### API Endpoints
- `POST /api/schedule` → create schedule, returns `{view_id, edit_id}`
- `GET /api/schedule/view/<view_id>` → get schedule + blocks (public)
- `GET /api/schedule/edit/<edit_id>` → get schedule + blocks (owner)
- `PUT /api/schedule/edit/<edit_id>` → update name/timezone/color
- `POST /api/schedule/<edit_id>/blocks` → add availability block
- `DELETE /api/schedule/<edit_id>/blocks/<block_id>` → remove block

## Key Design Decisions
- **No landing page** — `/` auto-creates a schedule and drops user into edit view immediately. Zero friction.
- **localStorage** stores `my_schedules` array so user can return to their schedule without auth
- **Accent color** stored on schedule, applies to all blocks on both edit and view
- **Recurring blocks** repeat on selected weekdays across all weeks; one-off blocks show only on their specific date
- **Calendar grid** has sticky day headers (pinned top), time gutter scrolls vertically with content
- Vite dev server proxies `/api` → `localhost:8000` (configured in `vite.config.js`)

## Future Plans (designed for but not implemented)
- Multi-user accounts (add `user_id` to schedules)
- Overlay view: stack multiple people's schedules on one grid in different colors
- The `accent_color` per schedule and `color` field on blocks support this already

## Gotchas
- Frontend uses inline styles (not Tailwind classes) for most layout — this was a conscious choice for the calendar grid's precise pixel positioning
- Day-of-week in DB: 0=Mon, 1=Tue … 6=Sun (different from JS Date.getDay() where 0=Sun)
- The DB file is gitignored if you add a .gitignore — it's auto-created on startup
