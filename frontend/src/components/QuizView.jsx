
import React, { useState, useEffect } from 'react';

const QuizView = ({ subject, topic, grade, studentName, studentId, numQuestions = 5, onBack, onComplete, onBadgeUnlock, initialQuestions = null }) => {
    const [loading, setLoading] = useState(!initialQuestions);
    const [questions, setQuestions] = useState(initialQuestions || []);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [leveledUp, setLeveledUp] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isAnswerChecked, setIsAnswerChecked] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const recognitionRef = React.useRef(null);

    useEffect(() => {
        // Initialize Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                console.log("Heard:", transcript);

                // Simple matching logic
                // 1. Check for "A", "B", "C", "D" (tricky with speech, but we can try)
                // 2. Fuzzy match against options

                const currentOptions = questions[currentQuestionIndex].options;
                const matchedOption = currentOptions.find(opt =>
                    opt.toLowerCase().includes(transcript) || transcript.includes(opt.toLowerCase())
                );

                if (matchedOption) {
                    handleAnswerSelect(matchedOption);
                } else {
                    // Fallback: Check if they said "Option 1", "First one", etc. (Advanced)
                    // For now, just alert if no match
                    // alert(`I heard "${transcript}", but couldn't match it to an answer.`);
                }
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [questions, currentQuestionIndex]); // Re-bind if needed, or just keep ref stable

    const startListening = () => {
        if (recognitionRef.current) {
            setIsListening(true);
            recognitionRef.current.start();
        } else {
            alert("Speech recognition not supported in this browser.");
        }
    };

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/quiz', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subject, topic, grade, num_questions: numQuestions })
                });
                const data = await res.json();
                // Handle case where data might be a string (if parsed manually) or object
                const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
                setQuestions(parsedData.questions || []);
            } catch (error) {
                console.error("Error fetching quiz:", error);
            } finally {
                setLoading(false);
            }
        };

        if (!initialQuestions) {
            fetchQuiz();
        }
    }, [subject, topic, grade, numQuestions, initialQuestions]);

    const handleAnswerSelect = (option) => {
        if (isAnswerChecked) return;
        setSelectedAnswer(option);
    };

    const handleCheckAnswer = () => {
        setIsAnswerChecked(true);
        if (selectedAnswer === questions[currentQuestionIndex].correct) {
            setScore(score + 1);
            // Play sound effect here if desired
        }
    };

    const handleNextQuestion = async () => {
        if (currentQuestionIndex + 1 < questions.length) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedAnswer(null);
            setIsAnswerChecked(false);
        } else {
            const finalScore = score; // Score is already updated by handleCheckAnswer
            // setScore(finalScore); // No need to update state again if it's already correct
            setShowResults(true);

            // Save results to DB
            try {
                await fetch('http://localhost:8000/api/results', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        student_name: studentName || "Student",
                        grade: grade,
                        subject: subject,
                        topic: topic,
                        score: finalScore,
                        total_questions: questions.length
                    })
                });

                // Award XP if studentId is present
                if (studentId) {
                    const xpEarned = finalScore * 5; // 5 XP per correct answer
                    const xpRes = await fetch('http://localhost:8000/api/students/xp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ student_id: studentId, xp_amount: xpEarned })
                    });
                    const xpData = await xpRes.json();
                    if (xpData.leveled_up) {
                        setLeveledUp(true);
                    }
                }

            } catch (err) {
                console.error("Failed to save results/xp", err);
            }

            // Check for new badges
            if (studentId && onBadgeUnlock) {
                try {
                    const badgeRes = await fetch(`http://localhost:8000/api/students/${studentId}/check-badges`, {
                        method: 'POST'
                    });
                    const badgeData = await badgeRes.json();
                    if (badgeData.new_badges && badgeData.new_badges.length > 0) {
                        // Show unlock modal for each badge (sequentially or just the first one for now)
                        // For simplicity, let's show the first one, or loop if we can handle multiple
                        badgeData.new_badges.forEach(badge => {
                            onBadgeUnlock(badge);
                        });
                    }
                } catch (err) {
                    console.error("Error checking badges:", err);
                }
            }

            // If onComplete is provided (Lesson Mode), call it after a short delay or button press
            if (onComplete) {
                // We can either auto-call or let user click "Continue"
            }
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <div className="animate-spin text-6xl mb-4">🧠</div>
                <h2 className="text-2xl font-bold text-gray-700">Generating your quiz...</h2>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <h2 className="text-xl text-red-500">Oops! Could not generate a quiz.</h2>
                <button onClick={onBack} className="mt-4 text-blue-500 underline">Go Back</button>
            </div>
        );
    }

    if (showResults) {
        return (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                {leveledUp && (
                    <div className="mb-6 animate-bounce">
                        <span className="text-6xl">🆙</span>
                        <h2 className="text-4xl font-bold text-purple-600">LEVEL UP!</h2>
                        <p className="text-xl text-purple-500">You are getting smarter!</p>
                    </div>
                )}
                <h2 className="text-4xl font-bold text-blue-600 mb-6">Quiz Complete! 🎉</h2>
                <div className="text-6xl font-bold text-gray-800 mb-4">
                    {score} / {questions.length}
                </div>
                <p className="text-xl text-gray-600 mb-8">
                    {score === questions.length ? "Perfect Score! You're a star! 🌟" : "Great effort! Keep learning!"}
                </p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onBack}
                        className="px-8 py-4 bg-gray-500 text-white font-bold rounded-xl shadow-lg hover:bg-gray-600"
                    >
                        Back
                    </button>
                    {onComplete && (
                        <button
                            onClick={() => onComplete(score, questions.length)}
                            className="px-8 py-4 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600"
                        >
                            Continue Lesson →
                        </button>
                    )}
                    {!isSaved && studentId && (
                        <button
                            onClick={async () => {
                                try {
                                    await fetch('http://localhost:8000/api/saved-quizzes', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            student_id: studentId,
                                            subject: subject,
                                            topic: topic,
                                            questions: questions
                                        })
                                    });
                                    setIsSaved(true);
                                } catch (err) {
                                    console.error("Error saving quiz:", err);
                                    alert("Failed to save quiz");
                                }
                            }}
                            className="px-8 py-4 bg-indigo-500 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-600 flex items-center gap-2"
                        >
                            <span>💾</span> Save Quiz
                        </button>
                    )}
                    {isSaved && (
                        <div className="px-8 py-4 bg-indigo-100 text-indigo-700 font-bold rounded-xl flex items-center gap-2">
                            <span>✅</span> Saved
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">Question {currentQuestionIndex + 1} of {questions.length}</span>
                <span className="text-sm font-bold text-blue-500">Score: {score}</span>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-8">{currentQuestion.question}</h3>

            <div className="grid gap-4 mb-8">
                {currentQuestion.options.map((option, idx) => {
                    let buttonStyle = "bg-gray-50 border-2 border-gray-200 hover:border-blue-300";

                    if (selectedAnswer === option) {
                        buttonStyle = "bg-blue-50 border-2 border-blue-500";
                    }

                    if (isAnswerChecked) {
                        if (option === currentQuestion.correct) {
                            buttonStyle = "bg-green-100 border-2 border-green-500 text-green-800";
                        } else if (selectedAnswer === option && option !== currentQuestion.correct) {
                            buttonStyle = "bg-red-100 border-2 border-red-500 text-red-800";
                        } else {
                            buttonStyle = "opacity-50";
                        }
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => handleAnswerSelect(option)}
                            className={`p - 4 rounded - xl text - left text - lg font - medium transition - all ${buttonStyle} `}
                            disabled={isAnswerChecked}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>

            {isAnswerChecked && currentQuestion.explanation && (
                <div className={`p-4 rounded-xl mb-8 ${selectedAnswer === currentQuestion.correct ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    <p className="font-bold mb-1">{selectedAnswer === currentQuestion.correct ? 'Correct!' : 'Incorrect'}</p>
                    <p>{currentQuestion.explanation}</p>
                </div>
            )}

            <div className="flex justify-between items-center">
                {/* Voice Input Button */}
                {!isAnswerChecked && (
                    <button
                        onClick={startListening}
                        className={`p-4 rounded-full shadow-lg transition-all ${isListening ? 'bg-red-500 animate-pulse text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        title="Speak Answer"
                        disabled={!recognitionRef.current} // Disable if API not supported
                    >
                        🎙️
                    </button>
                )}

                <div className="flex-1 flex justify-end">
                    {!isAnswerChecked ? (
                        <button
                            onClick={handleCheckAnswer}
                            disabled={!selectedAnswer || isListening} // Disable check answer when listening
                            className={`px-8 py-3 rounded-xl font-bold text-white transition-all ${!selectedAnswer || isListening ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                        >
                            Check Answer
                        </button>
                    ) : (
                        <button
                            onClick={handleNextQuestion}
                            className="px-8 py-3 bg-purple-500 text-white font-bold rounded-xl shadow-lg hover:bg-purple-600 hover:scale-105 transition-transform"
                        >
                            {currentQuestionIndex + 1 === questions.length ? 'Finish Quiz' : 'Next Question →'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizView;

