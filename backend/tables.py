from sqlalchemy import Column, DateTime, Float, Integer, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Free_slot(Base):
    __tablename__ = "free_slots"

    id = Column(Integer, primary_key=True)
    building = Column(String(50), nullable=False)
    room = Column(String(50), nullable=False)
    floor = Column(Integer, nullable=False, default=1)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)


class Building(Base):
    __tablename__ = "buildings"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    floors = Column(Integer, nullable=False, default=0)

