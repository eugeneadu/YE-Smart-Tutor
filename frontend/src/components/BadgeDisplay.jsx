import React, { useState, useEffect } from 'react';
import './BadgeDisplay.css';

const BadgeDisplay = ({ studentId }) => {
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (studentId) {
            fetchBadges();
        }
    }, [studentId]);

    const fetchBadges = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/students/${studentId}/badges`);
            const data = await res.json();
            setBadges(data);
        } catch (error) {
            console.error('Error fetching badges:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="badge-loading">Loading badges...</div>;
    }

    return (
        <div className="badge-container">
            <h3 className="badge-section-title">🏆 Your Badges</h3>
            <div className="badge-grid">
                {badges.map(badge => (
                    <BadgeCard key={badge.id} badge={badge} />
                ))}
            </div>
        </div>
    );
};

const BadgeCard = ({ badge }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div
            className={`badge-card ${badge.earned ? 'earned' : 'locked'} ${badge.is_new ? 'new' : ''} tier-${badge.tier}`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div className="badge-icon">{badge.icon}</div>
            <div className="badge-name">{badge.name}</div>

            {!badge.earned && (
                <div className="badge-progress">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${badge.progress}%` }}
                        />
                    </div>
                    <div className="progress-text">{badge.progress}%</div>
                </div>
            )}

            {badge.is_new && (
                <div className="badge-new-indicator">NEW!</div>
            )}

            {showTooltip && (
                <div className="badge-tooltip">
                    <strong>{badge.name}</strong>
                    <p>{badge.description}</p>
                    {badge.earned && badge.earned_at && (
                        <small>Earned {new Date(badge.earned_at).toLocaleDateString()}</small>
                    )}
                    {!badge.earned && (
                        <small>Progress: {badge.progress}%</small>
                    )}
                </div>
            )}
        </div>
    );
};

export default BadgeDisplay;
