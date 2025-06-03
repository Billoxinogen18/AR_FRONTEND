// File: AR_FRONTEND/src/pages/GamePage.jsx
import React from 'react';
import { Typography, Card, Grid, Row, Col, Button, message } from 'antd'; // Added message
import { ExperimentOutlined, BlockOutlined, RiseOutlined, CrownOutlined } from '@ant-design/icons';
import CoinflipGame from '../components/game/CoinFlipGame'; 

const { Title, Text, Paragraph } = Typography; // Correctly import Paragraph
const { useBreakpoint } = Grid; 

const GameCard = ({ title, description, actionText, onAction, icon, imageUrl, comingSoon, bannerText, bannerColor }) => {
  const isMobile = !useBreakpoint().md;
  return (
    <Card className="dark-theme-card game-info-card" style={{ textAlign: 'center' }}> {/* Removed height and flex from here */}
      <div className="card-content-grow"> {/* Added wrapper to allow button to stick to bottom via parent flex if needed, but CSS can also handle this */}
        {bannerText && (
            <div style={{
                backgroundColor: bannerColor || '#7e73ff',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '6px 6px 0 0', // Adjust banner visual
                fontSize: '0.8rem',
                fontWeight: 'bold',
                position: 'absolute',
                top: 0, // Pinned to top
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'auto',
                minWidth: '100px',
                zIndex: 1,
                textAlign:'center'
            }}>
                {bannerText}
            </div>
        )}
        {imageUrl && <img src={imageUrl} alt={title} className="card-image" style={{ marginTop: bannerText ? '25px': '0', height: isMobile ? '100px' : '120px', objectFit:'contain'}} />}
        <Title level={4} style={{ color: '#ffffff', marginTop: imageUrl ? 8 : 0, marginBottom: 8, fontSize: '1.2rem' }}>{icon}{title}</Title>
        <Text style={{ color: '#a0a0a5', display: 'block', minHeight: '40px', fontSize: '0.9rem' }}>{description}</Text>
      </div>
      <Button 
        type={comingSoon ? "default" : "primary"}
        onClick={onAction} 
        disabled={comingSoon}
        icon={comingSoon ? <BlockOutlined /> : null}
        style={{ marginTop: 16, width: '80%' }} // Consistent button width
        size="middle"
      >
        {actionText}
      </Button>
    </Card>
  );
};


const GamePage = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const handleComingSoon = () => {
    message.info("This game is coming soon! Stay tuned.");
  };

  return (
    <div style={{ padding: isMobile ? '0px' : '0px' }}> {/* Reduced padding, content has its own */}
      <Title level={2} className="page-title">Games Center</Title>
      <Paragraph style={{textAlign: 'center', color: '#a0a0a5', marginTop: '-16px', marginBottom: '32px', fontSize: isMobile ? '0.9rem' : '1rem'}}>
        Exciting games and generous ARIX rewards are waiting for you!
      </Paragraph>
      
      <Row justify="center" style={{marginBottom: 24}}>
        <Col xs={24} md={20} lg={16} xl={14}> {/* Constrained Coinflip width a bit */}
          <CoinflipGame /> 
        </Col>
      </Row>


      <Title level={3} className="section-title" style={{textAlign: 'center', marginBottom: 24}}>More Ways to Play</Title>
      <Row gutter={[isMobile ? 16 : 24, isMobile ? 16 : 24]} justify="center">
        <Col xs={24} sm={12} md={8}>
            <GameCard 
                title="Poker (AK Style)"
                description="Show who's the king of poker – bet, bluff, and win!"
                actionText="Take a seat"
                onAction={handleComingSoon}
                imageUrl="/img/game-poker-ak.png" 
                comingSoon
                icon={<CrownOutlined style={{marginRight: 6}}/>}
            />
        </Col>
        <Col xs={24} sm={12} md={8}>
             <GameCard 
                title="Durak Cards"
                description="Become a master of 'Durak' by playing with real opponents!"
                actionText="Play"
                onAction={handleComingSoon}
                imageUrl="/img/game-durak.png" 
                comingSoon
                icon={<ExperimentOutlined style={{marginRight: 6}} />}
            />
        </Col>
         <Col xs={24} sm={12} md={8}>
            <GameCard 
                title="Future Game"
                description="The next game is already in development. We will notify you as soon as it's released!"
                actionText="Unavailable"
                onAction={handleComingSoon}
                imageUrl="/img/game-work-in-progress.png" 
                comingSoon
                icon={<RiseOutlined style={{marginRight: 6}} />}
            />
        </Col>
      </Row>
    </div>
  );
};

export default GamePage;