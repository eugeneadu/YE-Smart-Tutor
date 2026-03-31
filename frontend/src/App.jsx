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
import LessonLibrary from './components/LessonLibrary'

function App() {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [currentTopic, setCurrentTopic] = useState('');
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard', 'lesson', 'quiz', 'admin', 'twi', 'flashcards', 'quiz-library'
  const [greeting, setGreeting] = useState('');
  const [unlockedBadge, setUnlockedBadge] = useState(null);
  const [quizConfig, setQuizConfig] = useState(null);

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
      const res = await fetch('/api/greet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, grade: profile.grade })
      });
      const data = await res.json();
      setGreeting(data.message);

      // Fetch Recommendations
      if (profile.id) {
        const recRes = await fetch(`/api/review/recommendations/${profile.id}`);
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
      const res = await fetch('/api/admin/verify-pin', {
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
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-panel p-8 max-w-sm w-full text-center relative overflow-hidden rounded-[2rem]">
              <div className="absolute top-[-50%] left-[-50%] w-full h-full bg-indigo-500/20 rounded-full blur-3xl"></div>
              <h3 className="text-2xl font-bold text-slate-100 mb-4 relative z-10">Parent Access</h3>
              <p className="text-slate-400 mb-6 relative z-10">Enter PIN to continue</p>

              <input
                type="password"
                value={parentPin}
                onChange={(e) => { setParentPin(e.target.value); setPinError(false); }}
                className={`w-full p-4 text-center text-2xl tracking-[1em] border-2 rounded-2xl mb-4 focus:outline-none bg-slate-800/50 text-slate-100 transition-all z-10 relative ${pinError ? 'border-pink-500/50 focus:border-pink-500' : 'border-slate-700 focus:border-indigo-500'}`}
                placeholder="••••"
                maxLength={4}
                autoFocus
              />

              {pinError && <p className="text-pink-400 text-sm mb-4 relative z-10">Incorrect PIN</p>}

              <div className="flex gap-4 relative z-10">
                <button
                  onClick={() => { setShowParentLock(false); setParentPin(''); setPinError(false); }}
                  className="flex-1 py-3 text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleParentAccess}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all"
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
    <div className="min-h-screen p-4 md:p-8">
      <header className="glass-header rounded-3xl p-4 md:px-8 flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-slate-700/50">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400 cursor-pointer hover:scale-105 transition-transform" onClick={handleBackToDashboard}>
          Y&E Smart Tutor
        </h1>

        <div className="flex items-center gap-6">
          {/* Gamification HUD */}
          <div className="bg-slate-800/60 px-6 py-3 rounded-2xl flex items-center gap-4 border border-slate-700 shadow-inner">
            <div className="text-center">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Lvl {currentProfile.level || 1}</div>
              <div className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">{getLevelTitle(currentProfile.level || 1)}</div>
            </div>
            <div className="w-32">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-bold tracking-wider">
                <span>XP</span>
                <span>{currentProfile.xp || 0} / {getNextLevelXP(currentProfile.level || 1)}</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 shadow-inner overflow-hidden border border-slate-700/50">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-1000 relative"
                  style={{ width: `${Math.min(100, ((currentProfile.xp || 0) / getNextLevelXP(currentProfile.level || 1)) * 100)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-shine"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/60 px-5 py-2 rounded-2xl border border-slate-700 shadow-inner">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-400/50 bg-slate-700 flex items-center justify-center text-xl">
               {currentProfile.name.toLowerCase() === 'yudelle' ? <img src="/avatars/yudelle.png" alt="Yudelle" className="w-full h-full object-cover"/> : currentProfile.name.toLowerCase() === 'emmalyn' ? <img src="/avatars/emmalyn.png" alt="Emmalyn" className="w-full h-full object-cover"/> : currentProfile.avatar}
            </div>
            <span className="text-lg font-bold text-slate-200">
              {currentProfile.name}
            </span>
            <div className="h-6 w-[1px] bg-slate-700 mx-1"></div>
            <button
              onClick={() => { setCurrentProfile(null); setViewMode('dashboard'); }}
              className="text-sm text-slate-400 hover:text-pink-400 font-bold transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {viewMode === 'dashboard' && (
          <div className="animate-fade-in">
            <div className="glass-panel p-6 mb-8 text-center rounded-3xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <p className="text-indigo-200 text-xl font-medium tracking-wide relative z-10">
                "{greeting}"
              </p>
            </div>
            <SubjectDashboard
              studentProfile={currentProfile}
              onSelectSubject={handleSubjectSelect}
              recommendations={recommendations}
              onStartFlashcards={() => setViewMode('flashcards')}
              onOpenQuizLibrary={() => setViewMode('quiz-library')}
              onOpenLessonLibrary={() => setViewMode('lesson-library')}
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
            numQuestions={quizConfig?.numQuestions}
            initialQuestions={quizConfig?.questions}
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
            onRetakeQuiz={(subject, topic, questions = null) => {
              setCurrentSubject(subject);
              setCurrentTopic(topic);
              // Store questions in state or pass directly if possible.
              // Since we need to switch viewMode, we'll use a new state variable for quiz config
              setQuizConfig({ questions });
              setViewMode('quiz');
            }}
            onStartQuiz={(numQuestions) => {
              setQuizConfig({ numQuestions });
              setViewMode('quiz');
            }}

          />
        )}

        {viewMode === 'lesson-library' && (
          <LessonLibrary
            studentId={currentProfile.id}
            onExit={handleBackToDashboard}
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

