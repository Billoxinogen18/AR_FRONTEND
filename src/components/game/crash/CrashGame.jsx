import React, { useState, useEffect, useRef, useMemo } from 'react';
import { placeCrashBet, cashOutCrashBet } from '../../../services/gameService';
import { useTonAddress } from '@tonconnect/ui-react';
import { FaRocket } from 'react-icons/fa';
import './CrashGame.css';

const CrashAnimation = ({ gameState }) => {
    const { phase, multiplier, crashPoint } = gameState;
    const [rocketStyle, setRocketStyle] = useState({ transform: 'translate(20px, 180px) rotate(-45deg)', opacity: 0 });
    const [particles, setParticles] = useState([]);

    const pathPoints = useMemo(() => {
        let points = "0,200";
        if (phase === 'RUNNING' || phase === 'CRASHED') {
            const endMultiplier = phase === 'CRASHED' ? crashPoint : multiplier;
            for (let i = 1; i <= endMultiplier; i += 0.1) {
                const x = 10 + Math.log2(i) * 50;
                const y = 200 - Math.pow(i, 1.2) * 2;
                if (x > 400 || y < 0) break;
                points += ` ${x},${y}`;
            }
        }
        return points;
    }, [phase, multiplier, crashPoint]);
    
    useEffect(() => {
        if (phase === 'RUNNING') {
            setParticles([]);
            const x = 10 + Math.log2(multiplier) * 50;
            const y = 200 - Math.pow(multiplier, 1.2) * 2;
            
            const prevMultiplier = Math.max(1, multiplier - 0.05);
            const prevX = 10 + Math.log2(prevMultiplier) * 50;
            const prevY = 200 - Math.pow(prevMultiplier, 1.2) * 2;
            const angle = Math.atan2(y - prevY, x - prevX) * (180 / Math.PI);

            setRocketStyle({
                transform: `translate(${x}px, ${y}px) rotate(${angle}deg)`,
                opacity: 1,
                transition: 'transform 0.1s linear'
            });
        } else if (phase === 'CRASHED') {
            const newParticles = Array.from({ length: 30 }).map(() => ({
                left: rocketStyle.transform.match(/translate\(([^,]+)px/)[1],
                top: rocketStyle.transform.match(/,\s*([^,]+)px/)[1],
                transform: `translate(${(Math.random() - 0.5) * 200}px, ${(Math.random() - 0.5) * 200}px) scale(0)`,
                backgroundColor: ['#ffc107', '#e74c3c', '#ffffff'][Math.floor(Math.random() * 3)],
            }));
            setParticles(newParticles);
            setRocketStyle(prev => ({ ...prev, opacity: 0, transition: 'opacity 0.1s' }));
        } else if (phase === 'WAITING') {
            setParticles([]);
            setRocketStyle({ transform: 'translate(20px, 180px) rotate(-45deg)', opacity: 0, transition: 'opacity 0.5s' });
        }
    }, [multiplier, phase]);

    const multiplierColor = phase === 'CRASHED' ? '#e74c3c' : '#2ecc71';

    return (
        <div className="crash-chart-container">
            {phase === 'WAITING' && (
                 <div className="countdown-overlay">
                    <div className="countdown-text">Starting in...</div>
                    <div className="countdown-timer" style={{animationDuration: '8s'}}>
                        <div className="countdown-bar"></div>
                    </div>
                </div>
            )}
             <div className="multiplier-overlay" style={{ color: multiplierColor }}>
                {phase === 'CRASHED' && 'Crashed @ '}
                {parseFloat(phase === 'CRASHED' ? crashPoint : multiplier).toFixed(2)}x
            </div>
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
            <div className="rocket-container" style={rocketStyle}>
                 <FaRocket />
            </div>
            {particles.map((p, i) => (
                <div key={i} className="particle" style={p} />
            ))}
        </div>
    );
};

const CrashGame = () => {
    const [gameState, setGameState] = useState({
        phase: 'CONNECTING',
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
    
    const userWalletAddress = useTonAddress();
    const socketRef = useRef(null);

    useEffect(() => {
        // --- REVISION: CONSTRUCT WEBSOCKET URL DYNAMICALLY ---
        // This constructs the correct WebSocket URL (wss:// or ws://) from your VITE variable.
        // It replaces the old hardcoded 'smartterminalbackend.vercel.app' URL.
        const backendUrl = import.meta.env.VITE_BACKEND_API_URL;
        const backendHost = new URL(backendUrl).host;
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${backendHost}`;
        
        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onopen = () => console.log('[WebSocket] Connection established');
        socketRef.current.onclose = () => console.log('[WebSocket] Connection closed');
        socketRef.current.onerror = (err) => console.error('[WebSocket] Error:', err);

        socketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'game_update' || data.type === 'full_state') {
                setGameState(data.payload);
                if (data.payload.phase === 'WAITING') {
                    if (isBetPlaced || isCashedOut) {
                        setIsBetPlaced(false);
                        setIsCashedOut(false);
                        setLastPayout(null);
                        setError('');
                    }
                }
            }
        };

        return () => {
            if (socketRef.current) socketRef.current.close();
        };
    }, [isBetPlaced, isCashedOut]);

    const handlePlaceBet = async () => {
        setIsLoading(true);
        setError('');
        try {
            await placeCrashBet({
                userWalletAddress,
                betAmountArix: parseFloat(betAmount)
            });
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
            const result = await cashOutCrashBet({ userWalletAddress });
            setIsCashedOut(true);
            setLastPayout({ amount: result.payout, multiplier: result.cashOutMultiplier });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to cash out.');
        }
        setIsLoading(false);
    };

    const renderButton = () => {
        if (gameState.phase === 'WAITING') {
            if (isBetPlaced) {
                return <button disabled className="crash-btn placed">Bet Placed</button>;
            }
            return <button onClick={handlePlaceBet} disabled={isLoading || !userWalletAddress} className="crash-btn place-bet">Place Bet</button>;
        }
        if (gameState.phase === 'RUNNING') {
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
                    <span key={i} className={`history-item ${h.crash_multiplier < 2 ? 'red' : 'green'}`}>
                        {parseFloat(h.crash_multiplier).toFixed(2)}x
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
                        disabled={isBetPlaced || gameState.phase !== 'WAITING'}
                    />
                    <span>ARIX</span>
                 </div>
                 {renderButton()}
            </div>
        </div>
    );
};

export default CrashGame;