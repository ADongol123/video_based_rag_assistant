import os
from dotenv import load_dotenv
from pymongo import MongoClient
from qdrant_client import QdrantClient
from langchain.embeddings import HuggingFaceEmbeddings

load_dotenv()


class Settings:
    # General
    SECRET_KEY = os.getenv("SECRET_KEY")

    # MongoDB
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    DB_NAME = os.getenv("MONGO_DB", "your_db")
    COLLECTION_NAME = os.getenv("MONGO_COLLECTION", "your_transcripts")

    # Qdrant
    QDRANT_URL = os.getenv("QDRANT_URL")
    QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
    
    QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "video_rag_embeddings")

    QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
    QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
    
    # Embedding model
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-mpnet-base-v2")
    
    # Classifier
    HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")


settings = Settings()

# DB Clients (can be used throughout your app)
mongo_client = MongoClient(settings.MONGO_URI)
transcripts_collection = mongo_client[settings.DB_NAME][settings.COLLECTION_NAME]

qdrant_client = QdrantClient(url=settings.QDRANT_URL)

embedding_model = HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL)
