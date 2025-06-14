import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { FaPlane } from 'react-icons/fa';
import { Table, Tabs, Input, Button, Spin, Tag, Empty, Tooltip, Switch, Grid, Card } from 'antd';
import { getCrashHistoryForUser } from '../../../services/api';
import './CrashGame.css';

const { useBreakpoint } = Grid;

const ChartIcon = () => <FaPlane size={24} style={{ transform: 'rotate(-45deg)', color: '#f1c40f' }} />;

const CrashAnimation = ({ gameState }) => {
    const { phase, multiplier, crashPoint } = gameState;
    const [planeStyle, setPlaneStyle] = useState({ bottom: '5%', left: '5%', opacity: 0, transform: 'rotate(-45deg)' });
    const countdownRef = useRef(null);

    // Rocket animation based on multiplier
    useEffect(() => {
        if (phase === 'RUNNING') {
            const logMultiplier = Math.log(multiplier || 1) / Math.log(1.5);
            const x = (logMultiplier / 10) * 100;
            const y = 80 - Math.pow(logMultiplier, 1.8);
            const rotation = 25 - (logMultiplier * 5);
            setPlaneStyle({
                left: `${Math.min(90, x)}%`,
                bottom: `${Math.min(85, 100 - y)}%`,
                transform: `rotate(${Math.max(-45, rotation)}deg) scale(1)`,
                opacity: 1,
                transition: 'all 0.1s linear'
            });
        } else if (phase === 'CRASHED') {
            setPlaneStyle(prev => ({ ...prev, opacity: 0, transform: `${prev.transform} rotate(45deg) scale(1.5)`, transition: 'all 0.4s ease-in-out' }));
        } else {
            setPlaneStyle({ bottom: '10%', left: '5%', opacity: 0, transform: 'rotate(-45deg) scale(0.8)', transition: 'opacity 0.5s ease-out' });
        }
    }, [phase, multiplier]);
    
    // Countdown bar animation
    useEffect(() => {
        const bar = countdownRef.current;
        if (phase === 'WAITING' && bar) {
            bar.classList.remove('animate');
            void bar.offsetWidth; // Trigger reflow to restart the animation
            bar.classList.add('animate');
        }
    }, [phase]);

    const displayMultiplier = parseFloat(phase === 'CRASHED' ? crashPoint : multiplier).toFixed(2);
    const multiplierColor = phase === 'CRASHED' ? '#e74c3c' : (phase === 'RUNNING' ? '#2ecc71' : '#a0a0b8');

    return (
        <div className="crash-chart-container">
            {phase === 'WAITING' && (
                <div className="countdown-overlay">
                    <div className="countdown-text">Starting Round</div>
                    <div className="countdown-timer"><div ref={countdownRef} className="countdown-bar animate"></div></div>
                </div>
            )}
            <div className="multiplier-overlay" style={{ color: multiplierColor }}>
                {displayMultiplier}x
                {phase === 'CRASHED' && <span className="crashed-text"> Crashed!</span>}
            </div>
            <div className="rocket-container" style={planeStyle}><ChartIcon /></div>
        </div>
    );
};

const CurrentBetsList = ({ players, myWalletAddress }) => {
    if (!players || players.length === 0) return <Empty description="No players in this round." image={Empty.PRESENTED_IMAGE_SIMPLE}/>;
    
    return (
        <div className="bets-list-container">
             {players.map(player => (
                <div key={player.user_wallet_address} className={`bet-row ${player.user_wallet_address === myWalletAddress ? 'my-bet-row' : ''}`}>
                    <span className="player-address">{player.user_wallet_address.slice(0, 4)}...{player.user_wallet_address.slice(-4)}</span>
                    <span className="bet-amount">{parseFloat(player.bet_amount_arix).toFixed(2)} ARIX</span>
                    {player.status === 'cashed_out'
                        ? <Tag color="success">@{parseFloat(player.cash_out_multiplier).toFixed(2)}x</Tag>
                        : <Tag color="processing">Playing</Tag>
                    }
                </div>
            ))}
        </div>
    )
};

const MyBetsHistory = ({ walletAddress }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = useCallback(() => {
        if (!walletAddress) return;
        setLoading(true);
        getCrashHistoryForUser(walletAddress)
            .then(res => setHistory(res.data || []))
            .catch(() => message.error("Could not load your bet history"))
            .finally(() => setLoading(false));
    }, [walletAddress]);

    useEffect(() => { fetchHistory() }, [fetchHistory]);

    const columns = [
        { title: 'Game', dataIndex: 'game_id', align: 'center'},
        { title: 'Bet', dataIndex: 'bet_amount_arix', render: val => parseFloat(val).toFixed(2) },
        { title: 'Crashed At', dataIndex: 'crash_multiplier', render: val => `${parseFloat(val).toFixed(2)}x` },
        { title: 'Outcome', render: (_, rec) => (
            rec.status === 'cashed_out' ?
            <Tag color="green">Won (+{(rec.payout_arix - rec.bet_amount_arix).toFixed(2)})</Tag> :
            <Tag color="red">Lost</Tag>
        )}
    ];
    if (loading) return <div style={{textAlign: 'center', padding: '20px'}}><Spin /></div>;
    return <Table columns={columns} dataSource={history} pagination={{ pageSize: 5 }} size="small" rowKey="id" />
};

