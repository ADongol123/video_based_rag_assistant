from fastapi import UploadFile,File,APIRouter
import os 
import shutil
import re
from utils.concurrent import async_transcribe, async_parse_frames 
import asyncio
from utils.helper import update_transcript_with_images
from datetime import datetime
from utils.db import transcripts_collection,course_collection,scraped_collection
from utils.chunking import refined_spacy_chunks
from utils.vector_store import ensure_qdrant_collection_exists,get_qdrant_vectorstore
from utils.embeddings import embed_and_store



app = APIRouter(prefix="/embeddings", tags=["embeddings"])


UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)




# Helper Functions---------------------------------------------------
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

#-------------------------------------------------------------------------

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

