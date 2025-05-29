import whisper
from collections import defaultdict
import os

model = whisper.load_model("base")

def transcribe_audio(audio_path: str, segment_duration: int = 60):
    result = model.transcribe(audio_path, verbose=False)
    segments = result.get("segments", [])

    time_chunks = defaultdict(list)

    # Group by minute
    for seg in segments:
        start_minute = int(seg['start'] // segment_duration)
        text = seg.get('text', '')
        if isinstance(text, str):
            time_chunks[start_minute].append(text)
    
    structured_transcript = []
    for minute, texts in sorted(time_chunks.items()):
        # Ensure we join only strings
        joined_text = " ".join([t for t in texts if isinstance(t, str)])
        structured_transcript.append({
            "start": minute * segment_duration,
            "end": (minute + 1) * segment_duration,
            "text": joined_text.strip()
        })

    transcript_path = audio_path.rsplit(".", 1)[0] + ".txt"
    with open(transcript_path, "w", encoding="utf-8") as f:
        for block in structured_transcript:
            f.write(f"[{block['start']}s - {block['end']}s]: {block['text']}\n")

    return structured_transcript, transcript_path
