# cloudinary_upload.py

import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv
import base64

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

def upload_image_bytes_to_cloudinary(image_bytes: bytes, public_id: str = None, folder: str = "video_frames") -> str:
    """
    Uploads image bytes to Cloudinary and returns the secure URL.
    """
    b64_encoded = base64.b64encode(image_bytes).decode('utf-8')
    data_url = f"data:image/jpeg;base64,{b64_encoded}"

    upload_options = {"folder": folder}
    if public_id:
        upload_options["public_id"] = public_id

    response = cloudinary.uploader.upload(data_url, **upload_options)
    return response["secure_url"]
