
import React, { useState, useEffect } from 'react';

const QuizLibrary = ({ studentId, onExit, onRetakeQuiz }) => {
    const [results, setResults] = useState([]);
    const [savedQuizzes, setSavedQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('history'); // 'history', 'saved'

    useEffect(() => {
        fetchData();
    }, [studentId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resultsRes, savedRes] = await Promise.all([
                fetch(`/api/students/${studentId}/results`),
                fetch(`/api/students/${studentId}/saved-quizzes`)
            ]);

            const resultsData = await resultsRes.json();
            const savedData = await savedRes.json();

            setResults(resultsData);
            setSavedQuizzes(savedData);
        } catch (error) {
            console.error("Error fetching library data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSavedQuiz = async (quizId) => {
        if (!window.confirm("Delete this saved quiz?")) return;
        try {
            await fetch(`/api/saved-quizzes/${quizId}`, {
                method: 'DELETE'
            });
            setSavedQuizzes(prev => prev.filter(q => q.id !== quizId));
        } catch (error) {
            console.error("Error deleting quiz:", error);
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse">Loading library...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 md:p-10 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <span>📝</span> Quiz Library
                    </h2>
                    <p className="text-gray-500 mt-1">Review history and saved quizzes</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onExit} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors">
                        Exit
                    </button>
                    <div className="bg-gray-100 p-1 rounded-xl flex">
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'history' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            History
                        </button>
                        <button
                            onClick={() => setActiveTab('saved')}
                            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'saved' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Saved Quizzes
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'history' ? (
                /* HISTORY VIEW */
                results.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <div className="text-6xl mb-4">📊</div>
                        <h3 className="text-xl font-bold text-gray-400">No quizzes taken yet</h3>
                        <p className="text-gray-400">Complete lessons and take quizzes to see them here!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-8">
                        {/* Group results by topic for display */}
                        {Object.entries(results.reduce((acc, result) => {
                            const topic = result.topic || 'Uncategorized';
                            if (!acc[topic]) acc[topic] = [];
                            acc[topic].push(result);
                            return acc;
                        }, {})).map(([topic, topicResults]) => {
                            // Calculate average score
                            const avgScore = Math.round(topicResults.reduce((sum, r) => sum + (r.score / r.total_questions), 0) / topicResults.length * 100);
                            const latestResult = topicResults[0]; // Assuming sorted by date desc

                            return (
                                <div
                                    key={topic}
                                    className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:scale-105 transition-all cursor-pointer group flex flex-col items-center text-center h-72 justify-between relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-cyan-400"></div>

                                    <div className="mt-4">
                                        <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">📊</div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-1 line-clamp-2">{topic}</h3>
                                        <div className="text-xs font-bold text-blue-500 uppercase tracking-wider">{latestResult.subject}</div>
                                    </div>

                                    <div className="w-full space-y-2">
                                        <div className="flex justify-between text-sm text-gray-500 px-4">
                                            <span>Attempts:</span>
                                            <span className="font-bold text-gray-800">{topicResults.length}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-500 px-4">
                                            <span>Avg Score:</span>
                                            <span className={`font-bold ${avgScore >= 80 ? 'text-green-500' : avgScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>{avgScore}%</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRetakeQuiz(latestResult.subject, topic);
                                        }}
                                        className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 mt-2"
                                    >
                                        <span>Retake New</span>
                                        <span>↺</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                /* SAVED QUIZZES VIEW */
                savedQuizzes.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <div className="text-6xl mb-4">💾</div>
                        <h3 className="text-xl font-bold text-gray-400">No saved quizzes</h3>
                        <p className="text-gray-400">Save a quiz after taking it to practice the same questions later!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-8">
                        {savedQuizzes.map((quiz) => (
                            <div
                                key={quiz.id}
                                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:scale-105 transition-all group flex flex-col items-center text-center h-72 justify-between relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 to-pink-400"></div>
                                <button
                                    onClick={() => handleDeleteSavedQuiz(quiz.id)}
                                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                                    title="Delete Saved Quiz"
                                >
                                    🗑️
                                </button>

                                <div className="mt-4">
                                    <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">💾</div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-1 line-clamp-2">{quiz.topic}</h3>
                                    <div className="text-xs font-bold text-purple-500 uppercase tracking-wider">{quiz.subject}</div>
                                </div>

                                <div className="w-full space-y-2">
                                    <div className="text-sm text-gray-500">
                                        Saved on {new Date(quiz.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="font-bold text-gray-800">
                                        {quiz.questions.length} Questions
                                    </div>
                                </div>

                                <button
                                    onClick={() => onRetakeQuiz(quiz.subject, quiz.topic, quiz.questions)}
                                    className="w-full py-3 bg-purple-50 text-purple-600 rounded-xl font-bold hover:bg-purple-100 transition-colors flex items-center justify-center gap-2 mt-2"
                                >
                                    <span>Start Quiz</span>
                                    <span>▶️</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
};

export default QuizLibrary;

