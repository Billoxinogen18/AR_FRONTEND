// AR_FRONTEND/src/components/game/plinko/PlinkoGame.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { playPlinko } from '../../../services/gameService';
import { PLINKO_MULTIPLIERS } from '../../../utils/constants';
import './PlinkoGame.css';

const Matter = window.Matter;

const PlinkoGame = ({ user, onGameEnd }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const runnerRef = useRef(null);
    const renderRef = useRef(null);

    const [betAmount, setBetAmount] = useState('10');
    const [risk, setRisk] = useState('medium');
    const [rows, setRows] = useState(12);
    const [isLoading, setIsLoading] = useState(false);
    const [gameResult, setGameResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    const getBucketColor = useCallback((multiplier) => {
        if (multiplier < 1) return '#ef4444'; // Red for losses
        if (multiplier < 3) return '#34d399'; // Green
        if (multiplier < 10) return '#6366f1'; // Blue/Indigo
        return '#a855f7'; // Purple for highest
    }, []);

    const setupScene = useCallback(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const parent = canvas.parentElement;
        const width = parent.offsetWidth;
        const height = parent.offsetHeight;

        engineRef.current = Matter.Engine.create({ gravity: { y: 1.2 } });
        renderRef.current = Matter.Render.create({
            element: parent,
            engine: engineRef.current,
            canvas: canvas,
            options: { width, height, wireframes: false, background: 'transparent' }
        });
        runnerRef.current = Matter.Runner.create();

        Matter.Render.run(renderRef.current);
        Matter.Runner.run(runnerRef.current, engineRef.current);

        const world = engineRef.current.world;
        const pegRadius = width / (rows * 4);
        const spacingX = width / (rows + 1);
        const spacingY = (height * 0.7) / (rows + 1);

        for (let row = 0; row < rows; row++) {
            const numPegs = row + 1;
            const y = spacingY * (row + 1.5);
            for (let col = 0; col < numPegs; col++) {
                const x = (width - (numPegs - 1) * spacingX) / 2 + col * spacingX;
                const peg = Matter.Bodies.circle(x, y, pegRadius, {
                    isStatic: true, restitution: 0.6, friction: 0.1, render: { fillStyle: '#a0a8c2' }
                });
                Matter.World.add(world, peg);
            }
        }

        const multipliers = PLINKO_MULTIPLIERS[rows]?.[risk] || [];
        const bucketWidth = width / (rows + 1);
        const bucketHeight = 10;
        const bucketY = height - bucketHeight / 2 - 20;

        for (let i = 0; i < multipliers.length; i++) {
            const x = (bucketWidth / 2) + i * bucketWidth;
            const bucket = Matter.Bodies.rectangle(x, bucketY, bucketWidth * 0.95, bucketHeight, {
                isStatic: true, render: { fillStyle: getBucketColor(multipliers[i]) }, label: `bucket-${i}`
            });
            const separatorY = bucketY - bucketHeight * 2;
            const separator = Matter.Bodies.rectangle(x - bucketWidth/2, separatorY, 4, bucketHeight * 4, {
                isStatic: true, render: { fillStyle: '#4b5563' }
            });
            Matter.World.add(world, [bucket, separator]);
        }
        Matter.World.add(world, Matter.Bodies.rectangle(width - bucketWidth/2, bucketY - bucketHeight * 2, 4, bucketHeight * 4, {
            isStatic: true, render: { fillStyle: '#4b5563' }
        }));

        const wallOptions = { isStatic: true, render: { visible: false } };
        Matter.World.add(world, [
            Matter.Bodies.rectangle(width / 2, height, width, 50, wallOptions),
            Matter.Bodies.rectangle(0, height / 2, 10, height, wallOptions),
            Matter.Bodies.rectangle(width, height / 2, 10, height, wallOptions)
        ]);
    }, [rows, risk, getBucketColor]);

    const cleanupScene = () => {
        if (renderRef.current) {
            Matter.Render.stop(renderRef.current);
            if (renderRef.current.canvas) {
                renderRef.current.canvas.remove();
            }
            renderRef.current.textures = {};
        }
        if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
        if (engineRef.current) Matter.Engine.clear(engineRef.current);
    };

    useEffect(() => {
        cleanupScene();
        setupScene();
        return cleanupScene;
    }, [setupScene]);

    const handlePlay = async () => {
        if (isLoading || !user?.wallet_address) {
            setErrorMessage("Please connect your wallet to play.");
            return;
        }
        setIsLoading(true);
        setGameResult(null);
        setErrorMessage('');

        try {
            const result = await playPlinko(user.wallet_address, betAmount, risk, rows);
            const { payout, path, bucketIndex, user: updatedUser } = result;

            onGameEnd(updatedUser); // Update user balance in parent immediately

            const ballRadius = canvasRef.current.offsetWidth / (rows * 4);
            const startX = canvasRef.current.offsetWidth / 2 + (Math.random() - 0.5) * 5;
            const ball = Matter.Bodies.circle(startX, ballRadius, ballRadius, {
                restitution: 0.8, friction: 0.05, render: { fillStyle: '#f59e0b' }
            });

            const bucketWidth = canvasRef.current.offsetWidth / (rows + 1);
            const targetX = (bucketWidth / 2) + bucketIndex * bucketWidth;
            const velocityX = ((targetX - startX) / (rows * 12)) * (risk === 'high' ? 1.2 : 1);
            Matter.Body.setVelocity(ball, { x: velocityX, y: 0 });

            Matter.World.add(engineRef.current.world, ball);

            setTimeout(() => {
                setGameResult({ payout: parseFloat(payout) });
                setIsLoading(false);
                if (ball && engineRef.current) {
                    Matter.World.remove(engineRef.current.world, ball);
                }
            }, 4000);
        } catch (error) {
            const message = error.message || 'Could not play game. Please try again.';
            console.error("Plinko game failed:", message);
            setErrorMessage(message);
            setIsLoading(false);
        }
    };
    
    return (
        <div className="plinko-game-container">
            <div className="plinko-canvas-container">
                <canvas ref={canvasRef} className="plinko-canvas"></canvas>
                 {gameResult && (
                    <div key={Date.now()} className="plinko-result-popup">
                        {gameResult.payout > 0 ? `+${gameResult.payout.toFixed(2)}` : 'Better luck!'}
                    </div>
                )}
            </div>

            <div className="plinko-controls">
                <div className="plinko-control-row">
                    <label>Bet Amount (ARIX)</label>
                    <input
                        type="number"
                        className="plinko-bet-input"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        placeholder="0.00"
                        disabled={isLoading}
                    />
                </div>

                <div className="plinko-control-row">
                    <label>Risk</label>
                    <div className="plinko-toggle-group">
                        {['low', 'medium', 'high'].map(r => (
                            <button key={r} className={`plinko-toggle-button ${risk === r ? 'active' : ''}`} onClick={() => !isLoading && setRisk(r)} disabled={isLoading}>
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="plinko-control-row">
                    <label>Rows</label>
                    <div className="plinko-toggle-group">
                        {[8, 10, 12, 14, 16].map(r => (
                            <button key={r} className={`plinko-toggle-button ${rows === r ? 'active' : ''}`} onClick={() => !isLoading && setRows(r)} disabled={isLoading}>
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="plinko-error-message">{errorMessage}</div>

                <button className="play-plinko-button" onClick={handlePlay} disabled={isLoading}>
                    {isLoading ? 'Dropping...' : 'Play'}
                </button>
            </div>
        </div>
    );
};

export default PlinkoGame;

