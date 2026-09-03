import os
from datetime import datetime
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo.errors import PyMongoError

try:
   from .database import client, free_slots, get_db
except ImportError:
   from database import client, free_slots, get_db

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

class FreeSlotCreate(BaseModel):
   building: str
   room: str
   floor: int
   start_time: datetime
   end_time: datetime
   day: str


@app.get("/health")
def health_check():
   try:
      client.admin.command("ping")
   except PyMongoError as error:
      raise HTTPException(status_code=503, detail="Database unavailable") from error
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
   db = Depends(get_db),
):
   current_time = time or datetime.now().strftime("%H:%M:%S")
   try:
      requested_time = datetime.strptime(current_time, "%H:%M:%S").time()
   except ValueError as error:
      raise HTTPException(status_code=400, detail="time must use HH:MM:SS format") from error
   filters = {
      "start_time": {"$lte": requested_time.strftime("%H:%M:%S")},
      "end_time": {"$gte": requested_time.strftime("%H:%M:%S")},
   }
   if building is not None:
      filters["building"] = building
   if floor is not None:
      filters["floor"] = floor
   if day is not None:
      filters["day"] = day
   unique_rooms = {}
   try:
      for table in free_slots.find(filters).sort("_id", 1):
         table["id"] = str(table.pop("_id"))
         room_key = (table["building"], table["floor"], table["room"])
         unique_rooms.setdefault(room_key, table)
   except PyMongoError as error:
      raise HTTPException(status_code=503, detail="Database unavailable") from error
   return list(unique_rooms.values())



@app.post("/tables")
def create_table(free_slot: FreeSlotCreate, db=Depends(get_db)):
   data = free_slot.model_dump()
   data["start_time"] = data["start_time"].time().isoformat()
   data["end_time"] = data["end_time"].time().isoformat()
   try:
      result = free_slots.insert_one(data)
      data["id"] = str(result.inserted_id)
   except PyMongoError as error:
      raise HTTPException(status_code=503, detail="Database unavailable") from error
   return data