import os
from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv

load_dotenv()
client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

try:
    audio_generator = client.text_to_speech.convert(
        text="Hello, this is a test using the new model.",
        voice_id="EXAVITQu4vr4xnSDxMaL",
        model_id="eleven_multilingual_v2"
    )
    data = b"".join(audio_generator)
    print(f"Success! Generated {len(data)} bytes.")
except Exception as e:
    print(f"Failed: {e}")
