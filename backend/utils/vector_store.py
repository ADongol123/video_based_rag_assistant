from qdrant_client import QdrantClient
from langchain.vectorstores import Qdrant
from langchain.embeddings import HuggingFaceEmbeddings
from qdrant_client.http import models as rest
from config import settings  # Your .env-based config class

embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")

qdrant_client = QdrantClient(url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY)

def get_qdrant_vectorstore():
    return Qdrant(
        client=qdrant_client,
        collection_name=settings.QDRANT_COLLECTION,
        embeddings=embedding_model
    ).as_retriever(search_kwargs={
        "k": 5,
        "filter": rest.Filter(
            must=[
                rest.FieldCondition(
                    key="type",
                    match=rest.MatchAny(any=["website"]) #Video add
                )
            ]
        )
    })



def ensure_qdrant_collection_exists():
    if not qdrant_client.collection_exists(collection_name=settings.QDRANT_COLLECTION):
        qdrant_client.recreate_collection(
            collection_name=settings.QDRANT_COLLECTION,
            vectors_config={
                "size": 768,          
                "distance": "Cosine"  
            }
        )
