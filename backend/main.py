import os
import json
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from elevenlabs.client import ElevenLabs
from google.genai import types
from dotenv import load_dotenv
from sqlalchemy.orm import Session
import models
from database import SessionLocal, engine

load_dotenv()

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Y&E Smart Tutor API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex='https?://.*',
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
client = None
if api_key:
    client = genai.Client(api_key=api_key)

# Configure ElevenLabs
# Configure ElevenLabs
elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
elevenlabs_client = None
DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM" # Default to Rachel

if elevenlabs_api_key:
    print(f"ElevenLabs API Key found: {elevenlabs_api_key[:4]}...{elevenlabs_api_key[-4:]}")
    elevenlabs_client = ElevenLabs(api_key=elevenlabs_api_key)
    try:
        # Pick the first available voice
        response = elevenlabs_client.voices.get_all()
        # Handle different response structures (list or object with voices attr)
        voices_list = response.voices if hasattr(response, 'voices') else response
        
        if voices_list:
            DEFAULT_VOICE_ID = voices_list[0].voice_id
            print(f"Selected voice: {voices_list[0].name} ({DEFAULT_VOICE_ID})")
            
    except Exception as e:
        print(f"Error listing voices: {e}")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class GreetingRequest(BaseModel):
    name: str
    grade: int

@app.get("/")
def read_root():
    return {"message": "Welcome to Y&E Smart Tutor API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/greet")
def generate_greeting(request: GreetingRequest):
    # Fallback if no key
    if not api_key:
        return {"message": f"Hello {request.name}! Welcome to your learning hub! (AI Key missing)"}

    prompt = ""
    if request.grade <= 2:
        prompt = f"You are a kind, encouraging elementary school teacher. Say hello to {request.name}, a 2nd grader, and ask if they are ready to play with words and numbers! Keep it very short and fun."
    else:
        prompt = f"You are a helpful tutor. Say hello to {request.name}, a 4th grader. Encourage them to tackle some math and science today. Keep it short and motivating."

    try:
        response = client.models.generate_content(model='gemini-2.0-flash', contents=prompt)
        return {"message": response.text}
    except Exception as e:
        print(f"Error: {e}")
        return {"message": f"Hello {request.name}! Ready to learn?"}

class LessonPlanRequest(BaseModel):
    subject: str
    topic: str
    grade: int

class LessonContentRequest(BaseModel):
    subject: str
    topic: str
    subtopic: str
    grade: int

class QuizRequest(BaseModel):
    subject: str
    topic: str
    grade: int
    num_questions: int = 5

