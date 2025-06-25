import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv() 

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI not set in environment variables")

client = MongoClient(MONGO_URI)
db = client['course_database']
transcripts_collection = db['parsed_data']
