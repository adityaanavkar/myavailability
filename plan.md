# Availability Calendar — Plan

## Core Idea
Eliminate the "when are you free?" back-and-forth in chat.  
User sets their availability once, shares a clean read-only link.  
Viewer sees a beautiful weekly view with full colored blocks — no invites, no signups.

---

## Stack

| Layer | Tech | Why |
|---|---|---|
| Backend | FastAPI + SQLite | Zero infra cost, simple, easy Postgres migration later |
| Frontend | React + Vite | Fast dev, easy deployment |
| Styling | Tailwind CSS | Utility-first, clean minimal look |
| Deploy Backend | Render.com (free tier) | Zero cost, auto-deploys from git |
| Deploy Frontend | Vercel (free tier) | Zero cost, global CDN |

---

## Link Model (no accounts)

Every "user" gets two UUIDs generated at first setup:
- **Edit link**: `app.com/edit/<edit_uuid>` — private, only for the owner
- **View link**: `app.com/view/<view_uuid>` — shareable, read-only

These are linked in the DB. Owner bookmarks their edit link. No passwords needed for v1.

Future: add auth layer on top of this same model without breaking existing links.

---

## Data Model

### `schedules` table
```
id            TEXT PRIMARY KEY  (view_uuid)
edit_id       TEXT UNIQUE       (edit_uuid)
name          TEXT              (display name shown on view page e.g. "Aditya's Availability")
timezone      TEXT              (e.g. "Asia/Kolkata")
accent_color  TEXT              (hex, e.g. "#1a73e8" — owner's chosen color, default blue)
created_at    DATETIME
```

### `availability_blocks` table
```
id              INTEGER PRIMARY KEY
schedule_id     TEXT FK → schedules.id
type            TEXT   ("recurring" | "oneoff")
-- For recurring:
day_of_week     INTEGER  (0=Mon … 6=Sun, NULL for oneoff)
start_time      TEXT     ("HH:MM")
end_time        TEXT     ("HH:MM")
-- For one-off:
date            TEXT     ("YYYY-MM-DD", NULL for recurring)
start_time      TEXT     ("HH:MM")
end_time        TEXT     ("HH:MM")
label           TEXT     (optional note e.g. "morning free", nullable)
color           TEXT     (hex, nullable — for future multi-person view)
```

---

## Pages / Routes

### Frontend Routes
| Route | Who sees it | Purpose |
|---|---|---|
| `/` | Everyone | Landing — "Create your availability page" button, generates edit+view UUIDs |
| `/edit/<edit_uuid>` | Owner only | Full edit view — add/remove blocks, set name, timezone |
| `/view/<view_uuid>` | Anyone with link | Read-only weekly view — clean, no UI clutter |

### Backend API
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/schedule` | Create new schedule → returns `{view_id, edit_id}` |
| GET | `/api/schedule/view/<view_id>` | Get schedule for viewer |
| GET | `/api/schedule/edit/<edit_id>` | Get schedule for editor (verify ownership) |
| PUT | `/api/schedule/edit/<edit_id>` | Update name/timezone |
| POST | `/api/schedule/<edit_id>/blocks` | Add availability block |
| DELETE | `/api/schedule/<edit_id>/blocks/<block_id>` | Remove a block |

---

## UI Design

Reference: Google Calendar week view aesthetic — clean white grid, thin day columns, time labels on left, full colored blocks.

### View Page (what the shared link shows)
- Google Calendar-style week view — day columns, hour rows, time labels on left
- **Full colored blocks** spanning their exact time range (not chips/circles)
- Block color = owner's chosen accent color
- Recurring slots appear on every matching weekday
- One-off slots show only on their specific date
- Week navigation (prev/next arrows) + "Today" button
- Header: "Aditya's availability" + timezone shown subtly
- No buttons, no actions, no clutter — pure read

### Edit Page (owner's private page)
- **Left sidebar** (~280px): owner name, timezone picker, accent color picker, "Copy view link" button, list of all blocks with delete (×) per block
- **Right area**: same Google Calendar-style weekly grid, interactive
- **Click any empty time slot** → small floating popover appears (like GCal's quick-create):
  - Label (optional, e.g. "morning")
  - Start time / End time (pre-filled from where you clicked)
  - Toggle: Recurring (select days of week) or One-off (date already set from click)
  - Save / Cancel
- Click an existing block → shows delete option inline
- Accent color from sidebar applies to all blocks live

### Accent Color
- Stored on the `schedules` table as `accent_color` (hex)
- Owner picks it in the sidebar (a small swatch palette — ~8 preset colors + custom)
- All blocks on both edit and view pages render in this color
- Future: each person in a multi-overlay view gets their own color automatically

---

## Build Phases

### Phase 1 — Backend Foundation
- [ ] FastAPI app setup with SQLite via `sqlite3` or `SQLModel`
- [ ] `schedules` + `availability_blocks` tables
- [ ] All API endpoints working + tested with curl/httpie
- [ ] CORS configured for frontend

### Phase 2 — Frontend Shell
- [ ] Vite + React + Tailwind setup
- [ ] Landing page — creates schedule, stores UUIDs in localStorage, redirects to edit
- [ ] Weekly calendar grid component (reusable for both view + edit)
- [ ] Week navigation logic (handle recurring vs one-off correctly)

### Phase 3 — View Page
- [ ] Fetch and render availability blocks as full colored time blocks
- [ ] Recurring slots rendered across all weeks
- [ ] Clean typography, owner name, timezone
- [ ] Mobile responsive

### Phase 4 — Edit Page
- [ ] Click to add block (popover form)
- [ ] Recurring vs one-off toggle in form
- [ ] Delete block (click on block → delete button)
- [ ] "Copy view link" button
- [ ] Optimistic UI updates

### Phase 5 — Polish
- [ ] Loading states, error states
- [ ] Empty state (no blocks yet — prompt to add)
- [ ] Favicon, page title, meta tags for share preview
- [ ] Deploy backend to Render, frontend to Vercel

---

## Future — Multi-User / Collaboration (designed for from day 1)
The `color` field on blocks and the UUID-based model already support this.

When we add accounts:
- User logs in → their `schedule` row gets a `user_id`  
- "Overlay" feature: give the app multiple `view_ids` → renders them in different colors on one grid
- "Send your availability" flow: share your edit link with a friend → they add your view to their own view
- No data model changes needed — just new UI and auth layer on top

---

## File Structure (target)
```
calendar/
├── venv/
├── backend/
│   ├── main.py          # FastAPI app
│   ├── database.py      # SQLite setup + models
│   ├── models.py        # Pydantic schemas
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CalendarGrid.jsx    # core reusable grid
│   │   │   ├── TimeBlock.jsx       # a single availability block
│   │   │   └── BlockForm.jsx       # add/edit block popover
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── EditPage.jsx
│   │   │   └── ViewPage.jsx
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
└── plan.md
```
