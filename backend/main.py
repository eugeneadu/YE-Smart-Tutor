import os
import json
from datetime import datetime, timedelta
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

class ChatRequest(BaseModel):
    message: str
    context: str
    student_grade: int

@app.post("/api/chat")
def chat_with_tutor(request: ChatRequest):
    if not api_key:
        return {"reply": "I'm sorry, I can't chat right now because my brain (API Key) is missing!"}

    prompt = f"""You are a friendly, encouraging tutor named "Professor Hoot" helping a Grade {request.student_grade} student.
    
    Current Lesson Context:
    {request.context}
    
    Student Question:
    {request.message}
    
    Instructions:
    1. Answer the question simply and clearly, using language appropriate for a Grade {request.student_grade} student.
    2. Be encouraging and positive. Use emojis occasionally.
    3. If the question is about the lesson, use the context provided.
    4. If the question is off-topic, gently guide them back to learning.
    5. Keep your answer concise (under 3 sentences unless a detailed explanation is needed).
    """

    try:
        response = client.models.generate_content(model='gemini-2.0-flash', contents=prompt)
        return {"reply": response.text}
    except Exception as e:
        print(f"Error in chat: {e}")
        return {"reply": "Oops! I got a little confused. Can you ask that again?"}

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
    is_public: bool = False

@app.put("/api/students/{student_id}")
def update_student(student_id: int, student: StudentUpdate, db: Session = Depends(get_db)):
    db_student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    db_student.name = student.name
    db_student.grade = student.grade
    db_student.avatar = student.avatar
    db_student.is_public_profile = student.is_public
    
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
    print(f"Verifying PIN: {pin}")
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
        
        # Clean text for TTS (remove markdown asterisks)
        clean_text = request.text.replace("*", "")
        
        # Generate speech using Edge TTS
        communicate = edge_tts.Communicate(clean_text, voice)
        
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

# ==================== GAMIFICATION ENDPOINTS ====================

from datetime import date, datetime, timedelta

# Badge endpoints

@app.get("/api/badges")
def get_all_badges(db: Session = Depends(get_db)):
    """Get all available badges"""
    badges = db.query(models.Badge).all()
    return [
        {
            "id": b.id,
            "name": b.name,
            "description": b.description,
            "icon": b.icon,
            "criteria_type": b.criteria_type,
            "criteria_value": b.criteria_value,
            "tier": b.tier
        }
        for b in badges
    ]

@app.get("/api/students/{student_id}/badges")
def get_student_badges(student_id: int, db: Session = Depends(get_db)):
    """Get badges earned by a student with progress toward unearned badges"""
    # Get earned badges
    earned = db.query(models.StudentBadge).filter(
        models.StudentBadge.student_id == student_id
    ).all()
    
    earned_badge_ids = {sb.badge_id for sb in earned}
    
    # Get all badges
    all_badges = db.query(models.Badge).all()
    
    # Calculate progress
    result = []
    for badge in all_badges:
        badge_data = {
            "id": badge.id,
            "name": badge.name,
            "description": badge.description,
            "icon": badge.icon,
            "tier": badge.tier,
            "earned": badge.id in earned_badge_ids,
            "progress": 0,
            "is_new": False
        }
        
        # If earned, get details
        if badge.id in earned_badge_ids:
            sb = next(sb for sb in earned if sb.badge_id == badge.id)
            badge_data["earned_at"] = sb.earned_at.isoformat()
            badge_data["is_new"] = sb.is_new
        else:
            # Calculate progress toward badge
            badge_data["progress"] = calculate_badge_progress(db, student_id, badge)
        
        result.append(badge_data)
    
    return result

