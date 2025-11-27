import React, { useEffect } from 'react';
import './BadgeUnlockModal.css';

const BadgeUnlockModal = ({ badge, onClose }) => {
    useEffect(() => {
        // Auto-dismiss after 5 seconds
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    if (!badge) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Confetti Animation */}
                <div className="confetti-container">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 0.5}s`,
                                background: ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 5)]
                            }}
                        />
                    ))}
                </div>

                {/* Badge Display */}
                <div className="badge-unlock-content">
                    <h2 className="unlock-title">🎉 Badge Unlocked! 🎉</h2>

                    <div className="badge-icon-large">
                        {badge.icon}
                    </div>

                    <h3 className="badge-name-large">{badge.name}</h3>
                    <p className="badge-description">{badge.description}</p>

                    <div className={`badge-tier tier-${badge.tier}`}>
                        {badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)} Badge
                    </div>

                    <button onClick={onClose} className="btn-awesome">
                        Awesome! 🎊
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BadgeUnlockModal;
