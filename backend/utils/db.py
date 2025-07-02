import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pymongo import ASCENDING
load_dotenv() 

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI not set in environment variables")

client = AsyncIOMotorClient(MONGO_URI)
db = client['course_database']
transcripts_collection = db['parsed_data']
user_collection = db['users']
scraped_collection = db["scraped_Data"]
course_collection = db["course_collection"]

# Ensure email unique index
async def ensure_indexes():
    await user_collection.create_index([("email",ASCENDING)], unique=True)
