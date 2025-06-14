import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { FaPlane, FaUsers, FaHistory } from 'react-icons/fa';
import { Table, Tabs, Input, Button, Spin, Tag, Empty, Card, Grid, message } from 'antd';
import { getCrashHistoryForUser } from '../../../services/api';
import './CrashGame.css';

const { useBreakpoint } = Grid;

const ChartIcon = () => <FaPlane size={24} style={{ transform: 'rotate(-45deg)', color: '#f1c40f', filter: 'drop-shadow(0 0 8px #f1c40f)' }} />;

// Crash Animation and Chart component
const CrashAnimation = ({ gameState }) => {
    const { phase, multiplier, crashPoint } = gameState;
    const [planeStyle, setPlaneStyle] = useState({ bottom: '5%', left: '5%', opacity: 0, transform: 'rotate(-45deg)' });
    const countdownRef = useRef(null);

    useEffect(() => {
        const bar = countdownRef.current;
        if (phase === 'WAITING' && bar) {
            bar.classList.remove('animate');
            void bar.offsetWidth; // Trigger reflow to restart animation
            bar.classList.add('animate');
        }

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
                transition: 'all 0.1s linear',
            });
        } else if (phase === 'CRASHED') {
            setPlaneStyle(prev => ({ ...prev, opacity: 0, transform: `${prev.transform} rotate(45deg) scale(1.5)`, transition: 'all 0.4s ease-in-out' }));
        } else {
            setPlaneStyle({ bottom: '10%', left: '5%', opacity: 0, transform: `rotate(-45deg) scale(0.8)`, transition: 'opacity 0.5s ease-out' });
        }
    }, [phase, multiplier]);

    const displayMultiplier = parseFloat(phase === 'CRASHED' ? crashPoint : multiplier).toFixed(2);
    const multiplierColor = phase === 'CRASHED' ? '#e74c3c' : (phase === 'RUNNING' ? '#2ecc71' : '#a0a0b8');

    return (
        <div className="crash-chart-container">
            {phase === 'WAITING' && (
                <div className="countdown-overlay">
                    <div className="countdown-text">STARTING ROUND</div>
                    <div className="countdown-timer"><div ref={countdownRef} className="countdown-bar animate"></div></div>
                </div>
            )}
            <div className="multiplier-overlay" style={{ color: multiplierColor }}>
                {displayMultiplier}x
                {phase === 'CRASHED' && <span className="crashed-text"> CRASHED!</span>}
            </div>
            <div className="rocket-container" style={planeStyle}><ChartIcon /></div>
        </div>
    );
};


const CurrentBetsList = ({ players, myWalletAddress }) => {
    const columns = [
        { title: 'Player', dataIndex: 'user_wallet_address', render: text => `${text.slice(0, 4)}...${text.slice(-4)}` },
        { title: 'Bet (ARIX)', dataIndex: 'bet_amount_arix', align: 'right', render: text => parseFloat(text).toFixed(2) },
        {
            title: 'Status', dataIndex: 'status', align: 'right', render: (status, record) => (
                status === 'cashed_out'
                    ? <Tag color="green">@{parseFloat(record.cash_out_multiplier).toFixed(2)}x</Tag>
                    : <Tag color="blue">Playing</Tag>
            )
        }
    ];

    if (!players || players.length === 0) return <Empty description="No players this round." image={Empty.PRESENTED_IMAGE_SIMPLE}/>;

    return <Table rowClassName={record => record.user_wallet_address === myWalletAddress ? 'my-bet-row' : ''} columns={columns} dataSource={players} pagination={false} rowKey="user_wallet_address" size="small"/>
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

    const columns = [
        { title: 'Game ID', dataIndex: 'game_id', align: 'center'},
        { title: 'Bet', dataIndex: 'bet_amount_arix', render: val => parseFloat(val).toFixed(2) },
        { title: 'Crashed At', dataIndex: 'crash_multiplier', render: val => `${parseFloat(val).toFixed(2)}x` },
        { title: 'Outcome', render: (_, rec) => (
            rec.status === 'cashed_out' ?
            <Tag color="green">Won (+{(rec.payout_arix - rec.bet_amount_arix).toFixed(2)})</Tag> :
            <Tag color="red">Lost (-{parseFloat(rec.bet_amount_arix).toFixed(2)})</Tag>
        )},
    ];
    if (loading) return <div style={{textAlign: 'center', padding: '20px'}}><Spin /></div>;
    return <Table columns={columns} dataSource={history} pagination={{ pageSize: 5 }} size="small" rowKey="id" />
};

