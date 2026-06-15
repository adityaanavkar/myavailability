from pydantic import BaseModel, field_validator
from typing import Optional, Literal


class ScheduleCreate(BaseModel):
    name: str = "My Availability"
    timezone: str = "UTC"
    accent_color: str = "#3b82f6"


class ScheduleUpdate(BaseModel):
    name: Optional[str] = None
    timezone: Optional[str] = None
    accent_color: Optional[str] = None


class BlockCreate(BaseModel):
    label: Optional[str] = None
    type: Literal["recurring", "oneoff"]
    day_of_week: Optional[int] = None   # 0=Mon … 6=Sun, for recurring
    date: Optional[str] = None          # YYYY-MM-DD, for oneoff
    start_time: str                     # HH:MM
    end_time: str                       # HH:MM

    @field_validator("day_of_week")
    @classmethod
    def check_dow(cls, v):
        if v is not None and not (0 <= v <= 6):
            raise ValueError("day_of_week must be 0–6")
        return v
