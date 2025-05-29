from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings
from typing import List, Dict


class EmbeddingManager:
    def __init__(self, collection_name:str, persist_directory:str = "./chromadb"):
        self.model = SentenceTransformer("all-mpnet-base-v2")
        self.chroma_client = chromadb.Client(Settings(persist_directory=persist_directory))
        self.collection = self.chroma_client.get_or_create_collection(name=collection_name)
        
    def add_chunks(self, chunks: List[Dict]):
        ids = [str(i) for i in range(len(chunks))]
        documents = [chunk['text'] for chunk in chunks]
        metadatas = [{k: v for k,v in chunk.items() if k != 'text'} for chunk in chunks]
        embeddings = self.model.encode(documents, normalize_embeddings=True).tolist()
        self.collection.add(documents=documents, embeddings=embeddings, metadatas=metadatas, ids=ids)
        
    
    def query(self, text:str, n_results:int = 5):
        query_embedding = self.model.encode(text, normalize_embeddings=True).tolist()
        return self.collection.query(query_embeddings=[query_embedding], n_results=n_results)
    
    def clear(self, youtube_url: str):
        # Delete only embeddings related to the given video
        self.collection.delete(where={"youtube_url": youtube_url})