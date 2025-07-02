# backend/main.py
# auth_routes
from auth import auth_routes
from utils.db import ensure_indexes


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
from bson import ObjectId
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
from utils.V2.scrapper import scrape_schedule_table_with_links, save_to_mongodb,crawl_all_pages
from utils.V2.scrapper import collection,extract_page_content
from tqdm import tqdm
from pathlib import Path
from urllib.parse import urlparse, urljoin, parse_qs
from pathlib import Path
import uuid
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from template_prompt.classifier import route_and_answer
from fastapi.middleware.cors import CORSMiddleware

model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")  # or any other model you prefer

scraped_collection = db["scraped_Data"]
course_collection = db["course_collection"]
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

# llava_model = LlavaModel()

rag = RAGChain(model_name="mistral")

mongo_client = client
db = db
# collection = transcripts_collection



UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)



class QueryInput(BaseModel):
    question: str
    
    
@app.get("/")
def root():
    return {"message": "YouTube RAG Assistant is running!"}
# ------------------------------------------------------------------------------
# AUTH ROUTES
app.include_router(auth_routes.app)

@app.on_event("startup")
def startup_event():
    ensure_indexes()
# -------------------------------------------------------------------------------
class QueryInput(BaseModel):
    question: str
    

class QuestionInput(BaseModel):
    question: str

class ClassificationOutput(BaseModel):
    category: str
# --- Exposed Function for main.py ---
# --- Final Function Called by API ---
# Optional helper function for FastAPI
@app.post("/classify/", response_model=ClassificationOutput)
def classify_question(payload: QuestionInput):
    answer = route_and_answer(payload)
    print("✅ Final Answer:\n", answer)

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

def convert_objectid(doc):
    doc["_id"] = str(doc["_id"])
    return doc

def is_youtube_url(url: str) -> bool:
    return "youtube.com/watch" in url or "youtu.be/" in url


def get_local_video_ids_from_folder():
    video_folder = Path("videos")  
    video_ids = []
    pattern = re.compile(r"\[([A-Za-z0-9_-]{11})\]")  # YouTube ID format

    # List files (filtering for video extensions if needed)
    for file in video_folder.iterdir():
        if file.is_file():
            match = pattern.search(file.name)
            if match:
                video_ids.append(match.group(1))
    return video_ids


def extract_youtube_id(url: str) -> str | None:
    """
    Extract the video ID from a YouTube URL.
    Supports formats like:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    """
    parsed = urlparse(url)
    if "youtube" in parsed.netloc:
        query = parse_qs(parsed.query)
        if "v" in query:
            return query["v"][0]
        # fallback for embed or other formats:
        path_parts = parsed.path.split('/')
        if len(path_parts) > 2 and path_parts[1] == 'embed':
            return path_parts[2]
    elif "youtu.be" in parsed.netloc:
        return parsed.path.lstrip('/')
    return None

# Helper function to find matching audio file
def find_audio_file(youtube_id: str, audio_dir="audios") -> Path | None:
    extensions = [".mkv", ".webm", ".mp4", ".mp3"]
    for ext in extensions:
        candidate = Path(audio_dir) / f"[{youtube_id}]{ext}"
        if candidate.exists():
            return candidate.resolve()
    return None

