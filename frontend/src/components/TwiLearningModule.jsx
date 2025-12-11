import React, { useState } from 'react';

const TwiLearningModule = ({ onBack }) => {
    const [topic, setTopic] = useState('');
    const [vocabList, setVocabList] = useState([]);
    const [loading, setLoading] = useState(false);

    // Translation State
    const [textToTranslate, setTextToTranslate] = useState('');
    const [translationResult, setTranslationResult] = useState(null);
    const [translating, setTranslating] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerateVocab = async () => {
        if (!topic) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/twi/vocab', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic })
            });
            if (!res.ok) throw new Error('Failed to generate vocabulary');
            const data = await res.json();
            setVocabList(data.vocab || []);
        } catch (error) {
            console.error("Error fetching Twi vocab:", error);
            setError("Sorry, I couldn't generate words right now. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleTranslate = async () => {
        if (!textToTranslate) return;
        setTranslating(true);
        setTranslationResult(null);
        setError(null);
        try {
            const res = await fetch('/api/twi/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textToTranslate })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Translation failed');
            }

            const data = await res.json();
            setTranslationResult(data);
        } catch (error) {
            console.error("Error translating:", error);
            setError("Sorry, translation failed. The AI might be busy. Please try again in a moment.");
        } finally {
            setTranslating(false);
        }
    };

    const speakText = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            // Note: Twi is not natively supported by most browsers, so we use a generic voice.
            // In a real app, we might use an external TTS API for better Twi support.
            // For now, we'll use a default voice but slow it down slightly.
            utterance.rate = 0.8;
            window.speechSynthesis.speak(utterance);
        } else {
            alert("Sorry, your browser doesn't support text-to-speech.");
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto border-4 border-yellow-400">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-yellow-800">Learn Twi! 🇬🇭</h2>
                <button onClick={onBack} className="text-gray-500 hover:text-gray-700">← Back</button>
            </div>

            <div className="mb-12 text-center border-b-2 border-yellow-100 pb-8">
                <p className="text-lg text-gray-600 mb-4">What do you want to learn words about?</p>
                <div className="flex gap-4 justify-center">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., Family, Food, School"
                        className="p-4 border-2 border-yellow-200 rounded-xl text-lg w-full max-w-md focus:border-yellow-500 focus:outline-none"
                    />
                    <button
                        onClick={handleGenerateVocab}
                        disabled={loading || !topic}
                        className="bg-yellow-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-yellow-600 disabled:opacity-50"
                    >
                        {loading ? 'Thinking...' : 'Teach Me!'}
                    </button>
                </div>
            </div>

            {/* Instant Translation Section */}
            <div className="mb-12 bg-blue-50 p-6 rounded-xl border border-blue-200">
                <h3 className="text-xl font-bold text-blue-800 mb-4 text-center">Instant Translator 🔄</h3>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <div className="flex gap-4 justify-center mb-4">
                    <input
                        type="text"
                        value={textToTranslate}
                        onChange={(e) => setTextToTranslate(e.target.value)}
                        placeholder="Type anything to translate..."
                        className="p-4 border-2 border-blue-200 rounded-xl text-lg w-full max-w-md focus:border-blue-500 focus:outline-none"
                    />
                    <button
                        onClick={handleTranslate}
                        disabled={translating || !textToTranslate}
                        className="bg-blue-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50"
                    >
                        {translating ? 'Translating...' : 'Translate'}
                    </button>
                </div>

                {translationResult && (
                    <div className="bg-white p-6 rounded-xl shadow-sm max-w-2xl mx-auto text-center animate-fade-in">
                        <div className="flex justify-center items-center gap-4 mb-2">
                            <h4 className="text-3xl font-bold text-gray-800">{translationResult.translation}</h4>
                            <button
                                onClick={() => speakText(translationResult.translation)}
                                className="text-3xl hover:scale-110 transition"
                                title="Listen"
                            >
                                🔊
                            </button>
                        </div>
                        <p className="text-gray-500 italic mb-2">"{translationResult.pronunciation}"</p>
                        {translationResult.notes && (
                            <p className="text-sm text-blue-600 bg-blue-50 inline-block px-3 py-1 rounded-full">
                                💡 {translationResult.notes}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vocabList.map((item, index) => (
                    <div key={index} className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-2xl font-bold text-gray-800">{item.twi}</h3>
                            <button
                                onClick={() => speakText(item.twi)}
                                className="text-2xl hover:scale-110 transition"
                                title="Listen"
                            >
                                🔊
                            </button>
                        </div>
                        <p className="text-gray-500 italic mb-2">"{item.pronunciation}"</p>
                        <p className="text-lg text-blue-600 font-semibold mb-4">{item.english}</p>
                        <div className="bg-white p-3 rounded-lg text-sm text-gray-600">
                            Example: <span className="font-medium">{item.example}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TwiLearningModule;
