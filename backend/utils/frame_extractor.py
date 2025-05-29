import cv2
import math
import cloudinary.uploader
import os
import numpy as np
from typing import List
import io
from utils.cloudinary_uploader import upload_image_bytes_to_cloudinary


def extract_and_upload_frames_in_memory(video_path: str, segment_seconds=5, resize_width=640):
    """
    Extract frames from video every `segment_seconds` interval, resize,
    upload directly to Cloudinary from memory without saving locally.
    Returns list of dicts with {start, end, images: [urls]} grouped by segments.
    """
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = frame_count / fps

    segments = []
    current_segment = {"start": 0, "end": segment_seconds, "images": []}

    frame_number = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        timestamp = frame_number / fps

        # If passed current segment end, push segment & start new one
        if timestamp > current_segment["end"]:
            segments.append(current_segment)
            current_segment = {
                "start": current_segment["end"],
                "end": min(current_segment["end"] + segment_seconds, duration),
                "images": []
            }

        # Resize frame keeping aspect ratio
        height, width = frame.shape[:2]
        ratio = resize_width / width
        new_dim = (resize_width, int(height * ratio))
        resized_frame = cv2.resize(frame, new_dim)

        # Encode frame to JPEG bytes in memory
        success, encoded_image = cv2.imencode('.jpg', resized_frame)
        if not success:
            frame_number += 1
            continue  # skip this frame if encoding fails

        image_bytes = encoded_image.tobytes()

        # Upload bytes to Cloudinary
        # Cloudinary uploader can accept file-like objects or base64 strings,
        # so we wrap bytes with a memory buffer
        import io
        image_buffer = io.BytesIO(image_bytes)

        # upload with a unique public_id to avoid overwriting
        public_id = f"youtube_frames/frame_{frame_number}"

        upload_response = cloudinary.uploader.upload(
            image_buffer,
            public_id=public_id,
            folder="youtube_frames",
            resource_type="image"
        )
        url = upload_response.get("secure_url")
        if url:
            current_segment["images"].append(url)

        frame_number += 1

    # Append last segment if any images
    if current_segment["images"]:
        segments.append(current_segment)

    cap.release()

    return segments





def extract_frames_and_upload(video_path: str, start_sec: int, end_sec: int, interval_sec: int) -> List[str]:
    cap = cv2.VideoCapture(video_path)
    image_urls = []

    for sec in range(start_sec, end_sec, interval_sec):
        cap.set(cv2.CAP_PROP_POS_MSEC, sec * 1000)
        success, frame = cap.read()
        if not success:
            break

        success, encoded_image = cv2.imencode('.jpg', frame)
        if not success:
            continue

        image_bytes = encoded_image.tobytes()
        public_id = f"frame_{sec}s"

        try:
            url = upload_image_bytes_to_cloudinary(image_bytes, public_id=public_id, folder="youtube_frames")
            if url:
                image_urls.append(url)
        except Exception as e:
            print(f"Failed to upload frame at {sec}s: {e}")

    cap.release()
    return image_urls