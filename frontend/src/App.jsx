import { useState } from 'react'
import ProfileSelection from './components/ProfileSelection'
import SubjectDashboard from './components/SubjectDashboard'
import LessonView from './components/LessonView'
import QuizView from './components/QuizView'
import AdminDashboard from './components/AdminDashboard'
import TwiLearningModule from './components/TwiLearningModule'
import BadgeUnlockModal from './components/BadgeUnlockModal'
import FlashcardPractice from './components/FlashcardPractice'
import QuizLibrary from './components/QuizLibrary'

function App() {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [currentTopic, setCurrentTopic] = useState('');
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard', 'lesson', 'quiz', 'admin', 'twi', 'flashcards', 'quiz-library'
  const [greeting, setGreeting] = useState('');
  const [unlockedBadge, setUnlockedBadge] = useState(null);

  const getLevelTitle = (level) => {
    switch (level) {
      case 1: return "Novice";
      case 2: return "Apprentice";
      case 3: return "Scholar";
      case 4: return "Master";
      case 5: return "Genius";
      default: return "Novice";
    }
  };

  const getNextLevelXP = (level) => {
    switch (level) {
      case 1: return 100;
      case 2: return 300;
      case 3: return 600;
      case 4: return 1000;
      default: return 10000;
    }
  };

  const [recommendations, setRecommendations] = useState([]);

  const handleProfileSelect = async (profile) => {
    setCurrentProfile(profile); // Profile now has id, xp, level from backend
    setGreeting('Loading your special message...');

    try {
      // Fetch Greeting
      const res = await fetch('http://localhost:8000/api/greet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, grade: profile.grade })
      });
      const data = await res.json();
      setGreeting(data.message);

      // Fetch Recommendations
      if (profile.id) {
        const recRes = await fetch(`http://localhost:8000/api/review/recommendations/${profile.id}`);
        const recData = await recRes.json();
        setRecommendations(recData);
      }

    } catch (err) {
      console.error(err);
      setGreeting(`Hi ${profile.name}! Let's start learning!`);
    }
  };

  const handleSubjectSelect = (subjectId, topic = null) => {
    if (subjectId === 'twi') {
      setViewMode('twi');
    } else {
      setCurrentSubject(subjectId);
      if (topic) {
        setCurrentTopic(topic);
        // If a topic is provided (from recommendation), we might want to jump straight to lesson setup or quiz
        // For now, let's go to lesson view, pre-filled
      }
      setViewMode('lesson');
    }
  };

  const handleStartQuiz = (topic) => {
    setCurrentTopic(topic);
    setViewMode('quiz');
  };

  const handleBackToDashboard = () => {
    setCurrentSubject(null);
    setCurrentTopic('');
    setViewMode('dashboard');
  };

  const handleBackToLesson = () => {
    setViewMode('lesson');
  };

  const [showParentLock, setShowParentLock] = useState(false);
  const [parentPin, setParentPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleParentAccess = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: parentPin })
      });
      const data = await res.json();

      if (data.valid) {
        setCurrentProfile({ name: 'Admin', grade: 0 });
        setViewMode('admin');
        setShowParentLock(false);
        setParentPin('');
        setPinError(false);
      } else {
        setPinError(true);
        setParentPin('');
      }
    } catch (err) {
      console.error("Error verifying PIN:", err);
      // Fallback to 1234 if backend fails (optional, but good for resilience)
      if (parentPin === '1234') {
        setCurrentProfile({ name: 'Admin', grade: 0 });
        setViewMode('admin');
        setShowParentLock(false);
        setParentPin('');
        setPinError(false);
      } else {
        setPinError(true);
      }
    }
  };

  if (!currentProfile) {
    return (
      <>
        <ProfileSelection onSelectProfile={handleProfileSelect} />
        <div className="fixed bottom-4 right-4">
          <button
            onClick={() => setShowParentLock(true)}
            className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1"
          >
            <span>Parent Mode</span>
            <span>🔒</span>
          </button>
        </div>

        {showParentLock && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Parent Access</h3>
              <p className="text-gray-500 mb-6">Enter PIN to continue (Default: 1234)</p>

              <input
                type="password"
                value={parentPin}
                onChange={(e) => { setParentPin(e.target.value); setPinError(false); }}
                className={`w-full p-4 text-center text-2xl tracking-widest border-2 rounded-xl mb-4 focus:outline-none ${pinError ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-blue-500'}`}
                placeholder="••••"
                maxLength={4}
                autoFocus
              />

              {pinError && <p className="text-red-500 text-sm mb-4">Incorrect PIN</p>}

              <div className="flex gap-4">
                <button
                  onClick={() => { setShowParentLock(false); setParentPin(''); setPinError(false); }}
                  className="flex-1 py-3 text-gray-500 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleParentAccess}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
                >
                  Unlock
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 p-4 md:p-8 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-blue-600 cursor-pointer" onClick={handleBackToDashboard}>
          Y&E Smart Tutor
        </h1>

        <div className="flex items-center gap-6">
          {/* Gamification HUD */}
          <div className="bg-white px-6 py-2 rounded-full shadow-sm flex items-center gap-4 border-2 border-yellow-400">
            <div className="text-center">
              <div className="text-xs text-gray-500 font-bold uppercase">Level {currentProfile.level || 1}</div>
              <div className="text-sm font-bold text-purple-600">{getLevelTitle(currentProfile.level || 1)}</div>
            </div>
            <div className="w-32">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>XP</span>
                <span>{currentProfile.xp || 0} / {getNextLevelXP(currentProfile.level || 1)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-yellow-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((currentProfile.xp || 0) / getNextLevelXP(currentProfile.level || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full shadow-sm">
            <span className="text-xl font-semibold text-gray-700">
              {currentProfile.name} <span className="text-sm text-gray-500">(Grade {currentProfile.grade})</span>
            </span>
            <button
              onClick={() => { setCurrentProfile(null); setViewMode('dashboard'); }}
              className="text-sm text-red-400 hover:text-red-600 font-bold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        {viewMode === 'dashboard' && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 text-center border-l-4 border-blue-400">
              <p className="text-gray-600 text-lg italic">
                "{greeting}"
              </p>
            </div>
            <SubjectDashboard
              studentProfile={currentProfile}
              onSelectSubject={handleSubjectSelect}
              recommendations={recommendations}
              onStartFlashcards={() => setViewMode('flashcards')}
              onOpenQuizLibrary={() => setViewMode('quiz-library')}
            />
          </div>
        )}

        {viewMode === 'lesson' && (
          <LessonView
            subject={currentSubject}
            defaultGrade={currentProfile.grade}
            studentProfile={currentProfile}
            initialTopic={currentTopic}
            onStartQuiz={handleStartQuiz}
            onBack={handleBackToDashboard}
            onBadgeUnlock={(badge) => setUnlockedBadge(badge)}
          />
        )}

        {viewMode === 'quiz' && (
          <QuizView
            subject={currentSubject}
            topic={currentTopic}
            grade={currentProfile.grade}
            studentName={currentProfile.name}
            studentId={currentProfile.id}
            onBack={handleBackToLesson}
            onBadgeUnlock={(badge) => setUnlockedBadge(badge)}
          />
        )}

        {viewMode === 'twi' && (
          <TwiLearningModule onBack={handleBackToDashboard} />
        )}

        {viewMode === 'admin' && (
          <AdminDashboard onBack={() => { setCurrentProfile(null); setViewMode('dashboard'); }} />
        )}

        {viewMode === 'flashcards' && (
          <FlashcardPractice
            studentId={currentProfile.id}
            onExit={handleBackToDashboard}
          />
        )}

        {viewMode === 'quiz-library' && (
          <QuizLibrary
            studentId={currentProfile.id}
            onExit={handleBackToDashboard}
            onRetakeQuiz={(subject, topic) => {
              setCurrentSubject(subject);
              setCurrentTopic(topic);
              setViewMode('quiz');
            }}
          />
        )}
      </main>

      {unlockedBadge && (
        <BadgeUnlockModal
          badge={unlockedBadge}
          onClose={() => setUnlockedBadge(null)}
        />
      )}
    </div>
  )
}

export default App
