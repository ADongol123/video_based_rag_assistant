import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()  # take environment variables from .env.

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI not set in environment variables")

client = MongoClient(MONGO_URI)
db = client['youtube_rag']
transcripts_collection = db['transcripts']
