import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { FaPlane, FaUsers, FaHistory } from 'react-icons/fa';
import { Table, Tabs, Input, Button, Spin, Tag, Empty, Card, Grid, message, Switch } from 'antd';
import { getCrashHistoryForUser } from '../../../services/api';
import './CrashGame.css';

const { useBreakpoint } = Grid;

const ChartIcon = () => <FaPlane size={24} className="plane-icon" />;

// ====================================================================================
// REVISED CRASH ANIMATION COMPONENT
// ====================================================================================
const CrashAnimation = ({ gameState }) => {
    const { phase, multiplier, crashPoint } = gameState;
    const [planeStyle, setPlaneStyle] = useState({ bottom: '10%', left: '5%', opacity: 0 });
    const [isExploding, setIsExploding] = useState(false);
    
    // NEW: SVG path for a persistent, high-performance trail
    const [trailPath, setTrailPath] = useState('');
    const previousPositionRef = useRef(null); // Ref to store the last position for angle calculation
    const countdownRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const bar = countdownRef.current;
        if (phase === 'WAITING' && bar) {
            bar.classList.remove('animate');
            void bar.offsetWidth; 
            bar.classList.add('animate');
            setIsExploding(false);
            setTrailPath(''); // Clear the trail for the new round
            previousPositionRef.current = null;
        }

        if (phase === 'RUNNING' && containerRef.current) {
            setIsExploding(false);
            
            const containerWidth = containerRef.current.offsetWidth;
            const containerHeight = containerRef.current.offsetHeight;

            // Same smooth curve calculation
            const progress = Math.min(1, Math.log1p(multiplier - 1) / Math.log1p(19));
            const xPercent = 5 + progress * 85; 
            const yPercent = 10 + Math.pow(progress, 0.7) * 75;

            // Convert percentages to pixel values for accurate SVG path and angle calculation
            const currentX = (xPercent / 100) * containerWidth;
            const currentY = containerHeight - ((yPercent / 100) * containerHeight); // Y is from top for SVG

            // --- NEW: DYNAMIC PLANE ORIENTATION ---
            let rotation = 15; // Default rotation
            if (previousPositionRef.current) {
                const dx = currentX - previousPositionRef.current.x;
                const dy = currentY - previousPositionRef.current.y;
                // Calculate angle and convert from radians to degrees. Add 45deg to align the FontAwesome icon.
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                rotation = angle + 45;
            }
            previousPositionRef.current = { x: currentX, y: currentY };

            // --- NEW: PERSISTENT TRAIL LOGIC ---
            // The plane draws the trail from start to finish. It does not disappear.
            setTrailPath(prevPath => {
                if (prevPath === '') {
                    return `M ${currentX},${currentY}`; // Start the path
                }
                return `${prevPath} L ${currentX},${currentY}`; // Draw a line to the new point
            });

            const newStyle = {
                left: `${xPercent}%`,
                bottom: `${yPercent}%`,
                transform: `rotate(${rotation}deg) scale(1)`,
                opacity: 1,
                transition: 'all 0.1s linear',
            };
            setPlaneStyle(newStyle);

        } else if (phase === 'CRASHED') {
            setPlaneStyle(prev => ({ ...prev, opacity: 0, transition: 'opacity 0.1s ease-out' }));
            setIsExploding(true);
        } else {
            setIsExploding(false);
            setPlaneStyle({ bottom: '10%', left: '5%', opacity: 0, transform: `rotate(-45deg) scale(0.8)`, transition: 'opacity 0.5s ease-out' });
        }
    }, [phase, multiplier]);

    const finalMultiplier = (phase === 'CRASHED' && crashPoint) ? crashPoint : multiplier;
    const displayMultiplier = !isNaN(finalMultiplier) ? parseFloat(finalMultiplier).toFixed(2) : "1.00";
    const multiplierColor = phase === 'CRASHED' ? '#e74c3c' : (phase === 'RUNNING' ? '#2ecc71' : 'var(--app-primary-text-light)');

    return (
        <div className="crash-chart-container" ref={containerRef}>
            {phase === 'WAITING' && (
                <div className="countdown-overlay">
                    <div className="countdown-text">NEXT ROUND</div>
                    <div className="countdown-timer"><div ref={countdownRef} className="countdown-bar animate"></div></div>
                </div>
            )}
            <div className="multiplier-overlay" style={{ color: multiplierColor }}>
                {displayMultiplier}x
                {phase === 'CRASHED' && <span className="crashed-text">CRASHED!</span>}
            </div>

            {/* --- NEW: SVG Trail Rendering --- */}
            <svg className="trail-svg-container">
                <path d={trailPath} className="trail-path" />
            </svg>

            {!isExploding && <div className="rocket-container" style={planeStyle}><ChartIcon /></div>}

            {isExploding &&
                <div className="explosion-container" style={{ left: planeStyle.left, bottom: planeStyle.bottom }}>
                    <div className="shockwave" />
                    <div className="shockwave shockwave-delayed" />
                    <div className="explosion-flash" />
                    {Array.from({ length: 25 }).map((_, i) => <div key={`fire-${i}`} className="fire-particle" style={{ '--i': i, '--delay': `${Math.random() * 0.2}s` }} />)}
                    {Array.from({ length: 30 }).map((_, i) => <div key={`smoke-${i}`} className="smoke-particle" style={{ '--i': i, '--delay': `${0.1 + Math.random() * 0.3}s` }} />)}
                    {Array.from({ length: 20 }).map((_, i) => <div key={`debris-${i}`} className="debris-particle" style={{ '--i': i, '--delay': `${Math.random() * 0.2}s` }} />)}
                </div>
            }
        </div>
    );
};


