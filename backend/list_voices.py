import os
from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("ELEVENLABS_API_KEY")
if not api_key:
    print("No API Key found")
else:
    client = ElevenLabs(api_key=api_key)
    try:
        response = client.voices.get_all()
        voices = response.voices if hasattr(response, 'voices') else response
        
        print(f"Found {len(voices)} voices:")
        print("-" * 50)
        for i, v in enumerate(voices, 1):
            print(f"{i}. {v.name} (ID: {v.voice_id})")
        print("-" * 50)
            
    except Exception as e:
        print(f"Error: {e}")
