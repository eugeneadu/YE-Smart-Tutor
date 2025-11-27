"""
Badge and Streak API endpoints
Append this to main.py
"""

# At the end of main.py, add these endpoints:

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
