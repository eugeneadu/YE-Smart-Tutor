import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import QuizView from './QuizView';
import Modal from './Modal';
import Flashcard from './Flashcard';
import ChatAssistant from './ChatAssistant';

const LessonView = ({ subject, defaultGrade, studentProfile, initialTopic = '', onBack, onBadgeUnlock }) => {
    const [topic, setTopic] = useState(initialTopic);
    const [grade, setGrade] = useState(defaultGrade);
    const [mode, setMode] = useState('setup'); // 'setup', 'plan', 'learning', 'quiz'
    const [lessonPlan, setLessonPlan] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [currentContent, setCurrentContent] = useState('');
    const [currentImage, setCurrentImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [quizConfig, setQuizConfig] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);

    const [ttsAudioUrl, setTtsAudioUrl] = useState(null);
    const [lessonComplete, setLessonComplete] = useState(false);
    const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
    const [flashcardsGenerated, setFlashcardsGenerated] = useState(false);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', content: '', type: 'info' });
    const [currentFlashcards, setCurrentFlashcards] = useState([]);
    const [showFlashcards, setShowFlashcards] = useState(false);
    const [flippedCards, setFlippedCards] = useState({});
    const [numCardsToGenerate, setNumCardsToGenerate] = useState(3);

    useEffect(() => {
        // Cleanup speech on unmount
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    // Fetch Lesson Plan
    const handleStartLesson = async () => {
        if (!topic) return;
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/api/lesson/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, topic, grade })
            });
            const data = await res.json();
            setLessonPlan(data.plan || []);
            setMode('plan');
        } catch (error) {
            console.error("Error fetching plan:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Content for current step
    const fetchContent = async (stepIndex) => {
        setLoading(true);
        try {
            const subtopic = lessonPlan[stepIndex];
            const res = await fetch('http://localhost:8000/api/lesson/content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, topic, subtopic, grade })
            });
            const data = await res.json();
            setCurrentContent(data.content);
            setCurrentImage(data.image_url || null);
            setMode('learning');

            // Auto-save generated lesson
            if (studentProfile && studentProfile.id) {
                try {
                    await fetch(`http://localhost:8000/api/students/${studentProfile.id}/lesson-log`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            subject: subject,
                            topic: topic,
                            content: data.content
                        })
                    });
                } catch (err) {
                    console.error("Error auto-saving lesson:", err);
                }
            }
        } catch (error) {
            console.error("Error fetching content:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartLearning = () => {
        fetchContent(0);
    };

    const handleTakeQuiz = () => {
        setMode('quiz-setup');
    };

    const startQuiz = (numQuestions) => {
        setQuizConfig({ numQuestions });
        setMode('quiz');
    };

    const handleQuizComplete = async (score, total) => {
        const percentage = score / total;
        if (percentage >= 0.6) {
            if (currentStep + 1 < lessonPlan.length) {
                setMode('learning'); // Switch back to learning mode to show Modal
                setModalConfig({
                    isOpen: true,
                    title: 'Great Job! 🎉',
                    content: 'You passed the quiz! Moving to the next section.',
                    type: 'success',
                    onClose: () => {
                        setModalConfig(prev => ({ ...prev, isOpen: false }));
                        setCurrentStep(prev => prev + 1);
                        fetchContent(currentStep + 1);
                    }
                });
            } else {
                // Lesson Completed!

                // Log Activity
                if (studentProfile && studentProfile.id) {
                    try {
                        await fetch(`http://localhost:8000/api/students/${studentProfile.id}/activity`, {
                            method: 'POST'
                        });

                        // Check for Badges
                        if (onBadgeUnlock) {
                            const badgeRes = await fetch(`http://localhost:8000/api/students/${studentProfile.id}/check-badges`, {
                                method: 'POST'
                            });
                            const badgeData = await badgeRes.json();
                            if (badgeData.new_badges && badgeData.new_badges.length > 0) {
                                badgeData.new_badges.forEach(badge => {
                                    onBadgeUnlock(badge);
                                });
                            }
                        }
                    } catch (err) {
                        console.error("Error logging activity:", err);
                    }

                    // Save Lesson Log
                    try {
                        await fetch(`http://localhost:8000/api/students/${studentProfile.id}/lesson-log`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                subject: subject,
                                topic: topic,
                                content: currentContent
                            })
                        });
                    } catch (err) {
                        console.error("Error logging lesson:", err);
                    }
                }
                setLessonComplete(true);
            }
        } else {
            setModalConfig({
                isOpen: true,
                title: 'Keep Trying! 💪',
                content: 'You need 60% to pass. Review the material and try again.',
                type: 'warning',
                onClose: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
            });
            setMode('learning');
        }
    };

    const handleGenerateFlashcards = async () => {
        if (!currentContent) return;
        setIsGeneratingFlashcards(true);
        try {
            const genRes = await fetch('http://localhost:8000/api/flashcards/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: currentContent, num_cards: numCardsToGenerate })
            });
            const genData = await genRes.json();
            if (genData.flashcards) {
                setCurrentFlashcards(genData.flashcards);
                setFlippedCards({}); // Reset flips
                setShowFlashcards(true);
            }
        } catch (error) {
            console.error("Error generating flashcards:", error);
            setModalConfig({
                isOpen: true,
                title: 'Error',
                content: 'Failed to generate flashcards. Please try again.',
                type: 'error',
                onClose: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setIsGeneratingFlashcards(false);
        }
    };

    const handleSaveFlashcards = async () => {
        if (!studentProfile || currentFlashcards.length === 0) return;
        try {
            for (const card of currentFlashcards) {
                await fetch(`http://localhost:8000/api/students/${studentProfile.id}/flashcards`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        student_id: studentProfile.id,
                        topic: topic,
                        front: card.front,
                        back: card.back
                    })
                });
            }
            setFlashcardsGenerated(true);
            setModalConfig({
                isOpen: true,
                title: 'Saved! 💾',
                content: 'Flashcards saved to your profile.',
                type: 'success',
                onClose: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
            });
        } catch (error) {
            console.error("Error saving flashcards:", error);
        }
    };

    const speakText = async (text) => {
        setIsGeneratingTTS(true);
        try {
            const res = await fetch('http://localhost:8000/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    voice_id: "FGY2WhTYpPnrIDTdsKH5" // Laura's voice
                })
            });

            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("audio/mpeg")) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                setTtsAudioUrl(url);
                setIsSpeaking(true);
            } else {
                // Check for quota error
                const errorData = await res.json();
                const errorMsg = errorData.detail || "Failed to generate speech";

                if (res.status === 429 || errorMsg.includes("quota")) {
                    alert("⚠️ ElevenLabs quota exceeded. The text has been shortened to fit your remaining credits. Please upgrade your plan for full lessons.");
                } else {
                    alert("Failed to generate speech: " + errorMsg);
                }
                console.error("TTS error:", errorMsg);
            }
        } catch (err) {
            console.error("Error generating TTS:", err);
            alert("Failed to generate speech. Please try again.");
        } finally {
            setIsGeneratingTTS(false);
        }
    };

    const stopSpeaking = () => {
        setTtsAudioUrl(null);
        setIsSpeaking(false);
    };

    // --- RENDER MODES ---

    if (mode === 'setup') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-10 max-w-2xl w-full border border-white/50">
                    <button onClick={onBack} className="mb-6 text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-2 font-medium">
                        <span>←</span> Back to Dashboard
                    </button>
                    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-8 capitalize">
                        {subject} Lesson Setup
                    </h2>

                    <div className="space-y-8">
                        <div>
                            <label className="block text-xl font-bold text-gray-700 mb-3">What do you want to learn today?</label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., Photosynthesis, Fractions, Ancient Rome"
                                className="w-full p-5 border-2 border-indigo-100 rounded-2xl text-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xl font-bold text-gray-700 mb-3">Grade Level</label>
                            <select
                                value={grade}
                                onChange={(e) => setGrade(parseInt(e.target.value))}
                                className="w-full p-5 border-2 border-indigo-100 rounded-2xl text-xl bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none shadow-sm cursor-pointer"
                            >
                                {[...Array(12).keys()].map(i => (
                                    <option key={i + 1} value={i + 1}>Grade {i + 1}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleStartLesson}
                            disabled={loading || !topic}
                            className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-2xl font-bold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin">⏳</span> Creating Magic...
                                </>
                            ) : (
                                <>
                                    <span>✨</span> Create Lesson Plan
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'plan') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-10 max-w-3xl w-full border border-white/50">
                    <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                        <span className="text-4xl">🗺️</span>
                        <span>Your Adventure: <span className="text-emerald-600">{topic}</span></span>
                    </h2>
                    <div className="space-y-4 mb-10">
                        {lessonPlan.map((step, idx) => (
                            <div key={idx} className="flex items-center gap-6 p-6 bg-white rounded-2xl shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold border-2 border-emerald-200">
                                    {idx + 1}
                                </div>
                                <span className="text-xl font-medium text-gray-700">{step}</span>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={handleStartLearning}
                        disabled={loading}
                        className="w-full py-5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl text-2xl font-bold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin">⏳</span> Loading Your Lesson...
                            </>
                        ) : (
                            <>
                                <span>🚀</span> Start Learning!
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    if (mode === 'quiz-setup') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-fuchsia-100 p-8 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-white/50">
                    <div className="text-6xl mb-6">🤔</div>
                    <h3 className="text-3xl font-bold mb-4 text-gray-800">Ready for a Quiz?</h3>
                    <p className="mb-8 text-xl text-gray-600">How many questions can you handle?</p>
                    <div className="grid grid-cols-3 gap-4 mb-10">
                        {[5, 10, 15].map(num => (
                            <button
                                key={num}
                                onClick={() => startQuiz(num)}
                                className="p-6 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-2xl font-bold text-2xl transition-colors border-2 border-purple-200"
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setMode('learning')} className="text-gray-500 hover:text-gray-800 font-medium underline decoration-2 underline-offset-4">
                        Maybe later
                    </button>
                </div>
            </div>
        );
    }

    if (mode === 'quiz') {
        return (
            <QuizView
                subject={subject}
                topic={`${topic}: ${lessonPlan[currentStep]}`}
                grade={grade}
                studentName={studentProfile.name}
                studentId={studentProfile.id}
                numQuestions={quizConfig?.numQuestions || 5}
                onComplete={handleQuizComplete}
                onBack={() => setMode('learning')}
            />
        );
    }

    if (lessonComplete) {
        return (
            <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl w-full text-center space-y-8 animate-fade-in">
                    <div className="text-8xl animate-bounce">🎉</div>
                    <h2 className="text-4xl font-bold text-gray-800">Lesson Completed!</h2>
                    <p className="text-xl text-gray-600">You've mastered <span className="font-bold text-blue-600">{topic}</span> and earned XP!</p>

                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                        <h3 className="font-bold text-blue-800 mb-2">Want to remember this forever?</h3>
                        <p className="text-blue-600 mb-6">Create AI-powered flashcards to practice later.</p>

                        {!flashcardsGenerated ? (
                            <button
                                onClick={handleGenerateFlashcards}
                                disabled={isGeneratingFlashcards}
                                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform transition-all hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGeneratingFlashcards ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        <span>Generating Magic Cards...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>✨</span>
                                        <span>Create Flashcards</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="bg-green-100 text-green-700 p-4 rounded-xl font-bold flex items-center justify-center gap-2">
                                <span>✅</span>
                                <span>Flashcards Created Successfully!</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onBack}
                        className="text-gray-500 hover:text-gray-700 font-bold"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // --- LEARNING MODE ---
    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12">
            <div className="max-w-5xl mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-blue-100 font-bold uppercase tracking-wider text-sm mb-1">{topic}</h2>
                        <h3 className="text-3xl md:text-4xl font-extrabold">{lessonPlan[currentStep]}</h3>
                    </div>
                    <div className="text-right bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                        <span className="block text-xs text-blue-100 uppercase font-bold tracking-widest">Progress</span>
                        <span className="text-3xl font-bold">{currentStep + 1} <span className="text-blue-200 text-xl">/ {lessonPlan.length}</span></span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-8 md:p-12 relative min-h-[400px]">
                    {/* Floating Controls */}
                    {!loading && (
                        <div className="absolute top-4 right-4 flex flex-col gap-3 z-10">
                            {/* Read Aloud Control */}
                            {isGeneratingTTS ? (
                                <div className="p-4 bg-white rounded-full shadow-lg border border-blue-100 animate-pulse flex items-center justify-center w-16 h-16">
                                    <span className="text-2xl animate-spin">⏳</span>
                                </div>
                            ) : !isSpeaking ? (
                                <button
                                    onClick={() => speakText(currentContent)}
                                    className="group p-4 bg-white rounded-full shadow-lg border border-green-100 hover:bg-green-50 hover:scale-110 transition-all w-16 h-16 flex items-center justify-center relative"
                                    title="Read Aloud"
                                >
                                    <span className="text-3xl">🗣️</span>
                                    <span className="absolute right-full mr-3 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        Read Aloud
                                    </span>
                                </button>
                            ) : (
                                <button
                                    onClick={stopSpeaking}
                                    className="group p-4 bg-red-50 rounded-full shadow-lg border border-red-100 hover:bg-red-100 hover:scale-110 transition-all w-16 h-16 flex items-center justify-center relative"
                                    title="Stop Reading"
                                >
                                    <span className="text-3xl">⏹️</span>
                                </button>
                            )}

                            {/* Flashcard Toggle */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="bg-white/90 backdrop-blur rounded-lg px-2 py-1 shadow-sm border border-gray-100">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block text-center">Count</label>
                                    <select
                                        value={numCardsToGenerate}
                                        onChange={(e) => setNumCardsToGenerate(parseInt(e.target.value))}
                                        className="bg-transparent text-sm font-bold text-gray-800 focus:outline-none text-center w-full"
                                        disabled={isGeneratingFlashcards}
                                    >
                                        <option value={3}>3</option>
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleGenerateFlashcards}
                                    disabled={isGeneratingFlashcards}
                                    className="group p-4 bg-white rounded-full shadow-lg border border-yellow-100 hover:bg-yellow-50 hover:scale-110 transition-all w-16 h-16 flex items-center justify-center relative"
                                    title="Generate Flashcards"
                                >
                                    <span className="text-3xl">{isGeneratingFlashcards ? '⏳' : '⚡'}</span>
                                    <span className="absolute right-full mr-3 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        Create Flashcards
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="space-y-6 animate-pulse max-w-3xl">
                            <div className="h-8 bg-gray-200 rounded-lg w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            <div className="h-64 bg-gray-100 rounded-2xl w-full mt-8"></div>
                        </div>
                    ) : (
                        <>
                            {currentImage && (
                                <div className="mb-8">
                                    <img
                                        src={currentImage}
                                        alt="Educational illustration"
                                        className="w-full rounded-2xl shadow-lg border-4 border-indigo-100"
                                    />
                                </div>
                            )}
                            <div className="prose prose-xl prose-indigo max-w-none text-gray-700 leading-relaxed">
                                <ReactMarkdown>{currentContent}</ReactMarkdown>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer / Action Bar */}
                <div className="bg-gray-50 p-8 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={handleTakeQuiz}
                        disabled={loading}
                        className="px-10 py-5 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 text-xl"
                    >
                        <span>Take Quiz to Unlock Next</span>

                        <span className="text-2xl">🔐</span>
                    </button>
                </div>

                {/* Embedded Flashcards Section */}
                {showFlashcards && (
                    <div className="bg-indigo-50 p-8 border-t border-indigo-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-indigo-800">⚡ Quick Flashcards</h3>
                            {!flashcardsGenerated ? (
                                <button
                                    onClick={handleSaveFlashcards}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                                >
                                    Save to Profile
                                </button>
                            ) : (
                                <span className="text-green-600 font-bold flex items-center gap-2">
                                    <span>✅</span> Saved
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {currentFlashcards.map((card, idx) => (
                                <div key={idx} className="transform scale-75 origin-top-left">
                                    <Flashcard
                                        front={card.front}
                                        back={card.back}
                                        isFlipped={!!flippedCards[idx]}
                                        onFlip={() => setFlippedCards(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                {/* TTS Audio Player */}
                {ttsAudioUrl && (
                    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-2xl shadow-2xl border-2 border-indigo-200 p-4 flex items-center gap-4 min-w-[400px]">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center animate-pulse">
                                <span className="text-2xl">🗣️</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-800 text-sm">Laura is reading...</p>
                                <audio
                                    src={ttsAudioUrl}
                                    controls
                                    autoPlay
                                    onEnded={stopSpeaking}
                                    className="w-full mt-1"
                                />
                            </div>
                        </div>
                        <button
                            onClick={stopSpeaking}
                            className="p-2 hover:bg-red-50 rounded-full transition-colors"
                            title="Close"
                        >
                            <span className="text-xl">✖️</span>
                        </button>
                    </div>
                )}
            </div>
            <Modal
                isOpen={modalConfig.isOpen}
                onClose={modalConfig.onClose}
                title={modalConfig.title}
                actions={
                    <button onClick={modalConfig.onClose} className="btn-modal btn-primary">
                        OK
                    </button>
                }
            >
                {modalConfig.content}
            </Modal>
            {/* Chat Assistant */}
            {mode === 'learning' && (
                <ChatAssistant
                    context={currentContent}
                    studentGrade={grade}
                />
            )}
        </div>
    );
};

export default LessonView;