const CrashGame = () => {
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const { VITE_BACKEND_API_URL } = import.meta.env;
    const userWalletAddress = useTonAddress();
    const [tonConnectUI] = useTonConnectUI();
    const socketRef = useRef(null);
    
    const [gameState, setGameState] = useState({ phase: 'CONNECTING', multiplier: 1.00, history: [], players: [] });
    const [betAmount, setBetAmount] = useState("10");
    const [autoCashout, setAutoCashout] = useState("2.0");
    const [useAutoCashout, setUseAutoCashout] = useState(false);
    const [myBet, setMyBet] = useState(null); // { betAmount, status }

    useEffect(() => {
        if (!VITE_BACKEND_API_URL) {
            console.error("Backend URL is not configured!");
            return;
        }

        const host = new URL(VITE_BACKEND_API_URL).host;
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${host}`;

        const connect = () => {
            const ws = new WebSocket(wsUrl);
            socketRef.current = ws;
            ws.onopen = () => console.log('[WebSocket] Connection established');
            ws.onclose = () => setTimeout(connect, 5000); // Reconnect on close
            ws.onmessage = (event) => {
                const { type, payload, error } = JSON.parse(event.data);
                if (type === 'game_update' || type === 'full_state') {
                    setGameState(payload);
                    if (payload.phase === 'WAITING' && myBet?.status !== 'cashed_out') setMyBet(null);
                } else if (type === 'bet_error' && payload.userWalletAddress === userWalletAddress) {
                    message.error(payload.message);
                    setMyBet(null);
                }
            };
        }
        connect();

        return () => socketRef.current?.close();
    }, []);

    const sendMessage = (type, payload) => socketRef.current.send(JSON.stringify({ type, payload }));

    const handlePlaceBet = () => {
        if (!userWalletAddress) { tonConnectUI.openModal(); return; }
        setMyBet({ betAmountArix: parseFloat(betAmount), status: 'placed' });
        sendMessage('PLACE_BET', { userWalletAddress, betAmountArix: parseFloat(betAmount), autoCashoutAt: useAutoCashout ? parseFloat(autoCashout) : null });
    };

    const handleCashOut = () => {
        if(myBet && myBet.status === 'placed') {
             setMyBet(prev => ({...prev, status: 'cashed_out'})); // Optimistic UI update
             sendMessage('CASH_OUT', { userWalletAddress });
        }
    };
    
    // Check my bet status based on the canonical game state from backend
    const myCurrentBetInGame = gameState.players.find(p => p.user_wallet_address === userWalletAddress);

    const renderButton = () => {
        const betPlaced = !!myCurrentBetInGame;
        const cashedOut = myCurrentBetInGame?.status === 'cashed_out';

        if (gameState.phase === 'CONNECTING') return <Button className="crash-btn" disabled>Connecting...</Button>;

        if (gameState.phase === 'RUNNING') {
            if (betPlaced && !cashedOut) {
                return <Button onClick={handleCashOut} className="crash-btn cashout">Cash Out @ {gameState.multiplier.toFixed(2)}x</Button>;
            }
            if (cashedOut) {
                return <Button disabled className="crash-btn cashed-out">Cashed Out</Button>;
            }
        }
        
        if (gameState.phase === 'WAITING') {
            if (betPlaced) return <Button disabled className="crash-btn placed">Bet Placed</Button>;
            return <Button onClick={handlePlaceBet} className="crash-btn place-bet" disabled={!userWalletAddress}>Place Bet</Button>;
        }

        if (gameState.phase === 'CRASHED' && betPlaced && !cashedOut) {
            return <Button disabled className="crash-btn crashed">Crashed</Button>;
        }
        
        return <Button disabled className="crash-btn">Waiting For Next Round...</Button>;
    };

    return (
        <div className="crash-game-page-container">
            <div className="crash-game-area">
                {!isMobile &&
                    <div className="bets-panel">
                        <Tabs defaultActiveKey="1" items={[{key: '1', label: <span><FaUsers/> All Bets</span>, children: <CurrentBetsList players={gameState.players} myWalletAddress={userWalletAddress} />}]} className="game-history-tabs" />
                    </div>
                }
                <div className="chart-and-controls-panel">
                    <CrashAnimation gameState={gameState} />
                    <Card className="bet-controls-area">
                        <div className="bet-control-tabs">
                           <div className="controls-container">
                               <div className="bet-input-row">
                                    <Input addonBefore="Bet" addonAfter="ARIX" type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)} disabled={!!myCurrentBetInGame} className="bet-input" />
                               </div>
                                <div className="quick-bet-buttons">
                                    <Button onClick={() => setBetAmount(p => Math.max(1, parseFloat(p)/2).toFixed(2))} disabled={!!myCurrentBetInGame}>1/2</Button>
                                    <Button onClick={() => setBetAmount(p => (parseFloat(p)*2).toFixed(2))} disabled={!!myCurrentBetInGame}>2x</Button>
                                    <Button onClick={() => setBetAmount(100)} disabled={!!myCurrentBetInGame}>100</Button>
                                </div>
                                <div className="auto-cashout-row">
                                     <Input addonBefore="Auto Cashout" addonAfter="x" type="number" value={autoCashout} onChange={e => setAutoCashout(e.target.value)} disabled={!!myCurrentBetInGame} className="bet-input" />
                                 </div>
                                {renderButton()}
                           </div>
                        </div>
                    </Card>
                </div>
            </div>
             {isMobile && 
                <div className="mobile-tabs-panel">
                     <Tabs defaultActiveKey="1" items={[{ key: '1', label: 'All Bets', children: <CurrentBetsList players={gameState.players} myWalletAddress={userWalletAddress} />}, {key: '2', label: 'My Bets', children: <MyBetsHistory walletAddress={userWalletAddress} />}]} className="game-history-tabs" centered />
                </div>
            }
        </div>
    );
};

export default CrashGame;