def calculate_badge_progress(db: Session, student_id: int, badge: models.Badge):
    """Calculate progress toward earning a badge (0-100%)"""
    try:
        if badge.criteria_type == "lesson_count":
            count = db.query(models.TestResult).filter(
                models.TestResult.student_id == student_id
            ).count()
            return min(100, int((count / badge.criteria_value) * 100))
        
        elif badge.criteria_type == "perfect_score":
            count = db.query(models.TestResult).filter(
                models.TestResult.student_id == student_id,
                models.TestResult.score == models.TestResult.total_questions
            ).count()
            return min(100, int((count / badge.criteria_value) * 100))
        
        elif badge.criteria_type == "streak":
            streak = db.query(models.StudentStreak).filter(
                models.StudentStreak.student_id == student_id
            ).first()
            if not streak:
                return 0
            return min(100, int((streak.current_streak / badge.criteria_value) * 100))
        
        elif badge.criteria_type == "subject_count":
            subjects = db.query(models.TestResult.subject).filter(
                models.TestResult.student_id == student_id
            ).distinct().count()
            return min(100, int((subjects / badge.criteria_value) * 100))
        
        return 0
    except:
        return 0

@app.post("/api/students/{student_id}/check-badges")
def check_and_award_badges(student_id: int, db: Session = Depends(get_db)):
    """Check all badge criteria and award new badges"""
    new_badges = []
    
    # Get all badges student doesn't have
    earned_ids = {sb.badge_id for sb in db.query(models.StudentBadge).filter(
        models.StudentBadge.student_id == student_id
    ).all()}
    
    all_badges = db.query(models.Badge).all()
    
    for badge in all_badges:
        if badge.id in earned_ids:
            continue  # Already has this badge
        
        # Check if criteria met
        if check_badge_criteria(db, student_id, badge):
            # Award badge
            student_badge = models.StudentBadge(
                student_id=student_id,
                badge_id=badge.id,
                is_new=True
            )
            db.add(student_badge)
            new_badges.append({
                "id": badge.id,
                "name": badge.name,
                "description": badge.description,
                "icon": badge.icon,
                "tier": badge.tier
            })
    
    db.commit()
    return {"new_badges": new_badges}

def check_badge_criteria(db: Session, student_id: int, badge: models.Badge) -> bool:
    """Check if student meets badge criteria"""
    try:
        if badge.criteria_type == "lesson_count":
            count = db.query(models.TestResult).filter(
                models.TestResult.student_id == student_id
            ).count()
            return count >= badge.criteria_value
        
        elif badge.criteria_type == "perfect_score":
            count = db.query(models.TestResult).filter(
                models.TestResult.student_id == student_id,
                models.TestResult.score == models.TestResult.total_questions
            ).count()
            return count >= badge.criteria_value
        
        elif badge.criteria_type == "streak":
            streak = db.query(models.StudentStreak).filter(
                models.StudentStreak.student_id == student_id
            ).first()
            return streak and streak.current_streak >= badge.criteria_value
        
        elif badge.criteria_type == "subject_count":
            subjects = db.query(models.TestResult.subject).filter(
                models.TestResult.student_id == student_id
            ).distinct().count()
            return subjects >= badge.criteria_value
        
        elif badge.criteria_type == "subject_master":
            # Check if student has 15+ lessons in any subject
            from sqlalchemy import func
            subject_counts = db.query(
                models.TestResult.subject,
                func.count(models.TestResult.id).label('count')
            ).filter(
                models.TestResult.student_id == student_id
            ).group_by(models.TestResult.subject).all()
            
            return any(count >= badge.criteria_value for _, count in subject_counts)
        
        elif badge.criteria_type == "time_early":
            # Check if any lesson completed before 9 AM
            early = db.query(models.TestResult).filter(
                models.TestResult.student_id == student_id
            ).all()
            return any(t.timestamp.hour < 9 for t in early if t.timestamp)
        
        elif badge.criteria_type == "time_late":
            # Check if any lesson completed after 8 PM
            late = db.query(models.TestResult).filter(
                models.TestResult.student_id == student_id
            ).all()
            return any(t.timestamp.hour >= 20 for t in late if t.timestamp)
        
        return False
    except:
        return False

@app.post("/api/students/{student_id}/badges/{badge_id}/acknowledge")
def acknowledge_badge(student_id: int, badge_id: int, db: Session = Depends(get_db)):
    """Mark badge as seen (remove NEW indicator)"""
    student_badge = db.query(models.StudentBadge).filter(
        models.StudentBadge.student_id == student_id,
        models.StudentBadge.badge_id == badge_id
    ).first()
    
    if student_badge:
        student_badge.is_new = False
        db.commit()
        return {"success": True}
    
    raise HTTPException(status_code=404, detail="Badge not found")

