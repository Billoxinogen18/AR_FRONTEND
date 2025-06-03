import React from 'react';
import { Typography, Grid, Button } from 'antd';
import { Link } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
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
        minHeight: 'calc(100vh - 56px - 60px - 130px)', // Adjust if BalanceHeader height changes
    }}>
      <div style={{
          backgroundColor: '#FFFFFF', // White background for the square
          padding: '20px',
          borderRadius: '12px', // Rounded corners for the white square
          display: 'inline-block', // To contain the circle
          marginBottom: '25px',
          boxShadow: '0 4px 15px rgba(0, 191, 255, 0.1)',
      }}>
        <img
            src="https://cryptologos.cc/logos/solana-sol-logo.png?v=032" // Solana logo URL
            alt="Game Platform Logo"
            style={{
                width: isMobile ? '100px' : '120px',
                height: isMobile ? '100px' : '120px',
                objectFit: 'contain',
            }}
        />
      </div>
       <Title level={2} style={{ color: '#00BFFF', marginBottom: '10px', fontSize: isMobile ? '1.5em': '1.8em' }}>
            Games Coming Soon!
        </Title>
        <Paragraph style={{ color: '#8A8A8A', fontSize: isMobile ? '0.9em': '1em', maxWidth: '400px', lineHeight: '1.6', marginBottom: '25px' }}>
            Get ready for an exciting lineup of games. Coinflip is just the beginning! More challenges and fun are on the way.
        </Paragraph>
         <div className="coinflip-banner" style={{
             backgroundColor: 'transparent',
             border: '1px solid #2C2C2C',
             padding: '10px 15px',
             width: '100%',
             maxWidth: '400px',
             borderRadius: '8px'
            }}>
            <Text style={{color: '#E0E0E5', fontSize: '0.9em'}}>Want to try your luck now? <Link to="/game/coinflip" style={{ fontWeight: 'bold', color: '#00BFFF' }}>Play Coinflip! →</Link></Text>
        </div>
    </div>
  );
};

export default GamePage;