// File: AR_FRONTEND/src/components/game/CoinflipGame.jsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, InputNumber, Button, Typography, Radio, Spin, message, Grid, Alert } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { placeCoinflipBet } from '../../services/api'; // Actual API call
import { ARIX_DECIMALS, fromArixSmallestUnits, toArixSmallestUnits } from '../../utils/tonUtils'; // For balance display
// Assuming a shared context or zustand store for ARIX balance if needed across games
// For this example, we'll make it self-contained for demo or assume balance info isn't directly managed here post-bet

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const CoinflipGame = ({ initialArixBalance, onGameEnd }) => { // Props for balance and game end callback
  const [betAmount, setBetAmount] = useState(10);
  const [choice, setChoice] = useState('heads');
  const [flipping, setFlipping] = useState(false);
  const [gameResult, setGameResult] = useState(null); 
  
  const userFriendlyAddress = useTonAddress();
  const rawAddress = useTonAddress(false); // For API calls
  const [tonConnectUI] = useTonConnectUI(); // For wallet connection prompt

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // Using passed initialArixBalance if available, otherwise showing a generic message
  // Actual real-time balance updates after a game would require more sophisticated state management or backend push

  // Placeholder images - replace these in your /public folder
  const coinImages = {
    heads: '/img/coin_heads.png', // e.g., /public/img/coin_heads.png
    tails: '/img/coin_tails.png', // e.g., /public/img/coin_tails.png
    spinning: '/img/coin_spinning.gif' // e.g., /public/img/coin_spinning.gif
  };
  const fallbackCoinImage = 'https://placehold.co/150x150/2a2d3a/e0e0e0?text=Coin';


  useEffect(() => { // Preload images
    Object.values(coinImages).forEach(src => {
      if (src.startsWith('/')) { // Only preload relative paths
        const img = new Image();
        img.src = src;
      }
    });
  }, []);

  const handlePlaceBet = async () => {
    if (!rawAddress) {
      message.warn("Please connect your wallet to play Coinflip with ARIX.");
      tonConnectUI.openModal(); // Prompt to connect
      return;
    }
    if (betAmount <= 0) {
      message.error("Bet amount must be greater than 0 ARIX.");
      return;
    }
    // Balance check could be done here if `initialArixBalance` prop is reliably up-to-date
    // Or better, backend handles balance check before processing bet.

    setFlipping(true);
    setGameResult(null);
    const loadingMessage = message.loading('Flipping the coin...', 0);

    try {
      const response = await placeCoinflipBet({ 
        userWalletAddress: rawAddress, 
        betAmountArix: betAmount, 
        choice 
      });
      
      // Assuming backend returns: { outcome, serverCoinSide, amountDeltaArix, newBalanceArix (optional), gameId }
      setGameResult({
        outcome: response.data.outcome,
        serverCoinSide: response.data.server_coin_side,
        amountDelta: parseFloat(response.data.amount_delta_arix),
        yourChoice: choice,
        gameId: response.data.game_id
      });

      if (response.data.outcome === 'win') {
        message.success(`You won ${parseFloat(response.data.amount_delta_arix)} ARIX!`);
      } else {
        message.error(`You lost ${Math.abs(parseFloat(response.data.amount_delta_arix))} ARIX.`);
      }

      if (typeof onGameEnd === 'function') {
        onGameEnd(response.data); // Notify parent about game result, potentially for balance update
      }

    } catch (error) {
      console.error("Coinflip bet error:", error);
      message.error(error?.response?.data?.message || "Failed to place bet. Please try again.");
      setGameResult({ error: true, message: error?.response?.data?.message || "An error occurred." });
    } finally {
      loadingMessage(); // Hide loading message
      setFlipping(false);
    }
  };

  const getCoinImageSrc = () => {
    if (flipping) return coinImages.spinning;
    if (gameResult?.serverCoinSide) {
      return gameResult.serverCoinSide === 'heads' ? coinImages.heads : coinImages.tails;
    }
    // Default to showing the selected choice before flip, or a generic coin if no images
    return choice === 'heads' ? coinImages.heads : coinImages.tails;
  };

  return (
    <Card className="neumorphic-glass-card coinflip-card" bordered={false}>
      <Title level={isMobile ? 3 : 2} style={{ textAlign: 'center', color: '#00adee', marginBottom: isMobile ? 20 : 30 }}>
        ARIX Coinflip
      </Title>
      
      {!userFriendlyAddress && (
          <Alert 
            message="Wallet Not Connected" 
            description="Connect your TON wallet to play Coinflip with ARIX."
            type="warning" showIcon style={{ marginBottom: 20 }} className="glass-pane-alert"
            action={ <Button size="small" type="primary" onClick={() => tonConnectUI.openModal()}> Connect Wallet </Button> }
          />
      )}
      {userFriendlyAddress && initialArixBalance !== undefined && (
         <Paragraph style={{ textAlign: 'center', color: '#aaa', marginBottom: isMobile ? 15 : 20, fontSize: '0.9em' }}>
            Your ARIX Balance: <Text strong style={{color: '#00adee'}}>{parseFloat(initialArixBalance).toFixed(ARIX_DECIMALS)} ARIX</Text>
            {/* Refresh button could be added if onGameEnd updates balance in parent */}
        </Paragraph>
      )}

      <Row gutter={[isMobile ? 16 : 32, isMobile ? 16 : 32]} justify="center" align="middle">
        <Col xs={24} md={10} style={{ textAlign: 'center', marginBottom: isMobile ? 20 : 0 }}>
          <div className="coin-display-container">
            <img 
                src={getCoinImageSrc()} 
                alt={flipping ? "Coin Spinning" : (gameResult?.serverCoinSide ? `Coin: ${gameResult.serverCoinSide}` : "Coin")} 
                className="coin-image"
                onError={(e) => { e.currentTarget.src = fallbackCoinImage; }}
            />
          </div>

          {gameResult && !flipping && !gameResult.error && (
            <div className={`game-result-info ${gameResult.outcome}`}>
              <Title level={4} className={`result-title ${gameResult.outcome}`}>
                {gameResult.outcome === 'win' ? 'You Won!' : 'You Lost!'}
              </Title>
              <Text className="result-text">You chose: <Text strong>{gameResult.yourChoice?.toUpperCase()}</Text></Text>
              <Text className="result-text">Coin was: <Text strong>{gameResult.serverCoinSide?.toUpperCase()}</Text></Text>
              <Text className="result-text delta">
                {gameResult.outcome === 'win' ? 'Profit: ' : 'Loss: '}
                <Text strong className={gameResult.outcome}>
                  {Math.abs(gameResult.amountDelta).toFixed(ARIX_DECIMALS)} ARIX
                </Text>
              </Text>
              {gameResult.gameId && <Text className="game-id-text">Game ID: {gameResult.gameId.substring(0,8)}...</Text>}
            </div>
          )}
           {gameResult?.error && (
                <Alert message="Game Error" description={gameResult.message} type="error" showIcon style={{marginTop: 15}}/>
            )}
        </Col>

        <Col xs={24} md={14} className="coinflip-controls">
          <div style={{ marginBottom: isMobile ? 15 : 20 }}>
            <Text className="input-label">Bet Amount (ARIX):</Text>
            <InputNumber
              style={{ width: '100%' }}
              className="neumorphic-input-number"
              value={betAmount}
              onChange={(value) => setBetAmount(value === null ? 0 : parseFloat(value))}
              min={1} // TODO: Fetch min/max from backend config
              max={10000} // Example max
              precision={ARIX_DECIMALS}
              disabled={flipping}
              size="large"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => (value ? value.replace(/\$\s?|(,*)/g, '') : '')}
            />
          </div>

          <div style={{ marginBottom: isMobile ? 20 : 30, textAlign: 'center' }}>
            <Text className="input-label">Choose your side:</Text>
            <Radio.Group
              onChange={(e) => setChoice(e.target.value)}
              value={choice}
              buttonStyle="solid"
              disabled={flipping}
              size="large"
              className="coinflip-radio-group"
            >
              <Radio.Button value="heads" className="coinflip-radio-button">Heads</Radio.Button>
              <Radio.Button value="tails" className="coinflip-radio-button">Tails</Radio.Button>
            </Radio.Group>
          </div>

          <Button
            type="primary"
            onClick={handlePlaceBet}
            loading={flipping}
            disabled={flipping || betAmount <= 0 || !userFriendlyAddress /* Add balance check if desired: || betAmount > initialArixBalance */}
            block
            size="large"
            className="flip-button"
          >
            {flipping ? 'Flipping...' : `Flip for ${betAmount} ARIX`}
          </Button>
        </Col>
      </Row>
    </Card>
  );
};