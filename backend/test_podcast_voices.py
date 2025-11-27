import os
from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("ELEVENLABS_API_KEY")
print(f"API Key: {api_key[:4]}...")

client = ElevenLabs(api_key=api_key)

voices = ["EXAVITQu4vr4xnSDxMaL", "FGY2WhTYpPnrIDTdsKH5"]
names = ["Sarah", "Laura"]

for name, voice_id in zip(names, voices):
    print(f"Testing {name} ({voice_id})...")
    try:
        audio = client.generate(
            text="Hello, this is a test.",
            voice=voice_id,
            model="eleven_monolingual_v1"
        )
        # Consume generator
        data = b"".join(audio)
        print(f"Success! Generated {len(data)} bytes.")
    except Exception as e:
        print(f"Failed: {e}")
