import React from 'react';
import BadgeDisplay from './BadgeDisplay';
import StreakCounter from './StreakCounter';
import Leaderboard from './Leaderboard';

const SubjectDashboard = ({ onSelectSubject, recommendations = [], studentProfile }) => {
    const subjects = [
        { id: 'math', name: 'Mathematics', icon: '📐', color: 'bg-blue-100 hover:bg-blue-200 text-blue-600' },
        { id: 'english', name: 'English', icon: '📚', color: 'bg-green-100 hover:bg-green-200 text-green-600' },
        { id: 'science', name: 'Science', icon: '🔬', color: 'bg-purple-100 hover:bg-purple-200 text-purple-600' },
        { id: 'twi', name: 'Twi Language', icon: '🇬🇭', color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-600' },
        { id: 'social', name: 'Social Studies', icon: '🌍', color: 'bg-orange-100 hover:bg-orange-200 text-orange-600' },
    ];

    return (
        <div className="space-y-8 animate-fade-in p-4 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area (2/3) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Welcome / Header could go here */}

                    {recommendations.length > 0 && (
                        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-8 border-red-400 p-8 rounded-2xl shadow-lg transform transition-all hover:scale-[1.01]">
                            <h3 className="text-2xl font-bold text-red-800 mb-6 flex items-center gap-3">
                                <span className="text-3xl">🧠</span>
                                <span>Smart Review Recommendations</span>
                            </h3>
                            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                                {recommendations.map((rec, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => onSelectSubject(rec.subject, rec.topic)}
                                        className="flex-shrink-0 bg-white p-6 rounded-2xl shadow-md border border-red-100 hover:shadow-xl hover:border-red-300 transition-all text-left min-w-[240px] group"
                                    >
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{rec.subject}</div>
                                        <div className="text-lg font-bold text-gray-800 group-hover:text-red-600 mb-3">{rec.topic}</div>
                                        <div className="flex items-center gap-2 text-sm font-medium text-red-500 bg-red-50 px-3 py-1 rounded-full w-fit">
                                            <span>Last Score:</span>
                                            <span className="font-bold">{rec.last_score}%</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {subjects.map((subject) => (
                            <button
                                key={subject.id}
                                onClick={() => onSelectSubject(subject.id)}
                                className={`${subject.color} p-8 rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center gap-4 border-4 border-transparent hover:border-white/50 group`}
                            >
                                <span className="text-6xl filter drop-shadow-md group-hover:scale-110 transition-transform duration-300">{subject.icon}</span>
                                <span className="text-2xl font-bold tracking-tight">{subject.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sidebar (1/3) */}
                <div className="space-y-8">
                    {studentProfile && (
                        <>
                            {/* Gamification Section */}
                            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        <span>🏆</span>
                                        <span>Achievements</span>
                                    </h2>
                                    <StreakCounter studentId={studentProfile.id} />
                                </div>
                                <BadgeDisplay studentId={studentProfile.id} />
                            </div>

                            {/* Leaderboard Section */}
                            <div className="h-[600px]">
                                <Leaderboard currentStudentId={studentProfile.id} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubjectDashboard;
