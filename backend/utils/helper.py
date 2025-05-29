from utils.downlaoder import download_youtube_video
from utils.db import transcripts_collection
from utils.frame_extractor import extract_frames_and_upload
from utils.cloudinary_uploader import upload_image_bytes_to_cloudinary

def update_transcript_with_images(transcript_data, image_segments):
    print("[Step 3] Updating transcript with images...")
    updated_transcripts = []

    for idx, entry in enumerate(transcript_data[0]):
        start = entry["start"]
        end = entry["end"]
        text = entry["text"]
        print(entry,"entry")
        # For the first segment, assign all images; else empty
        images = image_segments if idx == 0 else []

        updated_transcripts.append({
            "start": start,
            "end": end,
            "text": text,
            "images": images
        })

    print("[Step 3.2] Transcript updated with images.")
    return updated_transcripts




def process_video(youtube_url: str):
    video_path = download_youtube_video(youtube_url)
    video_doc = transcripts_collection.find_one({"youtube_url": youtube_url})
    if not video_doc:
        raise ValueError("Video not found in the database")

    transcript = video_doc.get("transcript", [])

    image_segments = []  # Will hold dicts like {start, end, images}

    for segment in transcript:
        start_sec = segment.get("start", 0)
        end_sec = segment.get("end", start_sec + 60)

        # Extract frames for this segment
        frames_bytes = extract_frames_and_upload(video_path, start_sec, end_sec, interval_sec=10)

        image_urls = []
        for frame_bytes in frames_bytes:
            url = upload_image_bytes_to_cloudinary(frame_bytes)
            image_urls.append(url)

        # Add this segment's images to the list with start/end info
        image_segments.append({
            "start": start_sec,
            "end": end_sec,
            "images": image_urls
        })

    # Now update the entire transcript once with all images mapped by time segment
    updated_transcript = update_transcript_with_images(transcript, image_segments)

    # Optionally: save updated_transcript back to DB or return it
    transcripts_collection.update_one(
        {"youtube_url": youtube_url},
        {"$set": {"transcript": updated_transcript}}
    )

    return updated_transcript




def is_image_related(question: str) -> bool:
    keywords = ["image", "picture", "photo", "frame", "screenshot"]
    return any(kw in question.lower() for kw in keywords)


