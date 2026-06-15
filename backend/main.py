import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, get_conn
from models import ScheduleCreate, ScheduleUpdate, BlockCreate

app = FastAPI(title="Availability Calendar API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


# ── helpers ──────────────────────────────────────────────────────────────────

def row_to_dict(row):
    return dict(row) if row else None


def schedule_payload(row, blocks):
    d = row_to_dict(row)
    d["blocks"] = [row_to_dict(b) for b in blocks]
    return d


# ── schedules ─────────────────────────────────────────────────────────────────

@app.post("/api/schedule", status_code=201)
def create_schedule(body: ScheduleCreate):
    view_id = str(uuid.uuid4())
    edit_id = str(uuid.uuid4())
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO schedules (id, edit_id, name, timezone, accent_color) VALUES (?,?,?,?,?)",
            (view_id, edit_id, body.name, body.timezone, body.accent_color),
        )
    return {"view_id": view_id, "edit_id": edit_id}


@app.get("/api/schedule/view/{view_id}")
def get_schedule_view(view_id: str):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM schedules WHERE id = ?", (view_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Schedule not found")
        blocks = conn.execute(
            "SELECT * FROM availability_blocks WHERE schedule_id = ? ORDER BY type, day_of_week, date, start_time",
            (view_id,),
        ).fetchall()
    return schedule_payload(row, blocks)


@app.get("/api/schedule/edit/{edit_id}")
def get_schedule_edit(edit_id: str):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM schedules WHERE edit_id = ?", (edit_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Schedule not found")
        blocks = conn.execute(
            "SELECT * FROM availability_blocks WHERE schedule_id = ? ORDER BY type, day_of_week, date, start_time",
            (row["id"],),
        ).fetchall()
    return schedule_payload(row, blocks)


@app.put("/api/schedule/edit/{edit_id}")
def update_schedule(edit_id: str, body: ScheduleUpdate):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM schedules WHERE edit_id = ?", (edit_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Schedule not found")
        updates = {k: v for k, v in body.model_dump().items() if v is not None}
        if updates:
            sets = ", ".join(f"{k} = ?" for k in updates)
            conn.execute(f"UPDATE schedules SET {sets} WHERE edit_id = ?", (*updates.values(), edit_id))
        updated = conn.execute("SELECT * FROM schedules WHERE edit_id = ?", (edit_id,)).fetchone()
        blocks = conn.execute(
            "SELECT * FROM availability_blocks WHERE schedule_id = ?", (updated["id"],)
        ).fetchall()
    return schedule_payload(updated, blocks)


# ── blocks ────────────────────────────────────────────────────────────────────

@app.post("/api/schedule/{edit_id}/blocks", status_code=201)
def add_block(edit_id: str, body: BlockCreate):
    with get_conn() as conn:
        row = conn.execute("SELECT id FROM schedules WHERE edit_id = ?", (edit_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Schedule not found")

        if body.type == "recurring" and body.day_of_week is None:
            raise HTTPException(422, "day_of_week required for recurring blocks")
        if body.type == "oneoff" and body.date is None:
            raise HTTPException(422, "date required for oneoff blocks")

        cur = conn.execute(
            """INSERT INTO availability_blocks
               (schedule_id, label, type, day_of_week, date, start_time, end_time)
               VALUES (?,?,?,?,?,?,?)""",
            (row["id"], body.label, body.type, body.day_of_week, body.date,
             body.start_time, body.end_time),
        )
        block_id = cur.lastrowid
        block = conn.execute("SELECT * FROM availability_blocks WHERE id = ?", (block_id,)).fetchone()
    return row_to_dict(block)


@app.delete("/api/schedule/{edit_id}/blocks/{block_id}", status_code=204)
def delete_block(edit_id: str, block_id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT id FROM schedules WHERE edit_id = ?", (edit_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Schedule not found")
        result = conn.execute(
            "DELETE FROM availability_blocks WHERE id = ? AND schedule_id = ?",
            (block_id, row["id"]),
        )
        if result.rowcount == 0:
            raise HTTPException(404, "Block not found")
