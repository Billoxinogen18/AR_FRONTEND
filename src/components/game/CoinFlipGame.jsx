// File: AR_FRONTEND/src/components/game/CoinFlipGame.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { InputNumber, Button, Typography, Radio, Spin, message, Alert, Tooltip, Grid } from 'antd';
import {
    ArrowLeftOutlined,
    InfoCircleOutlined,
    SoundOutlined,
    AudioMutedOutlined, 
    CheckCircleOutlined,
} from '@ant-design/icons';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { placeCoinflipBet } from '../../services/api';
import {
    ARIX_DECIMALS,
    getJettonWalletAddress, 
    getJettonBalance,       
    fromArixSmallestUnits,  
    COINFLIP_HEADS_IMG,     
    COINFLIP_TAILS_IMG,     
    COINFLIP_SPINNING_GIF,  
    COINFLIP_DEFAULT_IMG,   
    FALLBACK_IMAGE_URL      
} from '../../utils/tonUtils'; // All imports should come from tonUtils.js or other relevant utils
import './CoinFlipGame.css';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const ARIX_JETTON_MASTER_ADDRESS_FOR_GAME = import.meta.env.VITE_ARIX_TOKEN_MASTER_ADDRESS;

const ArixGameIcon = () => (
    <img src="/img/your-arix-icon.png" alt="ARIX" className="arix-game-icon" onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE_URL; e.currentTarget.alt="ARIX Icon";}} />
);

