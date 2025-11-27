import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const LessonLibrary = ({ studentId, onExit }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch(`/api/students/${studentId}/lesson-logs`);
                const data = await res.json();
                setLogs(data);
            } catch (err) {
                console.error("Error fetching logs:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [studentId]);

    if (loading) return <div className="p-8 text-center animate-pulse">Loading your lessons...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 md:p-10 h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <span>📚</span> My Lessons
                    </h2>
                    <p className="text-gray-500 mt-1">Review everything you've learned!</p>
                </div>
                <button onClick={onExit} className="px-6 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors">
                    Exit
                </button>
            </div>

            <div className="flex gap-8 h-full overflow-hidden">
                {/* List */}
                <div className="w-1/3 overflow-y-auto pr-4 space-y-4">
                    {logs.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">No lessons yet. Start learning!</div>
                    ) : (
                        logs.map(log => (
                            <div
                                key={log.id}
                                onClick={() => setSelectedLog(log)}
                                className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedLog?.id === log.id ? 'bg-blue-50 border-blue-200 shadow-md' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                            >
                                <div className="font-bold text-gray-800 mb-1">{log.topic}</div>
                                <div className="text-xs text-gray-500 flex justify-between">
                                    <span className="uppercase font-bold text-blue-400">{log.subject}</span>
                                    <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Content Viewer */}
                <div className="w-2/3 bg-white rounded-3xl shadow-sm border border-gray-100 p-8 overflow-y-auto">
                    {selectedLog ? (
                        <div className="prose prose-blue max-w-none">
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedLog.topic}</h2>
                            <div className="text-sm text-gray-400 mb-8 border-b pb-4">
                                {selectedLog.subject} • {new Date(selectedLog.timestamp).toLocaleString()}
                            </div>
                            <ReactMarkdown>{selectedLog.content}</ReactMarkdown>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300">
                            <div className="text-6xl mb-4">👈</div>
                            <p className="text-xl">Select a lesson to review</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LessonLibrary;
