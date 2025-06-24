// AR_FRONTEND/src/components/game/plinko/PlinkoGame.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTonWallet } from '@tonconnect/ui-react';
import { playPlinko } from '../../../services/api';
import { PLINKO_MULTIPLIERS } from '../../../utils/constants';
import { Spin, Button, message } from 'antd';
import './PlinkoGame.css';

// Using the Matter.js script loaded in index.html
const Matter = window.Matter;

const PlinkoGame = ({ user, setUser, loadingUser }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const renderRef = useRef(null);

    const [betAmount, setBetAmount] = useState('10');
    const [risk, setRisk] = useState('medium');
    const [rows, setRows] = useState(12);
    const [isLoading, setIsLoading] = useState(false);
    const [floatingTexts, setFloatingTexts] = useState([]);
    
    const wallet = useTonWallet();

    const getBucketColor = useCallback((multiplier) => {
        if (multiplier < 1) return '#F44336'; // Red
        if (multiplier < 3) return '#FFC107'; // Orange/Gold
        if (multiplier < 10) return '#4CAF50'; // Green
        if (multiplier < 100) return '#6366f1'; // Blue
        return '#a855f7'; // Purple
    }, []);

    const setupScene = useCallback(() => {
        // --- CRASH FIX ---
        // Ensure the canvas and its parent are actually rendered before we try to use them.
        if (!canvasRef.current || !canvasRef.current.parentElement) {
            return;
        }

        const parent = canvasRef.current.parentElement;
        const width = parent.offsetWidth;
        const height = parent.offsetHeight;
        
        // If width or height are 0, it means the element is not visible yet.
        if (width === 0 || height === 0) return;

        const engine = Matter.Engine.create({ gravity: { y: 1.2 } });
        const render = Matter.Render.create({
            element: parent, engine, canvas: canvasRef.current,
            options: { width, height, wireframes: false, background: 'transparent' }
        });
        const runner = Matter.Runner.create();
        
        engineRef.current = engine;
        renderRef.current = render;

        Matter.Render.run(render);
        Matter.Runner.run(runner, engine);

        const world = engine.world;
        const pegRadius = width / (rows * 5);
        const spacingX = width / (rows + 1);
        const spacingY = (height * 0.8) / (rows + 2);

        for (let row = 0; row < rows; row++) {
            const numPegs = row + 1;
            const y = spacingY * (row + 1.5);
            for (let col = 0; col < numPegs; col++) {
                const x = (width - (numPegs - 1) * spacingX) / 2 + col * spacingX;
                const peg = Matter.Bodies.circle(x, y, pegRadius, {
                    isStatic: true, restitution: 0.6, friction: 0.1, render: { fillStyle: '#A3AECF' }
                });
                Matter.World.add(world, peg);
            }
        }

        const multipliers = PLINKO_MULTIPLIERS[rows]?.[risk] || [];
        const bucketWidth = width / multipliers.length;
        const bucketHeight = 10;
        const bucketY = height - bucketHeight / 2 - 10;

        for (let i = 0; i < multipliers.length; i++) {
            const x = (bucketWidth / 2) + i * bucketWidth;
            const bucketColor = getBucketColor(multipliers[i]);
            const bucket = Matter.Bodies.rectangle(x, bucketY + 5, bucketWidth, bucketHeight, {
                isStatic: true,
                render: { fillStyle: bucketColor, opacity: 0.5 },
                label: `bucket-${i}`
            });
            const separatorY = bucketY - bucketHeight;
            const separator = Matter.Bodies.rectangle(x - bucketWidth/2, separatorY, 2, bucketHeight * 3, {
                isStatic: true, render: { fillStyle: '#2D3142' }
            });
            Matter.World.add(world, [bucket, separator]);
        }
        Matter.World.add(world, Matter.Bodies.rectangle(width - bucketWidth/2, bucketY - bucketHeight, 2, bucketHeight * 3, { isStatic: true, render: { fillStyle: '#2D3142' } }));

        const wallOptions = { isStatic: true, render: { visible: false } };
        Matter.World.add(world, [
            Matter.Bodies.rectangle(width / 2, height, width, 50, wallOptions),
            Matter.Bodies.rectangle(0, height / 2, 10, height, wallOptions),
            Matter.Bodies.rectangle(width, height / 2, 10, height, wallOptions)
        ]);

    }, [rows, risk, getBucketColor]);
    
    const cleanupScene = useCallback(() => {
        if (renderRef.current) {
            Matter.Render.stop(renderRef.current);
            // Don't remove the canvas, just clear it
            if (renderRef.current.canvas) {
                 const context = renderRef.current.canvas.getContext('2d');
                 context.clearRect(0, 0, renderRef.current.canvas.width, renderRef.current.canvas.height);
            }
        }
        if (engineRef.current) Matter.Engine.clear(engineRef.current);
    }, []);

    useEffect(() => {
        // Run setup on initial mount and when settings change
        setupScene();
        // Add a resize listener to redraw the scene if window size changes
        window.addEventListener('resize', setupScene);
        return () => {
            window.removeEventListener('resize', setupScene);
            cleanupScene();
        };
    }, [setupScene]);
    
    const handlePlay = async () => {
        if (isLoading || !wallet?.account?.address) {
            message.error("Please connect your wallet to play.");
            return;
        }
        setIsLoading(true);

        try {
            const { data: result } = await playPlinko({
                userWalletAddress: wallet.account.address,
                betAmount, risk, rows
            });

            // --- STATE FIX ---
            // Use setUser from props to update the global user state
            setUser(result.user);

            const parent = canvasRef.current.parentElement;
            const width = parent.offsetWidth;

            const ballRadius = width / (rows * 5);
            const startX = width / 2 + (Math.random() - 0.5) * 10;
            const ball = Matter.Bodies.circle(startX, ballRadius, ballRadius, {
                restitution: 0.8, friction: 0.05,
                render: { fillStyle: '#FFC107' }
            });

            const multipliers = PLINKO_MULTIPLIERS[rows][risk];
            const bucketWidth = width / multipliers.length;
            const targetX = (bucketWidth / 2) + result.bucketIndex * bucketWidth;
            const velocityX = ((targetX - startX) / (rows * 12)) * (risk === 'high' ? 1.2 : 1.0);
            Matter.Body.setVelocity(ball, { x: velocityX, y: 0 });

            Matter.World.add(engineRef.current.world, ball);

            setTimeout(() => {
                setFloatingTexts(texts => [...texts.slice(-5), { id: Date.now(), text: `${result.multiplier}x`, x: targetX, color: getBucketColor(result.multiplier) }]);
                setIsLoading(false);
                if (ball && engineRef.current?.world) {
                   Matter.World.remove(engineRef.current.world, ball);
                }
            }, 3500);

        } catch (error) {
            message.error(error.response?.data?.message || "An error occurred.");
            setIsLoading(false);
        }
    };
    
    const handleBetChange = (amount) => {
        setBetAmount(prev => {
            const current = parseFloat(prev) || 0;
            const newAmount = Math.max(0, current + amount);
            return newAmount.toString();
        });
    };

    return (
        <div className="plinko-game-page">
            <header className="plinko-header">
                <div className="plinko-balance">
                    {loadingUser ? <Spin size="small" /> : `${parseFloat(user?.balance || 0).toFixed(2)} ARIX`}
                </div>
            </header>
            
            <main className="plinko-game-container">
                <div className="plinko-canvas-container">
                    <canvas ref={canvasRef} />
                    {floatingTexts.map(ft => (
                        <div key={ft.id} className="multiplier-popup" style={{ left: `${ft.x}px`, color: ft.color, position: 'absolute', top: '50%' }}>
                            {ft.text}
                        </div>
                    ))}
                </div>
            </main>

            <footer className="plinko-controls-panel">
                <div className="control-group">
                    <div className="control-label">Risk</div>
                    <div className="segmented-control">
                        {['low', 'medium', 'high'].map(r => (
                            <button key={r} className={`segmented-button ${risk === r ? 'active' : ''}`} onClick={() => !isLoading && setRisk(r)} disabled={isLoading}>{r}</button>
                        ))}
                    </div>
                </div>
                 <div className="control-group">
                    <div className="control-label">Rows</div>
                    <div className="segmented-control">
                        {[8, 10, 12, 14, 16].map(r => (
                            <button key={r} className={`segmented-button ${rows === r ? 'active' : ''}`} onClick={() => !isLoading && setRows(r)} disabled={isLoading}>{r}</button>
                        ))}
                    </div>
                </div>
                <div className="control-group">
                    <div className="control-label">Bet Amount</div>
                    <div className="bet-amount-control">
                        <button className="bet-adjust-button minus" onClick={() => !isLoading && handleBetChange(-10)} disabled={isLoading}>-</button>
                        <input className="bet-amount-input" type="number" value={betAmount} onChange={(e) => !isLoading && setBetAmount(e.target.value)} disabled={isLoading} />
                        <button className="bet-adjust-button" onClick={() => !isLoading && handleBetChange(10)} disabled={isLoading}>+</button>
                    </div>
                </div>
                <Button className="play-button" onClick={handlePlay} disabled={isLoading || loadingUser} loading={isLoading}>
                    Play
                </Button>
            </footer>
        </div>
    );
};

export default PlinkoGame;