const CoinflipGame = ({ onBack }) => {
    const [betAmount, setBetAmount] = useState(1);
    const [choice, setChoice] = useState('heads');
    const [isFlipping, setIsFlipping] = useState(false);
    const [gameResult, setGameResult] = useState(null); 
    
    const userFriendlyAddress = useTonAddress();
    const rawAddress = useTonAddress(false);
    const [tonConnectUI] = useTonConnectUI();

    const [arixGameBalance, setArixGameBalance] = useState(0);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const [isSoundOn, setIsSoundOn] = useState(true);

    const screens = useBreakpoint();
    const isMobile = !screens.sm;

    const fetchArixGameBalance = useCallback(async (showMsg = false) => {
        if (!rawAddress || !ARIX_JETTON_MASTER_ADDRESS_FOR_GAME) {
            setArixGameBalance(0); return;
        }
        setBalanceLoading(true);
        try {
            const walletAddr = await getJettonWalletAddress(rawAddress, ARIX_JETTON_MASTER_ADDRESS_FOR_GAME);
            if (walletAddr) {
                const balanceNano = await getJettonBalance(walletAddr);
                setArixGameBalance(fromArixSmallestUnits(balanceNano));
                if (showMsg) message.success("ARIX balance refreshed!");
            } else {
                setArixGameBalance(0);
            }
        } catch (e) {
            console.error("Error fetching ARIX game balance:", e);
            setArixGameBalance(0);
            if (showMsg) message.error("Could not refresh ARIX balance.");
        } finally {
            setBalanceLoading(false);
        }
    }, [rawAddress]);

    useEffect(() => {
        if (userFriendlyAddress) {
            fetchArixGameBalance(false); 
        } else {
            setArixGameBalance(0); 
        }
    }, [userFriendlyAddress, fetchArixGameBalance]);

    useEffect(() => { 
        [COINFLIP_HEADS_IMG, COINFLIP_TAILS_IMG, COINFLIP_SPINNING_GIF, COINFLIP_DEFAULT_IMG].forEach(src => {
            if (src && src.startsWith('/')) { // Ensure only local paths are preloaded
                const img = new Image();
                img.src = src;
            }
        });
    }, []);

    const handlePlaceBet = async () => {
        if (!rawAddress) {
            message.warn({ content: "Please connect your wallet to play.", className: 'game-message-popup warning-popup' });
            tonConnectUI.openModal(); return;
        }
        if (betAmount <= 0) {
            message.error({ content: "Bet amount must be greater than 0 ARIX.", className: 'game-message-popup error-popup' }); return;
        }
        if (betAmount > arixGameBalance) {
            message.error({
                content: `Incorrect bet: You don't have enough ARIX. Balance: ${arixGameBalance.toFixed(ARIX_DECIMALS)} ARIX.`,
                className: 'game-message-popup error-popup',
                icon: <InfoCircleOutlined style={{ color: '#F44336' }}/>,
                duration: 4,
            });
            return;
        }

        setIsFlipping(true); 
        setGameResult(null); 
        
        setTimeout(async () => {
            try {
                const response = await placeCoinflipBet({ 
                    userWalletAddress: rawAddress, betAmountArix: betAmount, choice 
                });
                
                const newResult = {
                    outcome: response.data.outcome, 
                    serverCoinSide: response.data.server_coin_side,
                    amountDeltaArix: parseFloat(response.data.amount_delta_arix), 
                    yourChoice: choice,
                };
                setGameResult(newResult);
                
                if (response.data.newClaimableArixRewards !== undefined) {
                    setArixGameBalance(parseFloat(response.data.newClaimableArixRewards));
                } else {
                    fetchArixGameBalance(false); 
                }

            } catch (error) {
                console.error("Coinflip bet error:", error);
                const errorMessage = error?.response?.data?.message || "Failed to place bet. Please try again.";
                message.error({
                    content: errorMessage,
                    className: 'game-message-popup error-popup',
                    icon: <InfoCircleOutlined style={{ color: '#F44336' }} />,
                    duration: 4,
                });
                setGameResult({ error: true, message: errorMessage, outcome: 'error', serverCoinSide: choice, amountDeltaArix: 0, yourChoice: choice });
            } finally { 
                setIsFlipping(false); 
            }
        }, 1800); 
    };

    const getCoinImageSrc = () => {
        if (isFlipping) return COINFLIP_SPINNING_GIF;
        if (gameResult && !gameResult.error && gameResult.serverCoinSide) {
            return gameResult.serverCoinSide === 'heads' ? COINFLIP_HEADS_IMG : COINFLIP_TAILS_IMG;
        }
        return COINFLIP_DEFAULT_IMG; 
    };

    const potentialWinAmount = betAmount * 2; 

    const handleBetAmountChange = (value) => {
        const newBet = parseFloat(value);
        if (isNaN(newBet)) {
            setBetAmount(0);
        } else if (newBet < 0.1 && newBet !== 0) { 
            setBetAmount(0.1);
        } else {
            setBetAmount(newBet);
        }
    };
    
    const getResultBannerClass = () => {
        if (!gameResult || isFlipping) return 'cf-result-banner hidden';
        if (gameResult.error) return 'cf-result-banner error active';
        return `cf-result-banner ${gameResult.outcome} active`;
    };

    return (
        <div className="coinflip-game-page">
            <div className="coinflip-game-header">
                <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} className="cf-back-button" aria-label="Go Back"/>
                <div className="cf-game-logo-title">
                    <img src="/img/arix-logo-header.png" alt="ARIX" className="cf-header-logo" onError={(e) => e.currentTarget.style.display='none'}/>
                    <Text className="cf-header-terminal-text">TERMINAL</Text>
                </div>
                <div className="cf-balance-display">
                    <ArixGameIcon /> 
                    <Text className="cf-balance-text">{balanceLoading ? <Spin size="small" className="cf-balance-spin"/> : arixGameBalance.toFixed(2)}</Text>
                </div>
            </div>

            <div className="coinflip-main-content-area">
                <div className="cf-top-bar">
                    <Tooltip title="Game Info: Choose Heads or Tails. If your choice matches the coin flip, you win double your bet amount in ARIX.">
                        <Button type="text" icon={<InfoCircleOutlined />} className="cf-info-button" aria-label="Game Info"/>
                    </Tooltip>
                    <Title level={4} className="cf-game-title">COINFLIP</Title>
                    <Button 
                        type="text" 
                        icon={isSoundOn ? <SoundOutlined /> : <AudioMutedOutlined />}
                        onClick={() => setIsSoundOn(!isSoundOn)} 
                        className="cf-sound-button"
                        aria-label={isSoundOn ? "Mute Sound" : "Unmute Sound"}
                    />
                </div>
                <Paragraph className="cf-game-subtitle">Flip the coin and start the story</Paragraph>

                <div className="cf-coin-animation-area">
                    <div className="cf-stat-display left">
                        <Text className="cf-stat-label">STREAK</Text>
                        <Text className="cf-stat-value">0</Text>
                    </div>
                    <div className={`cf-coin-visual-wrapper ${isFlipping ? 'flipping' : ''}`}>
                        <img 
                            src={getCoinImageSrc()} 
                            alt={isFlipping ? "Coin Spinning" : (gameResult?.serverCoinSide || "ARIX Coin")}
                            className="cf-coin-image" 
                            onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE_URL; }}
                        />
                    </div>
                    <div className="cf-stat-display right">
                        <Text className="cf-stat-label">MULTIPLIER</Text>
                        <Text className="cf-stat-value">x1</Text>
                    </div>
                </div>
                
                <div className={getResultBannerClass()}>
                    <Text strong className="cf-result-banner-title">
                        {gameResult?.error ? "Error!" : (gameResult?.outcome === 'win' ? "YOU WON!" : "TRY AGAIN!")}
                    </Text>
                    <Text className="cf-result-banner-details">
                        {gameResult?.error ? gameResult.message :
                        `Coin: ${gameResult?.serverCoinSide?.toUpperCase()}. You chose ${gameResult?.yourChoice?.toUpperCase()}. 
                        ${gameResult?.outcome === 'win' ? `+${gameResult?.amountDeltaArix?.toFixed(ARIX_DECIMALS)}` : `-${Math.abs(gameResult?.amountDeltaArix || 0).toFixed(ARIX_DECIMALS)}`} ARIX.`}
                    </Text>
                </div>


                <div className="cf-bet-controls">
                    <Text className="cf-bet-label">BET AMOUNT (ARIX)</Text>
                    <div className="cf-bet-input-wrapper">
                        <ArixGameIcon />
                        <InputNumber
                            className="cf-bet-input"
                            value={betAmount}
                            onChange={handleBetAmountChange}
                            min={0.1} 
                            step={0.1}
                            precision={ARIX_DECIMALS > 2 ? 2 : ARIX_DECIMALS}
                            disabled={isFlipping || !userFriendlyAddress}
                            controls={false}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value ? value.toString().replace(/[^0-9.]/g, '') : "0"}
                            aria-label="Bet amount in ARIX"
                        />
                    </div>
                     <Button 
                        type="primary" 
                        className="cf-flip-button" 
                        onClick={handlePlaceBet}
                        loading={isFlipping}
                        disabled={isFlipping || !userFriendlyAddress || betAmount <= 0 || betAmount > arixGameBalance}
                    >
                        {isFlipping ? "FLIPPING..." : (userFriendlyAddress ? "FLIP COIN" : "Connect Wallet")}
                    </Button>
                </div>
                
                <div className="cf-choice-selection">
                    <Paragraph className="cf-choose-side-text">
                        <CheckCircleOutlined style={{marginRight: 6}} /> Choose a side to win {potentialWinAmount.toFixed(ARIX_DECIMALS)} ARIX
                    </Paragraph>
                    <Radio.Group 
                        onChange={(e) => setChoice(e.target.value)} 
                        value={choice} 
                        buttonStyle="solid"
                        disabled={isFlipping || !userFriendlyAddress}
                        className="cf-choice-radio-group"
                        aria-label="Choose Heads or Tails"
                    >
                        <Radio.Button value="heads" className="cf-choice-button heads" aria-label="Select Heads">
                            <img src={COINFLIP_HEADS_IMG} alt="Heads" className="cf-choice-button-icon" onError={(e) => e.currentTarget.style.display='none'}/>
                            HEADS
                        </Radio.Button>
                        <Radio.Button value="tails" className="cf-choice-button tails" aria-label="Select Tails">
                             <img src={COINFLIP_TAILS_IMG} alt="Tails" className="cf-choice-button-icon" onError={(e) => e.currentTarget.style.display='none'}/>
                            TAILS
                        </Radio.Button>
                    </Radio.Group>
                </div>
            </div>
        </div>
    );
};

export default CoinflipGame;
