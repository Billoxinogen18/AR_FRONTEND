// src/components/game/crash/CrashGame.jsx
// UPDATED FILE with full animations

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getCrashGameState, placeCrashBet, cashOutCrashBet } from '../../../services/gameService';
import { FaRocket } from 'react-icons/fa';
import './CrashGame.css'; // Make sure to use the new CSS file content

// --- Animation Component ---
const CrashAnimation = ({ gameState }) => {
    const { status, multiplier, crashPoint } = gameState;
    const containerRef = useRef(null);
    const [rocketStyle, setRocketStyle] = useState({ transform: 'translate(20px, 180px) rotate(-45deg)', opacity: 0 });
    const [particles, setParticles] = useState([]);

    // Path points for the graph line
    const pathPoints = useMemo(() => {
        let points = "0,200";
        if (status === 'running' || status === 'crashed') {
            const endMultiplier = status === 'crashed' ? crashPoint : multiplier;
            for (let i = 1; i <= endMultiplier; i += 0.1) {
                const x = 10 + Math.log2(i) * 50;
                const y = 200 - Math.pow(i, 1.2) * 2;
                if (x > 400 || y < 0) break; // stay within bounds
                points += ` ${x},${y}`;
            }
        }
        return points;
    }, [status, multiplier, crashPoint]);
    
    // Animate the rocket along the path
    useEffect(() => {
        if (status === 'running') {
             // Show the rocket
            setParticles([]);
            const x = 10 + Math.log2(multiplier) * 50;
            const y = 200 - Math.pow(multiplier, 1.2) * 2;
            
            // Calculate angle for rocket rotation
            const prevMultiplier = Math.max(1, multiplier - 0.05);
            const prevX = 10 + Math.log2(prevMultiplier) * 50;
            const prevY = 200 - Math.pow(prevMultiplier, 1.2) * 2;
            const angle = Math.atan2(y - prevY, x - prevX) * (180 / Math.PI);

            setRocketStyle({
                transform: `translate(${x}px, ${y}px) rotate(${angle}deg)`,
                opacity: 1,
                transition: 'transform 0.1s linear'
            });
        } else if (status === 'crashed') {
            // Create explosion particles at the last rocket position
            const newParticles = Array.from({ length: 30 }).map(() => ({
                left: rocketStyle.transform.match(/translate\(([^,]+)px/)[1],
                top: rocketStyle.transform.match(/,\s*([^,]+)px/)[1],
                transform: `translate(${(Math.random() - 0.5) * 200}px, ${(Math.random() - 0.5) * 200}px) scale(0)`,
                backgroundColor: ['#ffc107', '#e74c3c', '#ffffff'][Math.floor(Math.random() * 3)],
            }));
            setParticles(newParticles);
             // Hide the rocket
            setRocketStyle(prev => ({ ...prev, opacity: 0, transition: 'opacity 0.1s' }));
        } else if (status === 'waiting') {
            // Reset rocket position
            setParticles([]);
            setRocketStyle({ transform: 'translate(20px, 180px) rotate(-45deg)', opacity: 0, transition: 'opacity 0.5s' });
        }

    }, [multiplier, status]);

    const multiplierColor = status === 'crashed' ? '#e74c3c' : '#2ecc71';

    return (
        <div className="crash-chart-container" ref={containerRef}>
            {/* Countdown Overlay */}
            {status === 'waiting' && (
                 <div className="countdown-overlay">
                    <div className="countdown-text">Starting in...</div>
                    <div className="countdown-timer">
                        <div className="countdown-bar"></div>
                    </div>
                </div>
            )}
            
            {/* Multiplier Text */}
             <div className="multiplier-overlay" style={{ color: multiplierColor }}>
                {status === 'crashed' && 'Crashed @ '}
                {parseFloat(status === 'crashed' ? crashPoint : multiplier).toFixed(2)}x
            </div>
            
            {/* SVG Graph */}
            <svg width="100%" height="220" viewBox="0 0 400 220" preserveAspectRatio="none">
                 <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#2ecc71" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#f1c40f" stopOpacity="1" />
                    </linearGradient>
                </defs>
                <polyline
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pathPoints}
                />
            </svg>

            {/* Rocket Icon */}
            <div className="rocket-container" style={rocketStyle}>
                 <FaRocket />
            </div>

            {/* Explosion Particles */}
            {particles.map((p, i) => (
                <div key={i} className="particle" style={p} />
            ))}
        </div>
    );
};

// --- Main Game Component ---
const CrashGame = () => {
    const [gameState, setGameState] = useState({
        status: 'loading',
        multiplier: 1.00,
        crashPoint: null,
        history: [],
    });
    const [betAmount, setBetAmount] = useState('10');
    const [isBetPlaced, setIsBetPlaced] = useState(false);
    const [isCashedOut, setIsCashedOut] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [lastPayout, setLastPayout] = useState(null);

    const gameStateRef = useRef(gameState);
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const state = await getCrashGameState();
                setGameState(state);

                if (state.status === 'waiting' && gameStateRef.current.status !== 'waiting') {
                    setIsBetPlaced(false);
                    setIsCashedOut(false);
                    setError('');
                    setLastPayout(null);
                }
            } catch (err) {
                console.error("Error fetching game state:", err);
                setError('Connection error. Please refresh.');
            }
        }, 300); // Polling faster for smoother animation sync

        return () => clearInterval(interval);
    }, []);

    const handlePlaceBet = async () => {
        setIsLoading(true);
        setError('');
        try {
            await placeCrashBet(parseFloat(betAmount));
            setIsBetPlaced(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to place bet.');
        }
        setIsLoading(false);
    };

    const handleCashOut = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await cashOutCrashBet();
            setIsCashedOut(true);
            setLastPayout({ amount: result.payout, multiplier: result.cashOutMultiplier });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to cash out.');
        }
        setIsLoading(false);
    };

    const renderButton = () => {
        if (gameState.status === 'waiting') {
            if (isBetPlaced) {
                return <button disabled className="crash-btn placed">Bet Placed</button>;
            }
            return <button onClick={handlePlaceBet} disabled={isLoading} className="crash-btn place-bet">Place Bet</button>;
        }
        if (gameState.status === 'running') {
            if (isBetPlaced && !isCashedOut) {
                return <button onClick={handleCashOut} disabled={isLoading} className="crash-btn cashout">Cash Out @ {gameState.multiplier}x</button>;
            }
            if(isCashedOut) {
                 return <button disabled className="crash-btn cashed-out">Cashed Out!</button>;
            }
        }
        return <button disabled className="crash-btn">Waiting for next round...</button>;
    }
    
    return (
        <div className="crash-game-container">
            <div className="history-bar">
                {gameState.history && gameState.history.map((h, i) => (
                    <span key={i} className={`history-item ${h < 2 ? 'red' : 'green'}`}>
                        {parseFloat(h).toFixed(2)}x
                    </span>
                ))}
            </div>

            <CrashAnimation gameState={gameState} />
            
            {lastPayout && (
                <div className="payout-message">
                    You won {parseFloat(lastPayout.amount).toFixed(4)} ARIX @ {parseFloat(lastPayout.multiplier).toFixed(2)}x!
                </div>
            )}
            {error && <div className="crash-error-message">{error}</div>}

            <div className="controls-container">
                 <div className="bet-input-wrapper">
                    <span>Bet Amount</span>
                    <input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        placeholder="10"
                        className="bet-input"
                        disabled={isBetPlaced || gameState.status !== 'waiting'}
                    />
                    <span>ARIX</span>
                 </div>
                 {renderButton()}
            </div>
        </div>
    );
};

export default CrashGame;

