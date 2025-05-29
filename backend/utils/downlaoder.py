# utils/downloader.py

import yt_dlp
import os

def download_audio_webm(youtube_url: str, output_path="downloads/audio.webm") -> str:
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_path,
        'quiet': True,
        'no_warnings': True,
        'postprocessors': []  # no conversion, keep original format (likely webm or m4a)
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([youtube_url])
    return output_path