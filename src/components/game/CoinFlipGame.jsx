// File: AR_FRONTEND/src/components/game/CoinflipGame.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, InputNumber, Button, Typography, Radio, Spin, message, Grid, Alert } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { placeCoinflipBet } from '../../services/api'; 
import { ARIX_DECIMALS, getJettonWalletAddress, getJettonBalance, fromArixSmallestUnits } from '../../utils/tonUtils';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid; // For responsive layout adjustments

const ARIX_JETTON_MASTER_ADDRESS_FOR_GAME = import.meta.env.VITE_ARIX_TOKEN_MASTER_ADDRESS;

const CoinflipGame = () => {
  const [betAmount, setBetAmount] = useState(10);
  const [choice, setChoice] = useState('heads');
  const [flipping, setFlipping] = useState(false);
  const [gameResult, setGameResult] = useState(null); 
  
  const userFriendlyAddress = useTonAddress();
  const rawAddress = useTonAddress(false);
  const [tonConnectUI] = useTonConnectUI();

  const [arixGameBalance, setArixGameBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // Placeholder images - replace these in your /public folder or use SVGs
  const coinImages = {
    heads: '/img/coin_heads.png', 
    tails: '/img/coin_tails.png', 
    spinning: '/img/coin_spinning.gif' 
  };
  const fallbackCoinImage = 'https://placehold.co/150x150/2a2d3a/e0e0e0?text=Coin&font=montserrat';

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
              if (showMsg) message.info("ARIX wallet not found for this account.");
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
        fetchArixGameBalance(false); // Initial fetch without message
    } else {
        setArixGameBalance(0); 
    }
  }, [userFriendlyAddress, fetchArixGameBalance]);


  useEffect(() => { 
    Object.values(coinImages).forEach(src => {
      if (src.startsWith('/')) {
        const img = new Image();
        img.src = src;
      }
    });
  }, []);

  const handlePlaceBet = async () => {
    if (!rawAddress) {
      message.warn("Please connect your wallet to play Coinflip with ARIX.");
      tonConnectUI.openModal(); return;
    }
    if (betAmount <= 0) {
      message.error("Bet amount must be greater than 0 ARIX."); return;
    }
    if (betAmount > arixGameBalance) {
        message.error(`Insufficient ARIX balance (${arixGameBalance.toFixed(ARIX_DECIMALS)} ARIX) for this bet.`); return;
    }

    setFlipping(true); setGameResult(null);
    const loadingMessageKey = 'flippingCoin';
    message.loading({ content: 'Flipping the coin...', key: loadingMessageKey, duration: 0 });

    try {
      const response = await placeCoinflipBet({ 
        userWalletAddress: rawAddress, betAmountArix: betAmount, choice 
      });
      
      setGameResult({
        outcome: response.data.outcome, serverCoinSide: response.data.server_coin_side,
        amountDelta: parseFloat(response.data.amount_delta_arix), yourChoice: choice,
        gameId: response.data.game_id
      });

      if (response.data.outcome === 'win') {
        message.success({ content: `You won ${parseFloat(response.data.amount_delta_arix)} ARIX!`, key: loadingMessageKey, duration: 3 });
      } else {
        message.error({ content: `You lost ${Math.abs(parseFloat(response.data.amount_delta_arix))} ARIX.`, key: loadingMessageKey, duration: 3 });
      }
      fetchArixGameBalance(false); // Refresh balance after game
    } catch (error) {
      console.error("Coinflip bet error:", error);
      message.error({ content: error?.response?.data?.message || "Failed to place bet. Please try again.", key: loadingMessageKey, duration: 3 });
      setGameResult({ error: true, message: error?.response?.data?.message || "An error occurred." });
    } finally { 
      // message.destroy(loadingMessageKey) is handled by setting duration on success/error
      setFlipping(false); 
    }
  };

  const getCoinImageSrc = () => {
    if (flipping) return coinImages.spinning;
    if (gameResult?.serverCoinSide) {
      return gameResult.serverCoinSide === 'heads' ? coinImages.heads : coinImages.tails;
    }
    return choice === 'heads' ? coinImages.heads : coinImages.tails;
  };

  return (
    <Card className="neumorphic-glass-card coinflip-card" bordered={false}>
      <Title level={isMobile ? 3 : 2} style={{ textAlign: 'center', color: '#00adee', marginBottom: isMobile ? 20 : 30 }}>
        ARIX Coinflip
      </Title>
      
      {userFriendlyAddress ? (
        <Paragraph style={{ textAlign: 'center', color: '#aaa', marginBottom: isMobile ? 15 : 20, fontSize: '0.9em' }}>
            Your ARIX Balance: <Text strong style={{color: '#00adee'}}>{arixGameBalance.toFixed(ARIX_DECIMALS)} ARIX </Text>
            <Button icon={<ReloadOutlined />} onClick={() => fetchArixGameBalance(true)} loading={balanceLoading} type="text" size="small" style={{marginLeft: 8}} />
        </Paragraph>
      ) : (
          <Alert 
            message="Wallet Not Connected" type="warning" showIcon style={{ marginBottom: 20 }} className="glass-pane-alert"
            description="Connect your TON wallet to play Coinflip with ARIX and record your game history."
            action={ <Button size="small" type="primary" onClick={() => tonConnectUI.openModal()}> Connect Wallet </Button> }
          />
      )}

      <Row gutter={[isMobile ? 16 : 32, isMobile ? 20 : 32]} justify="center" align="middle">
        <Col xs={24} md={10} style={{ textAlign: 'center', marginBottom: isMobile ? 20 : 0 }}>
          <div className="coin-display-container">
            <img src={getCoinImageSrc()} alt={flipping ? "Coin Spinning" : (gameResult?.serverCoinSide ? `Coin: ${gameResult.serverCoinSide}`: "Coin")} 
                 className="coin-image" onError={(e) => { e.currentTarget.src = fallbackCoinImage; }} />
          </div>
          {gameResult && !flipping && !gameResult.error && (
            <div className={`game-result-info ${gameResult.outcome}`}>
              <Title level={4} className={`result-title ${gameResult.outcome}`}>{gameResult.outcome === 'win' ? 'You Won!' : 'You Lost!'}</Title>
              <Text className="result-text">You chose: <Text strong>{gameResult.yourChoice?.toUpperCase()}</Text></Text>
              <Text className="result-text">Coin was: <Text strong>{gameResult.serverCoinSide?.toUpperCase()}</Text></Text>
              <Text className="result-text delta">
                {gameResult.outcome === 'win' ? 'Profit: ' : 'Loss: '}
                <Text strong className={gameResult.outcome}>{Math.abs(gameResult.amountDelta).toFixed(ARIX_DECIMALS)} ARIX</Text>
              </Text>
              {gameResult.gameId && <Text className="game-id-text">Game ID: {gameResult.gameId.substring(0,8)}...</Text>}
            </div>
          )}
           {gameResult?.error && (<Alert message="Game Error" description={gameResult.message} type="error" showIcon style={{marginTop: 15}}/>)}
        </Col>

        <Col xs={24} md={14} className="coinflip-controls">
          <div style={{ marginBottom: isMobile ? 15 : 20 }}>
            <Text className="input-label">Bet Amount (ARIX):</Text>
            <InputNumber style={{ width: '100%' }} className="neumorphic-input-number" value={betAmount}
              onChange={(value) => setBetAmount(value === null ? 0 : parseFloat(value))} min={1} max={10000} 
              precision={ARIX_DECIMALS} disabled={flipping || !userFriendlyAddress} size="large"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value ? value.toString().replace(/\$\s?|(,*)/g, '') : "0"} />
          </div>
          <div style={{ marginBottom: isMobile ? 20 : 30, textAlign: 'center' }}>
            <Text className="input-label">Choose your side:</Text>
            <Radio.Group onChange={(e) => setChoice(e.target.value)} value={choice} buttonStyle="solid"
              disabled={flipping || !userFriendlyAddress} size="large" className="coinflip-radio-group">
              <Radio.Button value="heads" className="coinflip-radio-button">Heads</Radio.Button>
              <Radio.Button value="tails" className="coinflip-radio-button">Tails</Radio.Button>
            </Radio.Group>
          </div>
          <Button type="primary" onClick={handlePlaceBet} loading={flipping}
            disabled={flipping || betAmount <= 0 || !userFriendlyAddress || betAmount > arixGameBalance}
            block size="large" className="flip-button">
            {flipping ? 'Flipping...' : `Flip for ${betAmount} ARIX`}
          </Button>
        </Col>
      </Row>
    </Card>
  );
};

export default CoinflipGame;