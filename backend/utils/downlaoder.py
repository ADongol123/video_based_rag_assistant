# utils/downloader.py

import yt_dlp
import os
from pathlib import Path

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


def download_youtube_video(url: str, output_path: str = "videos") -> str:
    Path(output_path).mkdir(parents=True, exist_ok=True)

    ydl_opts = {
        'format': 'mp4',
        'outtmpl': f'{output_path}/%(id)s.%(ext)s',
        'quiet': True,
        'no_warnings': True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(url, download=True)
        video_path = ydl.prepare_filename(info_dict)
    return video_path