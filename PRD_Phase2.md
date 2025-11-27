# Y&E Smart Tutor - Phase 2 PRD: Advanced Engagement & Intelligence

## 1. Overview
This phase focuses on increasing student engagement through gamification and enhancing the learning experience with adaptive content and multi-modal interaction.

## 2. Features

### 2.1. 🎮 Gamification System
**Goal:** Motivate Yudelle and Emmalyn to keep learning.
*   **XP (Experience Points):**
    *   Earn 10 XP for completing a lesson.
    *   Earn 5 XP for every correct quiz answer.
    *   Bonus 50 XP for a perfect quiz score.
*   **Leveling:**
    *   Level 1: Novice (0-100 XP)
    *   Level 2: Apprentice (101-300 XP)
    *   Level 3: Scholar (301-600 XP)
    *   Level 4: Master (601-1000 XP)
    *   Level 5: Genius (1000+ XP)
*   **Badges:**
    *   "Math Whiz": Score >80% on 3 Math quizzes.
    *   "Scientist": Score >80% on 3 Science quizzes.
    *   "Linguist": Complete 5 Twi vocabulary sessions.

### 2.2. 🧠 Adaptive "Smart" Review
**Goal:** Reinforce weak areas.
*   **Weakness Tracking:** The system identifies topics where quiz scores were < 60%.
*   **Review Recommendation:** The Dashboard highlights a "Recommended Review" card suggesting these topics.

### 2.3. 🎙️ Voice Interaction (Speech-to-Text)
**Goal:** Improve oral skills and interactivity.
*   **Voice Answers:** Allow students to answer quiz questions by speaking (e.g., saying "A" or the answer text).
*   **Reading Practice:** A mode where the student reads a sentence aloud, and the system (simulated or via browser API) validates it.

### 2.4. 📊 Advanced Parent Insights
**Goal:** Provide actionable data to the parent.
*   **Progress Graphs:** Visual representation of XP growth and Quiz scores over time.
*   **Activity Log:** Detailed view of what was learned and when.

## 3. Technical Implementation Plan

### 3.1. Database Schema Updates (`models.py`)
*   **Student Table:** `id`, `name`, `grade`, `xp`, `level`, `avatar`.
*   **Badge Table:** `id`, `name`, `icon`, `description`.
*   **StudentBadges Table:** Link table.

### 3.2. Backend API Updates (`main.py`)
*   `POST /api/students`: Create/Get student profile.
*   `POST /api/students/{id}/xp`: Add XP (and check for level up).
*   `GET /api/students/{id}/badges`: Get earned badges.
*   `GET /api/review/recommendations`: Get topics with low past scores.

### 3.3. Frontend Updates
*   **ProfileSelection:** Fetch profiles from DB.
*   **GamificationHUD:** Display current Level, XP bar, and Badges in the header.
*   **QuizView:** Trigger XP update on completion.
*   **Dashboard:** Add "Smart Review" section.

## 4. Phasing
*   **Step 1:** Backend Gamification (Models & API).
*   **Step 2:** Frontend Gamification (Profile & HUD).
*   **Step 3:** Adaptive Review Logic.
*   **Step 4:** Voice Interaction.
