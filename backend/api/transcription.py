from utils.concurrent import async_transcribe, async_parse_frames 
import asyncio
from utils.helper import update_transcript_with_images
from datetime import datetime
from utils.db import scraped_collection




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