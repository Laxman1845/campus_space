import os
from datetime import datetime
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

try:
   from . import tables
   from .database import engine, get_db
except ImportError:
   import tables
   from database import engine, get_db

app = FastAPI()
frontend_url = os.getenv("FRONTEND_URL")
allowed_origins = [
   "http://localhost:5173",
   "http://127.0.0.1:5173",
   "http://localhost:5174",
   "http://127.0.0.1:5174",
   "http://localhost:5175",
   "http://127.0.0.1:5175",
   "capacitor://localhost",
   "http://localhost",
   "http://127.0.0.1",
]
if frontend_url:
   allowed_origins.append(frontend_url.rstrip("/"))

app.add_middleware(
   CORSMiddleware,
   allow_origin_regex=r"(http://(localhost|127\.0\.0\.1):\d+|https://[a-zA-Z0-9-]+\.vercel\.app)",
   allow_origins=allowed_origins,
   allow_credentials=True,
   allow_methods=["*"],
   allow_headers=["*"],
)

tables.Base.metadata.create_all(bind=engine)


class FreeSlotCreate(BaseModel):
   building: str
   room: str
   floor: int
   start_time: datetime
   end_time: datetime
   day: str


@app.get("/health")
def health_check():
   return {"status": "ok"}


@app.get("/")
def root():
   return {"status": "ok", "service": "campus-space-api"}


@app.get("/tables")
def get_tables(
   building: str | None = None,
   floor: int | None = None,
   time: str | None = None,
   day: str | None = None,
   db: Session = Depends(get_db),
):
   current_time = time or datetime.now().strftime("%H:%M:%S")
   try:
      requested_time = datetime.strptime(current_time, "%H:%M:%S").time()
   except ValueError as error:
      raise HTTPException(status_code=400, detail="time must use HH:MM:SS format") from error
   query = db.query(tables.Free_slot).filter(
      tables.Free_slot.start_time <= requested_time,
      tables.Free_slot.end_time >= requested_time,
   )
   if building is not None:
      query = query.filter(tables.Free_slot.building == building)
   if floor is not None:
      query = query.filter(tables.Free_slot.floor == floor)
   if day is not None:
      query = query.filter(tables.Free_slot.day == day)
   unique_rooms = {}
   for table in query.order_by(tables.Free_slot.id).all():
      room_key = (table.building, table.floor, table.room)
      unique_rooms.setdefault(room_key, table)
   return list(unique_rooms.values())



@app.post("/tables")
def create_table(free_slot: FreeSlotCreate, db: Session = Depends(get_db)):
   table = tables.Free_slot(**free_slot.model_dump())
   db.add(table)
   db.commit()
   db.refresh(table)
   return table