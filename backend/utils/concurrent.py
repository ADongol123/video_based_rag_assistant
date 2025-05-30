import asyncio
from concurrent.futures import ThreadPoolExecutor
from utils.transcriber import transcribe_audio
from utils.frame_extractor import extract_frames_and_upload
executor = ThreadPoolExecutor()

def blocking_transcribe(audio_path):
    return transcribe_audio(audio_path)

def blocking_parse_frames(video_path):
    start_sec = 0
    end_sec = 60  
    interval_sec = 10  

    return extract_frames_and_upload(video_path, start_sec, end_sec, interval_sec)


async def async_transcribe(audio_path: str):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, blocking_transcribe, audio_path)


async def async_parse_frames(video_path):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, blocking_parse_frames, video_path)