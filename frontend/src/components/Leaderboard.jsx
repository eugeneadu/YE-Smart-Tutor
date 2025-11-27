import React, { useState, useEffect } from 'react';
import './Leaderboard.css';

const Leaderboard = ({ currentStudentId, onPrivacyChange }) => {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPublic, setIsPublic] = useState(false);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    // Check current user's privacy setting when list updates
    useEffect(() => {
        if (leaders.length > 0 && currentStudentId) {
            const me = leaders.find(l => l.id === currentStudentId);
            if (me) {
                setIsPublic(me.is_public);
            }
        }
    }, [leaders, currentStudentId]);

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/leaderboard');
            const data = await res.json();
            setLeaders(data);
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrivacyToggle = async () => {
        const newStatus = !isPublic;
        setIsPublic(newStatus); // Optimistic update

        try {
            await fetch(`http://localhost:8000/api/students/${currentStudentId}/privacy`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_public: newStatus })
            });
            fetchLeaderboard(); // Refresh list to see name change
            if (onPrivacyChange) onPrivacyChange(newStatus);
        } catch (error) {
            console.error("Error updating privacy:", error);
            setIsPublic(!newStatus); // Revert on error
        }
    };

    if (loading) return <div className="leaderboard-container animate-pulse">Loading rankings...</div>;

    return (
        <div className="leaderboard-container">
            <div className="leaderboard-header">
                <div className="leaderboard-title">
                    <span>🏆</span> Leaderboard
                </div>
                <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">ALL TIME</span>
            </div>

            <div className="leaderboard-list">
                {leaders.map((student) => (
                    <div
                        key={student.rank}
                        className={`leaderboard-item ${student.id === currentStudentId ? 'is-me' : ''}`}
                    >
                        <div className={`rank-badge rank-${student.rank}`}>
                            {student.rank}
                        </div>
                        <div className="student-info">
                            <span className="student-avatar">{student.avatar}</span>
                            <div className="flex flex-col">
                                <span className="student-name">
                                    {student.name} {student.id === currentStudentId && "(You)"}
                                </span>
                                <span className="text-xs text-gray-400">Level {student.level}</span>
                            </div>
                        </div>
                        <div className="student-xp">{student.xp} XP</div>
                    </div>
                ))}
            </div>

            {currentStudentId && (
                <div className="privacy-toggle">
                    <span>Show my name on leaderboard</span>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={isPublic}
                            onChange={handlePrivacyToggle}
                        />
                        <span className="slider"></span>
                    </label>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
