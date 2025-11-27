"""
Initialize badges in the database
Run this script once after creating the database to populate default badges
"""

from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Badge

def seed_badges():
    """Create all badge definitions"""
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if badges already exist
        existing_badges = db.query(Badge).count()
        if existing_badges > 0:
            print(f"Badges already initialized ({existing_badges} badges found)")
            return
        
        badges = [
            {
                "name": "First Steps",
                "description": "Complete your first lesson",
                "icon": "🎓",
                "criteria_type": "lesson_count",
                "criteria_value": 1,
                "tier": "bronze"
            },
            {
                "name": "Quiz Ace",
                "description": "Score 100% on any quiz",
                "icon": "🏆",
                "criteria_type": "perfect_score",
                "criteria_value": 1,
                "tier": "bronze"
            },
            {
                "name": "Streak Master",
                "description": "Maintain a 7-day learning streak",
                "icon": "🔥",
                "criteria_type": "streak",
                "criteria_value": 7,
                "tier": "gold"
            },
            {
                "name": "Explorer",
                "description": "Try 5 different subjects",
                "icon": "🌟",
                "criteria_type": "subject_count",
                "criteria_value": 5,
                "tier": "silver"
            },
            {
                "name": "Perfectionist",
                "description": "Score 100% on 10 quizzes",
                "icon": "💯",
                "criteria_type": "perfect_score",
                "criteria_value": 10,
                "tier": "gold"
            },
            {
                "name": "Dedicated Learner",
                "description": "Complete 25 lessons",
                "icon": "📚",
                "criteria_type": "lesson_count",
                "criteria_value": 25,
                "tier": "silver"
            },
            {
                "name": "Subject Expert",
                "description": "Complete 15 lessons in one subject",
                "icon": "🎯",
                "criteria_type": "subject_master",
                "criteria_value": 15,
                "tier": "gold"
            },
            {
                "name": "Early Bird",
                "description": "Complete a lesson before 9 AM",
                "icon": "🌅",
                "criteria_type": "time_early",
                "criteria_value": 9,
                "tier": "bronze"
            },
            {
                "name": "Night Owl",
                "description": "Complete a lesson after 8 PM",
                "icon": "🌙",
                "criteria_type": "time_late",
                "criteria_value": 20,
                "tier": "bronze"
            },
            {
                "name": "Speed Demon",
                "description": "Complete a lesson in under 5 minutes",
                "icon": "⚡",
                "criteria_type": "speed",
                "criteria_value": 300,  # 300 seconds = 5 minutes
                "tier": "silver"
            }
        ]
        
        for badge_data in badges:
            badge = Badge(**badge_data)
            db.add(badge)
        
        db.commit()
        print(f"✅ Successfully created {len(badges)} badges!")
        
        # Display created badges
        for badge in db.query(Badge).all():
            print(f"  {badge.icon} {badge.name} - {badge.description}")
    
    except Exception as e:
        print(f"❌ Error seeding badges: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Initializing badges...")
    seed_badges()
