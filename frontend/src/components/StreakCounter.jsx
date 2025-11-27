import React, { useState, useEffect } from 'react';
import './StreakCounter.css';

const StreakCounter = ({ studentId }) => {
    const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (studentId) {
            fetchStreak();
        }
    }, [studentId]);

    const fetchStreak = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/students/${studentId}/streak`);
            const data = await res.json();
            setStreak(data);
        } catch (error) {
            console.error('Error fetching streak:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return null;
    }

    const isActive = streak.current_streak > 0;
    const isMilestone = streak.current_streak >= 7;

    return (
        <div className="streak-counter-container">
            <div className={`streak-counter ${isActive ? 'active' : ''}`}>
                <div className={`flame-icon ${isActive ? 'burning' : ''}`}>
                    🔥
                </div>
                <div className="streak-info">
                    <div className="streak-number">{streak.current_streak}</div>
                    <div className="streak-label">day streak</div>
                </div>
                {isMilestone && (
                    <div className="streak-badge">
                        <span className="milestone-icon">🏆</span>
                    </div>
                )}
            </div>
            {streak.longest_streak > 0 && (
                <div className="streak-tooltip">
                    Best: {streak.longest_streak} {streak.longest_streak === 1 ? 'day' : 'days'}
                </div>
            )}
        </div>
    );
};

export default StreakCounter;
