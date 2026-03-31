import React from 'react';
import BadgeDisplay from './BadgeDisplay';
import StreakCounter from './StreakCounter';
import Leaderboard from './Leaderboard';

const SubjectDashboard = ({ onSelectSubject, recommendations = [], studentProfile, onStartFlashcards, onOpenQuizLibrary, onOpenLessonLibrary }) => {
    const subjects = [
        { id: 'math', name: 'Mathematics', icon: '📐', colors: 'from-blue-500 to-cyan-400' },
        { id: 'english', name: 'English', icon: '📚', colors: 'from-emerald-500 to-teal-400' },
        { id: 'science', name: 'Science', icon: '🔬', colors: 'from-fuchsia-500 to-purple-600' },
        { id: 'twi', name: 'Twi Language', icon: '🇬🇭', colors: 'from-yellow-400 to-orange-500' },
        { id: 'social', name: 'Social Studies', icon: '🌍', colors: 'from-orange-500 to-red-500' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area (2/3) */}
                <div className="lg:col-span-2 space-y-8">
                    {recommendations.length > 0 && (
                        <div className="glass-panel p-8 rounded-3xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl -z-10 group-hover:bg-pink-500/20 transition-colors duration-700"></div>
                            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-orange-400 mb-6 flex items-center gap-3">
                                <span className="text-3xl animate-bounce">🧠</span>
                                <span>Smart Review Recommendations</span>
                            </h3>
                            <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar">
                                {recommendations.map((rec, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => onSelectSubject(rec.subject, rec.topic)}
                                        className="flex-shrink-0 glass-card p-6 rounded-2xl border-t border-l border-white/20 hover:border-pink-400/50 transition-all text-left min-w-[260px] group/card relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
                                        <div className="text-xs font-bold text-pink-300 uppercase tracking-widest mb-2 flex items-center justify-between">
                                            {rec.subject}
                                            <span className="text-lg">✨</span>
                                        </div>
                                        <div className="text-xl font-bold text-slate-100 group-hover/card:text-white mb-4 line-clamp-2">{rec.topic}</div>
                                        <div className="flex items-center gap-2 text-sm font-medium text-pink-200 bg-pink-500/20 px-4 py-1.5 rounded-full w-fit border border-pink-500/30">
                                            <span>Last Score:</span>
                                            <span className="font-extrabold">{rec.last_score}%</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {subjects.map((subject) => (
                            <button
                                key={subject.id}
                                onClick={() => onSelectSubject(subject.id)}
                                className={`relative group p-8 rounded-3xl overflow-hidden transition-all duration-300 transform hover:-translate-y-2 focus:outline-none`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${subject.colors} opacity-80 group-hover:opacity-100 transition-opacity duration-300`}></div>
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300"></div>
                                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/20 rounded-full blur-2xl transform group-hover:scale-150 transition-transform duration-500"></div>
                                
                                <div className="relative z-10 flex flex-col items-center gap-4 text-white">
                                    <span className="text-7xl filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 animate-float-fast">{subject.icon}</span>
                                    <span className="text-2xl font-extrabold tracking-wide drop-shadow-md">{subject.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sidebar (1/3) */}
                <div className="space-y-6">
                    {studentProfile && (
                        <>
                            {/* Gamification Section */}
                            <div className="glass-panel rounded-3xl p-6">
                                <div className="flex justify-between items-center mb-6 border-b border-slate-700/50 pb-4">
                                    <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                                        <span className="text-2xl">🏆</span>
                                        <span>Achievements</span>
                                    </h2>
                                    <div className="bg-slate-800/80 px-3 py-1 rounded-full border border-slate-600">
                                      <StreakCounter studentId={studentProfile.id} />
                                    </div>
                                </div>
                                <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-700/30">
                                  <BadgeDisplay studentId={studentProfile.id} />
                                </div>
                            </div>

                            {/* Flashcards Button */}
                            <button
                                onClick={onStartFlashcards}
                                className="w-full py-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-3xl shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transform transition-all hover:-translate-y-1 font-bold text-lg flex items-center justify-center gap-3 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-white/20 animate-shine opacity-0 group-hover:opacity-100"></div>
                                <span className="text-3xl relative z-10">⚡</span>
                                <span className="relative z-10">Practice Flashcards</span>
                            </button>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Quiz Library Button */}
                                <button
                                    onClick={onOpenQuizLibrary}
                                    className="w-full py-4 glass-card text-indigo-300 hover:text-indigo-100 hover:bg-indigo-500/20 hover:border-indigo-400 font-bold flex flex-col items-center justify-center gap-2 group"
                                >
                                    <span className="text-3xl group-hover:scale-110 transition-transform">📝</span>
                                    <span className="text-sm uppercase tracking-wider">Quizzes</span>
                                </button>

                                {/* Lesson Library Button */}
                                <button
                                    onClick={onOpenLessonLibrary}
                                    className="w-full py-4 glass-card text-emerald-300 hover:text-emerald-100 hover:bg-emerald-500/20 hover:border-emerald-400 font-bold flex flex-col items-center justify-center gap-2 group"
                                >
                                    <span className="text-3xl group-hover:scale-110 transition-transform">📚</span>
                                    <span className="text-sm uppercase tracking-wider">Lessons</span>
                                </button>
                            </div>

                            {/* Leaderboard Section */}
                            <div className="glass-panel rounded-3xl overflow-hidden h-[500px] border border-slate-700/50">
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
