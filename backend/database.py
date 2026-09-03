import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv(Path(__file__).resolve().parent / ".env")

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "campus_space")
MONGODB_COLLECTION = os.getenv("MONGODB_COLLECTION", "campus")

client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
database = client[MONGODB_DB]
free_slots = database[MONGODB_COLLECTION]
buildings = database["buildings"]


def get_db():
    return database
