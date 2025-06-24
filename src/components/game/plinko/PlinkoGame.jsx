import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTonWallet } from '@tonconnect/ui-react';
// These would be your actual imports
// import { playPlinko } from '../../../services/api';
// import { PLINKO_MULTIPLIERS } from '../../../utils/constants';
import { Spin, message } from 'antd';
import './PlinkoGame.css'; // Using the new, revised CSS file

// --- MOCK DATA FOR STANDALONE DEMO ---
// In a real scenario, you would import these from your utils/constants file.
const PLINKO_MULTIPLIERS = {
    8: { low: [5.6, 2.1, 1.2, 1, 0.5, 1, 1.2, 2.1, 5.6], medium: [8, 3, 1.5, 0.4, 0.2, 0.4, 1.5, 3, 8], high: [12, 5, 2, 0.3, 0.1, 0.3, 2, 5, 12] },
    10: { low: [8, 3, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 3, 8], medium: [12, 4, 2, 1.5, 0.4, 0.2, 0.4, 1.5, 2, 4, 12], high: [25, 10, 3, 1, 0.3, 0.1, 0.3, 1, 3, 10, 25] },
    12: { low: [10, 4, 2, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 2, 4, 10], medium: [15, 6, 3, 1.5, 0.5, 0.3, 0.2, 0.3, 0.5, 1.5, 3, 6, 15], high: [50, 15, 5, 2, 0.4, 0.2, 0.1, 0.2, 0.4, 2, 5, 15, 50] },
    14: { low: [12, 5, 3, 1.5, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.5, 3, 5, 12], medium: [20, 8, 4, 2, 1, 0.5, 0.3, 0.2, 0.3, 0.5, 1, 2, 4, 8, 20], high: [150, 30, 10, 4, 1, 0.3, 0.1, 0.0, 0.1, 0.3, 1, 4, 10, 30, 150] },
    16: { low: [16, 9, 2, 1.5, 1.2, 1.1, 1, 0.5, 0.2, 0.5, 1, 1.1, 1.2, 1.5, 2, 9, 16], medium: [35, 15, 8, 4, 2, 1, 0.5, 0.3, 0.2, 0.3, 0.5, 1, 2, 4, 8, 15, 35], high: [1000, 130, 26, 9, 4, 2, 0.3, 0.2, 0.1, 0.2, 0.3, 2, 4, 9, 26, 130, 1000] }
};
// Mock API call
const playPlinko = async (params) => {
    console.log("Playing with params:", params);
    const multipliers = PLINKO_MULTIPLIERS[params.rows][params.risk];
    const bucketIndex = Math.floor(Math.random() * multipliers.length);
    const multiplier = multipliers[bucketIndex];
    return new Promise(resolve => setTimeout(() => resolve({
        data: {
            user: { balance: (Math.random() * 1000).toFixed(2) },
            bucketIndex,
            multiplier
        }
    }), 500));
};
// --- END MOCK DATA ---

// Using the Matter.js script loaded in index.html, if available
const Matter = window.Matter;

