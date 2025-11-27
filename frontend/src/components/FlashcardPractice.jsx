import React, { useState, useEffect } from 'react';
import Flashcard from './Flashcard';
import Modal from './Modal';

const FlashcardPractice = ({ studentId, onExit }) => {
    const [view, setView] = useState('library'); // 'library', 'practice'
    const [allCards, setAllCards] = useState([]);
    const [practiceCards, setPracticeCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', content: '', type: 'info' });

    useEffect(() => {
        fetchAllCards();
    }, [studentId]);

    const fetchAllCards = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/api/students/${studentId}/flashcards`);
            const data = await res.json();
            setAllCards(data);
        } catch (error) {
            console.error("Error fetching flashcards:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCard = async (cardId) => {
        if (!window.confirm("Are you sure you want to delete this flashcard?")) return;

        try {
            await fetch(`http://localhost:8000/api/flashcards/${cardId}`, {
                method: 'DELETE'
            });
            setAllCards(prev => prev.filter(c => c.id !== cardId));
        } catch (error) {
            console.error("Error deleting card:", error);
            alert("Failed to delete card");
        }
    };

    const startPractice = (cardsToPractice) => {
        if (cardsToPractice.length === 0) {
            setModalConfig({
                isOpen: true,
                title: 'No Cards',
                content: 'There are no cards to practice in this selection.',
                type: 'info',
                onClose: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
            });
            return;
        }
        setPracticeCards(cardsToPractice);
        setCurrentIndex(0);
        setIsFlipped(false);
        setSessionComplete(false);
        setView('practice');
    };

    const startPracticeDue = () => {
        const now = new Date();
        const dueCards = allCards.filter(c => new Date(c.next_review) <= now);
        startPractice(dueCards);
    };

    const handleRate = async (rating) => {
        const currentCard = practiceCards[currentIndex];
        try {
            await fetch(`http://localhost:8000/api/flashcards/${currentCard.id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating })
            });

            if (currentIndex < practiceCards.length - 1) {
                setIsFlipped(false);
                setCurrentIndex(currentIndex + 1);
            } else {
                setSessionComplete(true);
                fetchAllCards(); // Refresh data to update next_review times
            }
        } catch (error) {
            console.error("Error submitting review:", error);
        }
    };

    // --- RENDER: LOADING ---
    if (loading && view === 'library') return <div className="p-8 text-center animate-pulse">Loading your library...</div>;

    // --- RENDER: LIBRARY VIEW ---
    if (view === 'library') {
        const dueCount = allCards.filter(c => new Date(c.next_review) <= new Date()).length;

        // Group cards by topic
        const cardsByTopic = allCards.reduce((acc, card) => {
            const topic = card.topic || 'Uncategorized';
            if (!acc[topic]) acc[topic] = [];
            acc[topic].push(card);
            return acc;
        }, {});

        return (
            <div className="max-w-6xl mx-auto p-6 md:p-10 h-full flex flex-col">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <span>📚</span> Flashcard Library
                        </h2>
                        <p className="text-gray-500 mt-1">Manage and practice your collection</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onExit} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors">
                            Exit
                        </button>
                        <button
                            onClick={startPracticeDue}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                        >
                            <span>Practice Due</span>
                            {dueCount > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs animate-pulse">{dueCount}</span>}
                        </button>
                    </div>
                </div>

                {/* Topic Folders Grid */}
                {allCards.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-xl font-bold text-gray-400">No flashcards yet</h3>
                        <p className="text-gray-400">Complete lessons to generate new cards!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-8">
                        {Object.entries(cardsByTopic).map(([topic, cards]) => (
                            <div
                                key={topic}
                                onClick={() => startPractice(cards)}
                                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:scale-105 transition-all cursor-pointer group flex flex-col items-center text-center h-64 justify-center relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-400 to-purple-400"></div>
                                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">📂</div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">{topic}</h3>
                                <span className="bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full text-sm font-bold">
                                    {cards.length} Cards
                                </span>
                                <div className="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold text-gray-400">
                                    Click to Practice
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <Modal
                    isOpen={modalConfig.isOpen}
                    onClose={modalConfig.onClose}
                    title={modalConfig.title}
                    actions={
                        <button onClick={modalConfig.onClose} className="btn-modal btn-primary">OK</button>
                    }
                >
                    {modalConfig.content}
                </Modal>
            </div>
        );
    }

    // --- RENDER: PRACTICE VIEW ---
    if (sessionComplete) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6 animate-fade-in">
                <div className="text-8xl animate-bounce">🌟</div>
                <h2 className="text-4xl font-bold text-gray-800">Session Complete!</h2>
                <p className="text-xl text-gray-600">You reviewed {practiceCards.length} cards.</p>
                <div className="flex gap-4">
                    <button
                        onClick={() => setView('library')}
                        className="px-8 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Back to Library
                    </button>
                    <button
                        onClick={onExit}
                        className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const currentCard = practiceCards[currentIndex];

    return (
        <div className="max-w-3xl mx-auto p-6 flex flex-col h-full">
            <div className="flex justify-between items-center mb-8">
                <button onClick={() => setView('library')} className="text-gray-500 hover:text-gray-800 font-bold flex items-center gap-2">
                    <span>←</span> Library
                </button>
                <div className="text-sm font-bold text-indigo-500 bg-indigo-50 px-4 py-2 rounded-full">
                    Card {currentIndex + 1} / {practiceCards.length}
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center mb-10 relative">
                <Flashcard
                    front={currentCard.front}
                    back={currentCard.back}
                    isFlipped={isFlipped}
                    onFlip={() => setIsFlipped(!isFlipped)}
                />

                {/* Navigation Controls */}
                <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-4 pointer-events-none">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (currentIndex > 0) {
                                setIsFlipped(false);
                                setCurrentIndex(currentIndex - 1);
                            }
                        }}
                        disabled={currentIndex === 0}
                        className={`w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:scale-110 transition-all pointer-events-auto ${currentIndex === 0 ? 'opacity-0' : 'opacity-100'}`}
                        title="Previous Card"
                    >
                        ←
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (currentIndex < practiceCards.length - 1) {
                                setIsFlipped(false);
                                setCurrentIndex(currentIndex + 1);
                            } else {
                                setSessionComplete(true);
                            }
                        }}
                        className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:scale-110 transition-all pointer-events-auto"
                        title="Skip / Next"
                    >
                        →
                    </button>
                </div>
            </div>

            <div className={`grid grid-cols-3 gap-6 transition-all duration-500 transform ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <button
                    onClick={() => handleRate('hard')}
                    className="p-6 bg-red-50 text-red-600 font-bold rounded-2xl border-2 border-red-100 hover:bg-red-100 hover:border-red-200 transition-all active:scale-95"
                >
                    <div className="text-2xl mb-2">😓</div>
                    Hard
                </button>
                <button
                    onClick={() => handleRate('medium')}
                    className="p-6 bg-yellow-50 text-yellow-600 font-bold rounded-2xl border-2 border-yellow-100 hover:bg-yellow-100 hover:border-yellow-200 transition-all active:scale-95"
                >
                    <div className="text-2xl mb-2">😐</div>
                    Medium
                </button>
                <button
                    onClick={() => handleRate('easy')}
                    className="p-6 bg-green-50 text-green-600 font-bold rounded-2xl border-2 border-green-100 hover:bg-green-100 hover:border-green-200 transition-all active:scale-95"
                >
                    <div className="text-2xl mb-2">🤩</div>
                    Easy
                </button>
            </div>

            {/* Skip Text */}
            <div className="text-center mt-6">
                <button
                    onClick={() => {
                        if (currentIndex < practiceCards.length - 1) {
                            setIsFlipped(false);
                            setCurrentIndex(currentIndex + 1);
                        } else {
                            setSessionComplete(true);
                        }
                    }}
                    className="text-gray-400 hover:text-gray-600 font-medium text-sm"
                >
                    Skip this card
                </button>
            </div>
        </div>
    );
};

export default FlashcardPractice;
