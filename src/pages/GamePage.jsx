import React from 'react';
import { Typography, Grid } from 'antd';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const GamePage = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  return (
    <div style={{
        padding: isMobile ? '20px 12px' : '30px 16px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 56px - 60px - 130px)',
    }}>
      <img
        src="/img/terminal_character_coins.png"
        alt="ARIX Terminal Character with Coins"
        style={{
          maxWidth: isMobile ? '280px' : '350px',
          width: '80%',
          marginBottom: '20px',
          filter: 'drop-shadow(0 0 20px rgba(0, 191, 255, 0.2))'
        }}
        onError={(e) => { e.currentTarget.src = 'https://placehold.co/350x300/0D0D0D/1A1A1A?text=Game+Art&font=inter'; }}
      />
       <Title level={3} style={{ color: '#00BFFF', marginBottom: '10px' }}>
            Games Coming Soon!
        </Title>
        <Text style={{ color: '#8A8A8A', fontSize: isMobile ? '0.9em': '1em', maxWidth: '400px', lineHeight: '1.6' }}>
            Get ready for an exciting lineup of games. Coinflip is just the beginning! More challenges and fun are on the way.
        </Text>
         <div className="coinflip-banner" style={{backgroundColor: '#181818', border: '1px solid #2C2C2C', padding: '10px 15px', marginTop: '25px', width: '100%', maxWidth: '400px'}}>
            <Text style={{color: '#A6FFBE'}}>Want to try your luck now? <Link to="/game/coinflip" style={{ fontWeight: 'bold', color: '#A6FFBE' }}>Play Coinflip! →</Link></Text>
        </div>
    </div>
  );
};

export default GamePage;