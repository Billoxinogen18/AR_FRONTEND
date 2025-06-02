// File: AR_Proj/AR_FRONTEND/src/components/game/CoinflipGame.jsx
import React, { useState } from 'react';
import { Row, Col, Card, InputNumber, Button, Typography, Radio, Alert } from 'antd';

const { Title, Text, Paragraph } = Typography;

const CoinflipGame = () => {
  const [betAmount, setBetAmount] = useState(10);
  const [choice, setChoice] = useState('heads');
  const [loading, setLoading] = useState(false); // Assuming you are using 'loading' as in the original file
  const [gameResult, setGameResult] = useState(null);

  const handlePlaceBet = async () => {
    setLoading(true);
    
    // Simulate game logic
    setTimeout(() => {
      const coinResult = Math.random() < 0.5 ? 'heads' : 'tails';
      const won = coinResult === choice;
      
      setGameResult({
        outcome: won ? 'win' : 'loss',
        serverCoinSide: coinResult,
        amountDelta: won ? betAmount : -betAmount
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <Card className="neumorphic-glass-card" title="ARIX Coinflip">
      <Row gutter={[16, 24]} justify="center">
        <Col xs={24} md={12} style={{ textAlign: 'center' }}>
          <Title level={4} style={{ color: '#e0e0e0', marginBottom: 20 }}>
            Choose Heads or Tails
          </Title>
          
          <div style={{ 
            marginBottom: 30, 
            minHeight: 150, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            fontSize: '4rem'
          }}>
            {loading ? '🔄' : '🪙'}
          </div>

          {gameResult && !loading && ( // Ensure variable name 'loading' matches your state
            <div style={{ 
              marginBottom: 20, 
              padding: '15px', 
              borderRadius: '10px', 
              // THIS IS THE CORRECTED LINE:
              background: gameResult.outcome === 'win' ? 'rgba(82, 196, 26, 0.2)' : 'rgba(255, 77, 79, 0.2)' 
            }}>
              <Title level={3} style={{ 
                color: gameResult.outcome === 'win' ? '#52c41a' : '#ff4d4f', 
                margin: 0 
              }}>
                {gameResult.outcome === 'win' ? 'You Won!' : 'You Lost!'}
              </Title>
              <Text style={{ color: '#e0e0e0' }}>
                Coin landed on: <Text strong style={{color: '#00adee', textTransform: 'capitalize'}}>
                  {gameResult.serverCoinSide}
                </Text>
              </Text>
              <br/>
              <Text style={{ color: '#e0e0e0' }}>
                {gameResult.outcome === 'win' ? 'You won: ' : 'You lost: '}
                <Text strong style={{color: gameResult.outcome === 'win' ? '#52c41a' : '#ff4d4f'}}>
                  {Math.abs(gameResult.amountDelta)} ARIX
                </Text>
              </Text>
            </div>
          )}
        </Col>

        <Col xs={24} md={12}>
          <Paragraph style={{ textAlign: 'center', color: '#aaa' }}>
            Demo Mode - Connect wallet for real betting
          </Paragraph>

          <div style={{ marginBottom: 20 }}>
            <Text style={{ color: '#aaa', display: 'block', marginBottom: 8 }}>
              Bet Amount (ARIX):
            </Text>
            <InputNumber
              style={{ width: '100%' }}
              value={betAmount}
              onChange={(value) => setBetAmount(parseFloat(value) || 0)}
              min={1}
              max={1000}
              precision={2}
              disabled={loading} // Ensure variable name 'loading' matches your state
            />
          </div>

          <div style={{ marginBottom: 30, textAlign: 'center' }}>
            <Radio.Group
              onChange={(e) => setChoice(e.target.value)}
              value={choice}
              buttonStyle="solid"
              disabled={loading} // Ensure variable name 'loading' matches your state
              size="large"
            >
              <Radio.Button value="heads" style={{ 
                borderRadius: '10px 0 0 10px', 
                padding: '0 25px' 
              }}>
                Heads
              </Radio.Button>
              <Radio.Button value="tails" style={{ 
                borderRadius: '0 10px 10px 0', 
                padding: '0 25px' 
              }}>
                Tails
              </Radio.Button>
            </Radio.Group>
          </div>

          <Button
            type="primary"
            onClick={handlePlaceBet}
            loading={loading} // Ensure variable name 'loading' matches your state
            disabled={loading || betAmount <= 0} // Ensure variable name 'loading' matches your state
            block
            size="large"
          >
            {loading ? 'Flipping...' : `Flip for ${betAmount} ARIX`} 
          </Button>
        </Col>
      </Row>
    </Card>
  );
};

export default CoinflipGame;