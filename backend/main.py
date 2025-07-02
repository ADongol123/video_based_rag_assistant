from api.auth import auth_routes
from utils.db import ensure_indexes
from fastapi import FastAPI
from config import settings
from utils.vector_store import qdrant_client
from qdrant_client.models import PayloadSchemaType
from fastapi.middleware.cors import CORSMiddleware
from api.classsify import app as classify_router
from api.embeddings import app as embeddings_router
from api.scrapping import app as scraping_router
from api.search import app as search_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["*"],                 
    allow_headers=["*"],
)

@app.on_event("startup")
def setup_qdrant_indexes():
    try:
        qdrant_client.create_payload_index(
            collection_name=settings.QDRANT_COLLECTION,
            field_name="metadata.type",
            field_schema=PayloadSchemaType.KEYWORD
        )
        print("Index for 'metadata.type' created successfully.")
    except Exception as e:
        print(f"Index creation skipped or failed: {e}")



    
@app.get("/")
def root():
    return {"message": "YouTube RAG Assistant is running!"}

app.include_router(auth_routes.app)
app.include_router(classify_router)
app.include_router(embeddings_router)
app.include_router(scraping_router)
app.include_router(search_router)



@app.on_event("startup")
def startup_event():
    ensure_indexes()



# @app.get("/transcribe")
# def transcribe_youtube_video(youtube_url: str = Query(..., description="YouTube Video URL")):
#     try:
#         audio_path = download_audio_webm(youtube_url)
#         transcript, transcript_path = transcribe_audio(audio_path)
        
#         # Build your document to insert
#         doc = {
#             "youtube_url": youtube_url,
#             "transcript": transcript,
#             "transcript_path": transcript_path,
#         }
        
#         # Insert into MongoDB
#         result = transcripts_collection.insert_one(doc)
        
#         # Join all transcript segments into a string for the excerpt
#         full_text = " ".join([block["text"] for block in transcript])
        
#         return {
#             "message": "Transcription complete",
#             "transcript_path": transcript_path,
#             "db_id": str(result.inserted_id),
#             "excerpt": full_text[:500] + "..."
#         }
#     except Exception as e:
#         return {"error": str(e)}



# video_embedder = EmbeddingManager("video_chunks")
# general_embedder = EmbeddingManager("knowledge_base")
# rag_chain = RAGChain("mistral")  # or "llama2", etc. in Ollama


# def is_image_related(question: str) -> bool:
#     image_keywords = ["image", "picture", "frame", "screenshot", "visual"]
#     return any(kw in question.lower() for kw in image_keywords)


# @app.get("/generate-answer")
# def generate_answer(youtube_url: str = Query(...), question: str = Query(...)):
#     # Clear previous chunks only related to this video
#     video_embedder.clear(youtube_url=youtube_url)

#     # Fetch document from MongoDB
#     video_doc = collection.find_one({"youtube_url": youtube_url})
#     if not video_doc:
#         raise HTTPException(status_code=404, detail="Video not found in the database")

#     # Extract and combine transcript text
#     transcript_segments = video_doc.get("transcript", [])
#     full_text = " ".join(segment["text"] for segment in transcript_segments if "text" in segment)

#     # Chunk the text
#     chunks = [
#         {
#             "text": full_text[i:i+300],
#             "source": "video",
#             "chunk_id": i,
#             "youtube_url": youtube_url  # Important for selective clearing
#         }
#         for i in range(0, len(full_text), 300)
#     ]

#     # Add to vector DB
#     video_embedder.add_chunks(chunks)

#     # Query both video and general embeddings
#     context_docs = video_embedder.query(text=question, n_results=3)
#     extra_knowledge = general_embedder.query(text=question, n_results=2)

#     # Extract documents from response
#     combined_context = "\n".join(context_docs['documents'][0] + extra_knowledge['documents'][0])

#     # If image-related, find matching image URLs from transcript
#     images = []
#     answers_from_images = []
#     if is_image_related(question):
#         for segment in transcript_segments:
#             if "images" in segment:
#                 images.extend(segment["images"])
#         if images:
#             answers_from_images = llava_model.answer_from_images(images, question)

#     answer = rag_chain.run(combined_context, question)


#     return {
#         "question": question,
#         "answer": answer,
#         "context_used": context_docs['documents'][0],
#         "images": answers_from_images if answers_from_images else None
#     }