# Streak endpoints

@app.get("/api/students/{student_id}/streak")
def get_student_streak(student_id: int, db: Session = Depends(get_db)):
    """Get student's current and longest streak"""
    streak = db.query(models.StudentStreak).filter(
        models.StudentStreak.student_id == student_id
    ).first()
    
    if not streak:
        # Create new streak record
        streak = models.StudentStreak(student_id=student_id)
        db.add(streak)
        db.commit()
        db.refresh(streak)
    
    return {
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "last_activity": streak.last_activity_date.isoformat() if streak.last_activity_date else None,
        "freeze_available": streak.freeze_available
    }

@app.post("/api/students/{student_id}/activity")
def log_activity(student_id: int, db: Session = Depends(get_db)):
    """Update streak based on activity"""
    streak = db.query(models.StudentStreak).filter(
        models.StudentStreak.student_id == student_id
    ).first()
    
    if not streak:
        streak = models.StudentStreak(student_id=student_id)
        db.add(streak)
    
    today = date.today()
    
    # Check if already logged today
    if streak.last_activity_date == today:
        return {"streak": streak.current_streak, "message": "Already logged today"}
    
    # Check if streak continues
    if streak.last_activity_date:
        days_since = (today - streak.last_activity_date).days
        
        if days_since == 1:
            # Continue streak
            streak.current_streak += 1
            if streak.current_streak > streak.longest_streak:
                streak.longest_streak = streak.current_streak
            
            # Award freeze after 7 days
            if streak.current_streak >= 7 and not streak.freeze_available:
                streak.freeze_available = True
        
        elif days_since > 1:
            # Streak broken - reset
            streak.current_streak = 1
            streak.freeze_available = False
    else:
        # First activity
        streak.current_streak = 1
    
    streak.last_activity_date = today
    db.commit()
    
    # Check for streak-based badges
    check_and_award_badges(student_id, db)
    
    return {
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "freeze_available": streak.freeze_available
    }

# ==================== LEADERBOARD ENDPOINTS ====================

@app.get("/api/leaderboard")
def get_leaderboard(period: str = "all_time", limit: int = 10, db: Session = Depends(get_db)):
    """Get leaderboard rankings"""
    # For now, we only track all-time XP. 
    # Future: Implement weekly XP tracking in a separate table or reset logic.
    
    students = db.query(models.Student).order_by(models.Student.xp.desc()).limit(limit).all()
    
    leaderboard = []
    for rank, student in enumerate(students, 1):
        display_name = student.name if student.is_public_profile else f"Student #{student.id}"
        leaderboard.append({
            "rank": rank,
            "id": student.id,
            "name": display_name,
            "xp": student.xp,
            "level": student.level,
            "avatar": student.avatar if student.is_public_profile else "👤",
            "is_public": student.is_public_profile
        })
        
    return leaderboard

@app.put("/api/students/{student_id}/privacy")
def update_privacy(student_id: int, privacy_data: dict, db: Session = Depends(get_db)):
    """Update student privacy setting"""
    is_public = privacy_data.get("is_public", False)
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    student.is_public_profile = is_public
    db.commit()
    return {"status": "success", "is_public_profile": is_public}

# ==================== FLASHCARD ENDPOINTS ====================

class FlashcardGenerateRequest(BaseModel):
    text: str
    num_cards: int = 5

