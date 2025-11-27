# Y&E Smart Tutor

An AI-powered educational platform that makes learning engaging and personalized for students.

## Features

- ✨ AI-generated lessons tailored to grade level
- 🎯 Interactive quizzes with immediate feedback
- 🗣️ Text-to-speech with high-quality voices (Edge TTS)
- 📊 Student profiles with XP and leveling system
- 🎨 Beautiful, modern UI with animations
- 📝 Topic recommendations based on performance

## Tech Stack

### Backend
- **Framework:** FastAPI (Python)
- **Database:** SQLite
- **AI:** Google Gemini API
- **TTS:** Microsoft Edge TTS

### Frontend
- **Framework:** React with Vite
- **Styling:** TailwindCSS + Custom CSS
- **State:** React Hooks

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Google Gemini API Key

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd YE_SmartTutor
```

2. Set up backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Create `.env` file in backend directory
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Set up frontend
```bash
cd frontend
npm install
```

### Running the App

Use the provided startup script:
```bash
./start_app.sh
```

Or run manually:

**Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## Project Structure

```
YE_SmartTutor/
├── backend/
│   ├── main.py           # FastAPI application
│   ├── models.py         # Database models
│   ├── database.py       # Database configuration
│   └── requirements.txt  # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── App.jsx       # Main application
│   │   └── index.css     # Styles
│   └── package.json      # Node dependencies
├── PRD.md                # Product Requirements Document
└── start_app.sh          # Startup script
```

## API Endpoints

### Students
- `GET /api/students` - List all students
- `POST /api/students` - Create student
- `DELETE /api/students/{id}` - Delete student

### Lessons
- `POST /api/lesson/plan` - Generate lesson plan
- `POST /api/lesson/content` - Generate lesson content
- `POST /api/tts` - Generate text-to-speech audio

### Quizzes
- `POST /api/quiz` - Generate quiz
- `POST /api/quiz/submit` - Submit quiz answers

### Progress
- `POST /api/students/xp` - Add XP to student
- `GET /api/review/recommendations/{student_id}` - Get recommended topics

## Roadmap

See [PRD.md](./PRD.md) for detailed feature roadmap including:
- 🎮 Gamification (Badges, Streaks, Leaderboards)
- 📚 Study Tools (Flashcards, Notes, Spaced Repetition)
- 📊 Analytics Dashboard
- 🤖 AI Study Buddy (Chat Assistant)

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, please open a GitHub issue.

---

**Made with ❤️ for young learners**
