// AR_FRONTEND/src/components/game/crash/CrashGame.jsx

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { FaPlane, FaUsers, FaHistory, FaStar } from 'react-icons/fa';
import { Table, Tabs, Input, Button, Spin, Tag, Empty, Card, Grid, message, Switch, Tooltip } from 'antd';
import { getCrashHistoryForUser } from '../../../services/api';
import './CrashGame.css';

const { useBreakpoint } = Grid;

const ChartIcon = () => <FaPlane size={24} className="plane-icon" />;

const CrashAnimation = ({ gameState }) => {
    const { phase, multiplier, crashPoint } = gameState;
    const [planeStyle, setPlaneStyle] = useState({ bottom: '5%', left: '5%', opacity: 0 });
    const [isExploding, setIsExploding] = useState(false);
    const countdownRef = useRef(null);

    useEffect(() => {
        const bar = countdownRef.current;
        if (phase === 'WAITING' && bar) {
            bar.classList.remove('animate');
            void bar.offsetWidth;
            bar.classList.add('animate');
            setIsExploding(false);
        }

        if (phase === 'RUNNING') {
            setIsExploding(false);
            const logMultiplier = Math.log2(multiplier || 1);
            const x = logMultiplier * 14; 
            const y = 80 - Math.pow(logMultiplier, 2) * 2;
            const rotation = Math.max(-45, 15 - logMultiplier * 8);
            
            setPlaneStyle({
                left: `${Math.min(95, 5 + x)}%`,
                bottom: `${Math.min(95, 15 + (80 - y))}%`,
                transform: `rotate(${rotation}deg) scale(1)`,
                opacity: 1,
                transition: 'all 0.1s linear',
            });
        } else if (phase === 'CRASHED') {
            setPlaneStyle(prev => ({ ...prev, opacity: 0 }));
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
        <div className="crash-chart-container">
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

            <div className="trail" style={{...planeStyle, opacity: phase === 'RUNNING' ? 1 : 0}} />
            {!isExploding && <div className="rocket-container" style={planeStyle}><ChartIcon /></div>}
            {isExploding &&
                <div className="explosion-container" style={{left: planeStyle.left, bottom: planeStyle.bottom}}>
                    {Array.from({ length: 20 }).map((_, i) => <div key={i} className="particle" style={{'--i': i}}/>)}
                </div>
            }
        </div>
    );
};

const CurrentBetsList = ({ players, myWalletAddress }) => {
    const columns = [
        { title: 'Player', dataIndex: 'user_wallet_address', render: text => `${text.slice(0, 4)}...${text.slice(-4)}` },
        { title: 'Bet', dataIndex: 'bet_amount_arix', align: 'right', render: text => parseFloat(text).toFixed(2) },
        { title: 'Payout @', dataIndex: 'status', align: 'right', render: (status, record) => {
                if (status === 'cashed_out') return <span style={{ color: '#2ecc71' }}>{parseFloat(record.cash_out_multiplier).toFixed(2)}x</span>;
                if (status === 'lost') return <span style={{ color: '#e74c3c' }}>-</span>;
                return <Tag color="blue">Playing</Tag>;
            }
        }
    ];

    if (!players || players.length === 0) return <Empty description="No players this round" image={Empty.PRESENTED_IMAGE_SIMPLE} />;

    return <Table rowClassName={record => record.user_wallet_address === myWalletAddress ? 'my-bet-row' : ''} columns={columns} dataSource={players} pagination={false} rowKey="user_wallet_address" size="small"/>;
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
        { title: 'ID', dataIndex: 'game_id', align: 'center'},
        { title: 'Bet', dataIndex: 'bet_amount_arix', render: val => parseFloat(val).toFixed(2) },
        { title: 'Crash', dataIndex: 'crash_multiplier', render: val => `${parseFloat(val).toFixed(2)}x` },
        { title: 'Outcome', render: (_, rec) => (
            rec.status === 'cashed_out' ?
            <Tag color="green">Won (+{(rec.payout_arix - rec.bet_amount_arix).toFixed(2)})</Tag> :
            <Tag color="red">Lost (-{parseFloat(rec.bet_amount_arix).toFixed(2)})</Tag>
        )}
    ];

    if (loading) return <div style={{textAlign: 'center', padding: '20px'}}><Spin /></div>;
    return <Table columns={columns} dataSource={history} pagination={{ pageSize: 5 }} size="small" rowKey="id" />;
};


const CrashGame = () => {
    const screens = useBreakpoint();
    const isMobile = !screens.lg;
    const { VITE_BACKEND_API_URL } = import.meta.env;

    const [gameState, setGameState] = useState({ phase: 'CONNECTING', multiplier: 1.00, history: [], players: [] });
    const [betAmount, setBetAmount] = useState("10");
    const [placingBet, setPlacingBet] = useState(false);
    
    const userWalletAddress = useTonAddress();
    const [tonConnectUI] = useTonConnectUI();
    const socketRef = useRef(null);
    
    const myCurrentBet = useMemo(() => {
        if (!userWalletAddress || !gameState.players) return null;
        return gameState.players.find(p => p.user_wallet_address === userWalletAddress);
    }, [gameState.players, userWalletAddress]);

    useEffect(() => {
        if (!VITE_BACKEND_API_URL) return;
        const host = new URL(VITE_BACKEND_API_URL).host;
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${host}`;

        let isMounted = true;
        const connect = () => {
            if (!isMounted) return;
            socketRef.current = new WebSocket(wsUrl);
            ws.onopen = () => setGameState(prev => ({...prev, phase: 'WAITING'}));
            ws.onclose = () => {
                if (isMounted) setTimeout(connect, 3000);
                setGameState(prev => ({...prev, phase: 'CONNECTING'}));
            };
            ws.onmessage = (event) => {
                if(!isMounted) return;
                try {
                    const { type, payload } = JSON.parse(event.data);
                    if (type === 'game_update' || type === 'full_state') {
                        setGameState(payload);
                    } else if (type === 'bet_success') {
                        if (payload.userWalletAddress === userWalletAddress) { message.success('Bet placed!'); setPlacingBet(false); }
                    } else if (type === 'bet_error') {
                        if (payload.userWalletAddress === userWalletAddress) { message.error(payload.message, 3); setPlacingBet(false); }
                    } else if (type === 'cashout_success') {
                        if (payload.userWalletAddress === userWalletAddress) { message.success(`Cashed out for ${payload.payoutArix.toFixed(2)} ARIX!`); }
                    }
                } catch(e) { /* ignore parse errors */ }
            };
        }
        connect();

        return () => { isMounted = false; socketRef.current?.close(); };
    }, [userWalletAddress]); // Added dependency

    const sendMessage = (type, payload) => socketRef.current?.send(JSON.stringify({ type, payload }));
    const handlePlaceBet = () => {
        if (!userWalletAddress) { tonConnectUI.openModal(); return; }
        setPlacingBet(true);
        sendMessage('PLACE_BET', { userWalletAddress, betAmountArix: parseFloat(betAmount) });
    };
    const handleCashOut = () => sendMessage('CASH_OUT', { userWalletAddress });

    const renderButton = () => {
        const betPlaced = !!myCurrentBet;
        const hasCashedOut = myCurrentBet?.status === 'cashed_out';

        if (gameState.phase === 'CONNECTING') return <Button className="crash-btn" loading disabled>CONNECTING</Button>;
        
        if (hasCashedOut) return <Button disabled className="crash-btn cashed-out">Cashed Out @ {myCurrentBet.cash_out_multiplier.toFixed(2)}x</Button>;
        
        if (gameState.phase === 'RUNNING') {
            if (betPlaced) return <Button onClick={handleCashOut} className="crash-btn cashout">Cash Out @ {gameState.multiplier.toFixed(2)}x</Button>;
            return <Button disabled className="crash-btn">Bets Closed</Button>;
        }
        
        if (gameState.phase === 'WAITING') {
            if (placingBet) return <Button loading className="crash-btn placed">Placing Bet...</Button>;
            if (betPlaced) return <Button disabled className="crash-btn placed">Bet Placed</Button>;
            return <Button onClick={handlePlaceBet} className="crash-btn place-bet" disabled={!userWalletAddress}>Place Bet</Button>;
        }
        
        if (gameState.phase === 'CRASHED') {
            if (betPlaced && !hasCashedOut) return <Button disabled className="crash-btn crashed">Crashed</Button>;
        }
        
        return <Button disabled className="crash-btn">Waiting for Next Round...</Button>;
    };

    const tabItems = [
        { key: '1', label: <span><FaUsers/> Current Bets</span>, children: <CurrentBetsList players={gameState.players} myWalletAddress={userWalletAddress} /> },
        { key: '2', label: <span><FaHistory/> My History</span>, children: userWalletAddress ? <MyBetsHistory walletAddress={userWalletAddress} /> : <Empty description="Connect wallet to view your bets" />},
        { key: '3', label: <span><FaStar/> Top Wins</span>, children: <Empty description="Coming Soon" />, disabled: true },
    ];

    return (
        <div className="crash-game-page-container">
            <div className="history-bar">
                {gameState.history.map((h, i) => (
                    <span key={i} className={`history-item ${h.crash_multiplier < 2 ? 'red' : 'green'}`}>{h.crash_multiplier}x</span>
                ))}
            </div>
            <div className="crash-game-area">
                {!isMobile && ( <div className="bets-panel"><Tabs defaultActiveKey="1" items={tabItems} className="game-history-tabs" centered /></div> )}
                <div className="chart-and-controls-panel">
                    <CrashAnimation gameState={gameState} />
                    <Card className="bet-controls-area">
                        <div className="controls-container">
                             <Input.Group compact className="bet-input-row">
                                <span className="bet-label">Bet</span>
                                <Input type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)} disabled={!!myCurrentBet} className="bet-input" />
                                <span className="bet-currency">ARIX</span>
                            </Input.Group>
                            {renderButton()}
                        </div>
                    </Card>
                </div>
            </div>
             {isMobile && <div className="mobile-tabs-panel"><Tabs defaultActiveKey="1" items={tabItems} className="game-history-tabs" centered /></div>}
        </div>
    );
};

export default CrashGame;