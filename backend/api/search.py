from fastapi import APIRouter
from schemas.search_schemas import SearchRequest, SearchResult
from langchain.embeddings import HuggingFaceEmbeddings
from typing import List
from utils.vector_store import qdrant_client
from config import settings
from utils.mistral_model import RAGChain 


app = APIRouter(prefix="/search", tags=["search"])




embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")


rag = RAGChain(model_name="mistral")


@app.post("/search", response_model=dict)
def search(request: SearchRequest):
    query_vector = embedding_model.embed_query(request.query) 
    
    def quad_search_by_type(doc_type:str) -> List[SearchResult]:
        qdrant_fileter = {
            "must":[
                {
                    "key":"metadata.type",
                    "match":{
                        "value":doc_type
                    }
                }
            ]
        }  
        search_result = qdrant_client.search(
            collection_name = settings.QDRANT_COLLECTION,
            query_vector=query_vector,
            query_filter=qdrant_fileter,
            limit=request.k,
            with_vectors=True
        ) 
        
        return [
            SearchResult(
                text = hit.payload.get("page_content", "No content"),
                score = hit.score
            )
            for hit in search_result
        ]

    # video_results = quad_search_by_type("video")
    website_results = quad_search_by_type("website")
    
    # Merge top k chunks as context
    combined_context = "\n\n".join(
        [res.text for res in website_results]
    )

    # Generate response using RAG chain
    answer = rag.run(context=combined_context, question=request.query)

    return {
        "query": request.query,
        "context_sources": {
            # "video_results": video_results,
            "website_results": website_results,
        },
        "response": answer
    }