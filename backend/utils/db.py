import os
from pymongo import MongoClient
from dotenv import load_dotenv
from pymongo import ASCENDING
load_dotenv() 

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI not set in environment variables")

client = MongoClient(MONGO_URI)
db = client['course_database']
transcripts_collection = db['parsed_data']
user_collection = db['users']


# Ensure email unique index
async def ensure_indexes():
    await user_collection.create_index([("email",ASCENDING)], unique=True)