@app.post("/scrape-table", tags=["Scraping"])
async def scrape_table():
    try:
        audio_folder = Path("videos")
        video_folder = Path("videos")
        supported_extensions = [".webm", ".mkv", ".mp4"]

        processed_files = 0

        for audio_file in audio_folder.iterdir():
            if not audio_file.is_file() or audio_file.suffix.lower() not in supported_extensions:
                continue

            # Extract base name like [YOUTUBEID]
            base_name = audio_file.stem  # e.g., "[EEMP1AlPpaI]"
            youtube_id = base_name.strip("[]")
            title = f"Local Video [{youtube_id}]"

            video_path = audio_file
            if not video_path.exists():
                print(f"❌ Skipping: Video file not found for {youtube_id}")
                continue

            print(f"\n🎞️ Processing local video: {youtube_id}")
            await transcribe_and_process(str(video_path), str(audio_file), video_title=title)
            processed_files += 1

        return {"message": f"✅ Processed {processed_files} local audio-video file(s)."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


    
@app.post("/scrape-table-website", tags=["Scraping"])
async def scrape_table_website():
    base_url = "https://inst.eecs.berkeley.edu/~cs188/"
    try:
        print("Website scraping started")
        documents = list(collection.find())
        total_url = 0
        
        for doc in documents:
            for section_key in ["Week", "Date", "Lecture", "Readings", "Discussion", "HW"]:
                section = doc.get(section_key, {})
                for link in section.get("links", []):
                    raw_href = link.get("href", "")
                    if not raw_href:
                        continue

                    full_url = urljoin(base_url, raw_href) if raw_href.startswith("/") else raw_href
                    total_url += 1
                    print(full_url)
                    
                    if full_url.startswith(base_url):
                        print(full_url)
                        # total_url += 1
                        try:
                            print("Scrapping started for url:", full_url)
                            scrapped_data = extract_page_content(full_url)
                            result = scraped_collection.insert_one(scrapped_data)
                            print(f"Scraped and saved data from {full_url} with ID: {result.inserted_id}")
                        except Exception as scrape_err:
                            print(f"Failed scraping {full_url}: {scrape_err}")
                            continue
                    print("Total URL found:", total_url)


        return {"message": "Scraping and saving to collection completed successfully."}
        print("Total URL found:", total_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/delete-website-data", tags=["Delete"])
async def delete_website_data():
    result = scraped_collection.delete_many({"type": "website"})
    return {"message": "Deleted documents with type='website'", "deleted_count": result.deleted_count}


@app.post("/website-scrape", tags=["Scraping"])
async def universal_website_scrape(url: str = Query(..., description="URL to scrape")):
    try:
        print("Scrapping started for url:", url)
        scrapped_data = crawl_all_pages(url)
        result = scraped_collection.insert_one(scrapped_data)
        print(f"Scraped and saved data from {url} with ID: {result.inserted_id}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# ------------------------------------------------------------------------------
# @app.get("/transcribe")
async def transcribe_and_process(video_path, audio_path, video_title=None):
    """
    Process a local video and audio file instead of downloading.

    Args:
        video_path (str or Path): path to local video file
        audio_path (str or Path): path to local audio file (e.g. extracted .webm or .mp3)
        video_title (str, optional): title of the video; if None, fallback to filename
    """

    try:
        # Use filename as title if not provided
        title = video_title or video_path.name if hasattr(video_path, "name") else str(video_path)

        print("[Step 1] Using local audio and video files.")
        print(f"Audio path: {audio_path}")
        print(f"Video path: {video_path}")

        print("[Step 2] Starting concurrent transcription and image parsing...")
        transcript_task = async_transcribe(audio_path)
        images_task = async_parse_frames(video_path)

        transcript, image_segments = await asyncio.gather(transcript_task, images_task)
        print("[Step 2] Transcription and image parsing done.")

        print("[Step 3] Updating transcript with images...")
        updated_transcript = update_transcript_with_images(transcript, image_segments)
        print("[Step 3] Transcript updated with images.")

        print("[Step 4] Inserting document to DB...")
        metadata = {
            "date": datetime.today().strftime("%Y-%m-%d"),
            "module": "CS188",  # adjust as needed
            "topic": title,
            "chunk_id": 1
        }

        doc = {
            "source": str(video_path),
            "embeddings": [],  # TODO: generate embeddings later if needed
            "type": "youtube_local",
            "title": title,
            "content": updated_transcript,
            "metadata": metadata
        }

        result = scraped_collection.insert_one(doc)
        print(f"[Step 4] Inserted doc with ID: {result.inserted_id}")

        print("[Step 5] Returning response.")
        return {
            "message": "Local transcription and image parsing complete",
            "db_id": str(result.inserted_id),
            "excerpt": doc
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



def fix_mongo_document(doc):
    if not doc:
        return doc
    doc = dict(doc) 
    if "_id" in doc and isinstance(doc["_id"], ObjectId):
        doc["_id"] = str(doc["_id"])
    return doc



def convert_course_doc_to_text(doc: dict)-> str:
    fields = ["Week", "Date", "Lecture", "Readings", "Discussion", "HW"]
    output_lines = []
    for field in fields:
        field_obj = doc.get(field, {})
        text = field_obj.get("title", "")
        links = field_obj.get("links", [])    
        line = f"{field}:{text}"
        if links:
            link_lines ="\n ".join([f"{link.get("text","")}: {link.get("href","")}" for link in links])
            line += "\n" + link_lines
        output_lines.append(line)
    return "\n".join(output_lines)

@app.get("/create_course_embeddings", tags=["Embeddings"])
def create_course_embeddings():
    try:
        fetch = course_collection.find({})
        processed_docs = 0

        for doc in fetch:
            doc_id = doc["_id"]

            full_text = convert_course_doc_to_text(doc)
            if not full_text.strip():
                continue

            # Chunk the text for embedding
            refined_chunks = refined_spacy_chunks(full_text)

            # Add metadata to chunks
            chunk_texts = []
            for idx, chunk in enumerate(refined_chunks):
                metadata = {
                    "doc_id": str(doc_id),
                    "chunk_index": idx,
                    "type": "course_schedule",
                    "source_title": doc.get("Lecture", {}).get("text", "Untitled Lecture"),
                }
                chunk.metadata = metadata
                chunk_texts.append({
                    "text": chunk.page_content,
                    "metadata": metadata
                })

            # Ensure Qdrant is ready and store
            ensure_qdrant_collection_exists()
            embed_and_store(refined_chunks)

            # Save back to MongoDB
            course_collection.update_one(
                {"_id": doc_id},
                {"$set": {"embeddings": chunk_texts}}
            )

            processed_docs += 1

        return {"status": f"✅ Created embeddings for {processed_docs} course document(s)."}

    except Exception as e:
        return {"error": str(e)}

@app.get("/create_embeddings")
def create_embeddings():
    try:
        fetch = scraped_collection.find({"type": {"$in":['website','youtube_local']}})

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
            scraped_collection.update_one(
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