const CurrentBetsList = ({ players, myWalletAddress }) => {
    if (!players || players.length === 0) return <Empty description="No players this round." image={Empty.PRESENTED_IMAGE_SIMPLE}/>;
    return(
        <div className="bets-list-container">
            {players.map(player => (
                <div key={player.user_wallet_address} className={`bet-row ${player.user_wallet_address === myWalletAddress ? 'my-bet-row' : ''}`}>
                    <span className="player-address">{player.user_wallet_address.slice(0, 4)}...{player.user_wallet_address.slice(-4)}</span>
                    <span className="bet-amount">{parseFloat(player.bet_amount_arix).toFixed(2)} ARIX</span>
                    {player.status === 'cashed_out'
                        ? <Tag color="green">@{parseFloat(player.cash_out_multiplier).toFixed(2)}x</Tag>
                        : <Tag color="blue">Playing</Tag>
                    }
                </div>
            ))}
        </div>
    );
};

const MyBetsHistory = ({ walletAddress }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const fetchHistory = useCallback(() => {
        if (!walletAddress) { setLoading(false); return; }
        setLoading(true);
        getCrashHistoryForUser(walletAddress)
            .then(res => setHistory(res.data || []))
            .catch(() => message.error("Could not load your bet history"))
            .finally(() => setLoading(false));
    }, [walletAddress]);
    useEffect(() => { fetchHistory() }, [fetchHistory]);
    const columns = [{ title: 'ID', dataIndex: 'game_id', align: 'center'}, { title: 'Bet', dataIndex: 'bet_amount_arix', render: val => parseFloat(val).toFixed(2) }, { title: 'Crashed At', dataIndex: 'crash_multiplier', render: val => `${parseFloat(val).toFixed(2)}x` }, { title: 'Outcome', render: (_, rec) => (rec.status === 'cashed_out' ? <Tag color="green">Won (+{(rec.payout_arix - rec.bet_amount_arix).toFixed(2)})</Tag> : <Tag color="red">Lost</Tag>) }, ];
    if (loading) return <div style={{textAlign: 'center', padding: '20px'}}><Spin /></div>;
    return <Table columns={columns} dataSource={history} pagination={{ pageSize: 5 }} size="small" rowKey="id" />
};