const PlinkoGame = ({ user, setUser, loadingUser }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const renderRef = useRef(null);
    const sceneContainerRef = useRef(null);

    const [betAmount, setBetAmount] = useState('10');
    const [risk, setRisk] = useState('medium');
    const [rows, setRows] = useState(12);
    const [isLoading, setIsLoading] = useState(false);
    const [floatingTexts, setFloatingTexts] = useState([]);
    const [currentMultipliers, setCurrentMultipliers] = useState([]);
    
    // Mock wallet for demo purposes
    const wallet = { account: { address: 'mock-wallet-address' } };

    const getBucketColor = useCallback((multiplier) => {
        if (multiplier < 1) return 'var(--plinko-red)';
        if (multiplier < 2) return 'var(--plinko-orange)';
        if (multiplier < 5) return 'var(--plinko-yellow)';
        if (multiplier < 20) return 'var(--plinko-green)';
        return 'var(--plinko-purple)';
    }, []);

    // Effect to update the visible multiplier bar when settings change
    useEffect(() => {
        setCurrentMultipliers(PLINKO_MULTIPLIERS[rows]?.[risk] || []);
    }, [rows, risk]);

    const setupScene = useCallback(() => {
        if (!Matter || !canvasRef.current || !sceneContainerRef.current) return;

        const container = sceneContainerRef.current;
        const width = container.clientWidth;
        // Adjust height to leave space for multiplier bar at the bottom
        const height = container.clientHeight - 60; 

        if (width === 0 || height <= 0) return;

        if (renderRef.current) {
            Matter.Render.stop(renderRef.current);
            if (renderRef.current.runner) Matter.Runner.stop(renderRef.current.runner);
            Matter.World.clear(engineRef.current.world);
            Matter.Engine.clear(engineRef.current);
            if(renderRef.current.canvas) renderRef.current.canvas.remove();
        }

        const engine = Matter.Engine.create({ gravity: { y: 1.2 } });
        const render = Matter.Render.create({
            element: container,
            engine: engine,
            canvas: canvasRef.current,
            options: { width, height, wireframes: false, background: 'transparent' }
        });
        const runner = Matter.Runner.create();
        
        engineRef.current = engine;
        renderRef.current = render;
        render.runner = runner;

        Matter.Render.run(render);
        Matter.Runner.run(runner, engine);

        const world = engine.world;
        const pegRadius = width / (rows * 5);
        const spacingX = width / (rows);
        const spacingY = (height * 0.8) / (rows + 1);

        // Create Pegs
        for (let row = 0; row < rows; row++) {
            const numPegs = row + 2;
            const y = spacingY * (row + 1.5);
            for (let i = 0; i < numPegs; i++) {
                const x = (width - (numPegs - 1) * spacingX) / 2 + i * spacingX;
                Matter.World.add(world, Matter.Bodies.circle(x, y, pegRadius, {
                    isStatic: true,
                    restitution: 0.6,
                    friction: 0.1,
                    render: { fillStyle: 'rgba(255, 255, 255, 0.4)', shadowBlur: 10, shadowColor: 'white' },
                    label: 'peg'
                }));
            }
        }
        
        // Create invisible buckets for physics collision, colors are handled by the UI bar
        const multipliers = PLINKO_MULTIPLIERS[rows]?.[risk] || [];
        const bucketWidth = width / (multipliers.length);
        const bucketHeight = 8;
        const bucketY = height - (bucketHeight);

        for (let i = 0; i < multipliers.length; i++) {
            const x = (bucketWidth / 2) + i * bucketWidth;
            const bucket = Matter.Bodies.rectangle(x, bucketY, bucketWidth, bucketHeight * 2, {
                isStatic: true,
                render: { visible: false }, // These are for physics only
                label: `bucket-${i}`
            });
            Matter.World.add(world, bucket);
        }
        
        // Add separators between buckets
        const separatorHeight = bucketHeight * 5;
        const separatorY = height - separatorHeight / 2;
        for (let i = 0; i <= multipliers.length; i++) {
            const x = i * bucketWidth;
            const separator = Matter.Bodies.rectangle(x, separatorY, 4, separatorHeight, {
                isStatic: true,
                render: { fillStyle: '#3a3f6b' }
            });
            Matter.World.add(world, separator);
        }

        const wallOptions = { isStatic: true, render: { visible: false } };
        Matter.World.add(world, [
            Matter.Bodies.rectangle(width / 2, height + 50, width, 100, wallOptions),
            Matter.Bodies.rectangle(-50, height / 2, 100, height, wallOptions),
            Matter.Bodies.rectangle(width + 50, height / 2, 100, height, wallOptions)
        ]);

    }, [rows, risk]);
    
    useEffect(() => {
        const handleResize = () => setupScene();
        setTimeout(setupScene, 100);
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            if (renderRef.current) {
                Matter.Render.stop(renderRef.current);
                if (renderRef.current.runner) Matter.Runner.stop(renderRef.current.runner);
            }
        };
    }, [setupScene]);
    
    const handlePlay = async () => {
        if (isLoading || !wallet?.account?.address) {
            message.error("Please connect your wallet to play.", 2);
            return;
        }
        setIsLoading(true);

        try {
            const { data: result } = await playPlinko({
                userWalletAddress: wallet.account.address,
                betAmount, risk, rows
            });
            
            // In a real app, setUser would be passed down as a prop
            if(setUser) setUser(result.user);

            const container = sceneContainerRef.current;
            const width = container.clientWidth;
            const ballRadius = Math.max(5, width / (rows * 6));
            const startX = width / 2 + (Math.random() - 0.5) * (width * 0.1);

            const ball = Matter.Bodies.circle(startX, ballRadius, ballRadius, {
                restitution: 0.8,
                friction: 0.05,
                render: {
                    fillStyle: '#fde047',
                    shadowColor: '#fde047',
                    shadowBlur: 20,
                    shadowOffsetX: 0,
                    shadowOffsetY: 0,
                },
                label: `ball-${Date.now()}`
            });

            const multipliers = PLINKO_MULTIPLIERS[rows][risk];
            const bucketWidth = width / multipliers.length;
            const targetX = (bucketWidth / 2) + result.bucketIndex * bucketWidth;
            
            const velocityX = ((targetX - startX) / (rows * 11)) * (risk === 'high' ? 1.05 : 1);
            Matter.Body.setVelocity(ball, { x: velocityX, y: 0 });

            Matter.World.add(engineRef.current.world, ball);

            setTimeout(() => {
                 const newText = {
                    id: Date.now(),
                    text: `${result.multiplier}x`,
                    x: targetX,
                    y: container.clientHeight - 80,
                    color: getBucketColor(result.multiplier)
                };
                setFloatingTexts(prev => [...prev.slice(-5), newText]);
            }, 2000); // Delay popup to match ball landing time

            setTimeout(() => {
                setIsLoading(false);
                if (ball && engineRef.current?.world) {
                   Matter.World.remove(engineRef.current.world, ball);
                }
            }, 5000); // Increased cleanup time

        } catch (error) {
            message.error(error.response?.data?.message || "An error occurred.", 2);
            setIsLoading(false);
        }
    };
    
    return (
        <div className="plinko-galaxy-container">
            <div className="plinko-header">
                <span className="balance-display">
                    {loadingUser ? <Spin size="small" /> : `${parseFloat(user?.balance || 77754).toFixed(2)} ARIX`}
                </span>
            </div>
            
            <div ref={sceneContainerRef} className="plinko-game-area">
                <div className="plinko-canvas-container">
                    <canvas ref={canvasRef} />
                </div>
                {floatingTexts.map(ft => (
                    <div 
                        key={ft.id} 
                        className="multiplier-popup" 
                        style={{ 
                            left: `${ft.x}px`, 
                            top: `${ft.y}px`,
                            color: ft.color,
                        }}
                    >
                        {ft.text}
                    </div>
                ))}
                <div className="multiplier-bar">
                    {currentMultipliers.map((m, index) => (
                        <div key={index} className="multiplier-item" style={{ backgroundColor: getBucketColor(m)}}>
                            {m}x
                        </div>
                    ))}
                </div>
            </div>

            <div className="plinko-controls-panel">
                 <div className="control-row">
                    <label>Risk Level</label>
                    <div className="segmented-control">
                        {['low', 'medium', 'high'].map(r => (
                            <button key={r} className={risk === r ? 'active' : ''} onClick={() => !isLoading && setRisk(r)}>{r}</button>
                        ))}
                    </div>
                </div>
                 <div className="control-row">
                    <label>Rows</label>
                    <div className="segmented-control rows">
                        {[8, 10, 12, 14, 16].map(r => (
                            <button key={r} className={rows === r ? 'active' : ''} onClick={() => !isLoading && setRows(r)}>{r}</button>
                        ))}
                    </div>
                </div>
                <div className="control-row">
                    <label>Bet Amount</label>
                    <div className="bet-control">
                        <button onClick={() => setBetAmount(val => String(Math.max(1, parseFloat(val)/2)))} disabled={isLoading}>/2</button>
                        <input className="bet-input" type="number" value={betAmount} onChange={(e) => !isLoading && setBetAmount(e.target.value)} />
                        <button onClick={() => setBetAmount(val => String(parseFloat(val)*2))} disabled={isLoading}>x2</button>
                    </div>
                </div>
                <button className="play-button" onClick={handlePlay} disabled={isLoading || loadingUser}>
                    {isLoading ? <Spin /> : 'Play'}
                </button>
            </div>
        </div>
    );
};

export default PlinkoGame;
