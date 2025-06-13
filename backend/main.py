# backend/main.py

from fastapi import FastAPI, Query, HTTPException,UploadFile,File
from utils.downlaoder import download_audio_webm,download_youtube_video
from utils.transcriber import transcribe_audio
from utils.db import transcripts_collection
from utils.embedder import EmbeddingManager
from utils.mistral_model import RAGChain 
from utils.db import client, db, transcripts_collection
import asyncio
from concurrent.futures import ThreadPoolExecutor
from utils.concurrent import async_transcribe, async_parse_frames 
from utils.helper import update_transcript_with_images
from utils.llava_model import LlavaModel
from datetime import datetime
import requests
from typing import List
from bs4 import BeautifulSoup
import re
import os 
import re
import asyncio
import shutil
from utils.website_scrapper import get_chapter_links, extract_page_content
from sentence_transformers import SentenceTransformer
from utils.chunking import refined_spacy_chunks
from utils.embeddings import embed_and_store, generate_embeddings_for_mongo
# from config import embedding_model
from utils.vector_store import ensure_qdrant_collection_exists,get_qdrant_vectorstore
from pydantic import BaseModel
from langchain.embeddings import HuggingFaceEmbeddings
from config import settings
from utils.vector_store import qdrant_client
from qdrant_client.models import PayloadSchemaType
from utils.V2.scrapper import scrape_schedule_table_with_links, save_to_mongodb
model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")  # or any other model you prefer
app = FastAPI()
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

# llava_model = LlavaModel()

rag = RAGChain(model_name="mistral")

mongo_client = client
db = db
collection = transcripts_collection



UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def root():
    return {"message": "YouTube RAG Assistant is running!"}
