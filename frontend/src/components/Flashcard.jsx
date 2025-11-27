import React from 'react';
import './Flashcard.css';

const Flashcard = ({ front, back, isFlipped, onFlip }) => {
    return (
        <div className={`flashcard-container ${isFlipped ? 'flipped' : ''}`} onClick={onFlip}>
            <div className="flashcard-inner">
                <div className="flashcard-front">
                    <div className="card-label">Question</div>
                    <div className="card-content">{front}</div>
                    <div className="mt-8 text-sm text-blue-500 font-medium animate-bounce">
                        Click to flip 👆
                    </div>
                </div>
                <div className="flashcard-back">
                    <div className="card-label">Answer</div>
                    <div className="card-content">{back}</div>
                </div>
            </div>
        </div>
    );
};

export default Flashcard;
