# backend/main.py

from fastapi import FastAPI, Query, HTTPException
from utils.downlaoder import download_audio_webm
from utils.transcriber import transcribe_audio
from utils.db import transcripts_collection
from utils.embedder import EmbeddingManager
from utils.mistral_model import RAGChain 
from utils.db import client, db, transcripts_collection


app = FastAPI()


mongo_client = client
db = db
collection = transcripts_collection


@app.get("/")
def root():
    return {"message": "YouTube RAG Assistant is running!"}

@app.get("/transcribe")
def transcribe_youtube_video(youtube_url: str = Query(..., description="YouTube Video URL")):
    try:
        audio_path = download_audio_webm(youtube_url)
        transcript, transcript_path = transcribe_audio(audio_path)
        
        # Build your document to insert
        doc = {
            "youtube_url": youtube_url,
            "transcript": transcript,
            "transcript_path": transcript_path,
        }
        
        # Insert into MongoDB
        result = transcripts_collection.insert_one(doc)
        
        # Join all transcript segments into a string for the excerpt
        full_text = " ".join([block["text"] for block in transcript])
        
        return {
            "message": "Transcription complete",
            "transcript_path": transcript_path,
            "db_id": str(result.inserted_id),
            "excerpt": full_text[:500] + "..."
        }
    except Exception as e:
        return {"error": str(e)}



video_embedder = EmbeddingManager("video_chunks")
general_embedder = EmbeddingManager("knowledge_base")
rag_chain = RAGChain("mistral")  # or "llama2", etc. in Ollama



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

    # Generate answer
    answer = rag_chain.run(combined_context, question)

    return {
        "question": question,
        "answer": answer,
        "context_used": context_docs['documents'][0]
    }
