import os
from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

api_key = os.getenv("ELEVENLABS_API_KEY")

print("--- ElevenLabs API Key Test ---")

if not api_key:
    print("❌ Error: ELEVENLABS_API_KEY not found in environment variables or .env file.")
    print("Please add ELEVENLABS_API_KEY=your_key_here to your .env file.")
else:
    # Print masked key for verification
    masked_key = f"{api_key[:4]}...{api_key[-4:]}" if len(api_key) > 8 else "****"
    print(f"✅ Found API Key: {masked_key}")

    try:
        client = ElevenLabs(api_key=api_key)
        print("Attempting to connect to ElevenLabs API...")
        
        # Try to fetch user info or voices to verify the key
        # get_all() is a good test
        response = client.voices.get_all()
        
        voices_list = response.voices if hasattr(response, 'voices') else response
        
        if voices_list:
            print(f"✅ Success! Connection established.")
            print(f"Found {len(voices_list)} voices available.")
            print(f"First voice: {voices_list[0].name} (ID: {voices_list[0].voice_id})")
        else:
            print("✅ Success! Connection established, but no voices returned (this is unusual but means auth worked).")
            
    except Exception as e:
        print(f"❌ API Connection Failed: {e}")
        print("Please check if your API key is valid.")