# ------------------------------------------------------------------------------
@app.post("/scrape-and-save",tags=["Scraping"])
def scrape_and_save():
    try:
        rows = scrape_schedule_table_with_links("https://inst.eecs.berkeley.edu/~cs188/su25/")
        if not rows:
            raise HTTPException(status_code=404, detail="No data scraped from the website.")
        inserted_count = save_to_mongodb(rows)
        return {"message": f"{inserted_count} rows inserted into MongoDB."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




# ------------------------------------------------------------------------------
@app.get("/transcribe")
async def transcribe_and_process(youtube_url: str = Query(...)):
    resp = requests.get(youtube_url)
    soup = BeautifulSoup(resp.text, "html.parser")
    
    # Title
    title_tag = soup.find("h1")
    title = title_tag.text.strip() if title_tag else "title_tag not found"
    

    try:
        print("[Step 1] Starting downloads...")
        audio_path = download_audio_webm(youtube_url)
        print(f"[Step 1] Audio downloaded: {audio_path}")

        video_path = download_youtube_video(youtube_url)
        print(f"[Step 1] Video downloaded: {video_path}")

        print("[Step 2] Starting concurrent transcription and image parsing...")
        transcript_task = async_transcribe(audio_path)
        images_task = async_parse_frames(video_path)

        transcript, image_segments = await asyncio.gather(transcript_task, images_task)
        print(f"[Step 2] Transcription and image parsing done.")

        print("[Step 3] Updating transcript with images...")
        updated_transcript = update_transcript_with_images(transcript, image_segments)
        print("[Step 3] Transcript updated with images.")

        print("[Step 4] Inserting document to DB...")
         # Prepare metadata
        metadata = {
            "date": datetime.today().strftime("%Y-%m-%d"),
            "module": "CS188",  # define or extract this accordingly
            "topic": title,  # define or extract this accordingly
            "chunk_id": 1
        }

        # Prepare document to insert
        doc = {
            "source": youtube_url,
            "embedings": [],  # fill embeddings later
            "type": "website",
            "title": title,  # you should extract this from video metadata or elsewhere
            "content": updated_transcript,  # or serialize if needed
            "metadata": metadata
        }
        result = transcripts_collection.insert_one(doc)
        print(f"[Step 4] Inserted to DB with id: {result.inserted_id}")

        excerpt = " ".join([block["text"] for block in updated_transcript])[:500] + "..."
        print("[Step 5] Returning response.")
        return {
            "message": "Transcription and image parsing complete",
            "db_id": str(result.inserted_id),
            "excerpt": excerpt
        }

    except Exception as e:
        print(f"[ERROR] {str(e)}")
        return {"error": str(e)}

@app.post("/upload/video")
async def upload_and_process_video(file: UploadFile = File(...)):
    try:
        # [STEP 1] Save uploaded video
        filename = file.filename
        save_path = os.path.join(UPLOAD_DIR, filename)
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        print(f"[Step 1] Video uploaded: {save_path}")

        # [STEP 2] Extract title and lecture number
        m = re.search(r"chapter(\d+)", filename.lower())
        lecture_number = int(m.group(1)) if m else None
        title = filename.replace("_", " ").replace(".mp4", "").title()

        # [STEP 3] Start transcription and image extraction
        transcript_task = async_transcribe(save_path)
        images_task = async_parse_frames(save_path)
        transcript, image_segments = await asyncio.gather(transcript_task, images_task)
        print("[Step 2] Transcription and image parsing done.")

        # [STEP 4] Update transcript with image segments
        updated_transcript = update_transcript_with_images(transcript, image_segments)
        print("[Step 3] Transcript updated with images.")

        # [STEP 5] Create document
        metadata = {
            "date": datetime.today().strftime("%Y-%m-%d"),
            "module": "CS188",  # You can make this dynamic too
            "topic": title,
            "lecture_number": lecture_number,
            "chunk_id": 1
        }

        doc = {
            "source": filename,
            "embedings": [],
            "type": "video",
            "title": title,
            "content": updated_transcript,
            "metadata": metadata
        }

        result = transcripts_collection.insert_one(doc)
        print(f"[Step 4] Inserted to DB with id: {result.inserted_id}")

        excerpt = " ".join([block["text"] for block in updated_transcript])[:500] + "..."
        return {
            "message": "Upload, transcription, and parsing complete.",
            "db_id": str(result.inserted_id),
            "excerpt": excerpt
        }

    except Exception as e:
        print(f"[ERROR] {str(e)}")
        return {"error": str(e)}
    

@app.get("/scrape/website")
def scrape_all_chapters():
    try:
        links = get_chapter_links()
        print(f"Found {len(links)} chapters to scrape.")
        
        inserted_ids = []
        for url in links:
            doc  = extract_page_content(url)
            result = transcripts_collection.insert_one(doc)
            inserted_ids.append(str(result.inserted_id))
            
        return {
            "message": "Scraping compeleted",
            "total": len(inserted_ids),
            "inserted_ids": inserted_ids
        }
    
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


from bson import ObjectId

def fix_mongo_document(doc):
    if not doc:
        return doc
    doc = dict(doc) 
    if "_id" in doc and isinstance(doc["_id"], ObjectId):
        doc["_id"] = str(doc["_id"])
    return doc




@app.get("/create_embeddings")
def create_embeddings():
    try:
        fetch = transcripts_collection.find({"type": "website"})

        for doc in fetch:
            doc_id = doc["_id"]
            segments = doc.get("content", [])

            # Ensure segments are dicts with "text" field
            if not segments or not isinstance(segments[0], dict):
                continue

            full_text = "\n".join([seg.get("text", "") for seg in segments])
            if not full_text.strip():
                continue

            # Chunk and refine
            refined_chunks = refined_spacy_chunks(full_text)

            # Add metadata to each chunk
            chunk_texts = []
            for idx, chunk in enumerate(refined_chunks):
                chunk_text = chunk.page_content
                metadata = {
                    "doc_id": str(doc_id),
                    "chunk_index": idx,
                    "type": doc.get("type", "unknown"),
                    "source_title": doc.get("title", "untitled"),
                }
                chunk.metadata = metadata
                chunk_texts.append({
                    "text": chunk_text,
                    "metadata": metadata
                })

            # Ensure Qdrant collection exists
            ensure_qdrant_collection_exists()

            # Store in Qdrant
            embed_and_store(refined_chunks)

            # Save chunks + metadata to MongoDB
            transcripts_collection.update_one(
                {"_id": doc_id},
                {"$set": {"embeddings": chunk_texts}}
            )

        return {"status": "Embeddings created, stored in Qdrant, and chunk texts saved in MongoDB."}
    
    except Exception as e:
        return {"error": str(e)}


class SearchResult(BaseModel):
    text: str
    score: float

class SearchResultsByType(BaseModel):
    video_results: List[SearchResult]
    website_results: List[SearchResult]


class SearchRequest(BaseModel):
    query: str
    k: int = 5
    
embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")

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