@app.post("/api/flashcards/generate")
def generate_flashcards(request: FlashcardGenerateRequest):
    if not api_key:
        return {"flashcards": []}

    prompt = f"""
    Create {request.num_cards} flashcards from the following text.
    Return a JSON object with a key 'flashcards' containing a list of objects.
    Each object must have 'front' (question) and 'back' (answer).
    Keep questions concise and answers clear.
    
    Text: {request.text[:2000]}
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type='application/json')
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error generating flashcards: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class FlashcardCreateRequest(BaseModel):
    student_id: int
    topic: str
    front: str
    back: str

@app.post("/api/students/{student_id}/flashcards")
def create_flashcard(student_id: int, card: FlashcardCreateRequest, db: Session = Depends(get_db)):
    db_card = models.Flashcard(
        student_id=student_id,
        topic=card.topic,
        front=card.front,
        back=card.back,
        next_review=datetime.utcnow()
    )
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card

@app.get("/api/students/{student_id}/flashcards/due")
def get_due_flashcards(student_id: int, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    cards = db.query(models.Flashcard).filter(
        models.Flashcard.student_id == student_id,
        models.Flashcard.next_review <= now
    ).all()
    return cards

class FlashcardReviewRequest(BaseModel):
    rating: str # "easy", "medium", "hard"

@app.post("/api/flashcards/{card_id}/review")
def review_flashcard(card_id: int, review: FlashcardReviewRequest, db: Session = Depends(get_db)):
    card = db.query(models.Flashcard).filter(models.Flashcard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    # Simple SM-2 inspired logic
    if review.rating == "easy":
        card.interval = max(1, card.interval * 2) if card.interval > 0 else 1
        card.ease_factor += 0.1
    elif review.rating == "medium":
        card.interval = max(1, int(card.interval * 1.5)) if card.interval > 0 else 1
    else: # hard
        card.interval = 0
        card.ease_factor = max(1.3, card.ease_factor - 0.2)
    
    # Update review count and next review date
    card.review_count += 1
    if card.interval == 0:
        # Review again in 10 minutes (effectively now for this simple app)
        card.next_review = datetime.utcnow()
    else:
        card.next_review = datetime.utcnow() + timedelta(days=card.interval)
        
    db.commit()
    return {"status": "success", "next_review": card.next_review, "interval": card.interval}

@app.get("/api/students/{student_id}/flashcards")
def get_all_flashcards(student_id: int, db: Session = Depends(get_db)):
    cards = db.query(models.Flashcard).filter(models.Flashcard.student_id == student_id).all()
    return cards

@app.delete("/api/flashcards/{card_id}")
def delete_flashcard(card_id: int, db: Session = Depends(get_db)):
    card = db.query(models.Flashcard).filter(models.Flashcard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    db.delete(card)
    db.commit()
    return {"status": "success", "message": "Flashcard deleted"}

@app.get("/api/students/{student_id}/results")
def get_student_results(student_id: int, db: Session = Depends(get_db)):
    results = db.query(models.TestResult).filter(models.TestResult.student_id == student_id).order_by(models.TestResult.timestamp.desc()).all()
    return results

# ==================== LESSON LOG ENDPOINTS ====================

class LessonLogCreate(BaseModel):
    subject: str
    topic: str
    content: str

@app.post("/api/students/{student_id}/lesson-log")
def log_lesson(student_id: int, log: LessonLogCreate, db: Session = Depends(get_db)):
    db_log = models.LessonLog(
        student_id=student_id,
        subject=log.subject,
        topic=log.topic,
        content=log.content,
        timestamp=datetime.utcnow()
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@app.get("/api/students/{student_id}/lesson-logs")
def get_lesson_logs(student_id: int, db: Session = Depends(get_db)):
    logs = db.query(models.LessonLog).filter(models.LessonLog.student_id == student_id).order_by(models.LessonLog.timestamp.desc()).all()
    return logs

# ==================== SAVED QUIZ ENDPOINTS ====================

class SavedQuizCreate(BaseModel):
    student_id: int
    subject: str
    topic: str
    questions: list

@app.post("/api/saved-quizzes")
def save_quiz(quiz: SavedQuizCreate, db: Session = Depends(get_db)):
    db_quiz = models.SavedQuiz(
        student_id=quiz.student_id,
        subject=quiz.subject,
        topic=quiz.topic,
        questions=quiz.questions,
        created_at=datetime.utcnow()
    )
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    return db_quiz

@app.get("/api/students/{student_id}/saved-quizzes")
def get_saved_quizzes(student_id: int, db: Session = Depends(get_db)):
    quizzes = db.query(models.SavedQuiz).filter(models.SavedQuiz.student_id == student_id).order_by(models.SavedQuiz.created_at.desc()).all()
    return quizzes

@app.delete("/api/saved-quizzes/{quiz_id}")
def delete_saved_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(models.SavedQuiz).filter(models.SavedQuiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    db.delete(quiz)
    db.commit()
    return {"status": "success", "message": "Quiz deleted"}
