from sqlalchemy import Column, Float, Index, Integer, String, Time
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Free_slot(Base):
    __tablename__ = "free_slots"
    __table_args__ = (
        Index("ix_free_slots_availability", "building", "floor", "day", "start_time", "end_time"),
    )

    id = Column(Integer, primary_key=True)
    building = Column(String(50), nullable=False)
    room = Column(String(50), nullable=False)
    floor = Column(Integer, nullable=False, default=1)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    day = Column(String(20), nullable=True)


class Building(Base):
    __tablename__ = "buildings"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    floors = Column(Integer, nullable=False, default=0)

