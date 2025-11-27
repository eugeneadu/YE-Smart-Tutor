import React, { useState } from 'react';

const TwiLearningModule = ({ onBack }) => {
    const [topic, setTopic] = useState('');
    const [vocabList, setVocabList] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleGenerateVocab = async () => {
        if (!topic) return;
        setLoading(true);
        try {
            const res = await fetch('/api/twi/vocab', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic })
            });
            const data = await res.json();
            setVocabList(data.vocab || []);
        } catch (error) {
            console.error("Error fetching Twi vocab:", error);
        } finally {
            setLoading(false);
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

            <div className="mb-8 text-center">
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