// ====================================================================================
// FINAL, REVISED CRASH GAME COMPONENT
// ====================================================================================
const CrashGame = () => {
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const userWalletAddress = useTonAddress();
    const [tonConnectUI] = useTonConnectUI();
    const socketRef = useRef(null);

    const [gameState, setGameState] = useState({ phase: 'CONNECTING', multiplier: 1.00, history: [], players: [] });
    const [placingBet, setPlacingBet] = useState(false);
    
    // --- NEW: Auto-betting state ---
    const [betAmount, setBetAmount] = useState("10"); // Unified bet amount for both tabs
    const [autoCashout, setAutoCashout] = useState("2.0");
    const [isAutoBetting, setIsAutoBetting] = useState(false);
    const [isAutoCashout, setIsAutoCashout] = useState(true);

    const myCurrentBet = useMemo(() => {
        if (!userWalletAddress || !gameState.players) return null;
        return gameState.players.find(p => p.user_wallet_address === userWalletAddress);
    }, [gameState.players, userWalletAddress]);
    
    const sendMessage = (type, payload) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type, payload }));
        }
    };
    
    const handlePlaceBet = useCallback(() => {
        if (!userWalletAddress) { tonConnectUI.openModal(); return; }
        setPlacingBet(true);
        sendMessage('PLACE_BET', { userWalletAddress, betAmountArix: parseFloat(betAmount) });
    }, [userWalletAddress, betAmount, tonConnectUI]);
    
    const handleCashOut = useCallback(() => sendMessage('CASH_OUT', { userWalletAddress }), [userWalletAddress]);
    
    useEffect(() => {
        const { VITE_BACKEND_API_URL } = import.meta.env;
        if (!VITE_BACKEND_API_URL) return;
        const host = new URL(VITE_BACKEND_API_URL).host;
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${host}`;

        let isMounted = true;
        const connect = () => {
            if (!isMounted || (socketRef.current && socketRef.current.readyState < 2)) return;
            socketRef.current = new WebSocket(wsUrl);
            socketRef.current.onopen = () => { if (isMounted) setGameState(prev => ({...prev, phase: 'WAITING'})); };
            socketRef.current.onclose = () => {
                if (isMounted) {
                    setGameState(prev => ({...prev, phase: 'CONNECTING'}));
                    setTimeout(connect, 3000);
                }
            };
            socketRef.current.onmessage = (event) => {
                if(!isMounted) return;
                try {
                    const { type, payload } = JSON.parse(event.data);
                    if (type === 'game_update' || type === 'full_state') {
                        setGameState(payload);
                        if (payload.phase === 'WAITING') setPlacingBet(false);
                    } else if (type === 'bet_success' && payload.userWalletAddress === userWalletAddress) {
                         message.success('Bet placed!'); setPlacingBet(false); 
                    } else if (type === 'bet_error' && payload.userWalletAddress === userWalletAddress) {
                         message.error(payload.message, 3); setPlacingBet(false); 
                    } else if (type === 'cashout_success' && payload.userWalletAddress === userWalletAddress) {
                         message.success(`Cashed out for ${payload.payoutArix.toFixed(2)} ARIX!`);
                    }
                } catch(e) { console.error("Error processing message:", e) }
            };
        }
        connect();
        return () => { isMounted = false; socketRef.current?.close(); };
    }, [userWalletAddress]);

    // --- NEW: Full Auto-betting Logic ---
    useEffect(() => {
        // Auto-place bet when auto-betting is active and a new round starts
        if (isAutoBetting && gameState.phase === 'WAITING' && !myCurrentBet && !placingBet) {
            handlePlaceBet();
        }

        // Auto-cashout logic (this part was already present but now connected to a dedicated switch)
        if(isAutoCashout && myCurrentBet?.status === 'placed' && gameState.phase === 'RUNNING' && gameState.multiplier >= parseFloat(autoCashout)) {
            handleCashOut();
        }
    }, [gameState.phase, gameState.multiplier, isAutoBetting, isAutoCashout, myCurrentBet, placingBet, handlePlaceBet, handleCashOut, autoCashout]);


    const renderButton = () => {
        const hasBet = !!myCurrentBet;
        const hasCashedOut = myCurrentBet?.status === 'cashed_out';

        if (gameState.phase === 'CONNECTING') return <Button className="crash-btn" loading disabled>CONNECTING</Button>;
        
        if (hasCashedOut) return <Button disabled className="crash-btn cashed-out">Cashed Out @ {myCurrentBet.cash_out_multiplier.toFixed(2)}x</Button>;
        
        if (gameState.phase === 'RUNNING') {
            if (hasBet) return <Button onClick={handleCashOut} className="crash-btn cashout">Cash Out @ {gameState.multiplier.toFixed(2)}x</Button>;
            return <Button disabled className="crash-btn">Bets Closed</Button>;
        }
        
        if (gameState.phase === 'WAITING') {
            if (placingBet) return <Button loading className="crash-btn placed">Placing Bet...</Button>;
            if (hasBet) return <Button disabled className="crash-btn placed">Bet Placed</Button>;
            return <Button onClick={handlePlaceBet} className="crash-btn place-bet" disabled={!userWalletAddress}>Place Bet</Button>;
        }
        
        if (gameState.phase === 'CRASHED' && hasBet) return <Button disabled className="crash-btn crashed">Crashed</Button>;
        
        return <Button disabled className="crash-btn">Waiting For Next Round...</Button>;
    };

    const tabItems = [
        { key: '1', label: <span><FaUsers/> All Bets</span>, children: <CurrentBetsList players={gameState.players} myWalletAddress={userWalletAddress} /> },
        { key: '2', label: <span><FaHistory/> My History</span>, children: userWalletAddress ? <MyBetsHistory walletAddress={userWalletAddress} /> : <Empty description="Connect wallet to view your history" />},
    ];

    const isBettingDisabled = !!myCurrentBet || isAutoBetting;

    return (
        <div className="crash-game-page-container">
            <div className="history-bar">
                {gameState.history.map((h, i) => (
                    <span key={i} className={`history-item ${h.crash_multiplier < 2 ? 'red' : 'green'}`}>{h.crash_multiplier.toFixed(2)}x</span>
                ))}
            </div>
            <div className="crash-game-area">
                {!isMobile && ( <div className="bets-panel"><Tabs defaultActiveKey="1" items={tabItems} className="game-history-tabs" centered /></div> )}
                <div className="chart-and-controls-panel">
                    <CrashAnimation gameState={gameState} />
                    <Card className="bet-controls-area">
                         <Tabs defaultActiveKey="1" type="card">
                            <Tabs.TabPane tab="Manual" key="1">
                                 <div className="controls-container">
                                    <Input.Group compact>
                                        <Input addonBefore="Bet" type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)} disabled={isBettingDisabled} className="bet-input"/>
                                    </Input.Group>
                                     <div className="quick-bet-buttons">
                                        <Button onClick={() => setBetAmount(p => Math.max(1, parseFloat(p)/2).toFixed(2))} disabled={isBettingDisabled}>1/2</Button>
                                        <Button onClick={() => setBetAmount(p => (parseFloat(p)*2).toFixed(2))} disabled={isBettingDisabled}>2x</Button>
                                        <Button onClick={() => setBetAmount(100)} disabled={isBettingDisabled}>100</Button>
                                     </div>
                                     {renderButton()}
                                 </div>
                             </Tabs.TabPane>
                             <Tabs.TabPane tab="Auto" key="2">
                                <div className="controls-container">
                                    <Input.Group compact>
                                        <Input addonBefore="Base Bet" type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)} disabled={isAutoBetting} className="bet-input"/>
                                    </Input.Group>
                                     <Input.Group compact style={{alignItems: 'center'}}>
                                        <Input addonBefore="Auto Cashout" addonAfter="x" type="number" value={autoCashout} onChange={e => setAutoCashout(e.target.value)} disabled={isAutoBetting || !isAutoCashout} className="bet-input"/>
                                        <Switch checked={isAutoCashout} onChange={setIsAutoCashout} disabled={isAutoBetting} style={{ marginLeft: 12}} />
                                    </Input.Group>
                                    <Button 
                                      className={`crash-btn ${isAutoBetting ? 'crashed' : 'place-bet'}`} 
                                      onClick={() => setIsAutoBetting(!isAutoBetting)}
                                      disabled={!userWalletAddress || placingBet || !!myCurrentBet}
                                    >
                                      {isAutoBetting ? 'Stop Auto-Bet' : 'Start Auto-Bet'}
                                    </Button>
                                </div>
                            </Tabs.TabPane>
                         </Tabs>
                    </Card>
                </div>
            </div>
             {isMobile && <div className="mobile-tabs-panel"><Tabs defaultActiveKey="1" items={tabItems} className="game-history-tabs" centered /></div>}
        </div>
    );
};

export default CrashGame;