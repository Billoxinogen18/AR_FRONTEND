// File: AR_Proj/AR_FRONTEND/src/pages/GamePage.jsx
import React from 'react';
import { Typography } from 'antd';
import CoinflipGame from '../components/game/CoinFlipGame.jsx';

const { Title } = Typography;

const GamePage = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2} style={{ color: 'white', textAlign: 'center', marginBottom: '30px', fontWeight: 'bold' }}>
        ARIX Games
      </Title>
      <CoinflipGame />
    </div>
  );
};

export default GamePage;