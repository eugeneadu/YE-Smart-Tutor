
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Date, ForeignKey, Float, JSON
from database import Base
import datetime

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    grade = Column(Integer)
    avatar = Column(String, default="🎓")
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    is_public_profile = Column(Boolean, default=False)

class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    topic = Column(String)
    front = Column(String)  # Question
    back = Column(String)   # Answer
    ease_factor = Column(Float, default=2.5)
    interval = Column(Integer, default=0)  # Days
    next_review = Column(DateTime, default=datetime.datetime.utcnow)
    review_count = Column(Integer, default=0)

class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, nullable=True) # Link to Student
    student_name = Column(String, index=True) # Keep for legacy/fallback
    grade = Column(Integer)
    subject = Column(String)
    topic = Column(String)
    score = Column(Integer)
    total_questions = Column(Integer)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class LessonLog(Base):
    __tablename__ = "lesson_logs"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    subject = Column(String)
    topic = Column(String)
    content = Column(String) # Storing full text
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class SavedQuiz(Base):
    __tablename__ = "saved_quizzes"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    subject = Column(String)
    topic = Column(String)
    questions = Column(JSON) # Store list of questions
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Settings(Base):
    __tablename__ = "settings"
    
    key = Column(String, primary_key=True, index=True)
    value = Column(String)

# Gamification Models

class Badge(Base):
    __tablename__ = "badges"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=False)
    icon = Column(String, nullable=False)  # emoji
    criteria_type = Column(String, nullable=False)  # "lesson_count", "perfect_scores", "streak", etc.
    criteria_value = Column(Integer, nullable=False)
    tier = Column(String, default="bronze")  # bronze, silver, gold, platinum

class StudentBadge(Base):
    __tablename__ = "student_badges"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id"), nullable=False)
    earned_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_new = Column(Boolean, default=True)  # For "NEW!" indicator

class StudentStreak(Base):
    __tablename__ = "student_streaks"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), unique=True, nullable=False)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_activity_date = Column(Date)
    freeze_available = Column(Boolean, default=False)
