// File: AR_FRONTEND/src/pages/GamePage.jsx
import React from 'react';
import { Typography, Card, Grid } from 'antd'; // Imported Grid
import CoinflipGame from '../components/game/CoinFlipGame'; // Import the separate component

const { Title, Text } = Typography;
const { useBreakpoint } = Grid; // Using Grid.useBreakpoint

const GamePage = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  return (
    <div style={{ 
        padding: isMobile ? '16px' : '24px', 
        maxWidth: '900px', 
        margin: '0 auto' 
    }}>
      <Title level={2} style={{ 
          color: 'white', 
          textAlign: 'center', 
          marginBottom: isMobile ? '20px' : '30px', 
          fontWeight: 'bold' 
      }}>
        ARIX Games Center
      </Title>
      
      <CoinflipGame /> {/* Render the CoinflipGame component */}
      
      {/* Example of how you might list other games or coming soon sections */}
      <Card className="neumorphic-glass-card" style={{marginTop: 30, textAlign: 'center'}}>
            <Title level={4} style={{color: '#00adee', marginBottom: 8}}>More Games Coming Soon!</Title>
            <Text style={{color: '#aaa'}}>Poker, Durak, and other exciting challenges are on the way.</Text>
      </Card>
    </div>
  );
};

export default GamePage;
