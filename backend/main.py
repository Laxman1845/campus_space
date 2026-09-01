from datetime import datetime
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

try:
   from . import tables
   from .database import engine, get_db
except ImportError:
   import tables
   from database import engine, get_db

app = FastAPI()
app.add_middleware(
   CORSMiddleware,
   allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
   allow_origins=[
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
      "http://localhost:5175",
      "http://127.0.0.1:5175",
      "capacitor://localhost",
      "http://localhost",
      "http://127.0.0.1",
   ],
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


@app.get("/tables")
def get_tables(
   building: str | None = None,
   floor: int | None = None,
   time: str | None = None,
   db: Session = Depends(get_db),
):
   current_time = time or datetime.now().strftime("%H:%M:%S")
   query = db.query(tables.Free_slot).filter(
      func.to_char(tables.Free_slot.start_time, "HH24:MI:SS") <= current_time,
      func.to_char(tables.Free_slot.end_time, "HH24:MI:SS") >= current_time,
   )
   if building is not None:
      query = query.filter(tables.Free_slot.building == building)
   if floor is not None:
      query = query.filter(tables.Free_slot.floor == floor)
   return query.all()



@app.post("/tables")
def create_table(free_slot: FreeSlotCreate, db: Session = Depends(get_db)):
   table = tables.Free_slot(**free_slot.model_dump())
   db.add(table)
   db.commit()
   db.refresh(table)
   return table