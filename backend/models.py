from sqlalchemy import Column, Integer, String, DateTime
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

class Settings(Base):
    __tablename__ = "settings"
    
    key = Column(String, primary_key=True, index=True)
    value = Column(String)
