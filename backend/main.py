# backend/main.py

from fastapi import FastAPI, Query, HTTPException
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


app = FastAPI()

llava_model = LlavaModel()

mongo_client = client
db = db
collection = transcripts_collection


@app.get("/")
def root():
    return {"message": "YouTube RAG Assistant is running!"}

@app.get("/transcribe")
async def transcribe_and_process(youtube_url: str = Query(...)):
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
        doc = {
            "youtube_url": youtube_url,
            "transcript_path": audio_path,
            "transcript": updated_transcript,
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



video_embedder = EmbeddingManager("video_chunks")
general_embedder = EmbeddingManager("knowledge_base")
rag_chain = RAGChain("mistral")  # or "llama2", etc. in Ollama


def is_image_related(question: str) -> bool:
    image_keywords = ["image", "picture", "frame", "screenshot", "visual"]
    return any(kw in question.lower() for kw in image_keywords)


@app.get("/generate-answer")
def generate_answer(youtube_url: str = Query(...), question: str = Query(...)):
    # Clear previous chunks only related to this video
    video_embedder.clear(youtube_url=youtube_url)

    # Fetch document from MongoDB
    video_doc = collection.find_one({"youtube_url": youtube_url})
    if not video_doc:
        raise HTTPException(status_code=404, detail="Video not found in the database")

    # Extract and combine transcript text
    transcript_segments = video_doc.get("transcript", [])
    full_text = " ".join(segment["text"] for segment in transcript_segments if "text" in segment)

    # Chunk the text
    chunks = [
        {
            "text": full_text[i:i+300],
            "source": "video",
            "chunk_id": i,
            "youtube_url": youtube_url  # Important for selective clearing
        }
        for i in range(0, len(full_text), 300)
    ]

    # Add to vector DB
    video_embedder.add_chunks(chunks)

    # Query both video and general embeddings
    context_docs = video_embedder.query(text=question, n_results=3)
    extra_knowledge = general_embedder.query(text=question, n_results=2)

    # Extract documents from response
    combined_context = "\n".join(context_docs['documents'][0] + extra_knowledge['documents'][0])

    # If image-related, find matching image URLs from transcript
    images = []
    answers_from_images = []
    if is_image_related(question):
        for segment in transcript_segments:
            if "images" in segment:
                images.extend(segment["images"])
        if images:
            answers_from_images = llava_model.answer_from_images(images, question)

    answer = rag_chain.run(combined_context, question)


    return {
        "question": question,
        "answer": answer,
        "context_used": context_docs['documents'][0],
        "images": answers_from_images if answers_from_images else None
    }