const CrashGame = () => {
    const screens = useBreakpoint();
    const isMobile = !screens.lg;
    const userWalletAddress = useTonAddress();
    const [tonConnectUI] = useTonConnectUI();
    const socketRef = useRef(null);

    const [gameState, setGameState] = useState({ phase: 'CONNECTING', multiplier: 1.00, history: [], players: [] });
    const [betAmount, setBetAmount] = useState("10");
    const myCurrentBetInGame = gameState.players.find(p => p.user_wallet_address === userWalletAddress);

    useEffect(() => {
        const { VITE_BACKEND_API_URL } = import.meta.env;
        const host = new URL(VITE_BACKEND_API_URL).host;
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${host}`;

        const connect = () => {
            const ws = new WebSocket(wsUrl);
            socketRef.current = ws;
            ws.onopen = () => setGameState(prev => ({...prev, phase: 'WAITING'}));
            ws.onclose = () => {
                setGameState(prev => ({...prev, phase: 'CONNECTING'}));
                setTimeout(connect, 3000);
            };
            ws.onmessage = (event) => {
                const { type, payload } = JSON.parse(event.data);
                if (type === 'game_update' || type === 'full_state') {
                    setGameState(payload);
                }
            };
        }
        connect();

        return () => socketRef.current?.close();
    }, []);

    const sendMessage = (type, payload) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type, payload }));
        } else {
            message.error("Not connected to game server. Please refresh.", 2);
        }
    };
    
    const handlePlaceBet = () => {
        if (!userWalletAddress) { tonConnectUI.openModal(); return; }
        sendMessage('PLACE_BET', { userWalletAddress, betAmountArix: parseFloat(betAmount) });
    };
    const handleCashOut = () => {
        if (myCurrentBetInGame) sendMessage('CASH_OUT', { userWalletAddress });
    };

    const renderButton = () => {
        if (gameState.phase === 'CONNECTING') return <Button className="crash-btn" disabled>Connecting...</Button>;
        const hasBet = !!myCurrentBetInGame;
        const hasCashedOut = myCurrentBetInGame?.status === 'cashed_out';

        if (gameState.phase === 'RUNNING') {
            if (hasBet && !hasCashedOut) {
                return <Button onClick={handleCashOut} className="crash-btn cashout">Cash Out @ {gameState.multiplier.toFixed(2)}x</Button>;
            }
        }
        if (hasCashedOut) return <Button disabled className="crash-btn cashed-out">Cashed Out @ {myCurrentBetInGame.cash_out_multiplier}x</Button>;
        
        if (gameState.phase === 'WAITING') {
            if (hasBet) return <Button disabled className="crash-btn placed">Bet Placed</Button>;
            return <Button onClick={handlePlaceBet} className="crash-btn place-bet" disabled={!userWalletAddress}>Place Bet</Button>;
        }

        if (gameState.phase === 'CRASHED' && hasBet) {
             return <Button disabled className="crash-btn crashed">Crashed</Button>;
        }
        return <Button disabled className="crash-btn">Waiting For Next Round...</Button>;
    };

    const tabItems = [
        { key: '1', label: <span><FaUsers/> All Bets</span>, children: <CurrentBetsList players={gameState.players} myWalletAddress={userWalletAddress} /> },
        { key: '2', label: <span><FaHistory/> My Bets</span>, children: userWalletAddress ? <MyBetsHistory walletAddress={userWalletAddress} /> : <Empty description="Connect wallet to see your history" />},
    ];

    return (
        <div className="crash-game-page-container">
            <div className="history-bar">
                {gameState.history.map((h, i) => (
                    <span key={i} className={`history-item ${h.crash_multiplier < 2 ? 'red' : 'green'}`}>
                        {h.crash_multiplier}x
                    </span>
                ))}
            </div>
            <div className="crash-game-area">
                {!isMobile && (
                    <div className="bets-panel">
                        <Tabs defaultActiveKey="1" items={tabItems} className="game-history-tabs" centered />
                    </div>
                )}
                <div className="chart-and-controls-panel">
                    <CrashAnimation gameState={gameState}/>
                     <Card className="bet-controls-area">
                        <div className="controls-container">
                            <div className="bet-input-row">
                                <Input addonBefore="Bet" addonAfter="ARIX" type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)} disabled={!!myCurrentBetInGame} className="bet-input" />
                            </div>
                            <div className="quick-bet-buttons">
                                <Button onClick={() => setBetAmount(10)} disabled={!!myCurrentBetInGame}>10</Button>
                                <Button onClick={() => setBetAmount(100)} disabled={!!myCurrentBetInGame}>100</Button>
                                <Button onClick={() => setBetAmount(500)} disabled={!!myCurrentBetInGame}>500</Button>
                            </div>
                            {renderButton()}
                        </div>
                    </Card>
                </div>
            </div>
             {isMobile && 
                <div className="mobile-tabs-panel">
                    <Tabs defaultActiveKey="1" items={tabItems} className="game-history-tabs" centered />
                </div>
            }
        </div>
    );
};

export default CrashGame;