@app.post("/api/lesson/plan")
def generate_lesson_plan(request: LessonPlanRequest):
    if not api_key:
        return {"plan": ["Introduction to " + request.topic, "Key Concepts", "Examples", "Summary"]}

    prompt = f"""
    Create a short lesson plan with 3 to 5 distinct sub-topics for teaching '{request.topic}' in '{request.subject}' to a Grade {request.grade} student.
    Return ONLY valid JSON with a key 'plan' containing a list of strings (the sub-topic titles).
    Example: {{ "plan": ["What is a Volcano?", "Types of Volcanoes", "Why do they Erupt?"] }}
    """
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type='application/json')
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/lesson/content")
def generate_lesson_content(request: LessonContentRequest):
    if not api_key:
        return {"content": f"Simulation: Content for {request.subtopic} (Grade {request.grade})"}

    # Generate the text content
    content_prompt = f"""
    You are a tutor for a Grade {request.grade} student.
    Subject: {request.subject}
    Main Topic: {request.topic}
    Current Sub-topic: {request.subtopic}

    Write a clear, engaging, and age-appropriate explanation for this specific sub-topic. 
    Use analogies if helpful. Keep it focused on '{request.subtopic}'.
    """
    
    try:
        response = client.models.generate_content(model='gemini-2.0-flash', contents=content_prompt)
        content = response.text
        
        # Decide if an image would be helpful
        image_decision_prompt = f"""
        Topic: {request.subtopic}
        Subject: {request.subject}
        Grade: {request.grade}
        
        Would a visual diagram, illustration, or educational image significantly help a Grade {request.grade} student understand "{request.subtopic}"?
        Consider: diagrams for processes, scientific concepts, historical events, geography, anatomy, chemistry, physics, etc.
        
        Respond with JSON:
        {{
            "needs_image": true/false,
            "image_prompt": "A detailed prompt for generating an educational illustration" (only if needs_image is true)
        }}
        """
        
        image_decision = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=image_decision_prompt,
            config=types.GenerateContentConfig(response_mime_type='application/json')
        )
        
        try:
            decision_data = json.loads(image_decision.text)
            # Handle if response is a list (take first element) or dict
            if isinstance(decision_data, list):
                decision_data = decision_data[0] if decision_data else {}
        except:
            decision_data = {}
            
        image_url = None
        
        if decision_data.get("needs_image", False) and decision_data.get("image_prompt"):
            # Generate image using fast Imagen model
            try:
                image_prompt = f"Educational illustration for Grade {request.grade} students: {decision_data['image_prompt']}. Clear, colorful, age-appropriate, diagram style. No text or labels."
                
                image_response = client.models.generate_images(
                    model='models/imagen-4.0-fast-generate-001',
                    prompt=image_prompt,
                    config=types.GenerateImagesConfig(
                        aspect_ratio="16:9"
                    )
                )
                
                # Get the generated image
                if image_response.generated_images and len(image_response.generated_images) > 0:
                    import base64
                    image_data = image_response.generated_images[0].image.image_bytes
                    image_base64 = base64.b64encode(image_data).decode('utf-8')
                    image_url = f"data:image/png;base64,{image_base64}"
                    print(f"Successfully generated image for: {request.subtopic}")
            except Exception as img_error:
                print(f"Error generating image: {img_error}")
        
        return {
            "content": content,
            "image_url": image_url
        }
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quiz")
def generate_quiz(request: QuizRequest):
    if not api_key:
        return {
            "questions": [
                {
                    "id": i,
                    "question": f"Question {i} about {request.topic}",
                    "options": ["A", "B", "C", "D"],
                    "correct": "A"
                } for i in range(1, request.num_questions + 1)
            ]
        }

    system_prompt = f"You are a tutor for a Grade {request.grade} student."
    
    user_prompt = f"""
    {system_prompt}
    Create a {request.num_questions}-question multiple choice quiz about '{request.topic}' in {request.subject}.
    The output must be a JSON object with a key 'questions'.
    Each question object should have: 
    - 'id'
    - 'question'
    - 'options' (list of 4 strings)
    - 'correct' (the string of the correct answer)
    - 'explanation' (a short sentence explaining why the correct answer is right and why others might be wrong)
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=user_prompt,
            config=types.GenerateContentConfig(response_mime_type='application/json')
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ResultRequest(BaseModel):
    student_name: str
    grade: int
    subject: str
    topic: str
    score: int
    total_questions: int

@app.post("/api/results")
def save_result(result: ResultRequest, db: Session = Depends(get_db)):
    db_result = models.TestResult(
        student_name=result.student_name,
        grade=result.grade,
        subject=result.subject,
        topic=result.topic,
        score=result.score,
        total_questions=result.total_questions
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return {"status": "success", "id": db_result.id}

class TwiRequest(BaseModel):
    topic: str

@app.post("/api/twi/vocab")
def generate_twi_vocab(request: TwiRequest):
    if not api_key:
        return {"content": "Simulation: Twi vocab for " + request.topic}

    prompt = f"""
    You are an expert Twi language teacher (Asante Twi).
    Create a list of 5 common Twi words or phrases related to '{request.topic}'.
    Format the output as a JSON object with a key 'vocab'.
    Each item should have: 'twi' (the word/phrase), 'english' (translation), 'pronunciation' (phonetic guide), and 'example' (a simple sentence using the word).
    Example:
    {{
      "vocab": [
        {{
          "twi": "Maakye",
          "english": "Good morning",
          "pronunciation": "Ma-chi",
          "example": "Maakye, Papa. (Good morning, Father.)"
        }}
      ]
    }}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type='application/json')
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class StudentCreate(BaseModel):
    name: str
    grade: int
    avatar: str = "🎓"

class XPUpdate(BaseModel):
    student_id: int
    xp_amount: int

@app.get("/api/students")
def get_students(db: Session = Depends(get_db)):
    return db.query(models.Student).all()

@app.post("/api/students")
def get_or_create_student(student: StudentCreate, db: Session = Depends(get_db)):
    db_student = db.query(models.Student).filter(models.Student.name == student.name).first()
    if not db_student:
        db_student = models.Student(name=student.name, grade=student.grade, avatar=student.avatar)
        db.add(db_student)
        db.commit()
        db.refresh(db_student)
    return db_student

class StudentUpdate(BaseModel):
    name: str
    grade: int
    avatar: str

@app.put("/api/students/{student_id}")
def update_student(student_id: int, student: StudentUpdate, db: Session = Depends(get_db)):
    db_student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    db_student.name = student.name
    db_student.grade = student.grade
    db_student.avatar = student.avatar
    
    db.commit()
    db.refresh(db_student)
    return db_student

