import os
import hashlib
from typing import Optional
from openai import OpenAI
from pathlib import Path

class AudioService:
    def __init__(self):
        self._client = None
        self.output_dir = Path("static/audio")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.voice_map = {
            "lead": "alloy",
            "support": "shimmer"
        }

    @property
    def client(self):
        from config import get_settings
        settings = get_settings()
        if self._client is None:
            api_key = settings.openai_api_key
            if not api_key:
                print("[AudioService] Warning: OPENAI_API_KEY not found in settings.")
                return None
            self._client = OpenAI(api_key=api_key)
        return self._client

    async def generate_tts(self, text: str, voice_type: str = "lead") -> Optional[str]:
        """
        Convert text to speech and return the local URL/path to the audio file.
        Uses a hash of the text to avoid redundant API calls.
        """
        from config import get_settings
        settings = get_settings()
        if not settings.openai_api_key:
            print("[AudioService] Skipping TTS: No API key.")
            return None

        voice = self.voice_map.get(voice_type, "alloy")
        text_hash = hashlib.md5(f"{voice}:{text}".encode()).hexdigest()
        file_path = self.output_dir / f"{text_hash}.mp3"
        
        # Check cache
        if file_path.exists():
            return f"/static/audio/{text_hash}.mp3"

        try:
            response = self.client.audio.speech.create(
                model="tts-1",
                voice=voice,
                input=text
            )
            response.stream_to_file(file_path)
            return f"/static/audio/{text_hash}.mp3"
        except Exception as e:
            print(f"[AudioService] Error generating TTS: {e}")
            return None

audio_service = AudioService()
