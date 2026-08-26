from datetime import datetime
from fastapi import Depends, FastAPI
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
app.add_middleware(
   CORSMiddleware,
   allow_origins=[
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "capacitor://localhost",
      "http://localhost",
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
   db: Session = Depends(get_db),
):
   now = datetime.now()
   query = db.query(tables.Free_slot).filter(
      tables.Free_slot.start_time <= now,
      tables.Free_slot.end_time >= now,
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