// File: AR_Proj/AR_FRONTEND/src/components/game/CoinflipGame.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, InputNumber, Button, Typography, Spin, message, Radio, Image, Alert } from 'antd';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { placeCoinflipBet } from '../../services/api'; // Ensure this path is correct relative to this file
import { getJettonWalletAddress, getJettonBalance, fromArixSmallestUnits, toArixSmallestUnits, ARIX_DECIMALS } from '../../utils/tonUtils'; // Ensure this path is correct

// Asset paths - Ensure these images are in AR_FRONTEND/public/
const headsImageUrl = '/heads.png';
const tailsImageUrl = '/tails.png';
const defaultCoinImageUrl = '/coin-default.png'; // A default image for the coin before flipping or on error

const { Title, Text, Paragraph } = Typography;

const ARIX_JETTON_MASTER_ADDRESS = import.meta.env.VITE_ARIX_TOKEN_MASTER_ADDRESS;

const CoinflipGame = () => {
  const userFriendlyAddress = useTonAddress();
  const rawAddress = useTonAddress(false);
  const [tonConnectUI] = useTonConnectUI();

  const [betAmountArix, setBetAmountArix] = useState(10);
  const [choice, setChoice] = useState('heads');
  const [loading, setLoading] = useState(false); // For API call status
  const [flipping, setFlipping] = useState(false); // For UI animation state
  const [gameResult, setGameResult] = useState(null);
  const [arixBalance, setArixBalance] = useState(0);
  const [coinImage, setCoinImage] = useState(defaultCoinImageUrl);
  const [error, setError] = useState('');

  const fetchArixBalance = useCallback(async () => {
    if (!rawAddress || !ARIX_JETTON_MASTER_ADDRESS) {
      setArixBalance(0);
      return;
    }
    try {
      const userArixJettonWallet = await getJettonWalletAddress(rawAddress, ARIX_JETTON_MASTER_ADDRESS);
      if (userArixJettonWallet) {
        const balanceSmallestUnits = await getJettonBalance(userArixJettonWallet);
        setArixBalance(fromArixSmallestUnits(balanceSmallestUnits));
      } else {
        setArixBalance(0);
      }
    } catch (err) {
      console.error("Failed to fetch ARIX balance for game:", err);
      setArixBalance(0);
      // message.error("Could not fetch ARIX balance."); // Avoid too many messages if also on UserPage
    }
  }, [rawAddress]);

  useEffect(() => {
    if (userFriendlyAddress) {
      fetchArixBalance();
    } else {
      setArixBalance(0);
      setGameResult(null); // Clear results if wallet disconnects
    }
  }, [userFriendlyAddress, fetchArixBalance]);

  const handlePlaceBet = async () => {
    if (!rawAddress) {
      message.error('Please connect your wallet first.');
      tonConnectUI?.openModal(); // Prompt to connect
      return;
    }
    if (betAmountArix <= 0) {
      message.error('Bet amount must be greater than 0 ARIX.');
      return;
    }
    if (betAmountArix > arixBalance) {
      message.error(`Insufficient ARIX balance. You have ${arixBalance.toFixed(ARIX_DECIMALS)} ARIX.`);
      return;
    }

    setLoading(true);
    setFlipping(true);
    setGameResult(null);
    setError('');
    setCoinImage(defaultCoinImageUrl); // Show default/spinning coin

    // Simulate flipping animation
    let flipCount = 0;
    const animationInterval = setInterval(() => {
        setCoinImage(flipCount % 2 === 0 ? headsImageUrl : tailsImageUrl);
        flipCount++;
    }, 100);

    try {
      const response = await placeCoinflipBet({
        userWalletAddress: rawAddress,
        betAmountArix: betAmountArix,
        choice: choice,
      });

      clearInterval(animationInterval); // Stop animation
      setGameResult(response.data);
      setCoinImage(response.data.serverCoinSide === 'heads' ? headsImageUrl : tailsImageUrl); // Show actual result

      if (response.data.outcome === 'win') {
        message.success(`You won ${response.data.amountDelta.toFixed(ARIX_DECIMALS)} ARIX!`);
      } else {
        message.warning(`You lost ${Math.abs(response.data.amountDelta).toFixed(ARIX_DECIMALS)} ARIX.`);
      }
      
      // Optimistically update balance, then re-fetch for canonical balance
      setArixBalance(prev => parseFloat((prev + response.data.amountDelta).toFixed(ARIX_DECIMALS)));
      setTimeout(fetchArixBalance, 1500); // Fetch true balance after a moment

    } catch (err) {
      clearInterval(animationInterval);
      setCoinImage(defaultCoinImageUrl); // Reset coin on error
      const errorMsg = err.response?.data?.message || err.message || 'Failed to place bet. Please try again.';
      message.error(errorMsg);
      setError(errorMsg); // Display error in the UI
      console.error('Coinflip bet error:', err);
    } finally {
      setLoading(false);
      setFlipping(false);
    }
  };

  if (!userFriendlyAddress) {
    return (
      <Card className="neumorphic-glass-card" title="Coinflip Game">
        <Alert
            message="Connect Wallet"
            description="Please connect your TON wallet to play the Coinflip game."
            type="info"
            showIcon
            className="glass-pane"
            style={{marginBottom: 20}}
        />
        <div style={{textAlign: 'center'}}>
            <Button type="primary" onClick={() => tonConnectUI?.openModal()}>Connect Wallet to Play</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="neumorphic-glass-card" title="ARIX Coinflip">
      <Spin spinning={loading && !flipping} tip="Placing Bet...">
        <Row gutter={[16, 24]} justify="center">
          <Col xs={24} md={12} style={{ textAlign: 'center' }}>
            <Title level={4} style={{ color: '#e0e0e0', marginBottom: 20 }}>Choose Heads or Tails</Title>
            <div style={{ marginBottom: 30, minHeight: 130, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Image
                src={coinImage}
                alt="Coin"
                width={128}
                height={128}
                preview={false}
                // Consider adding a CSS class for a more elaborate flipping animation
              />
            </div>

            {gameResult && !flipping && (
              <div style={{ marginBottom: 20, padding: '15px', borderRadius: '10px', background: gameResult.outcome === 'win' ? 'rgba(82, 196, 26, 0.2)' : 'rgba(255, 77, 79, 0.