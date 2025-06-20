import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Card, Button, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTonAddress } from '@tonconnect/ui-react';
import { getUserProfile } from '../services/api';
import './GamePage.css';

const { Title, Text, Paragraph } = Typography;

const GamePage = () => {
    const navigate = useNavigate();
    const rawAddress = useTonAddress(false);
    const [claimableArix, setClaimableArix] = useState('0');
    const [loadingBalance, setLoadingBalance] = useState(false);

    const fetchUserArixBalance = useCallback(async () => {
        if (rawAddress) {
            setLoadingBalance(true);
            try {
                const profileRes = await getUserProfile(rawAddress);
                setClaimableArix(Math.floor(parseFloat(profileRes.data?.claimableArixRewards || 0)).toString());
            } catch (error) {
                console.error("Error fetching ARIX balance for Game Page:", error);
                setClaimableArix('0');
            } finally {
                setLoadingBalance(false);
            }
        } else {
            setClaimableArix('0');
        }
    }, [rawAddress]);

    useEffect(() => {
        fetchUserArixBalance();
    }, [fetchUserArixBalance]);


    // Simplified navigation handlers
    const handlePlayCoinflip = () => {
        navigate('/game/coinflip');
    };
    
    // NEW: Navigation handler for Crash Game
    const handlePlayCrash = () => {
        navigate('/game/crash');
    };


    return (
        <div className="game-page-container">
            <div className="header-content-wrapper">
                <div className="push-balance-section">
                    <div className="balance-info-box">
                        <div className="balance-amount-line">
                            <div className="balance-icon-wrapper">
                                <span className="balance-icon-representation">♢</span>
                            </div>
                            <Text className="push-balance-amount">
                                {loadingBalance ? <Spin size="small" wrapperClassName="balance-spin" /> : claimableArix}
                            </Text>
                        </div>
                        <Text className="push-balance-currency">ARIX</Text>
                    </div>
                </div>
            </div>

            <div className="game-page-top-banner">
                <Text className="game-page-top-banner-text">X2 or may be x256? Play Coinflip and try your luck! →</Text>
            </div>

            <Title level={1} className="game-page-title">Games</Title>
            <Paragraph className="game-page-intro-text">
                Exciting games and generous rewards are waiting for you! Take the first step toward victory!
            </Paragraph>

            <div className="game-card-list">
                {/* --- CoinFlip Card --- */}
                <Card className="game-card" hoverable onClick={handlePlayCoinflip}>
                    <div className="game-card-row">
                        <div className="game-card-image-section">
                            <img 
                                src="/img/coinflip-card-visual.png" 
                                alt="Coinflip Game Visual"
                                onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100/1a1a2e/ffffff?text=Coin'; }}
                            />
                        </div>
                        <div className="game-card-content-section">
                            <Title level={4} className="game-card-title">Heads or Tails?</Title>
                            <Paragraph className="game-card-description">
                                Make a choice and increase your balance up to x210! Take a risk and win!
                            </Paragraph>
                            <Button className="game-card-button">
                                <span className="button-icon-circle"></span>
                                Test your luck 
                                <span className="button-arrow">→</span>
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* --- NEW: Crash Game Card --- */}
                <Card className="game-card" hoverable onClick={handlePlayCrash}>
                    <div className="game-card-row">
                        <div className="game-card-image-section">
                            <img 
                                src="/img/crash-card-visual.png" // You'll need to add this image
                                alt="Crash Game Visual"
                                // Placeholder image if the primary one fails
                                onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100/1a1a2e/ffffff?text=Crash'; }}
                            />
                        </div>
                        <div className="game-card-content-section">
                            <Title level={4} className="game-card-title">Crash</Title>
                            <Paragraph className="game-card-description">
                                Cash out before the rocket crashes. The higher the multiplier, the bigger the win!
                            </Paragraph>
                            <Button className="game-card-button">
                                <span className="button-icon-circle"></span>
                                Fly to the moon
                                <span className="button-arrow">→</span>
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default GamePage;
