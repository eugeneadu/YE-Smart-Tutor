# Y&E Smart Tutor - Product Requirements Document (PRD)

## Executive Summary
**Product:** Y&E Smart Tutor  
**Version:** 2.0  
**Date:** November 27, 2025  
**Author:** Product Development Team  

### Vision
Transform Y&E Smart Tutor into an engaging, gamified learning platform that motivates students through interactive features, visual progress tracking, and personalized learning paths.

---

## Current State
**Existing Features:**
- ✅ AI-powered lesson generation (Gemini)
- ✅ Multi-step lesson plans
- ✅ Interactive quizzes with immediate feedback
- ✅ Student profiles with XP and leveling
- ✅ TTS read-aloud (Edge TTS with Jenny's voice)
- ✅ Topic recommendations based on weak areas
- ✅ Beautiful, modern UI with gradients and animations

**Technical Stack:**
- Backend: Python (FastAPI), SQLite, Gemini API, Edge TTS
- Frontend: React, Vite, TailwindCSS
- Deployment: Local development

---

## Phase 1: Gamification & Engagement (Priority: HIGH)

### 1.1 Badges & Achievements System

**User Story:**  
*As a student, I want to earn badges for completing milestones so I feel motivated to keep learning.*

**Acceptance Criteria:**
- [ ] Students earn badges for specific achievements
- [ ] Badges are displayed on student profile
- [ ] Badge unlock animations appear when earned
- [ ] Badge progress shown (e.g., "3/5 lessons to unlock Math Master")

**Badge Types:**
1. **First Steps** - Complete first lesson
2. **Quiz Ace** - Score 100% on a quiz
3. **Streak Master** - 7-day learning streak
4. **Explorer** - Try 5 different subjects
5. **Perfectionist** - 10 perfect quiz scores
6. **Dedicated Learner** - Complete 25 lessons
7. **Subject Expert** - Complete all lessons in one subject
8. **Early Bird** - Learn before 9 AM
9. **Night Owl** - Learn after 8 PM
10. **Speed Demon** - Complete lesson in under 5 minutes

**Technical Approach:**
```python
# Backend: models.py
class Badge(Base):
    id: int
    name: str
    description: str
    icon: str  # emoji or icon name
    criteria_type: str  # "lesson_count", "perfect_scores", "streak", etc.
    criteria_value: int

class StudentBadge(Base):
    student_id: int
    badge_id: int
    earned_at: datetime
    is_new: bool  # For showing "NEW!" indicator
```

**Success Metrics:**
- 30% increase in daily active users
- 50% of students earn at least 3 badges in first week

---

### 1.2 Daily Streaks

**User Story:**  
*As a student, I want to see my daily learning streak so I'm motivated to learn every day.*

**Acceptance Criteria:**
- [ ] Streak counter displays days of consecutive learning
- [ ] Streak resets if student misses a day
- [ ] Visual "streak flame" icon that grows with streak length
- [ ] Streak freeze option (1 free day off after 7-day streak)
- [ ] Streak milestones (7, 14, 30, 90 days) trigger celebrations

**Technical Approach:**
```python
# Backend: models.py
class StudentStreak(Base):
    student_id: int
    current_streak: int
    longest_streak: int
    last_activity_date: date
    freeze_available: bool
```

**UI Location:**
- Top-right corner of dashboard
- Animated flame icon (🔥) with number
- Pulsing effect when streak is active

**Success Metrics:**
- 40% of students reach 7-day streak within 30 days
- Average session frequency increases by 25%

---

### 1.3 Leaderboards

**User Story:**  
*As a student, I want to see how I rank compared to my classmates so I feel motivated to improve.*

**Acceptance Criteria:**
- [ ] Weekly leaderboard by XP earned
- [ ] All-time leaderboard
- [ ] Filter by grade level
- [ ] Anonymous option (show as "Student #123")
- [ ] Top 10 displayed with medals (🥇🥈🥉)

**Privacy Considerations:**
- Default: Anonymous usernames
- Opt-in for displaying real names
- Parents can disable leaderboard visibility

**Success Metrics:**
- 60% of students check leaderboard weekly
- 20% increase in XP earning activity

---

## Phase 2: Study Tools (Priority: MEDIUM)

### 2.1 Flashcards with Spaced Repetition

**User Story:**  
*As a student, I want to create flashcards from my lessons so I can memorize key concepts effectively.*

**Acceptance Criteria:**
- [ ] Auto-generate flashcards from lesson content using AI
- [ ] Manual flashcard creation
- [ ] Spaced repetition algorithm (SM-2 or Leitner system)
- [ ] Practice mode with shuffle
- [ ] Mark cards as "Easy", "Medium", "Hard"
- [ ] Statistics showing mastery percentage

**Technical Approach:**
```python
# Backend: main.py
@app.post("/api/flashcards/generate")
def generate_flashcards(lesson_content: str):
    # Use Gemini to extract Q&A pairs
    prompt = f"Create 5-10 flashcard question-answer pairs from: {lesson_content}"
    # Return flashcards with front/back

class Flashcard(Base):
    id: int
    student_id: int
    topic: str
    front: str  # Question
    back: str  # Answer
    ease_factor: float  # For spaced repetition
    next_review: datetime
    review_count: int
```

**Success Metrics:**
- 70% quiz score improvement for students using flashcards
- Average 15 flashcards created per student

---

### 2.2 Note-Taking During Lessons

**User Story:**  
*As a student, I want to take notes during lessons so I can remember important points.*

**Acceptance Criteria:**
- [ ] Collapsible notes panel on lesson page
- [ ] Auto-save notes every 30 seconds
- [ ] Markdown support for formatting
- [ ] Search through all notes
- [ ] Export notes as PDF

**UI Design:**
- Floating "📝 Notes" button on lesson page
- Slide-out panel from right side
- Simple rich text editor

**Success Metrics:**
- 40% of students take notes on at least 5 lessons
- Notes correlate with 15% better quiz performance

---

## Phase 3: Progress Analytics (Priority: MEDIUM)

### 3.1 Visual Progress Dashboard

**User Story:**  
*As a student, I want to see charts of my progress so I understand how I'm improving.*

**Acceptance Criteria:**
- [ ] XP growth over time (line chart)
- [ ] Quiz scores by subject (bar chart)
- [ ] Topics mastered vs. in-progress (pie chart)
- [ ] Weekly learning activity heatmap (like GitHub)
- [ ] Time spent learning per subject

**Charts Library:**
- Use **Chart.js** or **Recharts** for React

**Success Metrics:**
- 80% of students view dashboard weekly
- Positive correlation between dashboard views and engagement

---

### 3.2 AI Study Buddy (Chat Assistant)

**User Story:**  
*As a student, I want to ask follow-up questions about lessons so I can clarify confusing topics.*

**Acceptance Criteria:**
- [ ] Chat interface accessible from any lesson
- [ ] AI responds in simple, grade-appropriate language
- [ ] Context-aware (knows current lesson topic)
- [ ] Can explain concepts in different ways
- [ ] Suggests related topics to explore

**Technical Approach:**
```python
@app.post("/api/chat")
def chat_with_tutor(message: str, student_id: int, lesson_context: str):
    prompt = f"""You are a friendly tutor helping a Grade X student.
    Current lesson: {lesson_context}
    Student question: {message}
    Provide a clear, simple answer."""
    response = client.models.generate_content(...)
    return {"reply": response.text}
```

**Success Metrics:**
- 50% of students use chat feature within first month
- Average 3 questions per lesson

---

## Implementation Plan

### Sprint 1 (Week 1-2): Gamification Core
**Branch:** `feature/gamification-badges-streaks`
- Implement badges system
- Add daily streaks
- Create badge unlock animations
- Update student profile UI

### Sprint 2 (Week 3-4): Leaderboards & Competition
**Branch:** `feature/leaderboards`
- Build leaderboard backend
- Create leaderboard UI
- Add privacy controls
- Implement weekly resets

### Sprint 3 (Week 5-6): Flashcards
**Branch:** `feature/flashcards-spaced-repetition`
- Auto-generate flashcard endpoint
- Build flashcard practice UI
- Implement SM-2 spaced repetition algorithm
- Add flashcard statistics

### Sprint 4 (Week 7-8): Analytics Dashboard
**Branch:** `feature/progress-dashboard`
- Create analytics backend
- Build chart components
- Design dashboard layout
- Add data export features

### Sprint 5 (Week 9-10): AI Study Buddy
**Branch:** `feature/ai-chat-assistant`
- Create chat backend API
- Build chat UI component
- Implement context awareness
- Add conversation history

---

## Success Metrics (Overall)

### Engagement
- **Target:** 50% increase in daily active users
- **Target:** 3x increase in average session duration
- **Target:** 70% weekly retention rate

### Learning Outcomes
- **Target:** 20% improvement in average quiz scores
- **Target:** 40% more lessons completed per student
- **Target:** 80% of students use at least 3 new features

### User Satisfaction
- **Target:** 4.5+ star rating in app stores
- **Target:** 80% recommend to friends (NPS > 50)

---

## Future Considerations (Phase 4+)

1. **Mobile Apps** - iOS and Android native apps
2. **Offline Mode** - Download lessons for offline access
3. **Parent Portal** - Separate dashboard for parents
4. **Teacher Tools** - Curriculum creation, class management
5. **Multi-player Quizzes** - Real-time quiz competitions
6. **Voice Interaction** - Voice commands for navigation
7. **AR Learning** - Augmented reality for science/math visualizations
8. **Personalized Learning Paths** - AI-driven curriculum adaptation

---

## Technical Debt & Improvements

1. **Database Migration** - SQLite → PostgreSQL for scalability
2. **Authentication** - Add JWT-based auth system
3. **API Documentation** - Generate OpenAPI/Swagger docs
4. **Testing** - Unit tests for backend, E2E tests for frontend
5. **CI/CD Pipeline** - GitHub Actions for automated testing/deployment
6. **Error Monitoring** - Sentry or similar for production errors
7. **Performance Optimization** - Caching, lazy loading, code splitting

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI API costs escalate | High | Implement caching, rate limiting |
| Low user adoption of new features | Medium | A/B testing, user feedback loops |
| Performance degradation | High | Load testing, database indexing |
| Data privacy concerns | High | COPPA compliance, parental controls |
| Feature complexity | Medium | MVP approach, iterative releases |

---

## Approval & Sign-off

**Product Owner:** ________________  
**Engineering Lead:** ________________  
**Date:** ________________  

---

*This PRD is a living document and will be updated as requirements evolve.*