@app.delete("/api/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    db_student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    try:
        # Delete associated results
        db.query(models.TestResult).filter(models.TestResult.student_id == student_id).delete()
        
        db.delete(db_student)
        db.commit()
        return {"message": "Student deleted successfully"}
    except Exception as e:
        print(f"Error deleting student: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class PinUpdate(BaseModel):
    old_pin: str
    new_pin: str

@app.post("/api/admin/verify-pin")
def verify_pin(pin_data: dict, db: Session = Depends(get_db)):
    pin = pin_data.get("pin")
    setting = db.query(models.Settings).filter(models.Settings.key == "parent_pin").first()
    
    # Default to 1234 if not set (though migration should have set it)
    current_pin = setting.value if setting else "1234"
    
    if pin == current_pin:
        return {"valid": True}
    return {"valid": False}

@app.post("/api/admin/change-pin")
def change_pin(update: PinUpdate, db: Session = Depends(get_db)):
    setting = db.query(models.Settings).filter(models.Settings.key == "parent_pin").first()
    current_pin = setting.value if setting else "1234"
    
    if update.old_pin != current_pin:
        raise HTTPException(status_code=400, detail="Incorrect old PIN")
        
    if not setting:
        setting = models.Settings(key="parent_pin", value=update.new_pin)
        db.add(setting)
    else:
        setting.value = update.new_pin
        
    db.commit()
    return {"message": "PIN updated successfully"}

@app.post("/api/students/xp")
def add_xp(update: XPUpdate, db: Session = Depends(get_db)):
    db_student = db.query(models.Student).filter(models.Student.id == update.student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    db_student.xp += update.xp_amount
    
    # Simple Leveling Logic
    # Level 1: 0-100, Level 2: 101-300, Level 3: 301-600, Level 4: 601-1000, Level 5: 1000+
    new_level = db_student.level
    if db_student.xp > 1000:
        new_level = 5
    elif db_student.xp > 600:
        new_level = 4
    elif db_student.xp > 300:
        new_level = 3
    elif db_student.xp > 100:
        new_level = 2
    else:
        new_level = 1
        
    leveled_up = new_level > db_student.level
    db_student.level = new_level
    
    db.commit()
    db.refresh(db_student)
    
    return {"xp": db_student.xp, "level": db_student.level, "leveled_up": leveled_up}

@app.get("/api/review/recommendations/{student_id}")
def get_review_recommendations(student_id: int, db: Session = Depends(get_db)):
    # Find topics where score < 60%
    # We group by topic to avoid duplicates, taking the latest result
    
    # This is a simplified query. In a real app, we might want more complex logic.
    # We'll fetch all results for the student and process in python for simplicity with SQLite
    results = db.query(models.TestResult).filter(models.TestResult.student_id == student_id).all()
    
    recommendations = {}
    
    for r in results:
        percentage = r.score / r.total_questions if r.total_questions > 0 else 0
        if percentage < 0.6:
            # It's a weak area. 
            # If we haven't seen this topic yet, or if this result is newer than what we have, update it.
            # (Assuming results are roughly chronological or we trust the latest)
            recommendations[r.topic] = {
                "subject": r.subject,
                "topic": r.topic,
                "last_score": int(percentage * 100)
            }
        else:
            # If they passed it recently, remove from recommendations
            if r.topic in recommendations:
                del recommendations[r.topic]
                
    return list(recommendations.values())


@app.get("/api/results")
def get_results(db: Session = Depends(get_db)):
    return db.query(models.TestResult).order_by(models.TestResult.timestamp.desc()).all()

class TTSRequest(BaseModel):
    text: str
    voice_id: str = DEFAULT_VOICE_ID # Default voice

@app.post("/api/tts")
async def generate_speech(request: TTSRequest):
    try:
        import edge_tts
        import asyncio
        from io import BytesIO
        
        # Use a friendly female voice (Jenny is clear and pleasant)
        # You can also try: en-US-AriaNeural, en-US-SaraNeural
        voice = "en-US-JennyNeural"
        
        # Generate speech using Edge TTS
        communicate = edge_tts.Communicate(request.text, voice)
        
        # Collect audio chunks
        audio_data = BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data.write(chunk["data"])
        
        audio_bytes = audio_data.getvalue()
        
        if not audio_bytes:
            raise HTTPException(status_code=500, detail="No audio generated")
        
        return Response(content=audio_bytes, media_type="audio/mpeg")
        
    except Exception as e:
        error_msg = str(e)
        print(f"Error generating speech: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Failed to generate speech: {error_msg}")
